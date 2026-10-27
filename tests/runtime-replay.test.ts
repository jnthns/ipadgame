import {test} from 'node:test';
import assert from 'node:assert/strict';
import trace from './fixtures/runtime/map1-ruffle-0.7.1.json';
import {compareRuntimeTrace} from '../tools/compare-runtime-trace';

test('original SWF under Ruffle: 300 RNG states and 1500 fighter snapshots match',()=>{
 const result=compareRuntimeTrace(trace);
 assert.equal(result.frames,300);
 assert.equal(result.totalUnitFrames,1500);
 assert.equal(result.matchingUnitFrames,1500);
 assert.equal(result.matchingRngFrames,300);
 assert.deepEqual(result.firstDifferences,[]);
 assert.deepEqual(result.rngDifferences,[]);
});
test('runtime regression rejects incomplete captures',()=>{
 assert.throws(()=>compareRuntimeTrace({...trace,lines:trace.lines.filter(line=>line!=='DONE|300')}),/complete/);
});

test('reinforcement traces must include all additional slot observations',()=>{
 assert.throws(()=>compareRuntimeTrace({...trace,lines:['SCENARIO|reinforcement',...trace.lines]}),/complete/);
});

test('reinforcement duration metadata cannot conceal incomplete or invalid traces',()=>{
 assert.throws(()=>compareRuntimeTrace({...trace,lines:['SCENARIO|reinforcement','LENGTH|1200',...trace.lines]}),/complete/);
 assert.throws(()=>compareRuntimeTrace({...trace,lines:['SCENARIO|reinforcement','LENGTH|3601',...trace.lines]}),/Invalid trace length/);
});

import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
test('extended original replay preserves queued lethal-frame attacks and all 1200 RNG states',()=>{
 const capture=JSON.parse(gunzipSync(Buffer.from(readFileSync(new URL('./fixtures/runtime/reinforcement-1200.json.gz.b64',import.meta.url),'utf8'),'base64')).toString());
 const result=compareRuntimeTrace(capture);
 assert.equal(result.frames,1200);
 assert.equal(result.matchingRngFrames,1200);
 assert.deepEqual(result.rngDifferences,[]);
 assert.ok(result.removedClipFrames>0,'removed original corpse clips are tracked separately');
 assert.equal(result.totalUnitFrames-result.matchingUnitFrames,18);
 for(const difference of result.firstDifferences){
  assert.ok(Array.isArray(difference.errors));
  for(const error of difference.errors as {field:string;expected:unknown;actual:unknown}[]){
   assert.ok(['moveX','moveY'].includes(error.field));
   assert.ok(Number.isNaN(error.expected));
   assert.equal(error.actual,0);
  }
 }
});

test('original arrow shower matches all 300 frames after impact and weapon switching',()=>{
 const capture=JSON.parse(gunzipSync(Buffer.from(readFileSync(new URL('./fixtures/runtime/shower-effect.json.gz.b64',import.meta.url),'utf8'),'base64')).toString());
 const result=compareRuntimeTrace(capture);
 assert.equal(result.capturedFrames,300);
 assert.equal(result.frames,300);
 assert.equal(result.matchingRngFrames,300);
 assert.equal(result.matchingUnitFrames,result.totalUnitFrames);
 assert.deepEqual(result.firstDifferences,[]);
 assert.throws(()=>compareRuntimeTrace(capture,301),/Invalid comparison/);
 assert.throws(()=>compareRuntimeTrace({...capture,lines:capture.lines.filter((l:string)=>!l.startsWith('CAST|'))}),/validated ability cast/);
});

test('original wall effect matches all 300 frames including scatter and friendly fire',()=>{
 const capture=JSON.parse(gunzipSync(Buffer.from(readFileSync(new URL('./fixtures/runtime/wall-effect.json.gz.b64',import.meta.url),'utf8'),'base64')).toString());
 const result=compareRuntimeTrace(capture);
 assert.equal(result.capturedFrames,300);
 assert.equal(result.matchingRngFrames,300);
 assert.equal(result.matchingUnitFrames,result.totalUnitFrames);
 assert.deepEqual(result.firstDifferences,[]);
});
