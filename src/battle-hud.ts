import type {Battle} from './model';
import type {ArmyAbilityKind} from './army-abilities';
import {icon} from './interface-icons';
import {characterPortraitMarkup} from './character-portraits';

const esc=(value:unknown)=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export interface BattleHUDOptions {
  title:string;
  heroName:string;
  heroLevel:number;
  /** Trusted markup from the shared identity/equipment renderer. */
  heroPortraitHTML:string;
  /** Trusted markup produced by the existing supplyButtons renderer. */
  supplyButtonsHTML:string;
  paused?:boolean;
  speed?:number;
  control?:'hero'|'army';
}
export interface BattleHUDState {
  paused:boolean;
  speed:number;
  control:string;
  armyAbilityTarget?:ArmyAbilityKind|null;
  order?:'hold'|'charge'|'move';
}

/** Action IDs bind to the existing controller; this module never issues commands. */
export function battleMarkup(options:BattleHUDOptions):string {
  const {title,heroName,heroLevel,heroPortraitHTML,supplyButtonsHTML,paused=false,speed=1,control='hero'}=options;
  return `<section class="battle-presentation" aria-label="Battlefield">
    <div class="battle-topline"><div><div class="eyebrow">The field of battle</div><h2>${esc(title)}</h2></div><div class="battle-top-actions"><span class="battle-clock" id="battle-clock" aria-label="Battle elapsed time">0:00</span><button id="speed" aria-label="Change battle speed">${speed}× Speed</button><button id="pause" aria-pressed="${paused}">${icon('pause')}${paused?'Resume':'Pause'}</button><button id="retreat" class="ghost danger">Withdraw</button></div></div>
    <div class="battle-layout">
      <div class="battle-field-column">
        <div class="battle-arena-frame">
          <div class="battle-field-summary"><span><i class="team-dot allied"></i>Your company <b id="allied-field-count">—</b></span><span id="battle-count">Taking the field</span><span>Enemy <b id="enemy-field-count">—</b><i class="team-dot enemy"></i></span></div>
          <div class="battle-canvas-shell"><div id="game" class="canvas-wrap" role="img" aria-label="Battlefield. Tap ground to move the selected hero or army, or use the direction pad."></div><div class="battle-pause-banner" id="battle-pause-banner" ${paused?'':'hidden'}>Battle paused</div><div class="battle-target-banner" id="battle-target-banner" hidden>Choose an ability target</div></div>
          <div class="battle-ground-hint"><span><i class="hero-dot"></i>Hero</span><span><i class="team-dot allied"></i>Allies</span><span><i class="team-dot enemy"></i>Enemies</span><span class="battle-ground-instruction">Tap ground to give a destination</span></div>
        </div>
        <div class="battle-manual-bar manual-controls" aria-label="Manual hero controls">
          <div class="hero-dpad" role="group" aria-label="Move hero"><button class="move-up" data-hero-action="up" aria-label="Move up">↑</button><button class="move-left" data-hero-action="left" aria-label="Move left">←</button><span class="move-label" aria-hidden="true">Move</span><button class="move-right" data-hero-action="right" aria-label="Move right">→</button><button class="move-down" data-hero-action="down" aria-label="Move down">↓</button></div>
          <div class="hero-actions"><button class="primary battle-attack" data-hero-action="attack" aria-label="Attack with hero">${icon('swords')}<span>Attack<small>Hold to strike</small></span></button><button class="battle-switch" data-hero-action="switchWeapon" aria-label="Switch hero weapon">${icon('arrow')}<span>Switch weapon<small>Primary / secondary</small></span></button></div>
          <div class="battle-input-copy"><b>Your hero fights on command.</b><span>Hold a direction and Attack together.</span><details class="battle-keyboard-help"><summary>Keyboard controls</summary><p>WASD / arrows: move · Space / 0: attack · Shift: switch · P: pause · 1–6: supplies</p></details></div>
        </div>
      </div>
      <aside class="battle-command-rail" aria-label="Battle commands">
        <section class="battle-hero-card"><div class="battle-hero-heading"><div id="battle-hero-identity">${heroPortraitHTML}</div><div><span class="eyebrow">Your hero · Level ${heroLevel}</span><h3>${esc(heroName)}</h3><span id="hero-equipment-badge" class="battle-equipment-badge">Taking position</span></div></div><div class="battle-health-heading"><span>Health</span><b id="hero-health-text">— / —</b></div><div id="hero-health-bar" class="battle-health-bar" role="progressbar" aria-label="Hero health" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100"><i></i></div><p id="hero-hp" class="battle-weapon-label">Preparing equipment</p></section>
        <section class="battle-order-card"><div class="battle-card-heading"><span class="eyebrow">Field command</span><span id="battle-command-status">Hero selected</span></div><div class="battle-control-switch" role="group" aria-label="Select command target"><button data-control="hero" class="${control==='hero'?'active':''}" aria-pressed="${control==='hero'}">${icon('hero')}Hero</button><button data-control="army" class="${control==='army'?'active':''}" aria-pressed="${control==='army'}">${icon('banner')}Army</button></div><div class="battle-troop-orders" role="group" aria-label="Troop orders"><button id="hold" aria-pressed="false">${icon('shield')}Hold</button><button id="charge" class="primary" aria-pressed="true">${icon('swords')}Charge</button></div><dl class="battle-roster-counts"><div><dt>Soldiers on field</dt><dd id="soldiers-field-count">—</dd></div><div><dt>Your reserves</dt><dd id="allied-reserve-count">—</dd></div><div><dt>Enemy reserves</dt><dd id="enemy-reserve-count">—</dd></div></dl><p class="battle-hero-separate">Hero shown separately from soldiers.</p></section>
        <details class="battle-supply-drawer"><summary>${icon('bag')}Supplies & abilities</summary><div class="battle-supplies" role="group" aria-label="Potions and scrolls">${supplyButtonsHTML}<button data-army-ability="shower" aria-pressed="false">Arrow shower</button><button data-army-ability="wall" aria-pressed="false">Arrow wall</button></div><p>Reserve archers power arrow abilities. Their arrows can hit allies.</p></details>
      </aside>
    </div>
    <p class="battle-state-line" id="battle-state-line" role="status">Lead your hero. Direct your company.</p>
  </section>`;
}

const write=(root:ParentNode,selector:string,value:string)=>{const el=root.querySelector<HTMLElement>(selector);if(el&&el.textContent!==value)el.textContent=value;};
/** Reads current model values only; no time, HP, roster, RNG or save is changed. */
export function updateBattleHUD(battle:Pick<Battle,'fighters'|'reserves'|'tick'|'rageCommands'|'result'>,state:BattleHUDState,root:ParentNode=document):void {
  root.querySelector('.battle-presentation')?.setAttribute('data-simulation-tick',String(battle.tick));
  const hero=battle.fighters.find(f=>f.team===0&&f.key==='hero');
  const portrait=root.querySelector<HTMLElement>('#battle-hero-identity');
  if(hero&&portrait){
    const signature=JSON.stringify([hero.hero.NAME,hero.weaponItem.TYPE,hero.weaponItem.NAME,hero.secondaryItem?.TYPE,hero.secondaryItem?.NAME]);
    if(portrait.dataset.loadout!==signature){portrait.innerHTML=characterPortraitMarkup(hero.hero,undefined,{size:'hud',weapon:hero.weaponItem,secondary:hero.secondaryItem});portrait.dataset.loadout=signature;}
  }
  const allied=battle.fighters.filter(f=>f.team===0&&f.hp>0),enemy=battle.fighters.filter(f=>f.team===1&&f.hp>0);
  const activeTroops=allied.filter(f=>f.key!=='hero'),soldiers=activeTroops.length;
  const order=state.order??(activeTroops.length&&activeTroops.every(f=>f.hold)?'hold':activeTroops.some(f=>f.order)?'move':'charge');
  const hp=Math.max(0,Math.round(hero?.hp??0)),max=Math.max(1,Math.round(hero?.max??1));
  const remaining=Math.max(0,Math.min(100,hp/max*100)),seconds=Math.floor(battle.tick/30);
  write(root,'#hero-health-text',`${hp} / ${max}`);
  const health=root.querySelector<HTMLElement>('#hero-health-bar');
  if(health){health.setAttribute('aria-valuemax',String(max));health.setAttribute('aria-valuenow',String(hp));health.setAttribute('aria-valuetext',`${hp} of ${max} health`);health.classList.toggle('critical',remaining<30);const fill=health.querySelector<HTMLElement>('i');if(fill)fill.style.width=`${remaining}%`;}
  write(root,'#battle-clock',`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`);
  write(root,'#battle-count',`${allied.length} allies · ${enemy.length} enemies`);
  write(root,'#allied-field-count',String(allied.length));
  write(root,'#enemy-field-count',String(enemy.length));
  write(root,'#soldiers-field-count',String(soldiers));
  write(root,'#allied-reserve-count',String(battle.reserves[0].length));
  write(root,'#enemy-reserve-count',String(battle.reserves[1].length));
  write(root,'#hero-hp',`${hero?.weaponItem.NAME??'Unarmed'}${battle.rageCommands?' · Rage active':''}`);
  write(root,'#hero-equipment-badge',`${hero?.hero.HORSE?'Mounted':'On foot'} · ${hero?.weapon.range?'Ranged':'Melee'}`);
  const command=state.armyAbilityTarget?'Choose a target':state.control==='army'?'Army selected':'Hero selected';
  write(root,'#battle-command-status',command);
  write(root,'#battle-state-line',battle.result?battle.result==='victory'?'The field is yours.':'Your hero has fallen.':state.paused?'Battle paused. Resume when ready.':state.armyAbilityTarget?`Tap the battlefield to place ${state.armyAbilityTarget==='shower'?'Arrow shower':'Arrow wall'}. Arrows can hit allies.`:state.control==='army'?'Army selected. Tap ground to move your soldiers.':`Hero selected. ${order==='hold'?'Troops are holding position.':'Troops follow their orders.'}`);
  const paused=root.querySelector<HTMLElement>('#battle-pause-banner');if(paused)paused.hidden=!state.paused;
  const targeting=root.querySelector<HTMLElement>('#battle-target-banner');if(targeting){targeting.hidden=!state.armyAbilityTarget;if(state.armyAbilityTarget)targeting.textContent=`Target ${state.armyAbilityTarget==='shower'?'Arrow shower':'Arrow wall'} · tap ground`;}
  root.querySelector('#pause')?.setAttribute('aria-pressed',String(state.paused));
  write(root,'#speed',`${state.speed}× Speed`);
  root.querySelectorAll<HTMLElement>('[data-control]').forEach(el=>{const active=el.dataset.control===state.control;el.classList.toggle('active',active);el.setAttribute('aria-pressed',String(active));});
  root.querySelector('#hold')?.setAttribute('aria-pressed',String(order==='hold'));
  root.querySelector('#charge')?.setAttribute('aria-pressed',String(order==='charge'));
}
