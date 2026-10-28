import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Battle,data,expand,newCampaign} from '../src/model';
import {RENDER_PRESETS} from '../src/render-presets';
import {battleCellAt,battleCellCenter,projectBattlePixel,sampleFighterPose,unprojectBattlePoint} from '../src/battle-presentation-state';

test('battle projection retains source pixels and targets every original logical cell',()=>{
  for(let x=0;x<20;x++)for(let y=0;y<8;y++){
    const source={x:x*40+20,y:y*25+12.5},view=projectBattlePixel(source.x,source.y);
    assert.deepEqual(view,battleCellCenter({x,y}));
    assert.deepEqual(battleCellAt(view.x,view.y),{x,y});
    const restored=unprojectBattlePoint(view.x,view.y);
    assert.ok(Math.abs(restored.x-source.x)<1e-9&&Math.abs(restored.y-source.y)<1e-9);
  }
  assert.deepEqual(battleCellAt(-100,-100),{x:0,y:0});
  assert.deepEqual(battleCellAt(2000,2000),{x:19,y:7});
});

test('sampling illustrated poses at different render rates cannot change a seeded battle',()=>{
  const make=()=>new Battle(newCampaign(4),expand(data.towns.Jana.defenders),'siege','Jana',5973,{heroControl:'manual'});
  const baseline=make(),illustrated=make();
  const state=(b:Battle)=>JSON.stringify({fighters:b.fighters,reserves:b.reserves,projectiles:b.projectiles,tick:b.tick,result:b.result,gold:b.gold,xp:b.xp,loot:b.loot});
  for(let tick=0;tick<300;tick++){
    for(const preset of Object.values(RENDER_PRESETS))for(const f of illustrated.fighters){
      const before=JSON.stringify(f);
      sampleFighterPose(f,tick*1000/30,preset,tick%7===0?tick*1000/30+100:0);
      sampleFighterPose(f,tick*1000/30+8,preset);
      assert.equal(JSON.stringify(f),before,'presentation must not alter the sampled fighter');
    }
    baseline.setHeroInput({x:tick%60<25?1:0,attack:tick%90>30});
    illustrated.setHeroInput({x:tick%60<25?1:0,attack:tick%90>30});
    baseline.step();illustrated.step();
    assert.equal(state(illustrated),state(baseline),`simulation diverged at tick ${tick}`);
  }
});
