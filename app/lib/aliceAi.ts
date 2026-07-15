export type AliceInputMessage = {
    role: 'user' | 'assistant' | 'system';
    content: Array<{
        type: 'input_text' | 'output_text';
        text: string;
    }>;
};

const DEFAULT_YANDEX_FOLDER_ID = 'b1g1k18evi08k4r17n9h';
const DEFAULT_YANDEX_MODEL = 'yandexgpt-lite';

export class AliceAiRequestError extends Error {
    status: number;
    details: string;

    constructor(message: string, status: number, details: string) {
        super(message);
        this.name = 'AliceAiRequestError';
        this.status = status;
        this.details = details;
    }
}

export async function requestAliceAi(input: AliceInputMessage[]): Promise<unknown> {
    const apiKey = process.env.AI_API_KEY || process.env.NEXT_PUBLIC_AI_API_KEY;
    const yandexFolderId = process.env.AI_FOLDER_ID || process.env.YANDEX_FOLDER_ID || DEFAULT_YANDEX_FOLDER_ID;
    const yandexModel = process.env.AI_MODEL_NAME || process.env.YANDEX_MODEL_NAME || DEFAULT_YANDEX_MODEL;

    if (!apiKey) {
        throw new AliceAiRequestError('AI API ключ не настроен на сервере', 500, 'AI API key is missing');
    }

    const response = await fetch('https://ai.api.cloud.yandex.net/v1/responses', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Api-Key ${apiKey}`,
        },
        body: JSON.stringify({
            model: `gpt://${yandexFolderId}/${yandexModel}`,
            input,
            service_tier: 'default',
        }),
    });

    const rawResponseText = await response.text();

    if (!response.ok) {
        throw new AliceAiRequestError(`Ошибка Яндекса ${response.status}`, response.status, rawResponseText);
    }

    if (!rawResponseText) {
        return {};
    }

    try {
        return JSON.parse(rawResponseText) as unknown;
    } catch (error) {
        throw new AliceAiRequestError(
            'Яндекс вернул некорректный ответ',
            502,
            error instanceof Error ? error.message : 'JSON parse error',
        );
    }
}

export function extractAliceText(data: unknown): string {
    if (!data || typeof data !== 'object') {
        return '';
    }

    const response = data as {
        output?: unknown;
        output_text?: unknown;
        text?: unknown;
        message?: { text?: unknown };
        result?: { alternatives?: Array<{ message?: { text?: unknown } }> };
    };

    if (Array.isArray(response.output)) {
        for (const outputItem of response.output) {
            if (!outputItem || typeof outputItem !== 'object') {
                continue;
            }

            const content = (outputItem as { content?: unknown }).content;
            if (!Array.isArray(content)) {
                continue;
            }

            for (const contentItem of content) {
                if (contentItem && typeof contentItem === 'object') {
                    const text = (contentItem as { text?: unknown }).text;
                    if (typeof text === 'string' && text.trim()) {
                        return text.trim();
                    }
                }
            }
        }
    }

    const fallbackValues = [
        response.output_text,
        response.text,
        response.message?.text,
        response.result?.alternatives?.[0]?.message?.text,
    ];

    const fallbackText = fallbackValues.find((value) => typeof value === 'string' && value.trim());
    return typeof fallbackText === 'string' ? fallbackText.trim() : '';
}
