import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Battle,newCampaign,data,expand} from '../src/model';
import {readCampaignSave} from '../src/campaign-actions';
import {settleBattleVictory} from '../src/battle-outcome';
import {syncRoster,recordBattle,rankOf,fallenRoll,soldierName} from '../src/soldiers';

test('every soldier gets a stable name that survives saves and new recruits',()=>{
 const c=newCampaign(0),first=syncRoster(c).map(s=>s.name);
 assert.equal(first.length,c.army.length);assert.ok(first.every(n=>/\S+ \S+/.test(n)));
 c.army.push(c.army[0]);const after=syncRoster(c);
 assert.deepEqual(after.slice(0,first.length).map(s=>s.name),first);assert.equal(after.length,c.army.length);
 assert.deepEqual(syncRoster(readCampaignSave(JSON.stringify(c))).map(s=>s.name),after.map(s=>s.name));
 assert.equal(soldierName(c.army[0],7),soldierName(c.army[0],7));
});

test('ranks are earned from kills and battles together',()=>{
 assert.equal(rankOf({kills:0,battles:0}).title,'Recruit');assert.equal(rankOf({kills:1,battles:1}).title,'Blooded');
 assert.equal(rankOf({kills:9,battles:2}).title,'Blooded');assert.equal(rankOf({kills:5,battles:3}).title,'Veteran');
});

test('kill credits never change the battle and map back to the named soldiers who fought',()=>{
 const run=()=>{const c=newCampaign(0),b=new Battle(c,['MeleeViz1','MeleeViz1','MeleeViz1'],'encounter',c.town,99,{heroControl:'assisted'});for(let i=0;i<30*120&&!b.result;i++)b.step();return {c,b};};
 const one=run(),two=run();assert.equal(JSON.stringify(one.b.fighters),JSON.stringify(two.b.fighters));
 assert.ok(Object.values(one.b.killCredits).reduce((a,n)=>a+n,0)>0,'someone lands a killing blow');
 if(one.b.result!=='victory')return;
 const c=one.c,before=syncRoster(c).map(s=>({...s}));settleBattleVictory(one.b);
 const record=recordBattle(c,one.b,before,'Road battle near test');
 assert.deepEqual(syncRoster(c).map(s=>s.key),c.army,'roster stays aligned with the army');
 assert.equal(record.fallen.length,before.length-c.army.length);
 assert.equal(fallenRoll(c).length,record.fallen.length);
 const spawned=one.b.fighters.filter(f=>f.team===0&&f.key!=='hero').length;
 assert.ok(syncRoster(c).slice(0,Math.min(spawned,c.army.length)).every(s=>s.battles===1));
});

test('a siege defeat leaves no record because the campaign is restored',()=>{
 const c=newCampaign(0),t=Object.values(data.towns).find(x=>x.NAME==='Konstanz')!;syncRoster(c);const snapshot=JSON.stringify(c);
 const b=new Battle(structuredClone(c),expand(t.defenders),'siege',t.ID,3,{heroControl:'manual'});for(let i=0;i<30*120&&!b.result;i++)b.step();
 assert.equal(b.result,'defeat');assert.equal(JSON.stringify(c),snapshot);
});
