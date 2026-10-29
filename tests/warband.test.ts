import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newCampaign,data} from '../src/model';
import {readCampaignSave} from '../src/campaign-actions';
import {recordChronicle,chronicle,chronicleChart,musterMarkup,conquestMarkup,armyCounts} from '../src/warband';
import {itemRequirement,itemComparison,itemSummary} from '../src/item-cards';

test('chronicle snapshots the company, survives a save round trip and ignores malformed entries',()=>{
 const c=newCampaign(0);recordChronicle(c,'Set out');c.army.push(c.army[0]);c.hero.LEVEL=2;recordChronicle(c,'Road battle',1);
 const entries=chronicle(c);assert.equal(entries.length,2);assert.equal(entries[1].fallen,1);assert.equal(Object.values(entries[1].army).reduce((a,n)=>a+n,0),c.army.length);
 const restored=readCampaignSave(JSON.stringify(c));assert.deepEqual(chronicle(restored),entries);
 (c as unknown as {chronicle:unknown[]}).chronicle.push({label:5},null);assert.equal(chronicle(c).length,2);
});

test('chronicle keeps a bounded history',()=>{const c=newCampaign(0);for(let i=0;i<130;i++)recordChronicle(c,`Battle ${i}`);assert.equal(chronicle(c).length,120);assert.equal(chronicle(c)[0].label,'Battle 10');});

test('chronicle chart draws one column per entry and marks hero level-ups',()=>{
 const c=newCampaign(0);assert.match(chronicleChart(c),/story will chart here/);
 recordChronicle(c,'Set out');c.hero.LEVEL=2;recordChronicle(c,'Road battle');
 const svg=chronicleChart(c);assert.equal(svg.match(/class="chronicle-bar"/g)?.length,2);assert.match(svg,/Lv 2/);
});

test('muster shows the hero and every soldier up to the limit',()=>{
 const c=newCampaign(0),html=musterMarkup(c,'field.webp');
 assert.equal(html.match(/class="muster-figure rank-/g)?.length,c.army.length);assert.match(html,/muster-figure hero/);
 c.army=Array(60).fill(c.army[0]);assert.match(musterMarkup(c,'field.webp',48),/\+12 more/);
 assert.deepEqual(armyCounts(['a','b','a']),{a:2,b:1});
});

test('conquest board shows eight towns per land and marks captured ones',()=>{
 const c=newCampaign(0),html=conquestMarkup(c);
 assert.equal(html.match(/<i /g)?.length,32);assert.equal(html.match(/class="held"/g)?.length,1);
});

test('item cards state requirements against the hero and compare with equipped gear',()=>{
 const c=newCampaign(0),hero=c.hero,heavy=Object.values(data.items).find(i=>i.require_param==='STR'&&(i.require_value??0)>hero.STR)!;
 const req=itemRequirement(hero,heavy);assert.equal(req.met,false);assert.match(req.text,new RegExp(`needs ${heavy.require_value}`));
 const armor=Object.values(data.items).find(i=>i.TYPE==='Clothes'&&(i.value??0)>0)!;
 assert.match(itemComparison({...hero,ARMOR:null},armor),/\+\d+ defense vs nothing/);assert.match(itemSummary(armor),/defense/);
});
