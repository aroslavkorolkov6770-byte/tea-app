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

        // Создаем солидный корпоративный HTML-шаблон, чтобы обойти спам-фильтры Яндекса.
        // Роботы видят качественную верстку и считают письмо легитимным.
        const htmlTemplate = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 15px; background-color: #f9f9f9;">
            <div style="text-align: center; margin-bottom: 25px;">
                <h2 style="color: #0abab5; margin: 0; font-size: 24px; letter-spacing: 1px;">TEA HUB</h2>
                <p style="color: #666; font-size: 12px; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 2px;">Система корпоративного обучения</p>
            </div>
            
            <div style="background-color: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                <h3 style="color: #333; margin-top: 0; font-size: 18px;">Здравствуйте!</h3>
                <p style="color: #555; font-size: 15px; line-height: 1.6;">Вам поступило новое уведомление из системы <b>Tea Hub</b>:</p>
                
                <div style="background-color: #f4fbfb; border-left: 4px solid #0abab5; padding: 20px; margin: 25px 0; color: #222; font-size: 16px; line-height: 1.5; border-radius: 0 8px 8px 0;">
                    ${text}
                </div>
                
                <p style="color: #555; font-size: 14px; line-height: 1.6;">Для получения подробной информации, пожалуйста, авторизуйтесь в своем рабочем кабинете на нашей образовательной платформе.</p>
                
                <div style="text-align: center; margin-top: 30px;">
                    <a href="https://tea-hub.ru" style="display: inline-block; padding: 14px 30px; background-color: #0abab5; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; letter-spacing: 1px;">ПЕРЕЙТИ В TEA HUB</a>
                </div>
            </div>
            
            <div style="margin-top: 25px; text-align: center; color: #999; font-size: 11px; line-height: 1.5;">
                <p style="margin: 0 0 5px 0;">Это письмо сгенерировано автоматически. Пожалуйста, не отвечайте на него.</p>
                <p style="margin: 0;">&copy; Корольков Я.Д., 2026 | HUB СОТРУДНИКА. Все права защищены.</p>
            </div>
        </div>
        `;

        // Формируем и отправляем письмо
        await transporter.sendMail({
            from: `"Tea Hub LMS" <${process.env.SMTP_USER}>`, 
            to: to, 
            subject: subject, 
            text: text, // Оставляем обычный текст как резервный вариант
            html: htmlTemplate // Главный козырь против антиспама
        });

        return NextResponse.json({ success: true });
        
    } catch (error: any) {
        console.error('Ошибка отправки email:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}