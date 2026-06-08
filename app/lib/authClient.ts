'use client';

export interface ClientSessionUser {
    id: string;
    login: string;
    role: 'admin' | 'staff';
    name: string;
}

const setCookie = (name: string, value: string, days: number | null = 7) => {
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        document.cookie = `${name}=${encodeURIComponent(value)};expires=${date.toUTCString()};path=/`;
        return;
    }

    document.cookie = `${name}=${encodeURIComponent(value)};path=/`;
};

const deleteCookie = (name: string) => {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};

export const applyClientAuthState = (user: ClientSessionUser) => {
    const hasConsent = localStorage.getItem('cookieConsent') === 'true';
    const storage = hasConsent ? localStorage : sessionStorage;
    const secondaryStorage = hasConsent ? sessionStorage : localStorage;

    storage.setItem('isLoggedIn', 'true');
    storage.setItem('userRole', user.role);
    storage.setItem('current_user_id', user.id);
    storage.setItem('current_user_name', user.name);
    storage.setItem('login', user.login);

    secondaryStorage.removeItem('isLoggedIn');
    secondaryStorage.removeItem('userRole');
    secondaryStorage.removeItem('current_user_id');
    secondaryStorage.removeItem('current_user_name');
    secondaryStorage.removeItem('login');

    setCookie('isLoggedIn', 'true', hasConsent ? 7 : null);
    setCookie('userRole', user.role, hasConsent ? 7 : null);
    setCookie('current_user_id', user.id, hasConsent ? 7 : null);
    setCookie('current_user_name', user.name, hasConsent ? 7 : null);
};

export const clearClientAuthState = () => {
    const keysToRemove = [
        'isLoggedIn',
        'userRole',
        'current_user_id',
        'current_user_name',
        'login',
        'th_current_user',
        'currentUser',
        'user',
        'profile',
        'userData',
        'account',
    ];

    keysToRemove.forEach((key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    });

    deleteCookie('isLoggedIn');
    deleteCookie('userRole');
    deleteCookie('current_user_id');
    deleteCookie('current_user_name');
};
