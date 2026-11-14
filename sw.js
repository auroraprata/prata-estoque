// Prata — Controle: guarda o app no aparelho para abrir sem internet.
const CACHE='prata-app-v1';
const SHELL=['./','./index.html'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  // Planilha (Apps Script) nunca passa pelo cache: o app cuida disso sozinho.
  if(url.hostname.endsWith('script.google.com')||url.hostname.endsWith('googleusercontent.com'))return;
  const mesmaOrigem=url.origin===self.location.origin;
  const fonte=url.hostname==='fonts.googleapis.com'||url.hostname==='fonts.gstatic.com';
  if(!mesmaOrigem&&!fonte)return;
  if(mesmaOrigem){
    // Página do app: tenta a versão nova na internet; sem internet, usa a guardada.
    e.respondWith(fetch(req).then(res=>{
      if(res.ok){const cp=res.clone();caches.open(CACHE).then(c=>c.put(req,cp));}
      return res;
    }).catch(()=>caches.match(req,{ignoreSearch:true}).then(r=>r||caches.match('./index.html'))));
  }else{
    // Fontes: usa a guardada; se não tiver, baixa e guarda.
    e.respondWith(caches.match(req).then(r=>r||fetch(req).then(res=>{
      const cp=res.clone();caches.open(CACHE).then(c=>c.put(req,cp));return res;
    })));
  }
});
