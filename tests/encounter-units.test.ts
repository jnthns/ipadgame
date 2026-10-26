import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {data,seedRandom,type Hero} from '../src/model';
import {createEncounterUnit} from '../src/encounter-units';
import fixture from './fixtures/unit-bytecode.json';
import {runBytecode} from './helpers/avm1';
const methods=fixture.methods as unknown as Record<string,{base64:string;sha256:string}>;
function original(type:'Melee'|'Ranged',nation:string,id:number,rng:()=>number){const key=type+nation+id,h=structuredClone(data.units[key]) as Hero&Record<string,any>;
 h.SKILL=Object.fromEntries(['Sword','Axe','Mace','FarEast','Spear','Dagger','Staff','Dual','Fist','Bow','Crossbow','Throwing','Patriotism','ArtOfWar'].map(k=>[k,0]));
 const root={dice:(n:number)=>Math.floor(rng()*n),d:(n:number)=>Math.floor(rng()*n)+1,percent:(n:number)=>Math.floor(rng()*100)+1<=n};
 const scope={WeaponClass:(type:string,nation:string,id:number)=>{const w=data.items['WeaponClass'+type+nation+id];assert.ok(w,`gear ${type}${nation}${id}`);return structuredClone(w);},Armor:(type:string,nation:string,id:number)=>structuredClone(data.items['Armor'+type+nation+id]),Horse:(color:string,hp:number,def:number,speed:number,price:number)=>({skin_color:color==='any'?['red','brown','grey','white','black'][root.dice(4)]:color,bonus_HP:hp,bonus_DEF:def,bonus_speed:speed,price})};
 h['Unit'+key]=()=>runBytecode(methods['Unit'+key],fixture.pool,{1:h,2:root},scope);
 runBytecode(methods.Unit,fixture.pool,{1:h,2:()=>undefined,3:root,5:nation,6:id,7:type},scope);delete h['Unit'+key];return h;
}
const plain=(o:unknown)=>JSON.parse(JSON.stringify(o));
test('all original Unit fixtures retain their extracted bytecode hashes',()=>{assert.equal(Object.keys(methods).length,77);for(const m of Object.values(methods))assert.equal(createHash('sha256').update(Buffer.from(m.base64,'base64')).digest('hex'),m.sha256);});
test('random roaming unit fields and RNG draw counts match original AVM1 constructors across 3,040 cases',()=>{
 for(const key of Object.keys(data.units))for(let seed=0;seed<40;seed++){const match=key.match(/^(Melee|Ranged)(Viz|Ger|Rus|Jap|Rog)(\d+)$/)!;const type=match[1] as 'Melee'|'Ranged',nation=match[2] as Hero['NATION'],id=Number(match[3]);let a=0,b=0;const ra=seedRandom(seed*371+key.length),rb=seedRandom(seed*371+key.length);const actual=createEncounterUnit(type,nation,id,()=>{a++;return ra();}),expected=original(type,nation,id,()=>{b++;return rb();});assert.deepEqual(plain(actual),plain(expected),`${key} seed ${seed}`);assert.equal(a,b,`${key} random draws`);}
});
test('roaming rogues vary equipment, secondary skills, nationality and mounts without mutating templates',()=>{const snapshot=JSON.stringify(data.units);const units=Array.from({length:100},(_,i)=>createEncounterUnit('Melee','Rog',1,seedRandom(i)));assert.equal(new Set(units.map(h=>h.NATION)).size,4);assert.ok(new Set(units.map(h=>h.WEAPON_PRI.NAME)).size>3);assert.ok(units.some(h=>h.HORSE));assert.equal(JSON.stringify(data.units),snapshot);assert.throws(()=>createEncounterUnit('Melee','Rog',1,()=>NaN),/RNG/);assert.throws(()=>createEncounterUnit('Melee','Rog',99,()=>.5),/Unknown/);const bow=Array.from({length:30},(_,i)=>createEncounterUnit('Ranged','Rog',1,seedRandom(i)));assert.ok(bow.some(h=>h.SKILL.undefined===30));});
