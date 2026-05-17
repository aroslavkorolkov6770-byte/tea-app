import { NextResponse } from 'next/server';
// Используем require для избежания проблем с типами
const webpush = require('web-push');

export async function POST(req: Request) {
  try {
    // 1. Инициализируем VAPID ключи ВНУТРИ функции POST, 
    // чтобы Next.js не пытался запустить этот код во время npm run build
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || 'mailto:admin@teahub.com';

    if (!publicKey || !privateKey) {
      console.warn("⚠️ VAPID ключи не заданы на сервере. Push-уведомления не будут отправлены.");
      return NextResponse.json({ message: 'Push-уведомления отключены (нет ключей)' }, { status: 200 });
    }

    // Применяем настройки
    webpush.setVapidDetails(subject, publicKey, privateKey);

    // 2. Получаем массив подписок и само сообщение от нашей админки
    const { subscriptions, payload } = await req.json();

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ message: 'Нет активных устройств для отправки' }, { status: 200 });
    }

    // 3. Рассылаем пуши параллельно на все устройства
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