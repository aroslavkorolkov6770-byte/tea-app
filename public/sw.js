self.addEventListener('push', function (event) {
    console.log('[ServiceWorker] 🔔 ПРИЛЕТЕЛ PUSH-СИГНАЛ!');
    
    let data = { title: 'Tea Hub', body: 'Новое уведомление' };

    if (event.data) {
        console.log('[ServiceWorker] Сырые данные:', event.data.text());
        try {
            data = event.data.json();
        } catch (e) {
            console.error('[ServiceWorker] Ошибка парсинга JSON', e);
        }
    }

    const options = {
        body: data.body || 'Текст уведомления',
        icon: '/favicon.ico', // убедись, что этот файл есть в папке public
        vibrate: [200, 100, 200],
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'Tea Hub', options)
    );
});

self.addEventListener('notificationclick', function (event) {
    console.log('[ServiceWorker] 🖱️ Клик по уведомлению!');
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data?.url || '/')
    );
});