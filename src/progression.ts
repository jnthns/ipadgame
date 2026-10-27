import type {Hero} from './model';
/** Exact sparse Hero.EXP_FOR_LEVELS indices, including the original 30–39 holes. */
export const xpThresholds:number[]=Object.assign([-1,0,100,250,500,800,1200,1600,2000,2500,3000,3600,4200,4800,5500,6200,7000,7800,8700,9700,10800,12000,13400,15000,17000,19500,22000,25000,29000,34000],{40:39000,41:45000,42:50000,43:55000,44:61000,45:67000,46:74000,47:81000,48:88000,49:95000,50:100000,51:0});
Object.freeze(xpThresholds);
/** Original AVM1 >= is Less2 then Not: an undefined threshold passes this gate.
 * Consequently level 29 jumps through the missing entries to level 39.
 */
export function addXP(h:Hero,amount:number){if(!Number.isFinite(amount)||amount<0)throw new RangeError('Experience must be finite and non-negative.');h.EXP+=amount;let gained=false;while(h.LEVEL<50){const threshold=xpThresholds[h.LEVEL+1];if(threshold!==undefined&&h.EXP<threshold)break;h.LEVEL++;h.free_points+=25;gained=true;}return gained;}
export const ATTRIBUTES=['STR','DEX','CON','INT'] as const;
export type Attribute=typeof ATTRIBUTES[number];
export const SKILLS=['Sword','Axe','Mace','FarEast','Spear','Dagger','Staff','Dual','Fist','Bow','Crossbow','Throwing','Patriotism','ArtOfWar'] as const;
export function canUpgradeAttribute(h:Hero,key:string):key is Attribute{return (ATTRIBUTES as readonly string[]).includes(key)&&h.free_points>=2&&Number.isInteger(h[key as Attribute])&&h[key as Attribute]<200;}
export function upgradeAttribute(h:Hero,key:string){if(!canUpgradeAttribute(h,key))return false;h[key]++;h.free_points-=2;return true;}
export function canUpgradeSkill(h:Hero,key:string){const cap=key==='ArtOfWar'||key==='Patriotism'?Math.min(100,h.INT*2):100;return (SKILLS as readonly string[]).includes(key)&&Object.hasOwn(h.SKILL,key)&&Number.isInteger(h.SKILL[key])&&h.SKILL[key]<cap&&h.free_points>=1;}
export function upgradeSkill(h:Hero,key:string){if(!canUpgradeSkill(h,key))return false;h.SKILL[key]++;h.free_points--;return true;}
