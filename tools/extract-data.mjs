// Execute only the known, locally decompiled data classes in an isolated VM.
// This small AS2 adapter is NOT a Flash emulator. Arrays are serialized as maps
// when they have named properties (AS2 uses Array for associative dictionaries).
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
const root='reference/decompiled/scripts/';
const ctx=vm.createContext({_root:{getNationNumber:n=>['Rog','Viz','Ger','Rus','Jap'].indexOf(n),percent:()=>true,dice:()=>0,d:()=>1},Math});
for(const name of ['Hero','Item','Enchant','WeaponClass','Armor','Horse','ItemInfo','UnitInfo','Unit','Town']){
 let s=fs.readFileSync(root+'__Packages/'+name+'.as','utf8');
 s=s.replace(/^   var [\w]+;\r?$/gm,'').replace(new RegExp('function '+name+'\\('),'constructor(').replace(/function (\w+)\(/g,'$1(');
 vm.runInContext(s+`;globalThis.${name}=${name};`,ctx,{timeout:3000});
}
function plain(v){if(v==null||typeof v!=='object')return v;if(Array.isArray(v)&&Object.keys(v).some(k=>!/^\d+$/.test(k)))return Object.fromEntries(Object.keys(v).map(k=>[k,plain(v[k])]));if(Array.isArray(v))return v.map(plain);return Object.fromEntries(Object.keys(v).map(k=>[k,plain(v[k])]));}
const units={};
const source=fs.readFileSync(root+'__Packages/Unit.as','utf8');
for(const [,tp,nt,id] of source.matchAll(/function Unit(Melee|Ranged)(Viz|Ger|Rus|Jap|Rog)(\d+)\(/g))units[tp+nt+id]=plain(vm.runInContext(`new Unit('${tp}','${nt}',${id})`,ctx));
const towns={};
for(const [,id] of fs.readFileSync(root+'__Packages/Town.as','utf8').matchAll(/function Town(\w+)\(\)/g))towns[id]=plain(vm.runInContext(`new Town('${id}')`,ctx));
const heroes=[];
for(const f of fs.readdirSync(root).filter(f=>f.startsWith('DefineButton2_'))){const p=root+f+'/BUTTONCONDACTION on(release).as';if(!fs.existsSync(p))continue;let s=fs.readFileSync(p,'utf8');if(!s.includes('_global.MAIN_HERO = new Hero()'))continue;s=s.slice(s.indexOf('delete _global.MAIN_HERO;'),s.indexOf('   inventoryShowStats();'));ctx._global={IS_CAPTURED:{}};vm.runInContext(s,ctx);heroes.push(plain(ctx._global));}
const items={};
for(const [name,prefix] of [['WeaponClass','Weapon'],['Armor','Armor']]){
 for(const [,id] of fs.readFileSync(root+'__Packages/'+name+'.as','utf8').matchAll(new RegExp('function '+prefix+'(\\w+)\\(\\)','g'))){
 const m=id.match(/^(.*?)(Viz|Ger|Rus|Jap|Rog|All)(\d+)$/);if(m)items[name+id]=plain(vm.runInContext(`new ${name}('${m[1]}','${m[2]}',${m[3]})`,ctx));
 }
}
const data={source:{url:'https://cache.armorgames.com/files/games/feudalism-433.swf',sha256:crypto.createHash('sha256').update(fs.readFileSync('reference/feudalism.swf')).digest('hex'),ffdec:'26.4.0'},units,towns,heroes,items};
fs.writeFileSync('src/original-data.json',JSON.stringify(data,null,2)+'\n');
console.log(`Extracted ${Object.keys(units).length} units, ${Object.keys(towns).length} towns, ${heroes.length} heroes. SHA256 ${data.source.sha256}`);
const enchants=Object.fromEntries(Array.from({length:24},(_,i)=>[i+1,plain(vm.runInContext(`new Enchant(${i+1})`,ctx))]));
fs.writeFileSync('src/enchantments.json',JSON.stringify(enchants,null,2)+'\n');
