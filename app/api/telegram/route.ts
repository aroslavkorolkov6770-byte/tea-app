import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        // Получаем ID чата и текст из нашей админки
        const { chat_id, text } = await request.json();
        
        // Достаем секретный токен из сейфа
        const token = process.env.TELEGRAM_BOT_TOKEN;

        if (!token) {
            return NextResponse.json({ success: false, error: 'Токен не настроен на сервере' }, { status: 500 });
        }

        if (!chat_id) {
            return NextResponse.json({ success: false, error: 'Не указан Telegram ID сотрудника' }, { status: 400 });
        }

        // Формируем запрос к официальному API Телеграма
        const tgUrl = `https://api.telegram.org/bot${token}/sendMessage`;

        const res = await fetch(tgUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chat_id,
                text: text,
                parse_mode: 'HTML' // Позволит нам выделять текст жирным или курсивом
            })
        });

        const data = await res.json();

        if (data.ok) {
            return NextResponse.json({ success: true });
        } else {
            console.error("Ответ от Telegram с ошибкой:", data);
            return NextResponse.json({ success: false, error: data.description }, { status: 400 });
        }

    } catch (error) {
        console.error('Критическая ошибка отправки в Telegram:', error);
        return NextResponse.json({ success: false, error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}