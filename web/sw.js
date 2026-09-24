const VERSION="pc-2.5.4-u3";
self.addEventListener("install",()=>self.skipWaiting());
self.addEventListener("activate",event=>event.waitUntil((async()=>{for(const key of await caches.keys()) await caches.delete(key); await self.clients.claim();})()));
self.addEventListener("fetch",event=>{if(event.request.method!=="GET") return; event.respondWith((async()=>{try{return await fetch(event.request,{cache:"no-store"});}catch(error){const cached=await caches.match(event.request); if(cached)return cached; throw error;}})());});
