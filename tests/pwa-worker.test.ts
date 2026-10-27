import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync,renameSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';

function fixture(){const dir=mkdtempSync(join(tmpdir(),'feudalism-pwa-'));mkdirSync(join(dir,'dist'));writeFileSync(join(dir,'dist/index.html'),'<main>game</main>');writeFileSync(join(dir,'dist/game.js'),'game');const generate=()=>{execFileSync(process.execPath,[resolve('tools/make-sw.mjs')],{cwd:dir});return readFileSync(join(dir,'dist/sw.js'),'utf8');};return {dir,generate,clean:()=>rmSync(dir,{recursive:true,force:true})};}
function runtime(code:string){
 const scope='https://example.test/ipadgame/',handlers:Record<string,(event:any)=>void>={},records=new Map<string,Map<string,string>>();let claimed=0,network=0;const deleted:string[]=[];
 const caches={async open(name:string){if(!records.has(name))records.set(name,new Map());const values=records.get(name)!;return {async addAll(files:string[]){for(const file of files)values.set(new URL(file,scope).href,file);},async match(request:string|{url:string}){return values.get(typeof request==='string'?request:request.url);}};},async keys(){return [...records.keys()];},async delete(name:string){deleted.push(name);return records.delete(name);}};
 vm.runInNewContext(code,{URL,caches,self:{registration:{scope},location:{origin:'https://example.test'},clients:{claim:async()=>{claimed++;}},addEventListener:(type:string,callback:any)=>{handlers[type]=callback;}},fetch:async()=>{network++;return 'network';}});
 return {scope,records,deleted,get claimed(){return claimed;},get network(){return network;},async event(type:string){let work:Promise<unknown>|undefined;handlers[type]({waitUntil:(p:Promise<unknown>)=>{work=p;}});await work;},async request(url:string,mode='cors',method='GET'){let response:Promise<unknown>|undefined;handlers.fetch({request:{url,method,mode},respondWith:(p:Promise<unknown>)=>{response=p;}});return response?await response:undefined;}};
}

test('PWA caches an atomic build, isolates its path, and serves query launches offline',async()=>{
 const f=fixture();try{const r=runtime(f.generate());await r.event('install');const current=[...r.records.keys()][0];assert.ok(current.includes(encodeURIComponent(r.scope)));assert.equal(r.records.get(current)?.size,3);
 r.records.set(current.replace(/[^-]+$/,'old'),new Map());r.records.set('feudalism-'+encodeURIComponent('https://example.test/othergame/')+'-old',new Map([['https://example.test/ipadgame/not-current.js','stale']]));await r.event('activate');assert.equal(r.claimed,1);assert.equal(r.deleted.length,1);assert.ok(r.records.has('feudalism-'+encodeURIComponent('https://example.test/othergame/')+'-old'));
 assert.equal(await r.request(r.scope+'?test=1','navigate'),'./index.html');assert.equal(await r.request(r.scope+'game.js'),'./game.js');assert.equal(await r.request(r.scope+'not-current.js'),'network','never borrow stale assets from another cache');assert.equal(r.network,1);
 assert.equal(await r.request('https://example.test/othergame/game.js'),undefined);assert.equal(await r.request('https://third-party.test/game.js'),undefined);assert.equal(await r.request(r.scope+'game.js','cors','POST'),undefined);
 }finally{f.clean();}
});
test('PWA revision changes when an asset path changes, even with identical contents',()=>{const f=fixture();try{const before=f.generate();renameSync(join(f.dir,'dist/game.js'),join(f.dir,'dist/renamed.js'));const after=f.generate();assert.notEqual(before.match(/const CACHE=.*;/)?.[0],after.match(/const CACHE=.*;/)?.[0]);assert.ok(after.includes('./renamed.js'));assert.ok(!after.includes('./game.js'));}finally{f.clean();}});
test('PWA install metadata points to present PNG icons with their declared dimensions',()=>{
 const html=readFileSync('index.html','utf8');assert.ok(html.includes('viewport-fit=cover'));
 const icon=html.match(/rel="apple-touch-icon" href="\.\/([^\"]+)"/)?.[1];assert.ok(icon);const apple=readFileSync(join('public',icon));assert.equal(apple.subarray(1,4).toString(),'PNG');
 const manifest=JSON.parse(readFileSync('public/manifest.webmanifest','utf8'));assert.equal(manifest.start_url,'./');assert.equal(manifest.scope,'./');assert.equal(manifest.display,'standalone');
 for(const entry of manifest.icons){const bytes=readFileSync(join('public',entry.src));assert.equal(bytes.subarray(1,4).toString(),'PNG');assert.equal(`${bytes.readUInt32BE(16)}x${bytes.readUInt32BE(20)}`,entry.sizes);}
});
