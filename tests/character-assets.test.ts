import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import manifest from '../public/art/remastered/identities/manifest.json';

test('all inspected character and weapon images ship intact with transparent gutters',()=>{
  assert.equal(Object.keys(manifest.assets).length,124);
  for(const [id,entry] of Object.entries(manifest.assets)){
    const category=id.startsWith('hero-')||id.startsWith('unit-')?'characters':'equipment';
    const bytes=readFileSync(new URL(`../public/art/remastered/identities/${category}/${id}.webp`,import.meta.url));
    assert.ok(bytes.length>100,`${id}: missing or truncated image`);
    assert.equal(bytes.toString('ascii',0,4),'RIFF');
    assert.equal(bytes.toString('ascii',8,12),'WEBP');
    assert.equal(createHash('sha256').update(bytes).digest('hex'),entry.sha256,`${id}: image differs from inspected alpha bounds`);
    const [left,top,right,bottom]=entry.bounds;
    assert.ok(left>=8&&top>=8&&right<=248&&bottom<=248,`${id}: missing transparent safety margin`);
  }
});
