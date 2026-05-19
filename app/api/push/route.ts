import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
    try {
        // Получаем данные из админки
        const { to, subject, text } = await req.json();

        if (!to || !subject || !text) {
            return NextResponse.json({ error: 'Не все поля заполнены' }, { status: 400 });
        }

        // Настраиваем подключение к SMTP серверу (Яндекс или Mail.ru)
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.yandex.ru',
            port: Number(process.env.SMTP_PORT) || 465,
            secure: true, 
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        // Формируем и отправляем письмо
        await transporter.sendMail({
            from: `"Tea Hub LMS" <${process.env.SMTP_USER}>`, 
            to: to, 
            subject: subject, 
            text: text, 
        });

        return NextResponse.json({ success: true });
        
    } catch (error: any) {
        console.error('Ошибка отправки email:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}