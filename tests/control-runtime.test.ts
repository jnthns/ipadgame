import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {compareControlTrace} from '../tools/compare-control-trace';
const capture=(name:string)=>JSON.parse(gunzipSync(Buffer.from(readFileSync(new URL(`./fixtures/runtime/${name}.json.gz.b64`,import.meta.url),'utf8'),'base64')).toString());
for(const [fixture,frames,cast] of [['controls-cast',180,true],['controls-none',90,false],['controls-deployed',90,false]] as const){
 test(`original runtime reserve controls: ${fixture}`,()=>{
  const result=compareControlTrace(capture(fixture));
  assert.equal(result.frames,frames);assert.equal(result.cast,cast);
  assert.equal(result.matchingControlFrames,frames);assert.equal(result.matchingRngFrames,frames);assert.deepEqual(result.differences,[]);
 });
}
test('control replay rejects missing, duplicate, malformed and unproven cast evidence',()=>{
 const input=capture('controls-cast');const first=input.lines.find((l:string)=>l.startsWith('CONTROL|1|'))!;
 assert.throws(()=>compareControlTrace({...input,lines:input.lines.filter((l:string)=>l!==first)}),/Incomplete/);
 assert.throws(()=>compareControlTrace({...input,lines:[...input.lines,first]}),/Invalid control frame/);
 assert.throws(()=>compareControlTrace({...input,lines:input.lines.map((l:string)=>l===first?l.replace('|2|false','|NaN|false'):l)}),/Invalid control frame/);
 assert.throws(()=>compareControlTrace({...input,lines:input.lines.filter((l:string)=>!l.startsWith('CONTROLCAST|'))}),/cast evidence/);
});
