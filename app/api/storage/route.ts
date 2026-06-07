import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

// Папка для хранения файлов (создастся в корне проекта)
const dataDir = path.join(process.cwd(), 'data');

// Функция для очистки имени файла (чтобы логины типа admin@mail.ru не ломали систему файлов)
const sanitizeKey = (key: string) => {
    return key.replace(/[^a-zA-Z0-9_-]/g, '_');
};

const ensureDataDir = () => {
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
};

const readStorageValue = (rawKey: string) => {
    const safeKey = sanitizeKey(rawKey);
    const filePath = path.join(dataDir, `${safeKey}.json`);

    if (!fs.existsSync(filePath)) {
        return [];
    }

    const fileData = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileData);
};

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const rawKey = searchParams.get('key');
    const rawKeys = searchParams.get('keys');

    if (!rawKey && !rawKeys) {
        return NextResponse.json({ error: 'Не указан ключ данных' }, { status: 400 });
    }

    try {
        ensureDataDir();

        if (rawKeys) {
            const keys = rawKeys
                .split(',')
                .map((key) => key.trim())
                .filter(Boolean);

            const result: Record<string, any> = {};

            for (const key of keys) {
                try {
                    result[key] = readStorageValue(key);
                } catch (error) {
                    console.error(`Ошибка чтения ключа ${key}:`, error);
                    result[key] = [];
                }
            }

            return NextResponse.json(result, {
                status: 200,
                headers: {
                    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0',
                },
            });
        }

        const safeKey = sanitizeKey(rawKey as string);
        const filePath = path.join(dataDir, `${safeKey}.json`);

        if (fs.existsSync(filePath)) {
            const fileData = fs.readFileSync(filePath, 'utf8');
            return new NextResponse(fileData, {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0',
                },
            });
        } else {
            return new NextResponse(JSON.stringify([]), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-store',
                },
            });
        }
    } catch (error) {
        console.error('Ошибка чтения:', error);
        return NextResponse.json([], { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { key: rawKey, data } = body;

        if (!rawKey || !data) {
            return NextResponse.json({ error: 'Неверные данные' }, { status: 400 });
        }

        const safeKey = sanitizeKey(rawKey);
        const filePath = path.join(dataDir, `${safeKey}.json`);
        
        ensureDataDir();

        // Записываем данные в локальный файл
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        console.log(`OK [УСПЕХ] Файл сохранен: ${filePath}`);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(' Ошибка записи:', error);
        return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
    }
}
