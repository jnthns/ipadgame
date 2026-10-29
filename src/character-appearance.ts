import original from './original-data.json';
import type {Hero,Item,Nation} from './model';
import {EQUIPMENT_KINDS,type EquipmentKind} from './character-equipment';
export {EQUIPMENT_KINDS,type EquipmentKind} from './character-equipment';
import {equipmentArt,type EquipmentArtId} from './equipment-art';
export {EQUIPMENT_ARTS,EQUIPMENT_VARIANTS,type EquipmentArtId} from './equipment-art';

/** Art metadata only. Nothing here changes a recovered unit, item, or battle rule. */
export type CharacterSheetId='heroes'|'viz'|'ger'|'rus'|'jap'|'rog';
export type CharacterSheet={key:string;filename:string;columns:number;rows:number};
export const CHARACTER_SHEETS:Readonly<Record<CharacterSheetId,CharacterSheet>>=Object.freeze({
  heroes:{key:'identity-heroes',filename:'heroes.webp',columns:4,rows:2},
  viz:{key:'identity-viz',filename:'troop-viz.webp',columns:4,rows:5},
  ger:{key:'identity-ger',filename:'troop-ger.webp',columns:4,rows:5},
  rus:{key:'identity-rus',filename:'troop-rus.webp',columns:4,rows:4},
  jap:{key:'identity-jap',filename:'troop-jap.webp',columns:4,rows:5},
  rog:{key:'identity-rog',filename:'troop-rog.webp',columns:3,rows:2},
});

export const NATION_APPEARANCES:Readonly<Record<Nation,{label:string;inspiration:string;palette:string}>>=Object.freeze({
  Viz:{label:'Southern lands',inspiration:'Byzantine and late Roman inspired tunics, scale and lamellar armor, cheek-piece helmets and imperial cavalry.',palette:'ochre, ivory, bronze and plum'},
  Ger:{label:'Western lands',inspiration:'Medieval Central European inspired tunics, mail, coifs, enclosed helmets and progressively heavier plate.',palette:'slate blue, steel, russet and cream'},
  Rus:{label:'Forest lands',inspiration:'Medieval Rus inspired belted wool coats, leather, mail and pointed helmets; no horned helmets.',palette:'forest green, burgundy, dark leather and silver'},
  Jap:{label:'Far East',inspiration:'Japanese inspired wrapped robes, practical shinobi clothing and laced lacquered samurai armor with distinct helmets.',palette:'indigo, muted red, ivory and lacquered gold'},
  Rog:{label:'Rogues',inspiration:'Road outlaws in patched travel clothes and mismatched salvaged regional armor.',palette:'dusty brown, charcoal, faded green and rust'},
});

export type CharacterAppearance={
  id:string;name:string;kind:'hero'|'troop';nation:Nation;role:string;
  sheet:CharacterSheet;frame:{column:number;row:number;columns:number;rows:number};
  /** Final padded standalone cutouts. Their entire canvas must be contained, never covered. */
  imagePath:string;imageURL:string;portraitURL:string;
  description:string;alt:string;armor:string|null;helmet:string|null;mounted:boolean;
};

const recovered=original as unknown as {heroes:{MAIN_HERO:Hero}[];units:Record<string,Hero>};

/** New remaster visages, not invented claims about missing original biographies. */
const HERO_VISAGES:readonly {id:string;role:string;description:string}[]=[
  {id:'hero-karl',role:'Morningstar guardian',description:'A broad-faced, stocky western guardian with short chestnut hair, a short brown beard and a blue-gray tunic. Karl carries a spiked morningstar and small buckler.'},
  {id:'hero-niora',role:'Staff adept',description:'A lean Japanese-inspired staff adept with warm brown eyes, black hair in a high bun and ivory-and-red travel robes. Niora begins with an apprentice staff and a hunter bow.'},
  {id:'hero-olga',role:'Forest archer',description:'A strong Rus-inspired forest archer with an auburn braid, a steady gaze and a green wool tunic. Olga begins with a guard bow and a forged two-handed sword.'},
  {id:'hero-vseslav',role:'Axe warrior',description:'A burly Rus-inspired warrior with a square jaw, thick dark beard, dark leather coat and leather cap. Vseslav carries a peasant two-handed axe and a small throwing axe.'},
  {id:'hero-edgar',role:'Imperial swordsman',description:'A young southern swordsman with an olive complexion, wavy dark hair, determined brows and a cream-and-ochre tunic. Edgar begins with an iron two-handed sword and a long bow.'},
  {id:'hero-elizabth',role:'Hammer warrior',description:'An athletic western warrior with short honey-blonde hair, squared, determined features and a russet-and-slate travel tunic. Elizabth begins with a two-handed battle hammer and steel throwing knives.'},
  {id:'hero-selena',role:'Crossbow scout',description:'A southern scout with an olive complexion, a dark curly bob, perceptive wide eyes and a saffron-and-plum light tunic. Selena begins with a light crossbow and a knife.'},
  {id:'hero-sieg',role:'Shinobi swordsman',description:'A lean Japanese-inspired shinobi with sharp eyes, straight black hair tied back and deep indigo-and-red travel clothes. Sieg begins with a short ninja-to and shuriken.'},
];

/** Source insertion order is also the order used by the generated source sheets. */
const TROOP_DESIGNS:Readonly<Record<string,{role:string;description:string}>>={
  MeleeViz1:{role:'caravan guard',description:'A practical southern caravan guard in a belted ivory travel tunic, bronze trim and simple boots.'},
  MeleeViz2:{role:'town guard',description:'A southern town guard in bronze leather armor and an open cheek-piece helmet.'},
  MeleeViz3:{role:'line infantry',description:'Southern line infantry in scale-like phalax armor, ochre cloth and a light cheek-piece helmet.'},
  MeleeViz4:{role:'legionary',description:'An imperial legionary with a crested cavalry-style helmet, layered phalax armor and an ivory skirt.'},
  MeleeViz5:{role:'moon warrior',description:'An elite southern warrior in bright centurion armor, plum cloth and a distinct uncovered face.'},
  MeleeViz6:{role:'light cavalry',description:'A southern cavalryman in light phalax armor and a light cheek-piece helmet, with riding boots.'},
  MeleeViz7:{role:'blademaster',description:'A southern master duelist in bronze leather armor and an ornate chivalry helmet.'},
  MeleeViz8:{role:'golden cavalry',description:'An imperial elite rider in shining gilt armor and a tall leader helmet with rich plum cloth.'},
  MeleeViz9:{role:'assassin',description:'A southern assassin in a low hood, bronze leather protection and quiet plum travel layers.'},
  RangedViz9:{role:'silent crossbowman',description:'A southern covert marksman in a charcoal hood, bronze leather armor and muted ochre cloth.'},
  RangedViz1:{role:'bowman',description:'A lightly dressed southern bowman with an ivory tunic, ochre sash and exposed dark hair.'},
  RangedViz2:{role:'crossbowman',description:'A southern crossbowman wearing a leather vest over an ivory tunic, with an uncovered head.'},
  RangedViz3:{role:'elite archer',description:'An imperial elite archer in bronze leather armor and a light cheek-piece helmet.'},
  RangedViz4:{role:'crossbow sniper',description:'A southern sniper in phalax armor, ochre cloth and a light imperial helmet.'},
  RangedViz5:{role:'elite crossbow sniper',description:'A veteran southern sniper with reinforced phalax armor, a polished light helmet and plum accents.'},
  RangedViz6:{role:'mounted archer',description:'An imperial mounted archer in light phalax armor, a cheek-piece helmet and riding boots.'},
  RangedViz7:{role:'oil thrower',description:'A southern oil thrower in a belted work tunic, a protective leather apron and practical wrapped sleeves.'},
  RangedViz8:{role:'Greek-fire thrower',description:'An imperial fire specialist with a plum work coat, brass belt fittings and an uncovered, intent face.'},
  MeleeGer1:{role:'acolyte',description:'A western acolyte in a plain belted slate-and-cream tunic, with an uncovered youthful face.'},
  MeleeGer2:{role:'priest',description:'A western battle priest in a long cream tunic with slate-blue trim and a simple cowl.'},
  MeleeGer3:{role:'maceman',description:'A western maceman in footman armor and a simple steel footman helmet over slate cloth.'},
  MeleeGer4:{role:'town guard',description:'A western town guard in long chainmail and a steel footman helmet, with russet cloth accents.'},
  MeleeGer5:{role:'footman',description:'A western footman in practical plate-and-mail armor and a simple footman helmet.'},
  MeleeGer6:{role:'grey infantry',description:'A western veteran in long grey mail, a steel footman helmet and a pale slate surcoat.'},
  MeleeGer7:{role:'elite infantry',description:'Elite western infantry in crusader chainmail and a heavier knight helmet with a cream surcoat.'},
  MeleeGer8:{role:'paladin',description:'A western paladin in polished full plate, a knight helmet and bright ivory-and-slate cloth.'},
  MeleeGer9:{role:'heavy maceman',description:'A heavy western maceman in broad full plate, a knight helmet and a dark slate tabard.'},
  MeleeGer10:{role:'knight',description:'A western mounted knight in polished full plate and a knight helmet, with armored riding legs.'},
  MeleeGer11:{role:'crusader',description:'An elite western mounted crusader in ornate redeemer full plate and an enclosed crusader helmet.'},
  MeleeGer12:{role:'macemaster',description:'A western master of paired maces in crusader chainmail, a knight helmet and a slate half-cloak.'},
  RangedGer1:{role:'hunter',description:'A western hunter in a plain russet travel tunic and sturdy boots, with an uncovered head.'},
  RangedGer2:{role:'castle defender',description:'A western castle crossbowman in a slate-blue tunic, a cream scarf and an uncovered face.'},
  RangedGer3:{role:'armored bowman',description:'A western armored bowman in footman armor and a steel footman helmet with slate cloth.'},
  RangedGer4:{role:'castle keeper',description:'A western veteran crossbowman in long chainmail and a footman helmet, with a dark russet surcoat.'},
  RangedGer5:{role:'recon scout',description:'A light western scout in close-fitting slate-and-russet travel clothes, with an uncovered head.'},
  RangedGer6:{role:'mounted recon scout',description:'A veteran western mounted scout in fitted charcoal-and-slate travel clothes and riding boots.'},
  RangedGer7:{role:'mounted inquisitor',description:'A western mounted inquisitor in crusader chainmail and a knight helmet with a cream-and-russet cloak.'},
  MeleeRus1:{role:'militia',description:'A Rus militia fighter in a belted burgundy wool tunic, wrapped trousers and simple boots.'},
  MeleeRus2:{role:'militia commander',description:'A Rus mounted militia commander in a green belted wool coat, a leather cap and riding boots.'},
  MeleeRus3:{role:'warrior',description:'A Rus warrior in a dark leather coat and leather helmet over burgundy cloth.'},
  MeleeRus4:{role:'veteran warrior',description:'A Rus veteran in short chainmail and a pointed guardian helmet over a green wool coat.'},
  MeleeRus5:{role:'elite warrior',description:'An elite Rus warrior in reinforced warrior chainmail and a pointed guardian helmet with burgundy cloth.'},
  MeleeRus6:{role:'axemaster',description:'A Rus paired-axe expert in short chainmail and a pointed guardian helmet with a dark green sash.'},
  MeleeRus7:{role:'berserker',description:'A powerful Rus berserker in the game’s guardian full plate and a pointed hero helmet, without fantasy horns.'},
  MeleeRus8:{role:'light rider',description:'A Rus light rider in warrior chainmail and a pointed guardian helmet, with tall leather boots.'},
  MeleeRus9:{role:'elite mounted guard',description:'An elite Rus mounted guard in guardian full plate and a tall pointed hero helmet with burgundy trim.'},
  MeleeRus10:{role:'great mounted hero',description:'A legendary Rus rider in ornate hero full plate and a gilt pointed hero helmet with a rich green coat.'},
  RangedRus1:{role:'forest guard',description:'A Rus forest archer in a belted green wool coat and soft boots, with an uncovered head.'},
  RangedRus2:{role:'forest keeper',description:'A veteran Rus forest archer in a deep green belted coat, burgundy scarf and an uncovered mature face.'},
  RangedRus3:{role:'crossbow master',description:'A Rus master crossbowman in hard leather armor and a leather cap over burgundy wool.'},
  RangedRus4:{role:'axe thrower',description:'A Rus axe thrower in hard leather armor and a leather cap, with rolled green sleeves.'},
  RangedRus5:{role:'elite axe thrower',description:'An elite Rus axe thrower in warrior chainmail and a pointed guardian helmet with green-and-gold trim.'},
  RangedRus6:{role:'mounted elder',description:'A Rus mounted elder with a mature face, dark leather armor and a green wool cloak, without a helmet.'},
  MeleeJap1:{role:'unarmed martial artist',description:'A Japanese-inspired unarmed martial artist in a wrapped kimono and cloth belt. The original class name Taekwon is retained.'},
  MeleeJap2:{role:'staff apprentice',description:'A Japanese-inspired staff apprentice in a simple ivory kimono, red sash and practical sandals.'},
  MeleeJap3:{role:'senior staff apprentice',description:'A Japanese-inspired senior staff apprentice in a reinforced kimono, red bandana and indigo sash.'},
  MeleeJap4:{role:'naginata guard',description:'A Japanese-inspired shogun guard in fitted indigo ninja armor and a red bandana, designed for a naginata.'},
  MeleeJap5:{role:'elite naginata guard',description:'An elite Japanese-inspired shogun guard in gold-trimmed ninja armor and a low indigo hood.'},
  MeleeJap6:{role:'ninja',description:'A Japanese-inspired ninja in close-fitting indigo cloth armor and a red bandana, without European plate.'},
  MeleeJap7:{role:'elite ninja',description:'An elite Japanese-inspired ninja in dark cloth armor with restrained gold trim and a low hood.'},
  MeleeJap8:{role:'master ninja',description:'A master Japanese-inspired ninja in gold-trimmed indigo armor and a shadowed hood, with a distinct mature gaze.'},
  MeleeJap9:{role:'ronin',description:'A Japanese-inspired wandering ronin in worn indigo ninja armor and a travel hood with muted red cloth.'},
  MeleeJap10:{role:'samurai',description:'A Japanese-inspired samurai in gold-lacquered laced plate armor, a layered skirt and an indigo head covering.'},
  MeleeJap11:{role:'black samurai',description:'A Japanese-inspired black samurai in dark lacquered laced armor, a layered skirt and a distinct samurai mask.'},
  RangedJap1:{role:'shuriken thrower',description:'A Japanese-inspired shuriken thrower in simple indigo travel clothes, with an uncovered head.'},
  RangedJap2:{role:'shuriken master',description:'A Japanese-inspired shuriken master in a wrapped kimono, red sash and uncovered mature face.'},
  RangedJap3:{role:'elite shuriken thrower',description:'An elite Japanese-inspired shuriken thrower in a reinforced kimono and red bandana.'},
  RangedJap4:{role:'black shuriken thrower',description:'A Japanese-inspired covert shuriken thrower in fitted indigo ninja armor and a low dark hood.'},
  RangedJap5:{role:'shadow bowman',description:'A Japanese-inspired shadow archer in fitted indigo ninja armor, a low hood and practical wrapped sleeves.'},
  RangedJap6:{role:'ghost bowman',description:'An elite Japanese-inspired ghost archer in gold-trimmed ninja armor and an indigo hood, with a distinct pale scarf.'},
  MeleeRog1:{role:'shield rogue',description:'A road rogue in mismatched leather armor, a salvaged light helmet and patched riding trousers.'},
  MeleeRog2:{role:'two-handed rogue',description:'A rough road rogue in worn leather armor, a dented light helmet and faded brown riding clothes.'},
  MeleeRog3:{role:'swift rogue',description:'A swift road rogue in patched leather armor, a battered light helmet and a charcoal travel scarf.'},
  RangedRog1:{role:'bow rogue',description:'A road bandit archer in patched leather armor over a faded green tunic, with an uncovered head.'},
  RangedRog2:{role:'crossbow rogue',description:'A road bandit crossbowman in mismatched leather armor over russet cloth, with an uncovered head.'},
  RangedRog3:{role:'throwing rogue',description:'A road rogue in a patched brown tunic, charcoal scarf and dusty travel clothes, with an uncovered head.'},
};

// Public paths stay relative to the document so project Pages and local previews
// share the same URLs without importing a duplicate copy of every body image.
const imageURLFor=(id:string)=>new URL(`art/remastered/identities/characters/${id}.webp`,typeof document==='undefined'?'https://feudalism.invalid/':document.baseURI).href;

function makeAppearance(hero:Readonly<Hero>,id:string,kind:'hero'|'troop',nation:Nation,sheetId:CharacterSheetId,index:number,design:{role:string;description:string}):CharacterAppearance{
  const sheet=CHARACTER_SHEETS[sheetId],imageURL=imageURLFor(id);
  return Object.freeze({id,name:hero.NAME,kind,nation,role:design.role,sheet,
    frame:{column:index%sheet.columns,row:Math.floor(index/sheet.columns),columns:sheet.columns,rows:sheet.rows},
    imagePath:`art/remastered/identities/characters/${id}.webp`,imageURL,portraitURL:imageURL,
    description:design.description,
    alt:`${hero.NAME}, ${design.role}. ${design.description}`,
    armor:hero.ARMOR?.NAME??null,helmet:hero.HELMET?.NAME??null,mounted:!!hero.HORSE});
}

export const HERO_APPEARANCES:Readonly<Record<string,CharacterAppearance>>=Object.freeze(Object.fromEntries(
  recovered.heroes.map(({MAIN_HERO:hero},index)=>[hero.NAME,makeAppearance(hero,HERO_VISAGES[index].id,'hero',hero.NATION,'heroes',index,HERO_VISAGES[index])])
));
const nationCounters:Partial<Record<Nation,number>>={};
export const TROOP_APPEARANCES:Readonly<Record<string,CharacterAppearance>>=Object.freeze(Object.fromEntries(
  Object.entries(recovered.units).map(([key,hero])=>{
    // Recovered sampled rogues have NATION Viz; the class key defines their identity.
    const nation=(key.match(/(?:Melee|Ranged)(Viz|Ger|Rus|Jap|Rog)/)?.[1]??hero.NATION) as Nation;
    const index=nationCounters[nation]??0;nationCounters[nation]=index+1;
    return [key,makeAppearance(hero,`unit-${key}`,'troop',nation,nation.toLowerCase() as CharacterSheetId,index,TROOP_DESIGNS[key])];
  })
));
export const ALL_CHARACTER_APPEARANCES:readonly CharacterAppearance[]=Object.freeze([...Object.values(HERO_APPEARANCES),...Object.values(TROOP_APPEARANCES)]);

/** Known keys win over names. Roaming constructors retain class names, even when their gender/equipment is randomized. */
export function characterAppearance(hero:Readonly<Hero>,key?:string):CharacterAppearance{
  if(key&&Object.hasOwn(TROOP_APPEARANCES,key))return TROOP_APPEARANCES[key];
  if(Object.hasOwn(HERO_APPEARANCES,hero.NAME))return HERO_APPEARANCES[hero.NAME];
  const matchingName=Object.entries(recovered.units).find(([,unit])=>unit.NAME===hero.NAME&&unit.NATION===hero.NATION)
    ??Object.entries(recovered.units).find(([,unit])=>unit.NAME===hero.NAME);
  if(matchingName)return TROOP_APPEARANCES[matchingName[0]];
  // Saved or generated custom soldiers still retain a relevant regional costume.
  const role=weaponAppearance(hero.WEAPON_PRI).kind;
  const fallback=Object.entries(recovered.units).find(([candidate,unit])=>!candidate.includes('Rog')&&unit.NATION===hero.NATION&&weaponAppearance(unit.WEAPON_PRI).kind===role)
    ??Object.entries(recovered.units).find(([candidate,unit])=>!candidate.includes('Rog')&&unit.NATION===hero.NATION);
  return TROOP_APPEARANCES[fallback?.[0]??'MeleeRog3'];
}

export type WeaponKind=EquipmentKind|'fists';
export type WeaponAppearance={kind:WeaponKind;artId:EquipmentArtId|null;label:string;assetFrame:number|null;twoHanded:boolean;item:Readonly<Item>|null};

/** Names select art only when the recovered weapon type also agrees. */
const NAMED_EQUIPMENT_ART:Readonly<Record<string,readonly [type:string,id:EquipmentArtId]>>=Object.freeze({
  'Spiked Staff':['Staff','spikedStaff'],
  'Golden Naginata':['Staff','goldNaginata'],
  'Holy Spear':['Spear','holySpear'],
  'Darkness':['Katana','blackKatana'],
  'Holy Katana':['Katana','goldKatana'],
  'Holy Ninja-To':['NinjaTo','holyNinjato'],
  'Black Spirits':['Throwing','blackShuriken'],
  'Silver Shuriken':['Throwing','silverShuriken'],
  'Shining Shuriken':['Throwing','silverShuriken'],
  'Forged Crossbow':['Crossbow','forgedCrossbow'],
  'Elite Crossbow':['Crossbow','eliteCrossbow'],
  'Holy Bow':['Bow','holyBow'],
  'Samurai Bow':['Bow','samuraiBow'],
  'Long Axe':['OnehandedAxe','longAxe'],
  'Guard Axe':['OnehandedAxe','longAxe'],
  'Holy Axe':['OnehandedAxe','holyAxe'],
  'Elite Twohanded Axe':['TwohandedAxe','eliteGreataxe'],
  'Peacekeeper':['OnehandedMace','peacekeeperMace'],
  'Starbringer':['OnehandedSword','starbringerSword'],
  'Sinners':['Throwing','silverThrowingKnife'],
  'Holy Touches':['Throwing','silverThrowingKnife'],
  'Iron Buckler':['Shield','ironBuckler'],
  'Footman Shield':['Shield','kiteShield'],
  'Knight Shield':['Shield','kiteShield'],
  'Infantry Shield':['Shield','kiteShield'],
});

/** Resolve the actual equipped item, including alternate hands; a sword is never a catch-all. */
export function weaponAppearance(item:Readonly<Item>|null|undefined):WeaponAppearance{
  const type=item?.TYPE??'Fists',name=item?.NAME??'Unarmed',lower=name.toLowerCase();
  let kind:WeaponKind='fists';
  if(type==='Staff')kind=lower.includes('naginata')?'naginata':'staff';
  else if(type==='OnehandedMace'||type==='TwohandedMace'){
    kind=/morningstar|deadly spikes|holy star|hedgehog/.test(lower)?'morningstar':/hammer/.test(lower)?'hammer':'mace';
  }else if(type==='OnehandedSword')kind='sword';
  else if(type==='TwohandedSword')kind='greatsword';
  else if(type==='Katana')kind='katana';
  else if(type==='NinjaTo')kind='ninjato';
  else if(type==='OnehandedAxe')kind='axe';
  else if(type==='TwohandedAxe')kind='greataxe';
  else if(type==='Bow')kind='bow';
  else if(type==='Crossbow')kind='crossbow';
  else if(type==='Spear')kind='spear';
  else if(type==='Dagger')kind='dagger';
  else if(type==='Shield')kind='shield';
  else if(type==='Throwing'){
    kind=item?.NATION==='Jap'||/shuriken|black spirits/.test(lower)?'shuriken'
      :item?.NATION==='Rus'||/axe|tomahawk|golden punches/.test(lower)?'throwingAxe'
      :item?.NATION==='Viz'||/oil|greek fire/.test(lower)?'fire':'throwingKnife';
  }
  const assetFrame=kind==='fists'?null:EQUIPMENT_KINDS.indexOf(kind);
  const named=Object.hasOwn(NAMED_EQUIPMENT_ART,name)?NAMED_EQUIPMENT_ART[name]:undefined;
  const artId=kind==='fists'?null:equipmentArt(kind,named?.[0]===type?named[1]:undefined)?.id??kind;
  const twoHanded=item?.twohanded??['TwohandedSword','TwohandedAxe','TwohandedMace','Staff','Katana','Spear','Throwing','Bow','Dagger','Fists','Crossbow'].includes(type);
  return {kind,artId,label:name,assetFrame,twoHanded,item:item??null};
}

export function equippedAppearance(hero:Readonly<Hero>,activeItem:Readonly<Item>|null=hero.WEAPON_PRI,secondaryItem:Readonly<Item>|null=hero.WEAPON_SEC){
  return {primary:weaponAppearance(activeItem),secondary:weaponAppearance(secondaryItem)};
}
