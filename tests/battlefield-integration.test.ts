import {test} from 'node:test';import assert from 'node:assert/strict';
import {Battle,newCampaign} from '../src/model';import {battleLayout} from '../src/battle-layout';
test('all 80 original formations remain free of fighter and reservation overlap during simulation',()=>{
 for(let map=1;map<=80;map++){
  const c=newCampaign();c.army=Array(14).fill('MeleeViz1');
  const b=new Battle(c,Array(14).fill('MeleeGer1'),'siege',c.town,100+map,{heroControl:'manual',...battleLayout(map)});
  b.setHeroInput({attack:true,x:1});
  for(let tick=0;tick<200&&!b.result;tick++){
   b.step();const occupied=new Map<string,number>();const reserved=new Map<string,number>();
   for(const f of b.alive()){
    assert.ok(Number.isFinite(f.pixelX)&&Number.isFinite(f.pixelY));assert.ok(f.x>=0&&f.x<20&&f.y>=0&&f.y<8);
    const current=`${f.x},${f.y}`;assert.ok(!occupied.has(current),`map ${map} tick ${tick} occupied ${current}`);occupied.set(current,f.id);
    if(f.moving){const dest=`${f.nextX},${f.nextY}`;const other=reserved.get(dest);assert.ok(other===undefined||other===f.id,`map ${map} tick ${tick} reserved ${dest}`);reserved.set(dest,f.id);}
   }
   for(const [cell,id] of reserved){const occupant=occupied.get(cell);assert.ok(occupant===undefined||occupant===id,`map ${map} tick ${tick} reservation conflicts at ${cell}`);}
  }
 }
});
