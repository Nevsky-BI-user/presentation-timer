// Змінюй версію при кожному оновленні — це тригер для оновлення кешу
const CACHE_NAME = 'ptimer-v5';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './icon-192.png',
  './icon-512.png'
];

// Встановлення: кешуємо всі основні файли, skipWaiting активує новий SW одразу
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Активація: видаляємо всі старі кеші і беремо контроль над клієнтами
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Стратегія: NETWORK FIRST — спочатку мережа, якщо немає мережі — кеш
// Це гарантує що при наявності інтернету завжди завантажується свіжа версія
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Відповідь отримана з мережі — зберігаємо в кеш і повертаємо
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => {
        // Мережі немає — повертаємо з кешу (офлайн-режим)
        return caches.match(event.request);
      })
  );
});
