import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const body = await request.json();
    const { messages } = body; 

    // Достаем ключ из .env
    const API_KEY = process.env.NEXT_PUBLIC_AI_API_KEY; 

    // Склеиваем историю диалога в один текст, чтобы Ассистент понимал контекст
    const inputText = messages.map((m: any) => `${m.role === 'user' ? 'Сотрудник' : 'ИИ'}: ${m.text}`).join('\n\n');

    try {
        const response = await fetch("https://ai.api.cloud.yandex.net/v1/responses", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Для нового API Яндекса, совместимого с OpenAI, используется Bearer
                'Authorization': `Bearer ${API_KEY}`, 
                // Твой Folder ID (Project ID)
                'OpenAI-Project': 'b1g1k18evi08k4r17n9h' 
            },
            body: JSON.stringify({
                prompt: {
                    // Тот самый ID твоего настроенного Ассистента с загруженными файлами
                    id: 'fvt57g2r89qkgi1p7cb3'
                },
                input: inputText
            })
        });

        // Если Яндекс возвращает ошибку, перехватываем ее для отображения на клиенте
        if (!response.ok) {
            const errorText = await response.text();
            console.error("Ошибка от API Яндекса:", errorText);
            return NextResponse.json({ error: `Ошибка Яндекса ${response.status}`, details: errorText }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Внутренняя ошибка сервера:", error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}