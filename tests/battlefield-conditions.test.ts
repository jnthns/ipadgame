import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Battle,MIN_ATTACK_TIME,data,expand,newCampaign} from '../src/model';
import {CONDITIONS,CONDITION_IDS,rollCondition,type BattleKind} from '../src/battlefield-conditions';

const KINDS:BattleKind[]=['siege','quest','throne','encounter'];
const duel=(condition?:typeof CONDITIONS[keyof typeof CONDITIONS],enemy='MeleeViz1')=>{const c=newCampaign();c.army=[];return new Battle(c,[enemy],'quest',c.town,7,{heroControl:'manual',condition,reinforcementInterval:100000,initialSpawns:[{x:2,y:3,team:0,hero:true},{x:17,y:3,team:1}]});};

test('condition rolls are deterministic, respect the battle setting and reach every condition',()=>{
  const seen=new Set<string>();
  for(const kind of KINDS)for(const nation of ['Viz','Ger','Rus','Jap'] as const)for(let seed=1;seed<400;seed++){
    const condition=rollCondition(kind,nation,seed*7919);
    assert.equal(condition,rollCondition(kind,nation,seed*7919));
    assert.ok(condition.kinds.includes(kind),`${condition.id} rolled for ${kind}`);
    seen.add(condition.id);
  }
  assert.deepEqual([...seen].sort(),[...CONDITION_IDS].sort());
  for(let seed=1;seed<200;seed++){assert.notEqual(rollCondition('throne','Viz',seed).visual,'rain','no weather indoors');assert.notEqual(rollCondition('quest','Viz',seed).id,'fortified');}
});

test('a condition never consumes the combat RNG stream',()=>{
  const plain=duel(),omen=duel(CONDITIONS.goodOmen),storm=duel(CONDITIONS.thunderstorm);
  for(let i=0;i<5;i++){const r=plain.random();assert.equal(omen.random(),r);assert.equal(storm.random(),r);}
});

test('stat conditions change fighters as they take the field, including reinforcements',()=>{
  const fogged=duel(CONDITIONS.fog,'RangedGer6');
  assert.ok(fogged.alive(1)[0].weapon.range<=5);
  const c=newCampaign();const plain=new Battle(c,expand(data.towns.Jana.defenders),'siege','Jana',3,{heroControl:'manual'});
  const walls=new Battle(newCampaign(),expand(data.towns.Jana.defenders),'siege','Jana',3,{heroControl:'manual',condition:CONDITIONS.fortified});
  const a=plain.alive(1)[0],b=walls.alive(1)[0];
  assert.equal(b.max,Math.round(a.max*1.15));assert.equal(b.def,Math.round(a.def*1.35));
  assert.equal(walls.alive(0)[0].max,plain.alive(0)[0].max,'fortified only strengthens the garrison');
  const drums=duel(CONDITIONS.warDrums);
  for(const f of drums.fighters){assert.ok(f.weapon.after>=Math.min(MIN_ATTACK_TIME[f.animation],duel().fighters[f.id].weapon.after));assert.ok(f.speed>=2);}
  const mud=duel(CONDITIONS.mud);for(const f of mud.fighters)assert.ok(f.speed>=2);
});

test('the hero shot respects a range cap',()=>{
  const b=duel(CONDITIONS.narrowHalls,'MeleeViz1');const hero=b.fighters[0];
  hero.weapon={...hero.weapon,range:10};hero.weaponItem={...hero.weaponItem,FRAME:1};
  (b as unknown as {heroDirectHit(f:typeof hero):void}).heroDirectHit(hero);
  assert.equal(b.projectiles.at(-1)!.destination.x,hero.x+hero.facing*6);
});

test('lightning strikes on schedule, ignores armor and never finishes the hero',()=>{
  const b=duel(CONDITIONS.thunderstorm);b.fighters[1].recovery=1e9;b.fighters[1].hp=1e9;b.fighters[1].max=1e9;
  const hero=b.fighters[0];hero.hp=2;let strikes=0;
  for(let i=0;i<1200&&!b.result;i++){b.step();strikes+=b.hazards.length;if(b.hazards.length)assert.equal(b.tick%120,0);}
  assert.equal(strikes,10);assert.ok(hero.hp>=1);assert.notEqual(b.result,'defeat');
});

test('smoke wears fighters down to a floor and springs heal up to full',()=>{
  const smoke=duel(CONDITIONS.smoke);smoke.fighters.forEach(f=>f.recovery=1e9);smoke.commandTroops({type:'hold'});
  for(let i=0;i<3000;i++)smoke.step();
  for(const f of smoke.fighters)assert.equal(f.hp,Math.ceil(f.max*.35));
  const springs=duel(CONDITIONS.springs);springs.fighters.forEach(f=>{f.hp=1;f.recovery=1e9;});
  for(let i=0;i<4000;i++)springs.step();
  for(const f of springs.fighters)assert.equal(f.hp,f.max);
});

test('every condition runs a full siege to a result without stalling',()=>{
  for(const id of CONDITION_IDS){
    const b=new Battle(newCampaign(4),expand(data.towns.Jana.defenders),'siege','Jana',11,{heroControl:'auto',condition:CONDITIONS[id]});
    for(let i=0;i<30*240&&!b.result;i++)b.step();
    assert.ok(b.result,`${id} battle did not finish`);
  }
});

test('auto battle hands the hero to a guarded AI and can be taken back mid-fight',()=>{
  const manual=duel(),auto=duel();
  assert.equal(auto.setHeroControl('auto'),true);assert.equal(auto.setHeroControl('auto'),false);
  for(let i=0;i<900;i++){manual.step();auto.step();}
  assert.equal(manual.fighters[0].x,2,'an idle manual hero stays put');
  assert.ok(auto.fighters[0].x>2||auto.fighters[1].hp<auto.fighters[1].max,'with no soldiers the auto hero advances and fights');
  const hero=auto.fighters[0];hero.windup=5;
  auto.setHeroControl('manual');assert.equal(hero.windup,0,'returning to manual never leaves a stuck windup');
  const x=hero.x;auto.setHeroInput({x:-1});for(let i=0;i<60;i++)auto.step();
  assert.ok(hero.x<x||hero.hp<=0,'the hero obeys input again');
});

test('the auto hero stays behind its soldiers instead of charging the garrison alone',()=>{
  for(const seed of [1,2,3,4,5]){
    const b=new Battle(newCampaign(4),expand(data.towns.Trapezus.defenders),'siege','Trapezus',seed*7919,{heroControl:'auto'});
    const hero=b.fighters.find(f=>f.key==='hero')!;
    for(let i=0;i<300;i++){b.step();const front=Math.max(...b.alive(0).filter(f=>f.key!=='hero').map(f=>f.x));if(Number.isFinite(front))assert.ok(hero.x<=front+1,`hero ran ahead at tick ${b.tick}`);}
  }
});

test('the guarded auto hero wins fights the original soldier AI loses by getting the hero killed',()=>{
  let auto=0,assisted=0;
  for(let seed=1;seed<=8;seed++)for(const mode of ['auto','assisted'] as const){const c=newCampaign(4);c.army=[...c.army,...Array(6).fill(c.army[0])];const b=new Battle(c,expand(data.towns.Trapezus.defenders),'siege','Trapezus',seed*7919,{heroControl:mode});for(let i=0;i<30*300&&!b.result;i++)b.step();if(b.result==='victory'){if(mode==='auto')auto++;else assisted++;}}
  assert.ok(auto>assisted,`auto ${auto} vs assisted ${assisted}`);assert.ok(auto>=4);
});
