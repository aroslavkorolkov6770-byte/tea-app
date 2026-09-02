import OpenAI from 'openai';

export type AliceInputMessage = {
    role: 'user' | 'assistant' | 'system';
    content: Array<{
        type: 'input_text' | 'output_text';
        text: string;
    }>;
};

const DEFAULT_AI_PROJECT_ID = 'b1gggcekj6heiblum23f';
const DEFAULT_AI_PROMPT_ID = 'fvth3ukik96j74cfqu17';
const DEFAULT_AI_VECTOR_STORE_ID = 'fvt76sm8vtdbo4m77tk5';

type AliceAiRequestOptions = {
    useKnowledgeTools?: boolean;
};

const stringifyInput = (input: AliceInputMessage[]): string => input
    .map((message) => {
        const text = message.content
            .map((contentItem) => contentItem.text)
            .filter(Boolean)
            .join('\n');

        return `${message.role.toUpperCase()}:\n${text}`;
    })
    .filter(Boolean)
    .join('\n\n');

const getErrorStatus = (error: unknown): number => {
    if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as { status?: unknown }).status;
        if (typeof status === 'number') {
            return status;
        }
    }

    return 502;
};

const getErrorDetails = (error: unknown): string => {
    if (error instanceof Error) {
        return error.message.slice(0, 2000);
    }

    try {
        return JSON.stringify(error).slice(0, 2000);
    } catch {
        return 'Unknown AI provider error';
    }
};

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

export async function requestAliceAi(
    input: AliceInputMessage[],
    options: AliceAiRequestOptions = {},
): Promise<unknown> {
    const apiKey = process.env.AI_API_KEY?.trim();
    const projectId = (
        process.env.AI_PROJECT_ID
        || process.env.YANDEX_PROJECT_ID
        || DEFAULT_AI_PROJECT_ID
    ).trim();
    const promptId = (
        process.env.AI_PROMPT_ID
        || process.env.YANDEX_PROMPT_ID
        || DEFAULT_AI_PROMPT_ID
    ).trim();
    const vectorStoreId = (
        process.env.AI_VECTOR_STORE_ID
        || process.env.YANDEX_VECTOR_STORE_ID
        || DEFAULT_AI_VECTOR_STORE_ID
    ).trim();
    const useKnowledgeTools = options.useKnowledgeTools ?? true;

    if (!apiKey) {
        throw new AliceAiRequestError('AI API ключ не настроен на сервере', 500, 'AI API key is missing');
    }

    if (!projectId) {
        throw new AliceAiRequestError(
            'AI не настроен: не указан идентификатор проекта Yandex Cloud',
            500,
            'AI_PROJECT_ID is missing. Set AI_PROJECT_ID to the project used by the AI Studio prompt.',
        );
    }

    try {
        const client = new OpenAI({
            apiKey,
            baseURL: 'https://ai.api.cloud.yandex.net/v1',
            defaultHeaders: {
                'OpenAI-Project': projectId,
            },
            timeout: 45_000,
        });

        const response = await client.responses.create({
            prompt: {
                id: promptId,
            },
            input: stringifyInput(input),
            ...(useKnowledgeTools
                ? {
                    tools: [
                        {
                            type: 'file_search' as const,
                            vector_store_ids: [vectorStoreId],
                            max_num_results: 15,
                        },
                        {
                            type: 'web_search' as const,
                            filters: {
                                allowed_domains: ['tea-hub.ru'],
                            },
                            search_context_size: 'medium' as const,
                            user_location: {
                                type: 'approximate' as const,
                                region: '225',
                            },
                        },
                    ],
                }
                : {}),
        });

        return response;
    } catch (error) {
        throw new AliceAiRequestError(`Ошибка AI-провайдера ${getErrorStatus(error)}`, getErrorStatus(error), getErrorDetails(error));
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
