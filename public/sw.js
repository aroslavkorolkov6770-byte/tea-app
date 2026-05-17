self.addEventListener('push', function (event) {
    if (event.data) {
        const data = event.data.json();
        
        const options = {
            body: data.body,
            icon: '/favicon.ico', // Можешь заменить на путь к красивому логотипу
            badge: '/favicon.ico', // Иконка для шторки уведомлений телефона
            vibrate: [200, 100, 200], // Вибрация: вжик-пауза-вжик
            data: {
                url: data.url || '/tasks?tab=edu' // Куда перекинуть при клике
            }
        };

        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close(); // Закрываем плашку
    // Открываем нужную вкладку при клике на пуш
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});