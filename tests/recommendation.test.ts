import {test} from 'node:test';
import assert from 'node:assert/strict';
import {data,newCampaign,type Campaign} from '../src/model';
import {world,enterTown} from '../src/world-campaign';
import {geometry} from '../src/world-geometry';
import {recommendNext,reachable} from '../src/recommendation';
import type {ThreatEstimate,ThreatTier} from '../src/threat';

const estimate=(tier:ThreatTier):ThreatEstimate=>({tier,winRate:tier==='favorable'?5/6:.5,enemyLosses:1,garrison:7,throne:0,samples:6});
const lookup=(tiers:Record<string,ThreatTier>)=>(town:string)=>tiers[town]?estimate(tiers[town]):null;
const at=(town:string,setup:(c:Campaign)=>void=()=>{})=>{const c=newCampaign(4);world(c);enterTown(c,town);c.captured=[town];setup(c);return c;};
const towns=geometry.towns as Record<string,{x:number;y:number}>;

test('collecting earned money comes first, here or on the road',()=>{
  const c=at('Dubkee',c=>world(c).rewards.push({town:'Losevo',gold:300}));
  const rec=recommendNext(c,lookup({Trapezus:'favorable'}))!;
  assert.equal(rec.kind,'collect');assert.equal(rec.town,'Losevo');assert.equal(rec.here,false);assert.match(rec.title,/300 gp/);
  world(c).rewards[0].town='Dubkee';
  const local=recommendNext(c,lookup({}))!;assert.equal(local.kind,'collect');assert.equal(local.here,true);assert.equal(local.cta,'Collect payment');
});

test('accepted work is finished before new conquest',()=>{
  const c=at('Dubkee',c=>{c.quest={town:'Dubkee',count:4,reward:500,avatarId:0};});
  const camp=(geometry.questAvatars as Record<string,{x:number;y:number}>).quest_avatar_0;
  const rec=recommendNext(c,lookup({Losevo:'favorable'}));
  if(reachable(towns.Dubkee,camp))assert.equal(rec!.kind,'rogues');else assert.notEqual(rec?.kind,'rogues','an unreachable camp is never suggested');
});

test('the nearest reachable favorable garrison wins; overseas targets are skipped',()=>{
  const c=at('Dubkee');
  const rec=recommendNext(c,lookup({Losevo:'favorable',Omi:'favorable',RaGorod:'even'}))!;
  assert.equal(rec.kind,'siege');assert.equal(rec.town,'Losevo');assert.ok(!reachable(towns.Dubkee,towns.Omi),'fixture: Omi is across the sea');
  assert.equal(recommendNext(c,lookup({Omi:'favorable'}))?.town===('Omi' as string),false);
  const here=at('Losevo',c=>{c.captured=['Dubkee'];});
  assert.deepEqual([recommendNext(here,lookup({Losevo:'favorable'}))!.kind,recommendNext(here,lookup({Losevo:'favorable'}))!.cta],['siege','Attack garrison']);
});

test('without an easy win, recruit if affordable here, then try an even fight, then find work',()=>{
  const rich=at('Dubkee',c=>{c.gold=5000;});
  assert.equal(recommendNext(rich,lookup({Losevo:'even'}))!.kind,'recruit');
  const poor=at('Dubkee',c=>{c.gold=0;});
  assert.equal(recommendNext(poor,lookup({Losevo:'even'}))!.town,'Losevo');
  const stuck=recommendNext(poor,lookup({Losevo:'hard'}))!;
  assert.deepEqual([stuck.kind,stuck.here,stuck.cta],['contract',true,'Open town hall']);
});

test('the user’s case: standing in Dubkee always yields a destination, and recommending changes nothing',()=>{
  for(const tiers of [{},{Losevo:'favorable'},{Dobrov:'even'}] as Record<string,ThreatTier>[]){
    const c=at('Dubkee',c=>{c.gold=0;}),before=JSON.stringify(c);
    const rec=recommendNext(c,lookup(tiers));
    assert.ok(rec,'a recommendation is always available');
    assert.ok(rec!.here||reachable(towns.Dubkee,rec!.point),`${rec!.title} must be reachable overland`);
    assert.equal(JSON.stringify(c),before);
    assert.ok(Object.hasOwn(data.towns,rec!.town!));
  }
});
