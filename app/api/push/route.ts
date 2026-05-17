import { NextResponse } from 'next/server';
// Используем require, если стандартный import вызывает ошибку отсутствия типов (ts 7016)
const webpush = require('web-push');

// Инициализируем настройки VAPID из нашего .env файла
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:admin@teahub.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

export async function POST(req: Request) {
  try {
    // Получаем массив подписок и само сообщение от нашей админки
    const { subscriptions, payload } = await req.json();

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ message: 'Нет активных устройств для отправки' }, { status: 200 });
    }

    // Рассылаем пуши параллельно на все устройства
    const sendPromises = subscriptions.map((sub: any) =>
      webpush.sendNotification(sub, JSON.stringify(payload)).catch((err: any) => {
        console.error('Ошибка отправки пуша на устройство:', err);
        // Если пользователь удалил разрешения в браузере, сервер вернет ошибку.
      })
    );

    await Promise.all(sendPromises);

    return NextResponse.json({ success: true, message: 'Пуши успешно отправлены!' });
  } catch (error: any) {
    console.error('Критическая ошибка API Web-Push:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}