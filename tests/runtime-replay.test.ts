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
