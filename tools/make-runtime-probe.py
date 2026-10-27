#!/usr/bin/env python3
"""Add a deterministic trace harness to a research copy; never change source SWF.
Original classes, timelines and frame scripts remain intact. See RUNTIME_REPLAY.md.
"""
import argparse,importlib.util,pathlib,struct,zlib,hashlib
sp=importlib.util.spec_from_file_location('t',pathlib.Path(__file__).with_name('extract-terrain.py'));t=importlib.util.module_from_spec(sp);sp.loader.exec_module(t)
def action(op,p=b''):return bytes([op])+(struct.pack('<H',len(p))+p if op>=128 else b'')
def push(v):
 if isinstance(v,bool):return action(0x96,bytes([5,int(v)]))
 if isinstance(v,int):return action(0x96,b'\x07'+struct.pack('<i',v))
 if isinstance(v,float):return action(0x96,b'\x01'+struct.pack('<f',v))
 return action(0x96,b'\0'+v.encode()+b'\0')
def get(path):
 ps=path.split('.');code=push(ps[0])+action(0x1c)
 for p in ps[1:]:code+=push(p)+action(0x4e)
 return code

def setv(path,value):
 parts=path.split('.')
 return get('.'.join(parts[:-1]))+push(parts[-1])+value+action(0x4f) if len(parts)>1 else push(path)+value+action(0x1d)
def method(path,args=()):
 parent,key=path.rsplit('.',1);return b''.join(reversed(args))+push(len(args))+get(parent)+push(key)+action(0x52)
def function(name,args=()):return b''.join(reversed(args))+push(len(args))+push(name)+action(0x3d)
def new(name,args=()):return b''.join(reversed(args))+push(len(args))+push(name)+action(0x40)
def array(values):return b''.join(reversed(values))+push(len(values))+action(0x42)
def fn(body,params=()):return action(0x9b,b'\0'+struct.pack('<H',len(params))+b''.join(p.encode()+b'\0' for p in params)+struct.pack('<H',len(body)))+body

def if_(condition,yes,no=b''):
 # If skips a false block then jumps past true block.
 return condition+action(0x9d,struct.pack('<h',len(no)+5))+no+action(0x99,struct.pack('<h',len(yes)))+yes

def stmt(code):return code+action(0x17)
def trace(parts):
 code=push('')
 for i,part in enumerate(parts):
  if i:code+=push('|')+action(0x47)
  code+=part+action(0x47)
 return code+action(0x26)

def parse_args():
 parser=argparse.ArgumentParser(description=__doc__)
 parser.add_argument('--frames',type=int,default=300,help='Capture length (1–3600 frames)')
 parser.add_argument('--scenario',choices=['baseline','reinforcement','shower','wall'],default='baseline')
 parser.add_argument('--slots',type=int,default=5,help='Number of hero slots to observe (5–30); extra slots emit SLOT records')
 args=parser.parse_args()
 if not 1 <= args.frames <= 3600: parser.error('--frames must be between 1 and 3600')
 if args.scenario == 'reinforcement': args.slots=30
 if not 5 <= args.slots <= 30: parser.error('--slots must be between 5 and 30')
 return args

def extra_slot_records(slots):
 # Record every additional slot, including undefined ones, so creation and removal
 # can be located without assuming a display-list creation order.
 result=b''
 fields=['team','X','Y','_x','_y','HP','t_bef','t_aft','isBusy','atkAnim','body._currentframe','wpn.TYPE','attacking._name','moveX','moveY','nextX','nextY']
 for i in range(5,slots):
  result+=trace([push('SLOT'),get('_global.__replayFrame'),push(i),get(f'_root.hero{i}')+action(0x44)]+[get(f'_root.hero{i}.'+f) for f in fields])
 return result

def main():
 args=parse_args()
 root=pathlib.Path(__file__).resolve().parent.parent;raw=(root/'reference/feudalism.swf').read_bytes();assert hashlib.sha256(raw).hexdigest()==t.EXPECTED_SWF_SHA256
 # A Park-Miller stream keeps all products exactly representable in AVM1 doubles.
 randbody=setv('_global.__replaySeed',get('_global.__replaySeed')+push(16807)+action(0x0c)+push(2147483647)+action(0x3f))+get('_global.__replaySeed')+push(2147483647)+action(0x0d)+action(0x3e)
 step_seed=setv('_global.__replaySeed',get('_global.__replaySeed')+push(16807)+action(0x0c)+push(2147483647)+action(0x3f))
 dice_value=method('Math.floor',[get('_global.__replaySeed')+push(2147483647)+action(0x0d)+get('n')+action(0x0c)])
 init=trace([push('LENGTH'),push(args.frames)])+setv('_global.__replayStarted',push(True))+setv('_global.__replaySeed',push(1))+setv('Math.random',fn(randbody))+setv('_root.dice',fn(step_seed+dice_value+action(0x3e),['n']))+setv('_root.d',fn(step_seed+dice_value+push(1)+action(0x47)+action(0x3e),['n']))
 init+=setv('_root.dd',fn(step_seed+method('Math.floor',[get('_global.__replaySeed')+push(2147483647)+action(0x0d)+get('n')+push(2)+action(0x0c)+push(1)+action(0x47)+action(0x0c)])+get('n')+action(0x0b)+action(0x3e),['n']))
 init+=setv('_global.MAIN_HERO',new('Unit',[push('Melee'),push('Viz'),push(1)]))+setv('_global.MAIN_HERO.LEVEL',push(1))
 init+=setv('_global.FRIENDS',array([new('Unit',[push('Melee'),push('Viz'),push(1)]),new('Unit',[push('Ranged'),push('Viz'),push(1)])]))
 init+=setv('_global.ENEMIES',array([new('Unit',[push('Melee'),push('Viz'),push(1)]),new('Unit',[push('Ranged'),push('Viz'),push(1)])]))
 if args.scenario in ('shower','wall'):
  init+=trace([push('SCENARIO'),push(args.scenario)])
 if args.scenario=='reinforcement':
  init+=setv('_global.FRIENDS',array([new('Unit',[push('Melee'),push('Viz'),push(1)]) for _ in range(12)]))
  init+=setv('_global.ENEMIES',array([new('Unit',[push('Melee'),push('Viz'),push(1)]) for _ in range(12)]))
  init+=trace([push('SCENARIO'),push('reinforcement')])
 for k,v in [('CURR_TOWN','Trapezus'),('BATTLE_TYPE','QUEST'),('BATTLE_MAP',1),('times',0),('__replayFrame',0),('GOLD',100),('POTION_HealSmall',5),('POTION_HealMedium',2),('POTION_HealBig',1),('SCROLL_AllHealSmall',4),('SCROLL_AllHealBig',2),('SCROLL_Rage',1)]:init+=setv('_global.'+k,push(v))
 init+=stmt(method('_root.loadMap',[push(1)]))+stmt(method('_root.gotoAndStop',[push(5)]))+trace([push('BOOT'),get('_global.__replaySeed'),get('_root._currentframe'),get('Unit')+action(0x44),get('_root.loadMap')+action(0x44),get('loadMap')+action(0x44),get('_global.MAIN_HERO.NAME'),get('_global.HERO'),get('_root.WhatToLoad')])
 record=setv('_root.__probeReadout.text',get('_global.__replayFrame'))+setv('_global.__replayFrame',get('_global.__replayFrame')+push(1)+action(0x47))+trace([push('FRAME'),get('_global.__replayFrame'),get('_global.times'),get('_global.__replaySeed'),get('_root._currentframe')])
 for i in range(5):
  fields=['team','X','Y','_x','_y','HP','t_bef','t_aft','isBusy','atkAnim','body._currentframe','wpn.TYPE','attacking._name','moveX','moveY','nextX','nextY']
  record+=trace([push('UNIT'),get('_global.__replayFrame'),push(i)]+[get(f'_root.hero{i}.'+f) for f in fields])
 record+=extra_slot_records(args.slots)
 if args.scenario in ('shower','wall'):
  effect='addArrowShower' if args.scenario=='shower' else 'addArrowWall'
  cast=stmt(method('_root.'+effect,[get('_root.hero1.X'),get('_root.hero1.Y'),push(100),push(False)]))+trace([push('CAST'),push(args.scenario),get('_global.__replayFrame'),get('_root.hero1.X'),get('_root.hero1.Y')])
  record+=if_(get('_global.__replayFrame')+push(150)+action(0x49),cast)
 finish=trace([push('DONE'),get('_global.__replayFrame')])
 record+=if_(get('_global.__replayFrame')+push(args.frames)+action(0x49),finish)
 wait=trace([push('WAIT'),get('_root._currentframe'),get('_root._framesloaded'),method('_root.getBytesLoaded'),method('_root.getBytesTotal')])
 ready=get('_root._framesloaded')+push(4)+action(0x67)+get('_root._currentframe')+push(2)+action(0x67)+action(0x10)
 body=if_(get('_global.__replayStarted'),record,if_(ready,init,wait))

 code=setv('_global.__probeWarmup',push(0))+stmt(method('_root.createTextField',[push('__probeReadout'),push(30000),push(0),push(0),push(780),push(30)]))+setv('_root.__probeReadout.text',push('Runtime probe hook installed'))+stmt(method('_root.createEmptyMovieClip',[push('__runtimeProbe'),push(29999)]))+setv('_root.__runtimeProbe.onEnterFrame',fn(body))+trace([push('HOOK'),get('_root._currentframe')])+b'\0'
 data=raw[:8]+zlib.decompress(raw[8:]) if raw[:3]==b'CWS' else raw;tags,_=t.swf_tags(raw)
 def tag(code,payload):return struct.pack('<H',code<<6|63)+struct.pack('<I',len(payload))+payload if len(payload)>=63 else struct.pack('<H',code<<6|len(payload))+payload
 rebuilt=[];hooked=False;tracker_removed=False
 for kind,payload,offset in tags:
  if kind==12 and b'mochibot.com' in payload:tracker_removed=True;continue
  if kind==12 and b'onEnterFrame' in payload and not hooked:
   assert payload[-1]==0;payload=payload[:-1]+code;hooked=True
  rebuilt.append(tag(kind,payload))
 assert hooked and tracker_removed
 out=data[:tags[0][2]]+b''.join(rebuilt);out=b'FWS'+out[3:4]+struct.pack('<I',len(out))+out[8:]
 path=root/'reference/replay/instrumented.swf';path.parent.mkdir(exist_ok=True);path.write_bytes(out);(path.parent/'index.html').write_bytes((root/'tools/replay-player.html').read_bytes());print('Research copy:',path,'bytes',len(out),'source unchanged:',hashlib.sha256(raw).hexdigest())
if __name__=='__main__':main()
