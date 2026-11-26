const prefix="english-studio-pages-"+new URL(self.registration.scope).pathname+"-";
const cacheName=prefix+"__VERSION__";
const shell="__SHELL__";

self.addEventListener("install",event=>event.waitUntil(caches.open(cacheName).then(cache=>cache.addAll(shell))));
self.addEventListener("activate",event=>event.waitUntil(caches.keys()
  .then(keys=>Promise.all(keys.filter(k=>k.startsWith(prefix)&&k!==cacheName).map(k=>caches.delete(k))))
  .then(()=>self.clients.claim())));

async function asset(request) {
  const cache=await caches.open(cacheName);
  const hit=await cache.match(request);
  if(hit)return hit;
  const response=await fetch(request);
  if(response.ok&&response.status===200&&!new URL(request.url).pathname.endsWith(".mp4")){
    try{await cache.put(request,response.clone());}catch{/* Keep the network response usable when local storage is full. */}
  }
  return response;
}

async function audioRange(request,range) {
  const match=/^bytes=(\d*)-(\d*)$/.exec(range);
  if(!match||(!match[1]&&!match[2]))return fetch(request);
  // Browsers request byte ranges from audio elements. Keep one complete lesson clip for replay offline.
  const response=await asset(new Request(request.url,{credentials:request.credentials}));
  if(!response.ok||response.status!==200)return response;
  const bytes=await response.arrayBuffer(),size=bytes.byteLength;
  const start=match[1]?Number(match[1]):Math.max(0,size-Number(match[2]));
  const end=match[1]&&match[2]?Math.min(Number(match[2]),size-1):size-1;
  if(start>=size||end<start)return new Response(null,{status:416,headers:{"Content-Range":"bytes */"+size}});
  return new Response(bytes.slice(start,end+1),{status:206,headers:{"Accept-Ranges":"bytes","Content-Length":String(end-start+1),"Content-Range":"bytes "+start+"-"+end+"/"+size,"Content-Type":"audio/mpeg"}});
}

self.addEventListener("fetch",event=>{
  const {request}=event,url=new URL(request.url);
  if(request.method!=="GET"||!url.href.startsWith(self.registration.scope))return;
  const range=request.headers.get("range");
  if(range){
    if(url.pathname.endsWith(".mp3"))event.respondWith(audioRange(request,range));
    return;
  }
  if(request.mode==="navigate"){
    event.respondWith(fetch(request).catch(async()=>await (await caches.open(cacheName)).match(new URL("index.html",self.registration.scope))||Response.error()));
    return;
  }
  event.respondWith(asset(request));
});
