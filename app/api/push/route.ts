import { NextResponse } from 'next/server';
import webpush from 'web-push';
import type { PushSubscription } from 'web-push';
import { requireAdminSession } from '@/app/lib/serverAuth';
import {
    assertRateLimit,
    assertTrustedMutationRequest,
    getClientIdentifier,
    readJsonBody,
    securityErrorResponse,
} from '@/app/lib/serverSecurity';

const configureWebPush = () => {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;

    if (!publicKey || !privateKey) {
        return false;
    }

    // Настраиваем VAPID ключи только при реальной отправке, чтобы сборка не падала без .env.
    webpush.setVapidDetails('mailto:admin@tea-hub.ru', publicKey, privateKey);
    return true;
};

const normalizePushSubscription = (value: unknown): PushSubscription | null => {
    if (!value || typeof value !== 'object') {
        return null;
    }

    const candidate = value as {
        endpoint?: unknown;
        expirationTime?: unknown;
        keys?: {
            auth?: unknown;
            p256dh?: unknown;
        };
    };

    if (
        typeof candidate.endpoint !== 'string'
        || typeof candidate.keys?.auth !== 'string'
        || typeof candidate.keys?.p256dh !== 'string'
        || candidate.endpoint.length > 2_048
        || candidate.keys.auth.length > 512
        || candidate.keys.p256dh.length > 512
    ) {
        return null;
    }

    try {
        const endpoint = new URL(candidate.endpoint);
        if (
            endpoint.protocol !== 'https:'
            || endpoint.hostname === 'localhost'
            || endpoint.hostname.endsWith('.local')
        ) {
            return null;
        }
    } catch {
        return null;
    }

    return {
        endpoint: candidate.endpoint,
        expirationTime: typeof candidate.expirationTime === 'number'
            ? candidate.expirationTime
            : null,
        keys: {
            auth: candidate.keys.auth,
            p256dh: candidate.keys.p256dh,
        },
    };
};

export async function POST(req: Request) {
    try {
        assertTrustedMutationRequest(req);
        const session = await requireAdminSession();

        if (!session) {
            return NextResponse.json({ error: 'Доступ только для администратора' }, { status: 403 });
        }

        assertRateLimit('send-push', getClientIdentifier(req, session.id), 20, 5 * 60 * 1000);
        const body = await readJsonBody<Record<string, unknown>>(req, 256 * 1024);
        const subscriptions = Array.isArray(body.subscriptions) ? body.subscriptions.slice(0, 500) : [];
        const payload = body.payload && typeof body.payload === 'object'
            ? body.payload as { title?: unknown; body?: unknown; url?: unknown }
            : {};
        const normalizedPayload = {
            title: typeof payload.title === 'string' ? payload.title.trim().slice(0, 120) : '',
            body: typeof payload.body === 'string' ? payload.body.trim().slice(0, 1_000) : '',
            url: typeof payload.url === 'string' && payload.url.startsWith('/')
                ? payload.url.slice(0, 500)
                : '/tasks?tab=welcome',
        };

        if (!configureWebPush()) {
            return NextResponse.json(
                { error: 'VAPID ключи для Push-уведомлений не настроены на сервере' },
                { status: 500 }
            );
        }

        // Если подписок нет, корректно отвечаем фронтенду
        if (subscriptions.length === 0 || !normalizedPayload.title || !normalizedPayload.body) {
            return NextResponse.json({ error: 'Нет подписок для отправки' }, { status: 400 });
        }

        const safeSubscriptions = subscriptions
            .map(normalizePushSubscription)
            .filter((subscription): subscription is PushSubscription => Boolean(subscription));

        if (safeSubscriptions.length === 0) {
            return NextResponse.json({ error: 'Нет корректных подписок для отправки' }, { status: 400 });
        }

        const sendPromises = safeSubscriptions.map(async (sub) => {
            try {
                await webpush.sendNotification(sub, JSON.stringify(normalizedPayload), {
                    TTL: 60,
                    timeout: 10_000,
                });
            } catch (error: unknown) {
                const statusCode = error && typeof error === 'object' && 'statusCode' in error
                    ? String((error as { statusCode?: unknown }).statusCode ?? '')
                    : '';
                console.error(`Ошибка доставки Push. Код ответа: ${statusCode || 'не указан'}`);
            }
        });

        await Promise.all(sendPromises);

        return NextResponse.json({ success: true });
        
    } catch (error: unknown) {
        const securityResponse = securityErrorResponse(error);
        if (securityResponse) {
            return securityResponse;
        }

        console.error('Глобальная критическая ошибка Push API:', error);
        return NextResponse.json({ error: 'Не удалось отправить push-уведомления' }, { status: 500 });
    }
}
