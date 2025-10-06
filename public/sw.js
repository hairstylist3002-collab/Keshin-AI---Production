// Simple service worker to handle 404 errors
// This file exists to prevent 404 errors when browsers try to load /sw.js
// It doesn't provide any PWA functionality

self.addEventListener('install', (event) => {
  // Skip waiting to ensure the service worker activates immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Take control of all open clients immediately
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Let the browser handle all requests normally
  event.respondWith(fetch(event.request));
});
