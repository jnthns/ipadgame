/** Input adapter only. Simulation, collisions and attack readiness live in Battle. */
export type HeroInput={x:number;y:number;attack:boolean;switchWeapon:boolean};
export type HeroButtons={left?:boolean;right?:boolean;up?:boolean;down?:boolean;attack?:boolean;switchWeapon?:boolean};
export type HeroPosition={x:number;y:number};
export type TouchAction='left'|'right'|'up'|'down'|'attack'|'switchWeapon';
/** Original Player.moveOnDestination checks right after left and down after up. */
export function heroDirection(buttons:HeroButtons){return {x:buttons.right?1:buttons.left?-1:0,y:buttons.down?1:buttons.up?-1:0};}
export class HeroControls{
 private pointers=new Map<number,TouchAction>();
 private directionPulse:TouchAction|null=null;
 private attackPulse=false;
 private switchPulse=false;
 destination:HeroPosition|null=null;
 press(pointerId:number,action:TouchAction){this.pointers.set(pointerId,action);if(action==='attack')this.attackPulse=true;if(action==='switchWeapon')this.switchPulse=true;if(['left','right','up','down'].includes(action)){this.destination=null;this.directionPulse=action;}}
 release(pointerId:number){this.pointers.delete(pointerId);}
 moveTo(destination:HeroPosition){this.destination={x:Math.max(0,Math.min(19,Math.floor(destination.x))),y:Math.max(0,Math.min(7,Math.floor(destination.y)))};}
 reset(){this.pointers.clear();this.directionPulse=null;this.attackPulse=false;this.switchPulse=false;this.destination=null;}
 /** One call per simulation tick. A quick tap still submits one input tick; holds persist. */
 sample(keys:HeroButtons,hero:HeroPosition):HeroInput{
 const held=new Set(this.pointers.values());if(this.directionPulse)held.add(this.directionPulse);const buttons={left:keys.left||held.has('left'),right:keys.right||held.has('right'),up:keys.up||held.has('up'),down:keys.down||held.has('down')};
 let {x,y}=heroDirection(buttons);
 if(x||y)this.destination=null;
 else if(this.destination){x=Math.sign(this.destination.x-hero.x);y=Math.sign(this.destination.y-hero.y);if(!x&&!y)this.destination=null;}
 const input={x,y,attack:!!keys.attack||held.has('attack')||this.attackPulse,switchWeapon:!!keys.switchWeapon||held.has('switchWeapon')||this.switchPulse};
 this.directionPulse=null;this.attackPulse=false;this.switchPulse=false;return input;
 }
}
