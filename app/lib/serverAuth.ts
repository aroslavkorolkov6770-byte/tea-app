import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const AUTH_COOKIE_NAME = 'tea_hub_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const USERS_KEY = 'tea_hub_users_v1';
const HASH_PREFIX = 'scrypt';
const dataDir = path.join(process.cwd(), 'data');

export type UserRole = 'admin' | 'staff';

export interface StoredUser {
    id: string;
    login: string;
    pass?: string;
    passHash?: string;
    role: UserRole;
    name: string;
    isRegistered?: boolean;
    email?: string;
    avatar?: string;
}

export interface SessionUser {
    id: string;
    login: string;
    role: UserRole;
    name: string;
}

interface SessionPayload extends SessionUser {
    exp: number;
}

const sanitizeKey = (key: string) => key.replace(/[^a-zA-Z0-9_-]/g, '_');

const ensureDataDir = () => {
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
};

const getFilePath = (key: string) => path.join(dataDir, `${sanitizeKey(key)}.json`);

const getAuthSecret = () => process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'tea-hub-local-secret-change-me';

const baseUsers: StoredUser[] = [
    {
        id: 'u_admin',
        login: '11',
        pass: '11',
        role: 'admin',
        name: 'Главный Мастер',
        isRegistered: true,
    },
    {
        id: 'u_staff_new',
        login: '1',
        pass: '1',
        role: 'staff',
        name: '',
        isRegistered: false,
    },
];

export const shouldKeepLegacyPassword = (user: Pick<StoredUser, 'login'>, nextPassword?: string) => {
    const passwordToCheck = nextPassword ?? '';
    return (user.login === '11' && passwordToCheck === '11') || (user.login === '1' && passwordToCheck === '1');
};

export const readJsonFile = <T = any>(key: string, fallback: T): T => {
    ensureDataDir();
    const filePath = getFilePath(key);

    if (!fs.existsSync(filePath)) {
        return fallback;
    }

    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
    } catch (error) {
        console.error(`Ошибка чтения файла ${filePath}:`, error);
        return fallback;
    }
};

export const writeJsonFile = (key: string, data: unknown) => {
    ensureDataDir();
    fs.writeFileSync(getFilePath(key), JSON.stringify(data, null, 2), 'utf8');
};

export const ensureBaseUsers = () => {
    const currentUsers = readJsonFile<StoredUser[]>(USERS_KEY, []);

    if (!Array.isArray(currentUsers) || currentUsers.length === 0) {
        writeJsonFile(USERS_KEY, baseUsers);
        return baseUsers;
    }

    return currentUsers;
};

export const getStoredUsers = () => {
    return ensureBaseUsers();
};

export const saveStoredUsers = (users: StoredUser[]) => {
    writeJsonFile(USERS_KEY, users);
};

export const hashPassword = (password: string) => {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${HASH_PREFIX}$${salt}$${hash}`;
};

const verifyPasswordHash = (password: string, storedHash: string) => {
    const [prefix, salt, originalHash] = storedHash.split('$');

    if (prefix !== HASH_PREFIX || !salt || !originalHash) {
        return false;
    }

    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(originalHash, 'hex'));
};

export const verifyPassword = (user: StoredUser, password: string) => {
    if (user.passHash) {
        return verifyPasswordHash(password, user.passHash);
    }

    if (typeof user.pass === 'string') {
        return user.pass === password;
    }

    return false;
};

export const normalizeStoredPassword = (user: StoredUser, nextPassword: string) => {
    const normalizedUser: StoredUser = {
        ...user,
        passHash: hashPassword(nextPassword),
    };

    if (shouldKeepLegacyPassword(user, nextPassword)) {
        normalizedUser.pass = nextPassword;
    } else {
        delete normalizedUser.pass;
    }

    return normalizedUser;
};

export const toSessionUser = (user: StoredUser): SessionUser => ({
    id: user.id,
    login: user.login,
    role: user.role,
    name: user.name || (user.role === 'admin' ? 'Главный Мастер' : 'Сотрудник'),
});

export const toPublicUser = (user: StoredUser) => ({
    id: user.id,
    login: user.login,
    role: user.role,
    name: user.name,
    isRegistered: user.isRegistered ?? true,
    email: user.email || '',
    avatar: user.avatar || '',
    hasPassword: Boolean(user.passHash || user.pass),
});

const signValue = (value: string) => {
    return crypto.createHmac('sha256', getAuthSecret()).update(value).digest('base64url');
};

export const createSessionToken = (sessionUser: SessionUser) => {
    const payload: SessionPayload = {
        ...sessionUser,
        exp: Date.now() + SESSION_TTL_MS,
    };

    const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
    const signature = signValue(encodedPayload);
    return `${encodedPayload}.${signature}`;
};

export const verifySessionToken = (token: string | undefined) => {
    if (!token || !token.includes('.')) {
        return null;
    }

    const [encodedPayload, signature] = token.split('.');
    const expectedSignature = signValue(encodedPayload);

    if (signature !== expectedSignature) {
        return null;
    }

    try {
        const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as SessionPayload;

        if (!payload.exp || payload.exp < Date.now()) {
            return null;
        }

        return payload;
    } catch (error) {
        console.error('Ошибка разбора сессии:', error);
        return null;
    }
};

export const getSessionFromCookies = async () => {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    const payload = verifySessionToken(token);

    if (!payload) {
        return null;
    }

    return {
        id: payload.id,
        login: payload.login,
        role: payload.role,
        name: payload.name,
    } satisfies SessionUser;
};

export const getCurrentStoredUser = async () => {
    const session = await getSessionFromCookies();

    if (!session) {
        return null;
    }

    const users = getStoredUsers();
    const currentUser = users.find((user) => user.id === session.id);

    if (!currentUser) {
        return null;
    }

    return currentUser;
};

export const requireSession = async () => {
    const session = await getSessionFromCookies();

    if (!session) {
        return null;
    }

    return session;
};

export const requireAdminSession = async () => {
    const session = await requireSession();

    if (!session || session.role !== 'admin') {
        return null;
    }

    return session;
};

export const applySessionCookie = (response: NextResponse, sessionUser: SessionUser) => {
    response.cookies.set({
        name: AUTH_COOKIE_NAME,
        value: createSessionToken(sessionUser),
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: Math.floor(SESSION_TTL_MS / 1000),
    });
};

export const clearSessionCookie = (response: NextResponse) => {
    response.cookies.set({
        name: AUTH_COOKIE_NAME,
        value: '',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 0,
    });
};
