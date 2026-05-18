import { NextResponse } from 'next/server';
// Используем require для избежания проблем с типами
const webpush = require('web-push');

export async function POST(req: Request) {
  try {
    // 1. Извлекаем и ЖЕСТКО очищаем ключи от случайных кавычек и пробелов на стороне сервера
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.replace(/["']/g, '').trim();
    const privateKey = process.env.VAPID_PRIVATE_KEY?.replace(/["']/g, '').trim();
    const subject = process.env.VAPID_SUBJECT?.replace(/["']/g, '').trim() || 'mailto:admin@tea-hub.ru';

    if (!publicKey || !privateKey) {
      console.warn("⚠️ VAPID ключи не заданы в .env на сервере.");
      return NextResponse.json({ error: 'Ключи VAPID не настроены в .env на сервере' }, { status: 500 });
    }

    // Применяем гарантированно чистые настройки безопасности
    webpush.setVapidDetails(subject, publicKey, privateKey);

    // 2. Получаем массив подписок и само сообщение от нашей админки
    const { subscriptions, payload } = await req.json();

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ message: 'Нет active устройств для отправки в базе' }, { status: 200 });
    }

    // 3. Рассылаем пуши параллельно на все устройства
    const sendPromises = subscriptions.map((sub: any) =>
      webpush.sendNotification(sub, JSON.stringify(payload)).catch((err: any) => {
        console.error('Ошибка отправки пуша на конкретное устройство:', err.message || err);
      })
    );

    await Promise.all(sendPromises);

    return NextResponse.json({ success: true, message: 'Пуши успешно отправлены!' });
  } catch (error: any) {
    // Выводим реальную техническую причину ошибки в лог сервера и возвращаем её на фронтенд
    console.error('КРИТИЧЕСКАЯ ОШИБКА НА СЕРВЕРЕ В API/PUSH:', error.message || error);
    return NextResponse.json({ error: `Ошибка сервера: ${error.message || error}` }, { status: 500 });
  }
}