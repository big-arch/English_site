const scopePath=new URL(self.registration.scope).pathname;
const name="english-studio-account-"+scopePath+"-v3";
self.addEventListener("install",event=>event.waitUntil(caches.open(name).then(cache=>cache.addAll(["./offline.html","./favicon.svg"]))));
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>(k==="english-studio-v1"||k.startsWith("english-studio-account-"+scopePath+"-"))&&k!==name).map(k=>caches.delete(k))))));
self.addEventListener("fetch",event=>{if(event.request.mode==="navigate"&&new URL(event.request.url).origin===self.location.origin)event.respondWith(fetch(event.request).catch(async()=>await (await caches.open(name)).match("./offline.html")||Response.error()));});
