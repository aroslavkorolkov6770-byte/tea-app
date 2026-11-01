import { NextResponse } from 'next/server';
import { applySessionCookie, getCurrentStoredUser, getStoredUsers, saveStoredUsers, toPublicUser, toSessionUser, verifyPassword } from '@/app/lib/serverAuth';
import { assertRateLimit, assertTrustedMutationRequest, getClientIdentifier, readJsonBody, securityErrorResponse } from '@/app/lib/serverSecurity';
import { validateLoginChange } from '@/app/lib/loginValidation';

export const dynamic = 'force-dynamic';

export async function PUT(request: Request) {
    try {
        assertTrustedMutationRequest(request);
        const currentUser = await getCurrentStoredUser();
        if (!currentUser) return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
        assertRateLimit('account-login', getClientIdentifier(request, currentUser.id), 15, 60 * 60 * 1000);
        const body = await readJsonBody<{ login?: unknown; currentPassword?: unknown }>(request, 8 * 1024);
        const { login, error } = validateLoginChange(body.login);
        if (error) return NextResponse.json({ error }, { status: 400 });
        const password = typeof body.currentPassword === 'string' ? body.currentPassword : '';
        if (!password || password.length > 128 || !verifyPassword(currentUser, password)) {
            return NextResponse.json({ error: 'Текущий пароль указан неверно' }, { status: 403 });
        }
        const users = await getStoredUsers();
        if (users.some(user => user.id !== currentUser.id && user.login === login)) {
            return NextResponse.json({ error: 'Этот логин уже занят' }, { status: 409 });
        }
        // ID и хеш пароля сохраняются: профиль, назначения и прогресс остаются у того же человека.
        const updatedUser = login === currentUser.login ? currentUser : {
            ...currentUser, login, authVersion: (currentUser.authVersion || 0) + 1,
        };
        if (login !== currentUser.login) {
            await saveStoredUsers(users.map(user => user.id === currentUser.id ? updatedUser : user));
        }
        const response = NextResponse.json({ success: true, user: toPublicUser(updatedUser) });
        // Текущую сессию продлеваем с новым логином; прежние сессии перестают подходить.
        applySessionCookie(response, toSessionUser(updatedUser));
        return response;
    } catch (error) {
        const securityResponse = securityErrorResponse(error);
        if (securityResponse) return securityResponse;
        console.error('Ошибка смены логина:', error);
        return NextResponse.json({ error: 'Не удалось изменить логин' }, { status: 500 });
    }
}
