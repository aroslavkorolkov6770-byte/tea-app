import { NextResponse } from 'next/server';
import { dataUrlToBytes, getDataUrlMimeType } from '@/app/lib/documentPreview';
import { extractTextFromDocument } from '@/app/lib/documentTextExtractor';
import { getSessionFromCookies, readJsonFile } from '@/app/lib/serverAuth';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

const MAX_PREVIEW_SIZE_BYTES = 40 * 1024 * 1024;
const MAX_PREVIEW_CHARACTERS = 500_000;

type PreviewRequest = {
    fileId?: string;
    fileName?: string;
    dataUrl?: string;
};

const isSafeFileId = (value: string) => /^[a-zA-Z0-9_-]+$/.test(value);

export async function POST(request: Request) {
    try {
        const session = await getSessionFromCookies();
        if (!session) {
            return NextResponse.json({ error: 'Требуется вход в систему' }, { status: 401 });
        }

        const body = await request.json() as PreviewRequest;
        const fileName = String(body.fileName || '').trim();
        if (!fileName) {
            return NextResponse.json({ error: 'Не указано имя файла' }, { status: 400 });
        }

        let dataUrl = typeof body.dataUrl === 'string' ? body.dataUrl : '';
        if (!dataUrl && body.fileId) {
            const fileId = String(body.fileId);
            if (!isSafeFileId(fileId)) {
                return NextResponse.json({ error: 'Некорректный идентификатор файла' }, { status: 400 });
            }
            dataUrl = readJsonFile<string>(`file_data_${fileId}`, '');
        }

        if (!dataUrl || !dataUrl.startsWith('data:')) {
            return NextResponse.json({ error: 'Данные файла не найдены' }, { status: 404 });
        }

        const bytes = dataUrlToBytes(dataUrl);
        if (bytes.byteLength > MAX_PREVIEW_SIZE_BYTES) {
            return NextResponse.json({ error: 'Для просмотра доступны файлы размером до 40 МБ' }, { status: 413 });
        }

        const file = new File([bytes], fileName, { type: getDataUrlMimeType(dataUrl) });
        const text = await extractTextFromDocument(file, {
            maxSizeBytes: MAX_PREVIEW_SIZE_BYTES,
            maxCharacters: MAX_PREVIEW_CHARACTERS,
        });

        return NextResponse.json({ text });
    } catch (error) {
        console.error('Ошибка подготовки предпросмотра документа:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Не удалось подготовить документ' },
            { status: 422 },
        );
    }
}
