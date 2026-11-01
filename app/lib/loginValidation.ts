// Смена логина использует те же регистр и максимальную длину, что и обычный вход.
export const validateLoginChange = (value: unknown) => {
    const login = typeof value === 'string' ? value.trim() : '';
    if (!login || login.length > 120 || /[\s\p{Cc}]/u.test(login)) {
        return { login, error: 'Введите логин от 1 до 120 символов без пробелов.' };
    }
    return { login, error: null };
};
