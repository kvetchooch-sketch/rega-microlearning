importScripts('./notification.js');
const CACHE='rega-v4-20260928-growth';
const FILES=['./','./index.html','./style.css','./app.mjs','./core.mjs','./growth.mjs','./delivery-settings.mjs','./content.mjs','./content-expansion.mjs','./push.mjs','./push-config.mjs','./notification.js','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('rega-')&&k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()]));});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
 event.respondWith(caches.match(event.request,{ignoreSearch:event.request.mode==='navigate'}).then(cached=>cached||fetch(event.request)));
});
self.addEventListener('push',event=>{
 let data;try{data=event.data?.json();}catch{}
 const notification=self.RegaNotification.build(data,self.registration.scope);
 event.waitUntil(Promise.all([self.registration.showNotification(notification.title,notification.options),self.navigator.setAppBadge?.(1).catch(()=>{})]));
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();
 const url=self.RegaNotification.safeURL(event.notification.data?.url,self.registration.scope);
 event.waitUntil((async()=>{
  const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  for(const client of windows){if(new URL(client.url).origin===self.location.origin&&new URL(client.url).pathname===new URL(self.registration.scope).pathname){const navigated=await client.navigate(url);if(navigated)return navigated.focus();}}
  return self.clients.openWindow(url);
 })());
});
