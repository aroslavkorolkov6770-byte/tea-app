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

const MAX_HISTORY_MESSAGES = 12;
const MAX_MESSAGE_CHARACTERS = 12_000;
const MAX_TOTAL_CHARACTERS = 36_000;

const limitText = (text: string, maxCharacters: number): string => {
    if (text.length <= maxCharacters) {
        return text;
    }

    // Сохраняем начало контекста и конец сообщения, где обычно находится
    // актуальный вопрос пользователя.
    const headLength = Math.floor(maxCharacters * 0.65);
    const tailLength = maxCharacters - headLength;

    return `${text.slice(0, headLength)}\n\n[Контекст сокращен]\n\n${text.slice(-tailLength)}`;
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
            const text = limitText(normalizeContentText(message.content), MAX_MESSAGE_CHARACTERS);

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

const countCharacters = (messages: YandexInputMessage[]): number => messages.reduce((sum, message) => {
    return sum + message.content.reduce((messageSum, item) => messageSum + item.text.length, 0);
}, 0);

const compactInputForProvider = (messages: YandexInputMessage[]): YandexInputMessage[] => {
    const compacted = messages.slice(-MAX_HISTORY_MESSAGES);

    // Сначала убираем самые старые сообщения, сохраняя весь последний вопрос
    // и ближайшую часть диалога для связности ответа.
    while (compacted.length > 1 && countCharacters(compacted) > MAX_TOTAL_CHARACTERS) {
        compacted.shift();
    }

    if (countCharacters(compacted) <= MAX_TOTAL_CHARACTERS) {
        return compacted;
    }

    const lastMessage = compacted[compacted.length - 1];
    const lastItem = lastMessage?.content[0];
    if (lastItem) {
        lastItem.text = limitText(lastItem.text, MAX_TOTAL_CHARACTERS);
    }

    return compacted;
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
        const messages = Array.isArray(body.messages)
            ? body.messages.slice(-MAX_HISTORY_MESSAGES) as IncomingMessage[]
            : [];

        const yandexInput = compactInputForProvider(mapMessagesToYandexInput(messages));

        if (yandexInput.length === 0) {
            return NextResponse.json({ error: 'Сообщения для ИИ не переданы' }, { status: 400 });
        }

        const data = await requestAliceAi(yandexInput);
        return NextResponse.json(data);
    } catch (error) {
        const securityResponse = securityErrorResponse(error);
        if (securityResponse) {
            return securityResponse;
        }

        if (error instanceof AliceAiRequestError) {
            const details = error.details.toLowerCase();
            console.error('Ошибка AI-провайдера:', error.status, error.details);

            if (details.includes('ai_folder_id is missing')) {
                return NextResponse.json(
                    { error: 'AI не настроен: укажите AI_FOLDER_ID на сервере' },
                    { status: 503 },
                );
            }

            if (error.status === 401) {
                return NextResponse.json(
                    { error: 'AI-ключ не принят Yandex Cloud: проверьте ключ на сервере' },
                    { status: 502 },
                );
            }

            if (error.status === 403 || details.includes('permission') || details.includes('exec denied')) {
                return NextResponse.json(
                    { error: 'У AI-ключа нет прав на выбранную папку Yandex Cloud' },
                    { status: 502 },
                );
            }

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
