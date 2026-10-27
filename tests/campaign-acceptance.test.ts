import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Battle,newCampaign,data,expand,recruit,type Campaign} from '../src/model';
import {buyItem,equipInventory,economy,itemKey,readCampaignSave,buyConsumable} from '../src/campaign-actions';
import {prepareTownQuest,approveTownQuest,WorldTravel,world,enterTown,collectTownReward} from '../src/world-campaign';
import {geometry} from '../src/world-geometry';
import {battleLayout,chooseBattleMap} from '../src/battle-layout';
import {settleBattleVictory} from '../src/battle-outcome';
import {upgradeAttribute,upgradeSkill} from '../src/progression';

/** Exercise the actual simulation to termination; do not manufacture victory. */
function finish(battle:Battle,limit=12000){
 for(let frame=0;frame<limit&&!battle.result;frame++)battle.step();
 assert.notEqual(battle.result,null,`battle did not terminate in ${limit} frames`);
 return battle.result;
}
function reload(c:Campaign){const serialized=JSON.stringify(c),restored=readCampaignSave(serialized);assert.equal(JSON.stringify(restored),serialized);return restored;}

test('campaign acceptance: buy, equip, recruit, travel-trigger contracts, fight, collect, level and reload',()=>{
 let c=newCampaign();const originalPrimary=itemKey(c.hero.WEAPON_PRI);
 assert.equal(buyItem(c,'WeaponClassOnehandedSwordViz1'),null);
 assert.equal(equipInventory(c,0,'WEAPON_PRI'),null);
 assert.ok(economy(c).inventory.some(ref=>ref.key===originalPrimary),'replaced equipment survives');
 assert.equal(recruit(c,'MeleeViz1'),true);
 assert.equal(c.gold,20);
 assert.equal(c.army.length,6);
 c=reload(c);
 let completed=0;
 while(c.hero.LEVEL<2&&completed<20){
  const offer=prepareTownQuest(c,'combat',()=>0);assert.equal(offer.kind,'combat');if(offer.kind!=='combat')throw new Error('Expected combat offer');
  assert.equal(approveTownQuest(c),null);
  // Scene positioning is a fixture: the real WorldTravel arrival/quest branch executes below.
  const w=world(c),p=(geometry.questAvatars as Record<string,{x:number;y:number}>)[`quest_avatar_${offer.avatarId}`];
  Object.assign(w,{x:p.x,y:p.y,town:null,target:{x:p.x,y:p.y}});
  const travel=new WorldTravel(c);travel.random=()=>.5;const event=travel.step();
  assert.equal(event?.type,'quest');if(event?.type!=='quest')throw new Error('Quest did not trigger');
  assert.equal(recruit(c,'MeleeViz1'),false,'travel blocks remote recruitment');
  assert.notEqual(buyConsumable(c,'smallPotion'),null,'travel blocks remote shops');
  const beforeGold=c.gold,beforeXP=c.hero.EXP;
  c.battles++;
  const battle=new Battle(c,event.enemies,'quest',offer.town,c.battles*7919,{heroControl:'manual',...battleLayout(event.mapId)});
  assert.equal(finish(battle),'victory');
  const result=settleBattleVictory(battle),settled=JSON.stringify(c);
  assert.equal(settleBattleVictory(battle),result);
  assert.equal(JSON.stringify(c),settled,'re-reading results cannot duplicate rewards');
  assert.equal(c.gold,beforeGold+battle.gold,'contract payment is deferred');
  assert.equal(c.hero.EXP,beforeXP+battle.xp);
  assert.equal(c.quest,null);
  assert.ok(economy(c).inventory.length>1,'real defeated enemies produce loot');
  c=reload(c);
  assert.equal(collectTownReward(c),0,'being outside town cannot collect a reward');
  enterTown(c,offer.town);
  assert.equal(collectTownReward(c),offer.reward);
  assert.equal(collectTownReward(c),0,'payment is collected exactly once');
  completed++;
  c=reload(c);
 }
 assert.equal(c.hero.LEVEL,2,'combat XP crosses the first level threshold');
 assert.ok(completed>1);
 assert.equal(c.battles,completed);
 const points=c.hero.free_points,str=c.hero.STR,sword=c.hero.SKILL.Sword;
 assert.equal(upgradeAttribute(c.hero,'STR'),true);
 assert.equal(upgradeSkill(c.hero,'Sword'),true);
 assert.equal(c.hero.STR,str+1);assert.equal(c.hero.SKILL.Sword,sword+1);assert.equal(c.hero.free_points,points-3);
 c=reload(c);assert.equal(c.hero.STR,str+1);assert.equal(c.hero.LEVEL,2);
 const delivery=prepareTownQuest(c,'delivery',()=>.5);assert.equal(delivery.kind,'delivery');if(delivery.kind!=='delivery')throw new Error('Expected delivery');
 assert.equal(world(c).rewards.length,0,'unapproved offer cannot be paid');
 c=reload(c);assert.equal(approveTownQuest(c),null);assert.notEqual(approveTownQuest(c),null,'approval cannot duplicate the note');
 const deliveryGold=c.gold;c=reload(c);assert.equal(collectTownReward(c),0);
 enterTown(c,delivery.destination);assert.equal(collectTownReward(c),delivery.reward);assert.equal(c.gold,deliveryGold+delivery.reward);assert.equal(collectTownReward(c),0);assert.equal(world(c).delivery,null);
 c=reload(c);assert.equal(world(c).rewards.length,0);
});

test('campaign acceptance: simulated two-stage foreign conquest survives export and preserves hostility/service gates',()=>{
 let c=newCampaign();
 // Late-campaign fixture: this checks stage/reward/loss integration, not game balance.
 Object.assign(c.hero,{LEVEL:50,EXP:100000,CON:200,STR:200,DEX:200,INT:200});
 c.hero.SKILL.ArtOfWar=100;c.hero.SKILL.Patriotism=100;c.army=Array(100).fill('MeleeViz6');
 const town=data.towns.Sturmburg;
 const siege=new Battle(c,expand(town.defenders),'siege',town.ID,123,{heroControl:'manual',...battleLayout(chooseBattleMap('siege',town.ID,()=>0))});
 assert.equal(finish(siege),'victory');const goldBefore=c.gold;
 const first=settleBattleVictory(siege);
 assert.ok(first.nextEnemies.length>0);assert.equal(first.capturedTown,false);assert.ok(!c.captured.includes(town.ID));
 assert.equal(c.gold,goldBefore+siege.gold);assert.ok(c.army.length<100,'garrison casualties carry forward');
 c=reload(c);
 const surviving=c.army.length;
 const throne=new Battle(c,[...first.nextEnemies],'throne',town.ID,123,{heroControl:'manual',...battleLayout(chooseBattleMap('throne',town.ID,()=>0))});
 assert.equal(finish(throne),'victory');const final=settleBattleVictory(throne);
 assert.equal(final.capturedTown,true);assert.equal(final.nextEnemies.length,0);assert.ok(c.army.length<=surviving);
 assert.equal(c.captured.filter(id=>id===town.ID).length,1);assert.ok(c.hostile.includes('Ger'));
 assert.equal(world(c).town,town.ID);
 c=reload(c);
 const ownedRecruit=data.towns[town.ID].barracks[0];c.gold=100000;
 assert.equal(recruit(c,ownedRecruit.TYPE+ownedRecruit.NATION+ownedRecruit.ID),true,'captured town offers recruitment');
 enterTown(c,'Jana');assert.notEqual(buyConsumable(c,'smallPotion'),null,'uncaptured foreign towns close services');
 enterTown(c,town.ID);assert.equal(buyConsumable(c,'smallPotion'),null,'captured towns keep services');
 c=reload(c);assert.ok(c.captured.includes(town.ID));assert.ok(c.hostile.includes('Ger'));
});

test('campaign acceptance: actual defeat rejects settlement and a saved checkpoint restores supplies, quests and economy',()=>{
 const c=newCampaign();c.army=[];
 prepareTownQuest(c,'combat',()=>0);
 buyItem(c,'WeaponClassOnehandedSwordViz1');
 const checkpoint=JSON.stringify(c);
 c.battles++;
 const battle=new Battle(c,['MeleeViz9'],'quest',c.town,9,{heroControl:'manual',initialSpawns:[{x:1,y:3,team:0,hero:true},{x:2,y:3,team:1}]});
 assert.equal(battle.useConsumable('smallPotion'),true);
 assert.equal(finish(battle),'defeat');
 assert.throws(()=>settleBattleVictory(battle),/victorious/);
 assert.notEqual(JSON.stringify(c),checkpoint,'encounter consumed stock and advanced battle counter');
 const restored=readCampaignSave(checkpoint);
 assert.equal(JSON.stringify(restored),checkpoint);
 assert.equal(restored.supplies!.smallPotion,5);
 assert.equal(restored.battles,0);assert.ok(restored.quest);assert.equal(economy(restored).inventory[0].key,'WeaponClassOnehandedSwordViz1');
});
