export const saveDataToServer = (key: string, data: any) => {
    return fetch('/api/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, data }),
    })
        .then(async (response) => {
            if (!response.ok) {
                const payload = await response.json().catch(() => ({}));
                throw new Error(payload?.error || `Ошибка сохранения на сервер: ${response.status}`);
            }

            return response.json().catch(() => ({ success: true }));
        })
        .catch((err) => {
            console.error('Ошибка сохранения на сервер:', err);
            throw err;
        });
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
