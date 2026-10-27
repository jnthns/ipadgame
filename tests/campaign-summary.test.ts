import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Battle,newCampaign} from '../src/model';
import {settleBattleVictory} from '../src/battle-outcome';
import {world,enterTown,collectTownReward} from '../src/world-campaign';
import {readCampaignSave} from '../src/campaign-actions';
import {companyRoster,pendingPayments} from '../src/campaign-summary';

test('six battle gold remains distinct from saved contract payment, arrival and one-time collection',()=>{
 const c=newCampaign();c.gold=0;c.quest={town:c.town,count:1,reward:300,avatarId:0};
 const battle=new Battle(c,[],'quest',c.town);battle.gold=6;battle.result='victory';settleBattleVictory(battle);
 assert.equal(c.gold,6);assert.equal(c.quest,null);
 const restored=readCampaignSave(JSON.stringify(c));enterTown(restored,restored.town);
 assert.equal(restored.gold,6,'arrival does not silently change source payment rules');
 const before=JSON.stringify(restored);const payment=pendingPayments(restored)[0];
 assert.equal(payment.total,300);assert.equal(payment.next,300);assert.equal(payment.canCollect,true);
 assert.equal(JSON.stringify(restored),before,'viewing does not collect or duplicate pay');
 assert.equal(collectTownReward(restored),300);assert.equal(restored.gold,306);
 assert.deepEqual(pendingPayments(restored),[]);assert.equal(collectTownReward(restored),0);
});
test('road battle loot cannot falsely advertise completion of the active rogue contract',()=>{
 const c=newCampaign();c.gold=0;c.quest={town:c.town,count:1,reward:400,avatarId:0};
 const battle=new Battle(c,[],'encounter',c.town);battle.gold=6;battle.result='victory';settleBattleVictory(battle);
 assert.equal(c.gold,6);assert.equal(c.quest?.reward,400);assert.deepEqual(pendingPayments(c),[]);
});
test('company roster groups troops and shows living deployed soldiers plus reserves, excluding the hero',()=>{
 const c=newCampaign();c.army=['MeleeViz1','MeleeViz1','RangedViz1'];
 assert.deepEqual(companyRoster(c).map(r=>[r.key,r.count]),[['MeleeViz1',2],['RangedViz1',1]]);
 const battle=new Battle(c,['MeleeViz1'],'quest',c.town);battle.fighters.find(f=>f.team===0&&f.key==='MeleeViz1')!.hp=0;
 assert.equal(companyRoster(c,battle).reduce((n,r)=>n+r.count,0),2);
 assert.equal(c.army.length,3,'live view does not mutate the pre-settlement checkpoint');
 assert.deepEqual(companyRoster({...c,army:[]}),[]);
});
test('remote payments remain visible but cannot be collected until reaching their town',()=>{
 const c=newCampaign();world(c).rewards=[{town:'Jana',gold:200},{town:'Jana',gold:300}];
 assert.deepEqual(pendingPayments(c),[{town:'Jana',total:500,next:200,count:2,canCollect:false}]);
 enterTown(c,'Jana');assert.equal(pendingPayments(c)[0].canCollect,true);
 assert.equal(collectTownReward(c),200);assert.equal(pendingPayments(c)[0].next,300);
});
