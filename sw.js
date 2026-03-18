// ─── Зміни цю версію при кожному оновленні файлів ───
// CACHE_NAME — унікальне ім'я кешу. Зміна версії
// змусить service worker видалити старий кеш і завантажити нові файли.
const CACHE_NAME = 'ptimer-v3';

// ASSETS — список файлів які кешуються для офлайн-роботи
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './icon-192.png',
  './icon-512.png'
];

// ─── Install ───
// Спрацьовує коли браузер виявляє НОВИЙ service worker (змінився файл sw.js).
// skipWaiting() — не чекає закриття вкладок, одразу активується.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// ─── Activate ───
// Спрацьовує після install. Видаляє кеші старих версій.
// clients.claim() — одразу бере контроль над відкритими вкладками
// без перезавантаження.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ─── Fetch ───
// Стратегія: NETWORK FIRST — спочатку намагається завантажити з мережі.
// Якщо мережа недоступна — бере з кешу (офлайн-режим).
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).then(response => {
      // Успішна відповідь з мережі — оновлюємо кеш цим файлом
      const clone = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
      return response;
    }).catch(() => {
      // Мережа недоступна — повертаємо файл з кешу
      return caches.match(event.request);
    })
  );
});

// ─── Message listener ───
// Дозволяє сторінці надіслати повідомлення 'SKIP_WAITING'
// щоб примусово активувати новий service worker
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
