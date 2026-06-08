export const saveDataToServer = (key: string, data: any) => {
    return fetch('/api/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, data }),
    }).catch((err) => console.error('Ошибка сохранения на сервер:', err));
};

export const fetchStorageBatch = async (keys: string[]) => {
    const response = await fetch(`/api/storage?keys=${encodeURIComponent(keys.join(','))}`, {
        cache: 'no-store',
    });

    if (!response.ok) {
        throw new Error(`Ошибка пакетной загрузки данных: ${response.status}`);
    }

    return response.json();
};
