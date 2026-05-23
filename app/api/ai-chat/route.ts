import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const body = await request.json();
    const { messages } = body; 

    const API_KEY = process.env.NEXT_PUBLIC_AI_API_KEY; 

    try {
        const response = await fetch("https://llm.api.cloud.yandex.net/foundationModels/v1/completion", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Api-Key ${API_KEY}`,
                // Указан ПРАВИЛЬНЫЙ Folder ID, к которому привязан ключ
                'x-folder-id': 'b1g1k18evi08k4r17n9h' 
            },
            body: JSON.stringify({
                // Указан ПРАВИЛЬНЫЙ Folder ID в пути к модели
                modelUri: "gpt://b1g1k18evi08k4r17n9h/yandexgpt-lite", 
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