import fs from 'node:fs';import crypto from 'node:crypto';
const url='https://cache.armorgames.com/files/games/feudalism-433.swf';
const expected='31b2a89a748d415b249e7efbf41b2c960e6fc1f5f4e07d4b33505192363609ca';
const response=await fetch(url);if(!response.ok)throw new Error(`Distributor returned ${response.status}`);const bytes=Buffer.from(await response.arrayBuffer());if(bytes.toString('ascii',0,3)!=='CWS')throw new Error('Not the expected compressed SWF');const actual=crypto.createHash('sha256').update(bytes).digest('hex');if(actual!==expected)throw new Error('SWF has changed; review before using a new build');fs.mkdirSync('reference',{recursive:true});fs.writeFileSync('reference/feudalism.swf',bytes);console.log(`Verified ${bytes.length} bytes, SHA256 ${actual}`);
