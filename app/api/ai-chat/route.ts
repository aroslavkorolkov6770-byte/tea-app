import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const body = await request.json();
    const { messages } = body; // Получаем историю переписки

    // ВАЖНО: Ключ теперь на сервере, он не попадет в браузер!
    const API_KEY = process.env.NEXT_PUBLIC_AI_API_KEY; 

    try {
        const response = await fetch("https://llm.api.cloud.yandex.net/foundationModels/v1/completion", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Api-Key ${API_KEY}`,
                'x-folder-id': 'ajehp9b04amed51v0004' // Обязательно укажи свой Folder ID
            },
            body: JSON.stringify({
                modelUri: "gpt://ajehp9b04amed51v0004/yandexgpt-lite", // Укажи актуальный URI модели
                completionOptions: {
                    stream: false,
                    temperature: 0.3,
                    maxTokens: 2000
                },
                messages: messages
            })
        });

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
    }
}