import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const AUTH_COOKIE_NAME = 'tea_hub_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const USERS_KEY = 'tea_hub_users_v1';
const HASH_PREFIX = 'scrypt';
const SYSTEM_ADMIN_ID = 'u_staff';
const SYSTEM_ADMIN_LOGIN = 'system admin';
const SYSTEM_ADMIN_PASSWORD = '6Jr6731R';
const dataDir = path.join(process.cwd(), 'data');
const jsonFileCache = new Map<string, { parsed: unknown; modifiedAtMs: number }>();

export type UserRole = 'admin' | 'staff';

export interface StoredUser {
    id: string;
    login: string;
    pass?: string;
    passHash?: string;
    role: UserRole;
    name: string;
    isRegistered?: boolean;
    registered?: boolean;
    email?: string;
    avatar?: string;
    systemAccount?: boolean;
    ghostAccount?: boolean;
    profileDisabled?: boolean;
    profileOwnerOnly?: boolean;
    hideFromStats?: boolean;
    canSwitchMode?: boolean;
    accountLabel?: string;
}

export interface SessionUser {
    id: string;
    login: string;
    role: UserRole;
    name: string;
    systemAccount?: boolean;
    ghostAccount?: boolean;
    profileDisabled?: boolean;
    profileOwnerOnly?: boolean;
    hideFromStats?: boolean;
    canSwitchMode?: boolean;
    accountLabel?: string;
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
const getTempFilePath = (key: string) => path.join(dataDir, `${sanitizeKey(key)}.tmp`);
const getBackupFilePath = (key: string) => path.join(dataDir, `${sanitizeKey(key)}.bak`);

const getAuthSecret = () => process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'tea-hub-local-secret-change-me';

let baseUsers: StoredUser[] = [];

export const shouldKeepLegacyPassword = (user: Pick<StoredUser, 'login'>, nextPassword?: string) => {
    const passwordToCheck = nextPassword ?? '';
    return user.login === '11' && passwordToCheck === '11';
};

const isLegacySystemAccount = (user: Partial<StoredUser>) => {
    const normalizedName = typeof user.name === 'string' ? user.name.trim().toLowerCase() : '';
    return (
        user.id === 'u_staff' ||
        user.id === 'u_staff_new' ||
        user.login === '1' ||
        user.login === '1.1' ||
        user.login === SYSTEM_ADMIN_LOGIN ||
        normalizedName === 'ярик' ||
        normalizedName === 'системный администратор'
    );
};

const normalizeStoredUser = (user: StoredUser): StoredUser => {
    const normalizedUser: StoredUser = { ...user };

    if (typeof normalizedUser.isRegistered !== 'boolean' && typeof normalizedUser.registered === 'boolean') {
        normalizedUser.isRegistered = normalizedUser.registered;
    }

    delete normalizedUser.registered;

    if (isLegacySystemAccount(normalizedUser)) {
        normalizedUser.id = SYSTEM_ADMIN_ID;
        normalizedUser.login = SYSTEM_ADMIN_LOGIN;
        normalizedUser.role = 'admin';
        normalizedUser.name = 'Системный администратор';
        normalizedUser.isRegistered = true;
        normalizedUser.systemAccount = true;
        normalizedUser.ghostAccount = true;
        normalizedUser.profileDisabled = false;
        normalizedUser.profileOwnerOnly = true;
        normalizedUser.hideFromStats = true;
        normalizedUser.canSwitchMode = true;
        normalizedUser.accountLabel = 'Системный администратор';
        if (!verifyPassword(normalizedUser, SYSTEM_ADMIN_PASSWORD)) {
            normalizedUser.passHash = hashPassword(SYSTEM_ADMIN_PASSWORD);
        }
        delete normalizedUser.pass;
    }

    if (!normalizedUser.name) {
        normalizedUser.name = normalizedUser.role === 'admin' ? 'Главный Мастер' : 'Сотрудник';
    }

    return normalizedUser;
};

const haveUsersChanged = (originalUsers: StoredUser[], normalizedUsers: StoredUser[]) => {
    return JSON.stringify(originalUsers) !== JSON.stringify(normalizedUsers);
};

export const readJsonFile = <T = any>(key: string, fallback: T): T => {
    ensureDataDir();
    const filePath = getFilePath(key);
    const backupFilePath = getBackupFilePath(key);

    if (!fs.existsSync(filePath)) {
        if (!fs.existsSync(backupFilePath)) {
            return fallback;
        }
    }

    try {
        const activeFilePath = fs.existsSync(filePath) ? filePath : backupFilePath;
        const stats = fs.statSync(activeFilePath);
        const cachedEntry = jsonFileCache.get(filePath);

        if (cachedEntry && cachedEntry.modifiedAtMs === stats.mtimeMs) {
            return structuredClone(cachedEntry.parsed) as T;
        }

        const parsedData = JSON.parse(fs.readFileSync(activeFilePath, 'utf8')) as T;
        jsonFileCache.set(filePath, {
            parsed: parsedData,
            modifiedAtMs: stats.mtimeMs,
        });

        return structuredClone(parsedData) as T;
    } catch (error) {
        console.error(`Ошибка чтения файла ${filePath}:`, error);

        if (fs.existsSync(backupFilePath)) {
            try {
                const backupStats = fs.statSync(backupFilePath);
                const backupData = JSON.parse(fs.readFileSync(backupFilePath, 'utf8')) as T;
                jsonFileCache.set(filePath, {
                    parsed: backupData,
                    modifiedAtMs: backupStats.mtimeMs,
                });
                return structuredClone(backupData) as T;
            } catch (backupError) {
                console.error(`Ошибка чтения резервной копии ${backupFilePath}:`, backupError);
            }
        }

        return fallback;
    }
};

export const writeJsonFile = (key: string, data: unknown) => {
    ensureDataDir();
    const filePath = getFilePath(key);
    const tempFilePath = getTempFilePath(key);
    const backupFilePath = getBackupFilePath(key);
    const payload = JSON.stringify(data, null, 2);

    if (data === null) {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        if (fs.existsSync(backupFilePath)) {
            fs.unlinkSync(backupFilePath);
        }
        jsonFileCache.delete(filePath);
        return;
    }

    fs.writeFileSync(tempFilePath, payload, 'utf8');

    if (fs.existsSync(filePath)) {
        fs.copyFileSync(filePath, backupFilePath);
    }

    fs.renameSync(tempFilePath, filePath);
    fs.copyFileSync(filePath, backupFilePath);

    try {
        const stats = fs.statSync(filePath);
        jsonFileCache.set(filePath, {
            parsed: data,
            modifiedAtMs: stats.mtimeMs,
        });
    } catch (error) {
        console.error(`Ошибка обновления кеша файла ${filePath}:`, error);
        jsonFileCache.delete(filePath);
    }
};

export const ensureBaseUsers = () => {
    const currentUsers = readJsonFile<StoredUser[]>(USERS_KEY, []);

    if (!Array.isArray(currentUsers) || currentUsers.length === 0) {
        writeJsonFile(USERS_KEY, baseUsers);
        return baseUsers;
    }

    const normalizedUsers = currentUsers.map(normalizeStoredUser);

    if (!normalizedUsers.some((user) => user.id === 'u_admin')) {
        normalizedUsers.unshift(baseUsers[0]);
    }

    if (!normalizedUsers.some((user) => user.id === SYSTEM_ADMIN_ID)) {
        normalizedUsers.push(baseUsers[1]);
    }

    if (haveUsersChanged(currentUsers, normalizedUsers)) {
        writeJsonFile(USERS_KEY, normalizedUsers);
    }

    return normalizedUsers;
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

baseUsers = [
    {
        id: 'u_admin',
        login: '11',
        pass: '11',
        role: 'admin',
        name: 'Главный Мастер',
        isRegistered: true,
    },
    {
        id: SYSTEM_ADMIN_ID,
        login: SYSTEM_ADMIN_LOGIN,
        passHash: hashPassword(SYSTEM_ADMIN_PASSWORD),
        role: 'admin',
        name: 'Системный администратор',
        isRegistered: true,
        systemAccount: true,
        ghostAccount: true,
        profileDisabled: false,
        profileOwnerOnly: true,
        hideFromStats: true,
        canSwitchMode: true,
        accountLabel: 'Системный администратор',
    },
];

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
    systemAccount: Boolean(user.systemAccount),
    ghostAccount: Boolean(user.ghostAccount),
    profileDisabled: Boolean(user.profileDisabled),
    profileOwnerOnly: Boolean(user.profileOwnerOnly),
    hideFromStats: Boolean(user.hideFromStats),
    canSwitchMode: Boolean(user.canSwitchMode),
    accountLabel: user.accountLabel || '',
});

export const toPublicUser = (user: StoredUser) => ({
    id: user.id,
    login: user.login,
    role: user.role,
    name: user.name || (user.role === 'admin' ? 'Главный Мастер' : 'Сотрудник'),
    isRegistered: user.isRegistered ?? true,
    email: user.email || '',
    avatar: user.avatar || '',
    hasPassword: Boolean(user.passHash || user.pass),
    systemAccount: Boolean(user.systemAccount),
    ghostAccount: Boolean(user.ghostAccount),
    profileDisabled: Boolean(user.profileDisabled),
    profileOwnerOnly: Boolean(user.profileOwnerOnly),
    hideFromStats: Boolean(user.hideFromStats),
    canSwitchMode: Boolean(user.canSwitchMode),
    accountLabel: user.accountLabel || '',
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
        systemAccount: Boolean(payload.systemAccount),
        ghostAccount: Boolean(payload.ghostAccount),
        profileDisabled: Boolean(payload.profileDisabled),
        profileOwnerOnly: Boolean(payload.profileOwnerOnly),
        hideFromStats: Boolean(payload.hideFromStats),
        canSwitchMode: Boolean(payload.canSwitchMode),
        accountLabel: payload.accountLabel || '',
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
