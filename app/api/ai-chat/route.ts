import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const body = await request.json();
    const { messages } = body; 

    const API_KEY = process.env.NEXT_PUBLIC_AI_API_KEY; 

    // Склеиваем историю в один текст, чтобы Ассистент с файлами понимал весь контекст
    const inputText = messages.map((m: any) => `${m.role === 'user' ? 'Сотрудник' : 'ИИ'}: ${m.text}`).join('\n\n');

    try {
        const response = await fetch("https://ai.api.cloud.yandex.net/v1/responses", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`, // В новом API используется формат Bearer
                'OpenAI-Project': 'b1g1k18evi08k4r17n9h' 
            },
            body: JSON.stringify({
                prompt: {
                    id: 'fvt57g2r89qkgi1p7cb3'
                },
                input: inputText
            })
        });

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
    }
}