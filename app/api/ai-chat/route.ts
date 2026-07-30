import { NextResponse } from 'next/server';
import { AliceAiRequestError, requestAliceAi } from '@/app/lib/aliceAi';
import { requireSession } from '@/app/lib/serverAuth';
import {
    assertRateLimit,
    assertTrustedMutationRequest,
    getClientIdentifier,
    readJsonBody,
    securityErrorResponse,
} from '@/app/lib/serverSecurity';

type IncomingMessage = {
    role?: string;
    content?: unknown;
};

type YandexInputMessage = {
    role: 'user' | 'assistant';
    content: Array<{
        type: 'input_text' | 'output_text';
        text: string;
    }>;
};

const normalizeRole = (role: string | undefined): 'user' | 'assistant' => {
    if (role === 'assistant') {
        return role;
    }

    return 'user';
};

const normalizeContentText = (content: unknown): string => {
    if (typeof content === 'string') {
        return content.trim();
    }

    if (Array.isArray(content)) {
        const textParts = content
            .map((item) => {
                if (typeof item === 'string') {
                    return item.trim();
                }

                if (item && typeof item === 'object' && 'text' in item) {
                    const textValue = (item as { text?: unknown }).text;
                    return typeof textValue === 'string' ? textValue.trim() : '';
                }

                return '';
            })
            .filter(Boolean);

        return textParts.join('\n').trim();
    }

    return '';
};

const mapMessagesToYandexInput = (messages: IncomingMessage[]): YandexInputMessage[] => {
    return messages
        .map((message) => {
            const normalizedRole = normalizeRole(message.role);
            const text = normalizeContentText(message.content);

            if (!text) {
                return null;
            }

            return {
                role: normalizedRole,
                content: [
                    {
                        type: normalizedRole === 'assistant' ? 'output_text' : 'input_text',
                        text,
                    },
                ],
            } satisfies YandexInputMessage;
        })
        .filter((message): message is YandexInputMessage => Boolean(message));
};

export async function POST(request: Request) {
    try {
        assertTrustedMutationRequest(request);
        const session = await requireSession();
        if (!session) {
            return NextResponse.json({ error: 'Требуется вход в систему' }, { status: 401 });
        }

        assertRateLimit('ai-chat', getClientIdentifier(request, session.id), 30, 5 * 60 * 1000);
        const body = await readJsonBody<{ messages?: unknown }>(request, 64 * 1024);
        const messages = Array.isArray(body.messages) ? body.messages.slice(-30) as IncomingMessage[] : [];

        const yandexInput = mapMessagesToYandexInput(messages);

        if (yandexInput.length === 0) {
            return NextResponse.json({ error: 'Сообщения для ИИ не переданы' }, { status: 400 });
        }

        const totalCharacters = yandexInput.reduce((sum, message) => {
            return sum + message.content.reduce((messageSum, item) => messageSum + item.text.length, 0);
        }, 0);

        if (totalCharacters > 50_000 || yandexInput.some((message) => message.content[0].text.length > 12_000)) {
            return NextResponse.json({ error: 'Диалог превышает допустимый объем' }, { status: 413 });
        }

        const data = await requestAliceAi(yandexInput);
        return NextResponse.json(data);
    } catch (error) {
        const securityResponse = securityErrorResponse(error);
        if (securityResponse) {
            return securityResponse;
        }

        if (error instanceof AliceAiRequestError) {
            console.error('Ошибка AI-провайдера:', error.status, error.details);
            const status = error.status === 429 ? 429 : 502;
            const message = error.status === 429
                ? 'Лимит AI-сервиса временно исчерпан'
                : 'AI-сервис временно недоступен';
            return NextResponse.json({ error: message }, { status });
        }

        console.error('Внутренняя ошибка AI-чата:', error);
        return NextResponse.json({ error: 'Не удалось получить ответ AI-ассистента' }, { status: 500 });
    }
}
