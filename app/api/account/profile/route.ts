import { NextResponse } from 'next/server';
import {
    applySessionCookie,
    getCurrentStoredUser,
    getStoredUsers,
    saveStoredUsers,
    toPublicUser,
    toSessionUser,
    writeJsonFile,
    readJsonFile,
} from '@/app/lib/serverAuth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const currentUser = await getCurrentStoredUser();

        if (!currentUser) {
            return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
        }

        let profile = readJsonFile<Record<string, any>>(`profile_data_${currentUser.id}`, {});

        if (!profile || Array.isArray(profile) || Object.keys(profile).length === 0) {
            profile = {
                avatar: '',
                tg: currentUser.role === 'admin' ? 'admin_tea' : '',
                phone: '',
                email: currentUser.email || '',
                firstLogin: new Date().toISOString(),
            };

            writeJsonFile(`profile_data_${currentUser.id}`, profile);
        }

        return NextResponse.json({
            user: toPublicUser(currentUser),
            profile,
        });
    } catch (error) {
        console.error('Ошибка чтения профиля:', error);
        return NextResponse.json({ error: 'Ошибка чтения профиля' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const currentUser = await getCurrentStoredUser();

        if (!currentUser) {
            return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
        }

        const body = await request.json();
        const name = typeof body.name === 'string' ? body.name.trim() : currentUser.name;
        const avatar = typeof body.avatar === 'string' ? body.avatar : '';
        const tg = typeof body.tg === 'string' ? body.tg : '';
        const phone = typeof body.phone === 'string' ? body.phone : '';
        const email = typeof body.email === 'string' ? body.email.trim() : '';

        const users = getStoredUsers();
        const updatedUsers = users.map((user) => {
            if (user.id !== currentUser.id) {
                return user;
            }

            return {
                ...user,
                name,
                email,
            };
        });

        saveStoredUsers(updatedUsers);

        const previousProfile = readJsonFile<Record<string, any>>(`profile_data_${currentUser.id}`, {});
        writeJsonFile(`profile_data_${currentUser.id}`, {
            ...previousProfile,
            avatar,
            tg,
            phone,
            email,
        });

        const refreshedUser = updatedUsers.find((user) => user.id === currentUser.id) || currentUser;

        const response = NextResponse.json({
            success: true,
            user: toPublicUser(refreshedUser),
            profile: {
                ...previousProfile,
                avatar,
                tg,
                phone,
                email,
            },
        });
        applySessionCookie(response, toSessionUser(refreshedUser));
        return response;
    } catch (error) {
        console.error('Ошибка сохранения профиля:', error);
        return NextResponse.json({ error: 'Ошибка сохранения профиля' }, { status: 500 });
    }
}
