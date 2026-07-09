import { NextResponse } from 'next/server';

type IncomingMessage = {
    role?: string;
    content?: unknown;
};

type YandexInputMessage = {
    role: 'user' | 'assistant' | 'system';
    content: Array<{
        type: 'input_text' | 'output_text';
        text: string;
    }>;
};

const DEFAULT_YANDEX_FOLDER_ID = 'b1g1k18evi08k4r17n9h';
const DEFAULT_YANDEX_MODEL = 'yandexgpt-lite';

const normalizeRole = (role: string | undefined): 'user' | 'assistant' | 'system' => {
    if (role === 'assistant' || role === 'system') {
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
        const body = await request.json();
        const messages = Array.isArray(body?.messages) ? body.messages : [];

        const apiKey = process.env.AI_API_KEY || process.env.NEXT_PUBLIC_AI_API_KEY;
        const yandexFolderId = process.env.AI_FOLDER_ID || process.env.YANDEX_FOLDER_ID || DEFAULT_YANDEX_FOLDER_ID;
        const yandexModel = process.env.AI_MODEL_NAME || process.env.YANDEX_MODEL_NAME || DEFAULT_YANDEX_MODEL;

        const yandexInput = mapMessagesToYandexInput(messages);

        if (yandexInput.length === 0) {
            return NextResponse.json({ error: 'Сообщения для ИИ не переданы' }, { status: 400 });
        }

        if (!apiKey) {
            return NextResponse.json({ error: 'AI API ключ не настроен на сервере' }, { status: 500 });
        }

        const modelPath = `gpt://${yandexFolderId}/${yandexModel}`;

        const response = await fetch('https://ai.api.cloud.yandex.net/v1/responses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Api-Key ${apiKey}`,
            },
            body: JSON.stringify({
                model: modelPath,
                input: yandexInput,
                service_tier: 'default',
            }),
        });

        const rawResponseText = await response.text();

        if (!response.ok) {
            console.error('Ошибка от API Яндекса:', rawResponseText);

            return NextResponse.json(
                {
                    error: `Ошибка Яндекса ${response.status}`,
                    details: rawResponseText,
                    source: 'yandex',
                },
                { status: response.status },
            );
        }

        const data = rawResponseText ? JSON.parse(rawResponseText) : {};

        return NextResponse.json(data);
    } catch (error) {
        console.error('Внутренняя ошибка сервера:', error);

        return NextResponse.json(
            {
                error: 'Внутренняя ошибка сервера',
                details: error instanceof Error ? error.message : 'Неизвестная ошибка',
                source: 'server',
            },
            { status: 500 },
        );
    }
}
