/* Only the versioned static application shell is cached. Never cache client files or API traffic. */
'use strict';
const CACHE='ramy-shell-13-1-0';
const FILES=['index.html','styles.css','assets.js','artwork.js','core.js','store.js','reports.js','app.js','manifest.webmanifest','icon192.png','icon512.png','apple-touch-icon.png'];
const URLS=FILES.map(f=>new URL(f,self.registration.scope).href);
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(URLS))));
self.addEventListener('activate',event=>event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('ramy-shell-')&&k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()])));
self.addEventListener('message',event=>{if(event.data==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url);
 url.hash=''; // Fragment navigation belongs to the same cached application document.
 if(url.search)return;
 const canonical=url.href===self.registration.scope?new URL('index.html',self.registration.scope).href:url.href;
 if(!URLS.includes(canonical))return;
 event.respondWith(caches.open(CACHE).then(async cache=>{
  const cached=await cache.match(canonical);
  return cached||fetch(event.request);
 }));
});
