const CHUNKED_UPLOAD_KEYS = new Set(['tea_hub_products_v1']);
const CHUNK_SIZE = 150;
const CHUNK_UPLOAD_THRESHOLD = 250_000;

const postJson = (payload: Record<string, any>) => {
    return fetch('/api/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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

const saveChunkedArrayToServer = async (key: string, data: any[]) => {
    const totalChunks = Math.max(1, Math.ceil(data.length / CHUNK_SIZE));

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex += 1) {
        const chunkData = data.slice(chunkIndex * CHUNK_SIZE, (chunkIndex + 1) * CHUNK_SIZE);
        await postJson({
            key,
            data: chunkData,
            chunked: true,
            chunkIndex,
            totalChunks,
        });
    }
};

export const saveDataToServer = async (key: string, data: any) => {
    const serializedLength = JSON.stringify(data)?.length ?? 0;

    if (CHUNKED_UPLOAD_KEYS.has(key) && Array.isArray(data) && serializedLength > CHUNK_UPLOAD_THRESHOLD) {
        return saveChunkedArrayToServer(key, data);
    }

    return postJson({ key, data });
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
