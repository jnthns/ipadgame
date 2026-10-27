import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
const files=[];
function walk(dir){for(const f of fs.readdirSync(dir).sort()){const p=path.join(dir,f);if(fs.statSync(p).isDirectory())walk(p);else if(f!=='sw.js')files.push(p.replace(/^dist\//,''));}}
walk('dist');
// Paths matter too: a renamed asset must invalidate the previous file list.
const hash=crypto.createHash('sha256');for(const file of files)hash.update(file+'\0').update(fs.readFileSync('dist/'+file)).update('\0');
const revision=hash.digest('hex').slice(0,12);
fs.writeFileSync('dist/sw.js',`// An update waits for the previous app to close; never replace a running battle.
const PREFIX='feudalism-'+encodeURIComponent(self.registration.scope)+'-';
const CACHE=PREFIX+'${revision}';
const FILES=${JSON.stringify(['./',...files.map(p=>'./'+p)])};
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(PREFIX)&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))return;
 event.respondWith(caches.open(CACHE).then(async cache=>{
  const cached=await cache.match(request);if(cached)return cached;
  // A saved Home Screen URL may contain launch or test parameters. The app is static.
  if(request.mode==='navigate'){const index=await cache.match(new URL('./index.html',self.registration.scope).href);if(index)return index;}
  return fetch(request);
 }));
});
`);
console.log(`Offline cache ${revision}: ${files.length+1} files`);
