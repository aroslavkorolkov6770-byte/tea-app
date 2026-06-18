import { NextResponse } from 'next/server';
import {
    getSessionFromCookies,
    readJsonFile,
    getStoredUsers,
    toPublicUser,
    writeJsonFile,
} from '@/app/lib/serverAuth';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

const AUTH_READ_KEYS = new Set([
    'tea_hub_dynamic_route_v2',
    'tea_hub_dynamic_tests_v1',
    'tea_hub_dynamic_basics_v2',
    'tea_hub_urgent_files_v1',
    'tea_hub_assortment_matrix_v2',
    'tea_hub_products_v1',
    'tea_master_unified_v1',
    'sys_top_cats_v2',
    'sys_subs_map_v2',
    'sys_strengths_map_v2',
    'tea_hub_test_types_v1',
]);

const AUTH_WRITE_KEYS = new Set([
    'tea_hub_dynamic_route_v2',
    'tea_hub_dynamic_tests_v1',
    'tea_hub_dynamic_basics_v2',
    'tea_hub_urgent_files_v1',
    'tea_hub_assortment_matrix_v2',
    'tea_hub_products_v1',
    'tea_master_unified_v1',
    'sys_top_cats_v2',
    'sys_subs_map_v2',
    'sys_strengths_map_v2',
    'tea_hub_test_types_v1',
    'admin_cal_notes_v1',
]);

const isOwnKey = (key: string, prefix: string, userId: string) => key === `${prefix}${userId}`;
const isFileDataKey = (key: string) => key.startsWith('file_data_');
const isAiHistoryKey = (key: string) => key.startsWith('th_ai_history_');
const isSystemAdminProfileKey = (key: string) => key === 'profile_data_u_staff';

const getNotificationsForUser = (allNotifications: any[], userId: string) => {
    return allNotifications.filter((item: any) => item.target === 'Все' || item.target === userId || !item.target);
};

const mergeNotificationsForUser = (existingNotifications: any[], updatedVisibleNotifications: any[], userId: string) => {
    const remainingNotifications = existingNotifications.filter((item: any) => {
        return !(item.target === 'Все' || item.target === userId || !item.target);
    });

    return [...updatedVisibleNotifications, ...remainingNotifications];
};

const mergePushSubscriptionsForUser = (existingSubscriptions: any[], nextSubscriptions: any[], userId: string) => {
    const safeSubscriptions = Array.isArray(nextSubscriptions) ? nextSubscriptions : [];
    const filteredExisting = existingSubscriptions.filter((item: any) => item.userId !== userId);

    const normalizedNext = safeSubscriptions.map((item: any) => ({
        ...item,
        userId,
    }));

    return [...filteredExisting, ...normalizedNext];
};

const canReadKey = async (key: string, session: Awaited<ReturnType<typeof getSessionFromCookies>>) => {
    if (!session) {
        return false;
    }

    if (isSystemAdminProfileKey(key) && session.id !== 'u_staff') {
        return false;
    }

    if (session.role === 'admin') {
        return true;
    }

    if (AUTH_READ_KEYS.has(key)) {
        return true;
    }

    if (key === 'tea_hub_notifications_v1' || key === 'tea_hub_push_subs_v1' || key === 'tea_hub_test_results_v1') {
        return true;
    }

    if (isFileDataKey(key)) {
        return true;
    }

    if (isAiHistoryKey(key)) {
        return key === `th_ai_history_emp_${session.id}` || key === `th_ai_history_${session.id}` || key === 'th_ai_history_guest';
    }

    if (
        isOwnKey(key, 'profile_data_', session.id) ||
        isOwnKey(key, 'prog_route_', session.id) ||
        isOwnKey(key, 'prog_tests_', session.id) ||
        isOwnKey(key, 'prog_basics_', session.id) ||
        isOwnKey(key, 'dismissed_tasks_', session.id) ||
        isOwnKey(key, 'th_passed_tests_', session.id)
    ) {
        return true;
    }

    return false;
};

const canWriteKey = async (key: string, session: Awaited<ReturnType<typeof getSessionFromCookies>>) => {
    if (!session) {
        return false;
    }

    if (isSystemAdminProfileKey(key) && session.id !== 'u_staff') {
        return false;
    }

    if (session.role === 'admin') {
        return true;
    }

    if (key === 'tea_hub_notifications_v1' || key === 'tea_hub_push_subs_v1' || key === 'tea_hub_test_results_v1') {
        return true;
    }

    if (isAiHistoryKey(key)) {
        return key === `th_ai_history_emp_${session.id}` || key === `th_ai_history_${session.id}` || key === 'th_ai_history_guest';
    }

    if (
        isOwnKey(key, 'profile_data_', session.id) ||
        isOwnKey(key, 'prog_route_', session.id) ||
        isOwnKey(key, 'prog_tests_', session.id) ||
        isOwnKey(key, 'prog_basics_', session.id) ||
        isOwnKey(key, 'dismissed_tasks_', session.id) ||
        isOwnKey(key, 'th_passed_tests_', session.id)
    ) {
        return true;
    }

    return false;
};

const readKeyForSession = async (key: string, session: Awaited<ReturnType<typeof getSessionFromCookies>>) => {
    const canRead = await canReadKey(key, session);

    if (!canRead) {
        throw new Error(`ACCESS_DENIED:${key}`);
    }

    const data = readJsonFile(key, []);

    if (key === 'tea_hub_users_v1') {
        return getStoredUsers().map((user) => toPublicUser(user));
    }

    if (!session || session.role === 'admin') {
        return data;
    }

    if (key === 'tea_hub_notifications_v1') {
        return Array.isArray(data) ? getNotificationsForUser(data, session.id) : [];
    }

    if (key === 'tea_hub_push_subs_v1') {
        return Array.isArray(data) ? data.filter((item: any) => item.userId === session.id) : [];
    }

    return data;
};

const writeKeyForSession = async (key: string, data: any, session: Awaited<ReturnType<typeof getSessionFromCookies>>) => {
    const canWrite = await canWriteKey(key, session);

    if (!canWrite) {
        throw new Error(`ACCESS_DENIED:${key}`);
    }

    if (!session) {
        throw new Error('ACCESS_DENIED');
    }

    if (session.role !== 'admin') {
        if (key === 'tea_hub_notifications_v1') {
            const existingNotifications = readJsonFile<any[]>(key, []);
            writeJsonFile(key, mergeNotificationsForUser(existingNotifications, Array.isArray(data) ? data : [], session.id));
            return;
        }

        if (key === 'tea_hub_push_subs_v1') {
            const existingSubscriptions = readJsonFile<any[]>(key, []);
            writeJsonFile(key, mergePushSubscriptionsForUser(existingSubscriptions, Array.isArray(data) ? data : [], session.id));
            return;
        }
    }

    writeJsonFile(key, data);
};

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const rawKey = searchParams.get('key');
    const rawKeys = searchParams.get('keys');

    if (!rawKey && !rawKeys) {
        return NextResponse.json({ error: 'Не указан ключ данных' }, { status: 400 });
    }

    const session = await getSessionFromCookies();

    if (!session) {
        return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
    }

    try {
        if (rawKeys) {
            const keys = rawKeys
                .split(',')
                .map((key) => key.trim())
                .filter(Boolean);

            const result: Record<string, any> = {};

            for (const key of keys) {
                try {
                    result[key] = await readKeyForSession(key, session);
                } catch (error) {
                    if (error instanceof Error && error.message.startsWith('ACCESS_DENIED')) {
                        result[key] = [];
                    } else {
                        console.error(`Ошибка чтения ключа ${key}:`, error);
                        result[key] = [];
                    }
                }
            }

            return NextResponse.json(result, {
                status: 200,
                headers: {
                    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                    Pragma: 'no-cache',
                    Expires: '0',
                },
            });
        }

        const data = await readKeyForSession(rawKey as string, session);
        return NextResponse.json(data, {
            status: 200,
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                Pragma: 'no-cache',
                Expires: '0',
            },
        });
    } catch (error) {
        if (error instanceof Error && error.message.startsWith('ACCESS_DENIED')) {
            return NextResponse.json({ error: 'Недостаточно прав доступа' }, { status: 403 });
        }

        console.error('Ошибка чтения:', error);
        return NextResponse.json([], { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const rawKey = typeof body.key === 'string' ? body.key : '';
        const { data } = body;
        const isChunked = body.chunked === true;
        const chunkType = body.chunkType === 'string' ? 'string' : 'array';
        const chunkIndex = Number.isInteger(body.chunkIndex) ? Number(body.chunkIndex) : 0;
        const totalChunks = Number.isInteger(body.totalChunks) ? Number(body.totalChunks) : 1;

        if (!rawKey || typeof data === 'undefined') {
            return NextResponse.json({ error: 'Неверные данные' }, { status: 400 });
        }

        const session = await getSessionFromCookies();

        if (!session) {
            return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
        }

        if (isChunked) {
            const isValidArrayChunk = chunkType === 'array' && Array.isArray(data);
            const isValidStringChunk = chunkType === 'string' && typeof data === 'string';

            if ((!isValidArrayChunk && !isValidStringChunk) || totalChunks < 1 || chunkIndex < 0 || chunkIndex >= totalChunks) {
                return NextResponse.json({ error: 'Неверные параметры chunk-загрузки' }, { status: 400 });
            }

            const canWrite = await canWriteKey(rawKey, session);

            if (!canWrite) {
                return NextResponse.json({ error: 'Недостаточно прав доступа' }, { status: 403 });
            }

            const tempKey = `${rawKey}__upload_tmp`;
            const existingTemp = chunkIndex === 0
                ? (chunkType === 'string' ? '' : [])
                : readJsonFile<any>(tempKey, chunkType === 'string' ? '' : []);
            const mergedChunk = chunkType === 'string'
                ? `${typeof existingTemp === 'string' ? existingTemp : ''}${data}`
                : [...(Array.isArray(existingTemp) ? existingTemp : []), ...data];

            if (chunkIndex === totalChunks - 1) {
                await writeKeyForSession(rawKey, mergedChunk, session);
                writeJsonFile(tempKey, null);
                return NextResponse.json({ success: true, chunked: true, completed: true });
            }

            writeJsonFile(tempKey, mergedChunk);
            return NextResponse.json({ success: true, chunked: true, completed: false, chunkIndex });
        }

        await writeKeyForSession(rawKey, data, session);
        return NextResponse.json({ success: true });
    } catch (error) {
        if (error instanceof Error && error.message.startsWith('ACCESS_DENIED')) {
            return NextResponse.json({ error: 'Недостаточно прав доступа' }, { status: 403 });
        }

        console.error('Ошибка записи:', error);
        return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
    }
}
