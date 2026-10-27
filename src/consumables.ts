/** Counts, prices and effects recovered from buttons 155/171–175 and 1612–1617. */
export const CONSUMABLES={
 smallPotion:{name:'Small potion',price:10,heal:40,group:0,key:'1'},
 mediumPotion:{name:'Medium potion',price:100,heal:300,group:0,key:'2'},
 largePotion:{name:'Large potion',price:900,heal:100000,group:0,key:'3'},
 smallGroupHeal:{name:'Group heal 33%',price:50,heal:0,group:.33,key:'4'},
 largeGroupHeal:{name:'Group heal 66%',price:200,heal:0,group:.66,key:'5'},
 rage:{name:'Rage scroll',price:1000,heal:0,group:0,key:'6'},
} as const;
export type Consumable=keyof typeof CONSUMABLES;
export type Supplies=Record<Consumable,number>;
export const STARTING_SUPPLIES:Readonly<Supplies>=Object.freeze({smallPotion:5,mediumPotion:2,largePotion:1,smallGroupHeal:4,largeGroupHeal:2,rage:1});
export const EMPTY_SUPPLIES:Readonly<Supplies>=Object.freeze({smallPotion:0,mediumPotion:0,largePotion:0,smallGroupHeal:0,largeGroupHeal:0,rage:0});
export function isConsumable(key:string):key is Consumable{return Object.hasOwn(CONSUMABLES,key);}
export function validateSupplies(value:unknown):asserts value is Supplies{
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length!==6||Object.keys(CONSUMABLES).some(key=>!Object.hasOwn(value,key)||!Number.isSafeInteger((value as Supplies)[key as Consumable])||(value as Supplies)[key as Consumable]<0||(value as Supplies)[key as Consumable]>1e6))throw new Error('Invalid consumable save.');
}
/** Old alpha saves had no supplies; importing them must not grant free stock. */
export function supplies(owner:{supplies?:Supplies}):Supplies{return owner.supplies??=( {...EMPTY_SUPPLIES});}
export type Healable={key:string;team:number;hp:number;max:number};
/** Intentional repair: large potions use their own stock. Healing bypasses the
 * unused mana bookkeeping; AVM1 Less2/Not does not impose a missing-mana gate.
 * The original button still spends stock at full HP; group heals never revive. */
export function consume(owner:{supplies?:Supplies},key:Consumable,fighters:Healable[]):boolean{
 if(!isConsumable(key))return false;
 const hero=fighters.find(f=>f.key==='hero'&&f.team===0&&f.hp>0);
 const stock=supplies(owner);if(!hero||stock[key]<=0)return false;
 stock[key]--;
 const effect=CONSUMABLES[key];
 for(const f of fighters){if(f.hp<=0||f.team!==0||!effect.group&&f!==hero)continue;f.hp=Math.min(f.max,f.hp+(effect.group?Math.round(f.max*effect.group):effect.heal));}
 return true;
}
