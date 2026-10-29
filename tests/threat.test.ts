import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newCampaign,data} from '../src/model';
import {estimateSiege,cachedThreat,tierFor} from '../src/threat';
import {world} from '../src/world-campaign';
import {atlasMarkup,townCard,destinationTown,travelSeconds} from '../src/world-presentation';

const castleDefender=Object.keys(data.units).find(k=>data.units[k].NAME==='Castle Defender')!;

test('threat tiers order win rate first, then how much of the garrison falls',()=>{
 assert.equal(tierFor(.8,0),'favorable');assert.equal(tierFor(.5,0),'even');assert.equal(tierFor(0,.5),'hard');assert.equal(tierFor(0,.1),'overwhelming');
});

test('siege estimate is deterministic, cached and leaves the live campaign untouched',()=>{
 const c=newCampaign(0),before=JSON.stringify(c);
 const first=estimateSiege(c,'Konstanz');
 assert.equal(JSON.stringify(c),before);
 assert.equal(first.garrison,15);assert.equal(first.samples,6);
 assert.equal(first.tier,'overwhelming','a starting company cannot take Konstanz');
 assert.equal(cachedThreat(c,'Konstanz'),first);
 const again=newCampaign(0);assert.deepEqual(estimateSiege(again,'Konstanz'),first);
});

test('a stronger company changes the estimate, and owned towns need no simulation',()=>{
 const c=newCampaign(0),weak=estimateSiege(c,'Trapezus');
 c.army.push(...Array(4).fill(castleDefender));
 assert.equal(cachedThreat(c,'Trapezus'),null,'army changes invalidate the cached estimate');
 const strong=estimateSiege(c,'Trapezus');
 assert.ok(strong.winRate>weak.winRate);
 assert.equal(cachedThreat(c,c.town)?.tier,'owned');
});

test('town card names the threat and offers the right action for where the company is',()=>{
 const c=newCampaign(0),w=world(c),threat=estimateSiege(c,'Konstanz');
 const away=townCard(c,w,'Konstanz',threat);
 assert.match(away,/Overwhelming/);assert.match(away,/id="travel"/);assert.doesNotMatch(away,/id="siege"/);
 const home=townCard(c,w,c.town,cachedThreat(c,c.town));
 assert.match(home,/id="enter-city"/);assert.match(home,/Your banner/);assert.doesNotMatch(home,/card-threat/);
});

test('atlas shows one marker per town, the delivery objective and the journey destination',()=>{
 const c=newCampaign(0),w=world(c);
 w.delivery={from:c.town,to:'Konstanz',gold:500};w.rewards.push({town:'Konstanz',gold:500});
 const html=atlasMarkup(c,w,'Konstanz',false,town=>cachedThreat(c,town),true,true);
 assert.equal(html.match(/class="atlas-town/g)?.length,32);
 assert.match(html,/Deliver to Konstanz/);assert.match(html,/goal-badge delivery/);
 w.target={x:w.x+120,y:w.y};assert.equal(destinationTown(w),null,'an open-ground waypoint is not a town');
 assert.equal(travelSeconds(w,w.target),2,'two pixels per tick at 30 ticks per second');
});
