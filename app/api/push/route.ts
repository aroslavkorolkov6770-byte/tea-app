import { NextResponse } from 'next/server';
const webpush = require('web-push');

export async function POST(req: Request) {
  try {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.replace(/["']/g, '').trim();
    const privateKey = process.env.VAPID_PRIVATE_KEY?.replace(/["']/g, '').trim();
    const subject = process.env.VAPID_SUBJECT?.replace(/["']/g, '').trim() || 'mailto:admin@tea-hub.ru';

    if (!publicKey || !privateKey) {
      return NextResponse.json({ error: 'Ключи VAPID не настроены в .env на сервере' }, { status: 500 });
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);

    const { subscriptions, payload } = await req.json();

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ message: 'Нет устройств для отправки' }, { status: 200 });
    }

    // Ждем ответа от серверов Apple и Google по каждому устройству
    const results = await Promise.allSettled(
      subscriptions.map((sub: any) => webpush.sendNotification(sub, JSON.stringify(payload)))
    );

    // Ищем, не отклонил ли кто-то наш пуш
    const failures = results.filter((r: any) => r.status === 'rejected');
    
    if (failures.length > 0) {
        // Достаем точный код ошибки из недр APNs
        const errorMessages = failures.map((f: any) => {
             return `Код: ${f.reason?.statusCode || 'N/A'} - ${f.reason?.body || f.reason?.message || 'Неизвестно'}`;
        });
        
        console.error("ОШИБКИ ОТ APPLE/GOOGLE:", errorMessages);
        
        return NextResponse.json({ 
            error: `Apple (или Google) отклонил пуш! ${errorMessages.join(' | ')}` 
        }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Пуши успешно доставлены на сервера Apple и Google!' });
  } catch (error: any) {
    return NextResponse.json({ error: `Критическая ошибка сервера: ${error.message || error}` }, { status: 500 });
  }
}