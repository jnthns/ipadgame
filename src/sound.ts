/**
 * Small synthesized sound set. Everything is generated with Web Audio, so it works offline and adds no assets.
 * Purely presentational: nothing here reads or changes game state.
 */
export type Sound='hit'|'crit'|'miss'|'arrow'|'death'|'victory'|'defeat'|'coin'|'levelup'|'recruit'|'click'|'march'|'thunder';

const STORE='feudalism-sound-v1';
let context:AudioContext|null=null,master:GainNode|null=null,noise:AudioBuffer|null=null;
let enabled=(()=>{try{return localStorage.getItem(STORE)!=='off';}catch{return true;}})();
const lastPlayed=new Map<Sound,number>();
// Massed battles produce many events per tick; a short per-sound gap keeps the mix readable.
const MIN_GAP:Partial<Record<Sound,number>>={hit:55,crit:90,miss:120,arrow:70,death:120,thunder:300};

export function soundEnabled(){return enabled;}
export function setSoundEnabled(on:boolean){enabled=on;try{localStorage.setItem(STORE,on?'on':'off');}catch{/* preference only */}if(on)unlockAudio();}

/** iOS only starts audio from a user gesture; call from any tap. */
export function unlockAudio(){
 if(!enabled)return;
 if(!context){const Ctor=window.AudioContext??(window as unknown as {webkitAudioContext?:typeof AudioContext}).webkitAudioContext;if(!Ctor)return;context=new Ctor();master=context.createGain();master.gain.value=.5;master.connect(context.destination);}
 if(context.state==='suspended')void context.resume();
}

function noiseBuffer(ctx:AudioContext){if(noise)return noise;noise=ctx.createBuffer(1,ctx.sampleRate*.4,ctx.sampleRate);const data=noise.getChannelData(0);let seed=7;for(let i=0;i<data.length;i++){seed=(seed*16807)%2147483647;data[i]=seed/1073741823.5-1;}return noise;}

function tone(ctx:AudioContext,at:number,freq:number,length:number,{type='sine' as OscillatorType,gain=.3,slide=0}={}){
 const osc=ctx.createOscillator(),env=ctx.createGain();osc.type=type;osc.frequency.setValueAtTime(freq,at);if(slide)osc.frequency.exponentialRampToValueAtTime(Math.max(30,freq+slide),at+length);
 env.gain.setValueAtTime(0,at);env.gain.linearRampToValueAtTime(gain,at+.01);env.gain.exponentialRampToValueAtTime(.001,at+length);osc.connect(env).connect(master!);osc.start(at);osc.stop(at+length+.02);
}
function burst(ctx:AudioContext,at:number,length:number,{freq=1800,q=1,gain=.4,type='bandpass' as BiquadFilterType}={}){
 const src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),env=ctx.createGain();src.buffer=noiseBuffer(ctx);filter.type=type;filter.frequency.value=freq;filter.Q.value=q;
 env.gain.setValueAtTime(gain,at);env.gain.exponentialRampToValueAtTime(.001,at+length);src.connect(filter).connect(env).connect(master!);src.start(at);src.stop(at+length+.02);
}

export function play(sound:Sound){
 if(!enabled||!context||!master||context.state!=='running')return;
 const now=performance.now(),gap=MIN_GAP[sound]??0;if(gap&&now-(lastPlayed.get(sound)??-1e9)<gap)return;lastPlayed.set(sound,now);
 const ctx=context,t=ctx.currentTime,jitter=1+(Math.random()-.5)*.12;
 switch(sound){
  case 'hit':burst(ctx,t,.09,{freq:2400*jitter,q:2,gain:.35});tone(ctx,t,180*jitter,.08,{type:'triangle',gain:.18,slide:-80});break;
  case 'crit':burst(ctx,t,.14,{freq:3200,q:3,gain:.5});tone(ctx,t,900,.18,{type:'square',gain:.08,slide:-500});tone(ctx,t,140,.16,{type:'triangle',gain:.25,slide:-60});break;
  case 'miss':burst(ctx,t,.12,{freq:900*jitter,q:.7,gain:.12,type:'highpass'});break;
  case 'arrow':burst(ctx,t,.16,{freq:4200*jitter,q:6,gain:.12});break;
  case 'death':tone(ctx,t,220*jitter,.35,{type:'sawtooth',gain:.07,slide:-150});burst(ctx,t,.25,{freq:400,q:.8,gain:.2,type:'lowpass'});break;
  case 'victory':[392,494,587,784].forEach((f,i)=>tone(ctx,t+i*.13,f,i===3?.7:.2,{type:'triangle',gain:.22}));break;
  case 'defeat':[392,349,311,262].forEach((f,i)=>tone(ctx,t+i*.22,f,.4,{type:'triangle',gain:.18}));break;
  case 'coin':tone(ctx,t,988,.08,{type:'square',gain:.07});tone(ctx,t+.07,1319,.25,{type:'square',gain:.07});break;
  case 'levelup':[523,659,784,1047,1319].forEach((f,i)=>tone(ctx,t+i*.08,f,.35,{type:'triangle',gain:.18}));burst(ctx,t+.35,.5,{freq:6000,q:.5,gain:.06,type:'highpass'});break;
  case 'recruit':tone(ctx,t,330,.1,{type:'triangle',gain:.2});tone(ctx,t+.1,440,.25,{type:'triangle',gain:.2});burst(ctx,t,.08,{freq:300,gain:.2,type:'lowpass'});break;
  case 'click':tone(ctx,t,700,.04,{type:'triangle',gain:.08});break;
  case 'thunder':burst(ctx,t,.08,{freq:5000,q:.4,gain:.35,type:'highpass'});burst(ctx,t+.05,.4,{freq:180,q:.6,gain:.65,type:'lowpass'});burst(ctx,t+.25,.4,{freq:110,q:.5,gain:.4,type:'lowpass'});break;
  case 'march':for(let i=0;i<3;i++)burst(ctx,t+i*.11,.07,{freq:250,q:1,gain:.3,type:'lowpass'});break;
 }
}
