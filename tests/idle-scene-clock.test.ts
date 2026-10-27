import {test} from 'node:test';
import assert from 'node:assert/strict';
import {IdleSceneClock} from '../src/idle-scene-clock';
import {RootClock} from '../src/root-clock';
import {Battle,newCampaign} from '../src/model';

test('DOM city/shop clock advances at 30 Hz across display cadences and preserves battle entry phase',()=>{
 for(const fps of [30,45,60,120]){
  const root=new RootClock(4),idle=new IdleSceneClock(root);let ticks=0;
  for(let frame=0;frame<fps*2;frame++)ticks+=idle.advance(1000/fps,true);
  assert.equal(ticks,60);assert.equal(root.phase,2);
  idle.advance(1000/fps,false);
  const campaign=newCampaign(),battle=new Battle(campaign,['MeleeViz1'],'quest',campaign.town,1,{rootClock:root,heroControl:'manual'});
  battle.step();assert.equal(root.phase,3);
 }
});
test('inactive scenes reset fractional time and background gaps cannot advance an entire journey',()=>{
 const root=new RootClock(),idle=new IdleSceneClock(root);
 idle.advance(20,true);idle.advance(60000,false);assert.equal(root.phase,0);
 idle.advance(20,true);assert.equal(root.phase,0);assert.equal(idle.advance(100000,true),3);
 assert.equal(root.phase,3);
 for(const delta of [NaN,Infinity,-50,0])assert.equal(idle.advance(delta,true),0);
});
