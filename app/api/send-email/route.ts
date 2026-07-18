import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { requireAdminSession } from '@/app/lib/serverAuth';

export async function POST(req: Request) {
    try {
        const session = await requireAdminSession();

        if (!session) {
            return NextResponse.json({ error: 'Доступ только для администратора' }, { status: 403 });
        }

        const { to, subject, text } = await req.json();

        if (!to || !subject || !text) {
            return NextResponse.json({ error: 'Не все поля заполнены' }, { status: 400 });
        }

        // Настраиваем транспорт с более строгими параметрами для обхода спам-фильтров
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.yandex.ru',
            port: 465,
            secure: true, 
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
            // Добавляем таймауты и настройки для стабильности
            connectionTimeout: 10000,
            greetingTimeout: 5000,
            debug: true // Поможет увидеть детали в консоли сервера, если ошибка повторится
        });

        // Формируем письмо с заголовками, которые "любят" почтовые сервисы
        await transporter.sendMail({
            from: `"Ватэс" <${process.env.SMTP_USER}>`,
            to: to,
            subject: subject,
            text: text,
            html: `
                <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
                    <h2 style="color: #2e7d78;">Ватэс: уведомление</h2>
                    <p>${text.replace(/\n/g, '<br>')}</p>
                    <br>
                    <hr style="border: 0; border-top: 1px solid #eee;">
                    <p style="font-size: 12px; color: #888;">Это автоматическое сообщение. Пожалуйста, не отвечайте на него.</p>
                </div>
            `,
            // Устанавливаем заголовки, чтобы Яндекс видел, что это легальная рассылка
            headers: {
                'X-Priority': '3',
                'X-Mailer': 'TeaHub-LMS-System'
            }
        });

        return NextResponse.json({ success: true });
        
    } catch (error: any) {
        console.error('Ошибка отправки email (детали):', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
