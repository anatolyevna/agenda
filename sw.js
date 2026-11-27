/* Service worker : l'agenda fonctionne hors ligne. Les données passent par Supabase (non interceptées). */
var CACHE='agenda-v139';
var SHELL=['./','./index.html','./manifest.webmanifest','./icon-180.png','./icon-192.png','./icon-512.png'];
var LIB='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js';
var FONTS='https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@500;700&family=Nunito:wght@400;500;600;700;800&display=swap';
function warm(c){
  var jobs=[c.add(new Request(LIB,{mode:'no-cors'})).catch(function(){})];
  jobs.push(fetch(FONTS).then(function(res){if(!res.ok)return;var cp=res.clone();return c.put(FONTS,cp).then(function(){return res.text()}).then(function(css){
    var urls=(css.match(/url\((https:[^)]+)\)/g)||[]).map(function(x){return x.slice(4,-1)});
    return Promise.all(urls.map(function(u){return fetch(u).then(function(r2){if(r2.ok)return c.put(u,r2)}).catch(function(){})}))})}).catch(function(){}));
  return Promise.all(jobs)}
self.addEventListener('install',function(e){self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(SHELL).catch(function(){}).then(function(){return warm(c)})}).catch(function(){}))});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==CACHE}).map(function(k){return caches.delete(k)}))}).then(function(){return self.clients.claim()}))});
function fromCache(){return caches.match('./index.html',{ignoreSearch:true}).then(function(h){return h||caches.match('./',{ignoreSearch:true})})}
self.addEventListener('fetch',function(e){
  var r=e.request,u=new URL(r.url);
  if(r.method!=='GET')return;
  if(u.pathname.endsWith('/version.json'))return;
  if(u.hostname.endsWith('supabase.co')||u.hostname.endsWith('open-meteo.com'))return;
  var same=u.origin===self.location.origin;
  if(same&&(r.mode==='navigate'||u.pathname.endsWith('/index.html'))){
    var net=fetch(r.url,{cache:'no-store',credentials:'same-origin'}).then(function(res){if(res&&res.ok){var cp=res.clone();caches.open(CACHE).then(function(c){c.put('./index.html',cp)})}return res});
    var slow=new Promise(function(ok){setTimeout(function(){fromCache().then(ok)},4000)});
    e.respondWith(Promise.race([net.catch(function(){return fromCache().then(function(h){return h||Promise.reject()})}),slow.then(function(h){return h||net})]).then(function(res){return res||net}));
    return}
  if(same||u.hostname==='cdn.jsdelivr.net'||u.hostname==='fonts.googleapis.com'||u.hostname==='fonts.gstatic.com'){
    e.respondWith(caches.match(r).then(function(hit){var net=fetch(r).then(function(res){if(res&&(res.ok||res.type==='opaque')){var cp=res.clone();caches.open(CACHE).then(function(c){c.put(r,cp)})}return res}).catch(function(){return hit});return hit||net}))}
});
self.addEventListener('push',function(e){var d={};try{d=e.data?e.data.json():{}}catch(x){d={title:'Agenda',body:e.data?e.data.text():''}}
  e.waitUntil(self.registration.showNotification(d.title||'Agenda',{body:d.body||'',tag:d.tag||undefined,icon:'icon-192.png',badge:'icon-192.png',data:{url:'./'}}))});
self.addEventListener('notificationclick',function(e){e.notification.close();e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(function(l){for(var i=0;i<l.length;i++){if('focus' in l[i])return l[i].focus()}return clients.openWindow('./')}))});
