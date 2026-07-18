import { NextResponse } from 'next/server';
import { getStoredUsers, hashPassword, requireAdminSession, saveStoredUsers, toPublicUser, type StoredUser, type UserRole } from '@/app/lib/serverAuth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const session = await requireAdminSession();

        if (!session) {
            return NextResponse.json({ error: 'Доступ только для администратора' }, { status: 403 });
        }

        const body = await request.json();
        const name = typeof body.name === 'string' ? body.name.trim() : '';
        const login = typeof body.login === 'string' ? body.login.trim() : '';
        const password = typeof body.password === 'string' ? body.password.trim() : '';
        const location = typeof body.location === 'string' ? body.location.trim() : '';
        const role: UserRole = body.role === 'admin' ? 'admin' : 'staff';

        if (!name || !login || !password) {
            return NextResponse.json({ error: 'Заполните все поля' }, { status: 400 });
        }

        if (location.length > 120) {
            return NextResponse.json({ error: 'Название точки не должно превышать 120 символов' }, { status: 400 });
        }

        const users = getStoredUsers();

        if (users.some((user) => user.login === login)) {
            return NextResponse.json({ error: 'Логин уже существует' }, { status: 409 });
        }

        const createdUser: StoredUser = {
            id: `u_${Date.now()}`,
            login,
            passHash: hashPassword(password),
            role,
            name,
            location: location || undefined,
            isRegistered: role === 'admin',
        };

        const updatedUsers = [...users, createdUser];
        saveStoredUsers(updatedUsers);

        return NextResponse.json({
            success: true,
            user: toPublicUser(createdUser),
        });
    } catch (error) {
        console.error('Ошибка создания сотрудника:', error);
        return NextResponse.json({ error: 'Ошибка создания сотрудника' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const session = await requireAdminSession();

        if (!session) {
            return NextResponse.json({ error: 'Доступ только для администратора' }, { status: 403 });
        }

        const body = await request.json();
        const userId = typeof body.userId === 'string' ? body.userId : '';

        if (!userId) {
            return NextResponse.json({ error: 'Не указан пользователь' }, { status: 400 });
        }

        const users = getStoredUsers();
        const protectedIds = new Set(['u_admin', 'u_staff', 'u_staff_new']);
        const targetUser = users.find((user) => user.id === userId);

        if (protectedIds.has(userId) || targetUser?.systemAccount || targetUser?.ghostAccount) {
            return NextResponse.json({ error: 'Базовые аккаунты удалять нельзя' }, { status: 400 });
        }

        const updatedUsers = users.filter((user) => user.id !== userId);
        saveStoredUsers(updatedUsers);

        return NextResponse.json({ success: true, userId });
    } catch (error) {
        console.error('Ошибка удаления сотрудника:', error);
        return NextResponse.json({ error: 'Ошибка удаления сотрудника' }, { status: 500 });
    }
}
