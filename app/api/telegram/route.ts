import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { chat_id, text } = await request.json();
        const token = process.env.TELEGRAM_BOT_TOKEN;

        // ПРОВЕРКА 1: Видит ли сервер токен?
        if (!token) {
            console.error("ОШИБКА: Токен Telegram не найден в переменных окружения!");
            return NextResponse.json({ success: false, error: 'Токен не найден. Перезапустите сервер или проверьте .env' }, { status: 500 });
        }

        const tgUrl = `https://api.telegram.org/bot${token}/sendMessage`;

        const res = await fetch(tgUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id, text, parse_mode: 'HTML' })
        });

        const data = await res.json();

        // ПРОВЕРКА 2: Что ответил сам Телеграм?
        if (data.ok) {
            return NextResponse.json({ success: true });
        } else {
            console.error("Telegram API Error:", data.description);
            return NextResponse.json({ success: false, error: data.description }, { status: 400 });
        }

    } catch (error) {
        console.error('Critical Server Error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}