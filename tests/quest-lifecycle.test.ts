import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {newCampaign,seedRandom,data,type Campaign} from '../src/model';
import {world,acceptDelivery,prepareTownQuest,approveTownQuest,collectTownReward,enterTown,requestTownQuest} from '../src/world-campaign';
import fixture from './fixtures/quest-lifecycle.json';
function source(c:Campaign,rng:()=>number){const w=world(c);const q:Record<string,any>={cities:w.rewards.map(r=>r.town),rewards:w.rewards.map(r=>r.gold),deliver_to:w.questDeliveryTo??w.delivery?.to??'',avatar_id:c.quest?.avatarId??-1};const global={MAIN_HERO:c.hero,QUEST:q,GOLD:c.gold};const ctx=vm.createContext({_global:global,_root:{d:(n:number)=>Math.floor(rng()*n)+1,dice:(n:number)=>Math.floor(rng()*n)},Math});for(const [name,f] of Object.entries(fixture))if(name!=='checkReward')q[name]=vm.runInContext('('+f.source+')',ctx);const city={city:{ID:c.town},disableAll(){},wnd:{quest_txt:{text:''},gotoAndStop(){}}};const payout=vm.runInContext('('+fixture.checkReward.source+')',ctx);return {q,global,city,payout:()=>payout.call(city)};}
function notes(c:Campaign){return world(c).rewards.map(r=>[r.town,r.gold]);}
const plain=(v:unknown)=>JSON.parse(JSON.stringify(v));

test('new combat/delivery offers match source note cancellation, replacements and RNG use across 192 transitions',()=>{
 for(const kind of ['combat','delivery'] as const)for(const town of ['Trapezus','Jana','Dubkee','Omi'])for(let seed=0;seed<24;seed++){
  const c=newCampaign();enterTown(c,town);const from=c.town,to=Object.values(data.towns).find(t=>t.NATION===c.hero.NATION&&t.ID!==from)?.ID??'Lutetia';
  // Deliberately include multiple payments at the previous destination; source removes only the first.
  const w=world(c);w.questDeliveryTo=to;w.delivery={from,to,gold:450,accepted:true};w.rewards=[{town:to,gold:999},{town:to,gold:450},{town:from,gold:300}];
  let a=0,b=0;const ra=seedRandom(seed+711),rb=seedRandom(seed+711),original=source(c,()=>{b++;return rb();});const offer=prepareTownQuest(c,kind,()=>{a++;return ra();});
  if(kind==='combat')original.q.initQuestBattle(from);else original.q.initQuestFedEx(from,data.towns[from].NATION);
  assert.deepEqual(notes(c),plain(original.q.cities.map((t:string,i:number)=>[t,original.q.rewards[i]])));assert.equal(a,b);assert.equal(offer.reward,original.q.curr_gold);
  if(offer.kind==='combat'){assert.equal(c.quest?.avatarId,original.q.avatar_id);assert.equal(c.quest?.count,original.q.enemies_amount);assert.equal(w.questDeliveryTo,'');}
  else{assert.equal(w.delivery?.to,original.q.deliver_to);assert.equal(w.delivery?.accepted,false);assert.equal(c.quest,null);original.q.aproveDeliver();assert.equal(approveTownQuest(c),null);assert.deepEqual(notes(c),plain(original.q.cities.map((t:string,i:number)=>[t,original.q.rewards[i]])));assert.match(approveTownQuest(c)!,/pending/);}
 }
});
// Imported tables are only used to supply source nation IDs, not expected generated values.

test('town-hall collection matches original Cities.checkReward first-match removal and repeated payments',()=>{
 const c=newCampaign(),w=world(c);w.rewards=[{town:c.town,gold:100},{town:'Jana',gold:600},{town:c.town,gold:200}];const original=source(c,()=>.5);
 for(const expected of [100,200,0]){assert.equal(collectTownReward(c),expected);assert.equal(!!original.payout(),expected>0);assert.equal(c.gold,original.global.GOLD);assert.deepEqual(notes(c),plain(original.q.cities.map((t:string,i:number)=>[t,original.q.rewards[i]])));}
});

test('a delivery preview cancels the prior package even if the new offer is left unaccepted',()=>{
 const c=newCampaign();acceptDelivery(c,'Lutetia',400);const offer=prepareTownQuest(c,'delivery',()=>.3);assert.equal(offer.kind,'delivery');assert.equal(world(c).rewards.length,0);assert.equal(world(c).delivery?.accepted,false);enterTown(c,world(c).delivery!.to);assert.equal(collectTownReward(c),0);
});

test('towns choose combat or delivery using the original first dice(2) roll',()=>{
 const c=newCampaign();let i=0;assert.equal(requestTownQuest(c,()=>i++===0?.8:.5).kind,'combat');i=0;assert.equal(requestTownQuest(c,()=>i++===0?.1:.5).kind,'delivery');
});
