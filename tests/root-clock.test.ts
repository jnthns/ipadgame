import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Battle,newCampaign} from '../src/model';
import {WorldTravel} from '../src/world-campaign';
import {RootClock} from '../src/root-clock';
import fixture from './fixtures/root-bytecode.json';
import {runBytecode} from './helpers/avm1';

test('all31 root clock phases and command pulses match original root onEnterFrame bytecode for310 frames',()=>{
 for(let initial=0;initial<=30;initial++)for(const heroPresent of [false,true]){let calls=0;const global={times:initial},root:Record<string,unknown>={};if(heroPresent)root.hero0={};const clock=new RootClock(initial);for(let frame=0;frame<310;frame++){const before=calls;runBytecode(fixture.methods.onEnterFrame,fixture.pool,{1:root,2:global},{commandAI:()=>calls++});const pulse=clock.step();assert.equal(clock.phase,global.times);assert.equal(calls-before,heroPresent&&pulse?1:0);}}
});
test('a shared clock retains phase through simulated scene changes and rejects invalid starting phases',()=>{const clock=new RootClock(27);assert.equal(clock.step(),false);assert.equal(clock.phase,28);const campaign=newCampaign();const travel=new WorldTravel(campaign,clock);travel.step();assert.equal(clock.phase,29);const battle=new Battle(campaign,['MeleeViz1'],'quest',campaign.town,1,{rootClock:clock,heroControl:'manual'});let pulses=0;const reinforce=battle.reinforce.bind(battle);battle.reinforce=(...args)=>{pulses++;reinforce(...args);};battle.step();assert.equal(clock.phase,30);assert.equal(pulses,0);battle.step();assert.equal(clock.phase,0);assert.equal(pulses,1);for(const invalid of [-1,31,1.5,NaN])assert.throws(()=>new RootClock(invalid),/phase/);});
