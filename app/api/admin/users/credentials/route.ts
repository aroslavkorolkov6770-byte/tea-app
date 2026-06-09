import { NextResponse } from 'next/server';
import { getStoredUsers, normalizeStoredPassword, requireAdminSession, saveStoredUsers, toPublicUser } from '@/app/lib/serverAuth';

export const dynamic = 'force-dynamic';

export async function PUT(request: Request) {
    try {
        const session = await requireAdminSession();

        if (!session) {
            return NextResponse.json({ error: 'Доступ только для администратора' }, { status: 403 });
        }

        const body = await request.json();
        const userId = typeof body.userId === 'string' ? body.userId : '';
        const login = typeof body.login === 'string' ? body.login.trim() : '';
        const password = typeof body.password === 'string' ? body.password.trim() : '';

        if (!userId || !login || !password) {
            return NextResponse.json({ error: 'Логин и пароль обязательны' }, { status: 400 });
        }

        const users = getStoredUsers();
        const targetUser = users.find((user) => user.id === userId);

        if (targetUser?.systemAccount && session.id !== userId) {
            return NextResponse.json({ error: 'Доступ к системному аккаунту закрыт' }, { status: 403 });
        }

        if (users.some((user) => user.login === login && user.id !== userId)) {
            return NextResponse.json({ error: 'Логин уже занят другим пользователем' }, { status: 409 });
        }

        let updatedUser = null;
        const updatedUsers = users.map((user) => {
            if (user.id !== userId) {
                return user;
            }

            updatedUser = normalizeStoredPassword(
                {
                    ...user,
                    login,
                },
                password,
            );

            return updatedUser;
        });

        if (!updatedUser) {
            return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
        }

        saveStoredUsers(updatedUsers);

        return NextResponse.json({
            success: true,
            user: toPublicUser(updatedUser),
        });
    } catch (error) {
        console.error('Ошибка обновления доступов:', error);
        return NextResponse.json({ error: 'Ошибка обновления доступов' }, { status: 500 });
    }
}
