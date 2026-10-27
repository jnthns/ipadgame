import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {Battle,newCampaign,data,MIN_ATTACK_TIME,parseSave} from '../src/model';
import {CONSUMABLES,consume,supplies,STARTING_SUPPLIES,type Consumable} from '../src/consumables';
import {buyConsumable,readCampaignSave} from '../src/campaign-actions';

// Original Screen.makeThemHealUnits, embedded so clean checkouts need no SWF.
const healUnits=`function(amount){var i=0;while(i<_global.HERO){if(_root['hero'+i].HP>0&&_root['hero'+i].team==0){_root['hero'+i].HP+=Math.round(_root['hero'+i].MAX_HP*amount);if(_root['hero'+i].HP>_root['hero'+i].MAX_HP)_root['hero'+i].HP=_root['hero'+i].MAX_HP;_root['hero'+i].attachMovie('HealAnim','anim',1);}i++;}}`;

test('group healing matches original Screen over rounding, saturation, teams and dead units',()=>{
 for(const [key,fraction] of [['smallGroupHeal',.33],['largeGroupHeal',.66]] as const){for(let max=1;max<205;max++){
  const fighters=[{key:'hero',team:0,hp:1,max},{key:'soldier',team:0,hp:max-1,max},{key:'dead',team:0,hp:0,max},{key:'enemy',team:1,hp:1,max}];
  const root=Object.fromEntries(fighters.map((f,i)=>['hero'+i,{HP:f.hp,MAX_HP:f.max,team:f.team,attachMovie(){}}]));
  vm.runInNewContext('('+healUnits+')',{_root:root,_global:{HERO:4},Math})(fraction);
  const owner={supplies:{...STARTING_SUPPLIES}};assert.equal(consume(owner,key,fighters),true);
  assert.deepEqual(fighters.map(f=>f.hp),Object.values(root).map(f=>f.HP));assert.equal(owner.supplies[key],STARTING_SUPPLIES[key]-1);
 }}
});

test('hero potions restore the original amounts, cap at max, spend at full HP and use distinct stock',()=>{
 for(const [key,amount] of [['smallPotion',40],['mediumPotion',300],['largePotion',100000]] as const){
  const owner={supplies:{...STARTING_SUPPLIES}};const fighters=[{key:'hero',team:0,hp:1,max:200000},{key:'troop',team:0,hp:1,max:200000}];
  assert.equal(consume(owner,key,fighters),true);assert.equal(fighters[0].hp,1+amount);assert.equal(fighters[1].hp,1);
  assert.equal(owner.supplies.largeGroupHeal,2);owner.supplies[key]=1;fighters[0].hp=fighters[0].max;assert.equal(consume(owner,key,fighters),true);assert.equal(owner.supplies[key],0);assert.equal(fighters[0].hp,200000);
 }
});

test('empty supplies, dead heroes, invalid names and ended battles cannot spend or heal',()=>{
 const c=newCampaign();const b=new Battle(c,['MeleeViz1'],'quest',c.town,1,{heroControl:'manual'});const before=structuredClone(supplies(c));const hero=b.fighters[0];hero.hp=0;assert.equal(b.useConsumable('smallPotion'),false);assert.deepEqual(c.supplies,before);
 hero.hp=1;supplies(c).smallPotion=0;assert.equal(b.useConsumable('smallPotion'),false);assert.equal(b.useConsumable('__proto__' as Consumable),false);b.result='victory';assert.equal(b.useConsumable('rage'),false);assert.equal(supplies(c).rage,1);
});

test('shop prices and one/five purchases are transactional and respect hostility',()=>{
 for(const key of Object.keys(CONSUMABLES) as Consumable[]){const c=newCampaign();c.gold=10000;const initial=supplies(c)[key];assert.equal(buyConsumable(c,key,5),null);assert.equal(c.gold,10000-CONSUMABLES[key].price*5);assert.equal(supplies(c)[key],initial+5);
 const snapshot=JSON.stringify(c);assert.match(buyConsumable(c,key,2 as 1)!,/Invalid/);assert.equal(JSON.stringify(c),snapshot);c.gold=0;assert.match(buyConsumable(c,key)!,/gold/);assert.equal(supplies(c)[key],initial+5);
 c.hostile=[data.towns[c.town].NATION];c.captured=[];c.gold=10000;assert.match(buyConsumable(c,key)!,/hostile/);assert.equal(c.gold,10000);
 }
});

test('stock persists through save round trips, validates strictly, and migrates old saves without free stock',()=>{
 const c=newCampaign();supplies(c).smallPotion--;assert.deepEqual(readCampaignSave(JSON.stringify(c)).supplies,c.supplies);
 const legacy=structuredClone(c);delete legacy.supplies;assert.deepEqual(Object.values(parseSave(JSON.stringify(legacy)).supplies!),[0,0,0,0,0,0]);
 for(const invalid of [null,[],{}, {...STARTING_SUPPLIES,smallPotion:-1},{...STARTING_SUPPLIES,rage:1.5},{...STARTING_SUPPLIES,extra:1},{...STARTING_SUPPLIES,largePotion:1000001}])assert.throws(()=>readCampaignSave(JSON.stringify({...c,supplies:invalid})),/consumable/);
 const independent=newCampaign();supplies(c).rage=0;assert.equal(supplies(independent).rage,1);
});

function rageFixture(){const c=newCampaign();c.army=[];const b=new Battle(c,['MeleeViz1'],'quest',c.town,1,{heroControl:'manual'});const hero=b.fighters[0],enemy=b.alive(1)[0];Object.assign(enemy,{x:18,y:7,hp:1e9,recovery:1e9});b.spawn(structuredClone(data.units.MeleeViz1),'troop',0,4,3);const troop=b.fighters.at(-1)!;b.spawn(structuredClone(data.units.MeleeViz1),'target',1,5,3);const target=b.fighters.at(-1)!;Object.assign(target,{hp:1e9,recovery:1e9});troop.targetId=target.id;return {c,b,hero,troop,target};}

test('rage matches Soldier attack windup/recovery and leaves the manual hero unchanged',()=>{
 const {b,hero,troop}=rageFixture();troop.weapon.before=17;troop.weapon.after=90;assert.equal(b.useConsumable('rage'),true);
 // Soldier.attackEnemy: t_bef = RAGE[team] ? 1 : wpn.t_bef.
 b.setHeroInput({attack:true});b.step();assert.equal(troop.windup,1);assert.equal(hero.recovery,hero.weapon.after);
 // Soldier.waitForFire: t_bef == 1 -> t_aft = MIN_ATTACK_TIME[atkAnim].
 b.step();assert.equal(troop.recovery,MIN_ATTACK_TIME[troop.animation]);assert.equal(troop.windup,0);assert.equal(hero.recovery,hero.weapon.after-1);
});

test('rage lasts sixty 31-frame commands, refreshes on reuse and stops advancing with ended battles',()=>{
 const {c,b,troop}=rageFixture();troop.recovery=1e9;b.fighters[0].recovery=1e9;supplies(c).rage=3;b.useConsumable('rage');
 for(let i=0;i<30;i++)b.step();assert.equal(b.rageCommands,60);b.step();assert.equal(b.rageCommands,59);
 b.useConsumable('rage');assert.equal(b.rageCommands,60);for(let i=0;i<31*60;i++)b.step();assert.equal(b.rageCommands,0);assert.equal(supplies(c).rage,1);
 b.useConsumable('rage');b.result='defeat';for(let i=0;i<100;i++)b.step();assert.equal(b.rageCommands,60);
});
