import { NextResponse } from 'next/server';
import { applySessionCookie, getStoredUsers, toPublicUser, toSessionUser, verifyPassword } from '@/app/lib/serverAuth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const login = typeof body.login === 'string' ? body.login.trim() : '';
        const password = typeof body.password === 'string' ? body.password.trim() : '';

        if (!login || !password) {
            return NextResponse.json({ error: 'Логин и пароль обязательны' }, { status: 400 });
        }

        const users = getStoredUsers();
        const foundUser = users.find((user) => user.login === login);

        if (!foundUser || !verifyPassword(foundUser, password)) {
            return NextResponse.json({ error: 'Неправильный логин или пароль' }, { status: 401 });
        }

        if (foundUser.role !== 'admin' && !foundUser.isRegistered) {
            return NextResponse.json(
                {
                    requiresRegistration: true,
                    message: 'Для начала пройдите регистрацию и заполните данные профиля.',
                    user: toPublicUser(foundUser),
                },
                { status: 403 },
            );
        }

        const response = NextResponse.json({
            success: true,
            user: toPublicUser(foundUser),
        });

        applySessionCookie(response, toSessionUser(foundUser));
        return response;
    } catch (error) {
        console.error('Ошибка входа:', error);
        return NextResponse.json({ error: 'Ошибка сервера при входе' }, { status: 500 });
    }
}
