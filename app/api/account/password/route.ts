import { NextResponse } from 'next/server';
import { getCurrentStoredUser, getStoredUsers, normalizeStoredPassword, saveStoredUsers } from '@/app/lib/serverAuth';

export const dynamic = 'force-dynamic';

export async function PUT(request: Request) {
    try {
        const currentUser = await getCurrentStoredUser();

        if (!currentUser) {
            return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
        }

        const body = await request.json();
        const newPassword = typeof body.password === 'string' ? body.password.trim() : '';

        if (!newPassword) {
            return NextResponse.json({ error: 'Пароль не может быть пустым' }, { status: 400 });
        }

        const users = getStoredUsers();
        const updatedUsers = users.map((user) => {
            if (user.id !== currentUser.id) {
                return user;
            }

            return normalizeStoredPassword(user, newPassword);
        });

        saveStoredUsers(updatedUsers);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Ошибка смены пароля:', error);
        return NextResponse.json({ error: 'Ошибка смены пароля' }, { status: 500 });
    }
}
