import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Указываем папку, где будут храниться наши JSON-файлы (в корне проекта)
const dataDir = path.join(process.cwd(), 'data');

// Создаем папку data, если её еще нет
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// GET-запрос: Чтение данных (для загрузки страницы)
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
        return NextResponse.json({ error: 'Не указан ключ данных' }, { status: 400 });
    }

    const filePath = path.join(dataDir, `${key}.json`);

    try {
        if (fs.existsSync(filePath)) {
            const fileData = fs.readFileSync(filePath, 'utf8');
            return NextResponse.json(JSON.parse(fileData));
        } else {
            // Если файла еще нет, возвращаем пустоту
            return NextResponse.json([]);
        }
    } catch (error) {
        console.error('Ошибка чтения:', error);
        return NextResponse.json([], { status: 500 });
    }
}

// POST-запрос: Запись данных (при нажатии "Сохранить/Удалить")
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { key, data } = body;

        if (!key || !data) {
            return NextResponse.json({ error: 'Неверные данные' }, { status: 400 });
        }

        const filePath = path.join(dataDir, `${key}.json`);
        
        // Перезаписываем JSON файл новыми данными
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Ошибка записи:', error);
        return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
    }
}