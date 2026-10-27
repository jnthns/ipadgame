import {RootClock} from './root-clock';

/** Advance the source root phase while a DOM-only scene owns the foreground.
 * WorldTravel and Battle own their own ticks; never call this for those scenes.
 */
export class IdleSceneClock{
 private accumulator=0;
 constructor(private readonly root:RootClock){}
 advance(delta:number,active:boolean){
  if(!active){this.accumulator=0;return 0;}
  if(!Number.isFinite(delta)||delta<=0)return 0;
  this.accumulator+=Math.min(delta,100);
  let ticks=0;
  while(this.accumulator+1e-8>=1000/30){this.accumulator=Math.max(0,this.accumulator-1000/30);this.root.step();ticks++;}
  return ticks;
 }
}
