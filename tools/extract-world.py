#!/usr/bin/env python3
"""Extract original world collision edges and static hit-test bounds, without FFDec.
No raster approximation: quadratic Bezier control points remain exact twips.
"""
import importlib.util, pathlib, struct, json, hashlib
spec=importlib.util.spec_from_file_location('terrain',pathlib.Path(__file__).with_name('extract-terrain.py'))
t=importlib.util.module_from_spec(spec);spec.loader.exec_module(t)

def rect(p,off):
 b=t.Bits(p,off);n=b.unsigned(5);v=[b.signed(n) for _ in range(4)];return v,b.end

def skip_matrix(p,off):
 b=t.Bits(p,off)
 if b.unsigned(1):n=b.unsigned(5);b.unsigned(n);b.unsigned(n)
 if b.unsigned(1):n=b.unsigned(5);b.unsigned(n);b.unsigned(n)
 n=b.unsigned(5);b.unsigned(n);b.unsigned(n);return b.end

def name(p):
 flags=p[0];off=3
 if flags&2:off+=2
 if flags&4:off=skip_matrix(p,off)
 if flags&8:
  b=t.Bits(p,off);has_add=b.unsigned(1);has_mult=b.unsigned(1);n=b.unsigned(4)
  for _ in range(4*(has_add+has_mult)):b.unsigned(n)
  off=b.end
 if flags&16:off+=2
 return p[off:p.index(0,off)].decode() if flags&32 else None

def shape(code,p):
 bounds,off=rect(p,2)
 winding=False
 if code==83:
  _,off=rect(p,off);winding=bool(p[off]&4);off+=1
 rgba=code in (32,83)
 widths=[0]
 def styles(off):
  n=p[off];off+=1
  if n==255:n=struct.unpack_from('<H',p,off)[0];off+=2
  for _ in range(n):
   kind=p[off];off+=1
   if kind==0:off+=4 if rgba else 3
   elif kind in (16,18,19):
    off=skip_matrix(p,off);count=p[off]&15;off+=1+count*(5 if rgba else 4)
    if kind==19:off+=2
   elif kind in (64,65,66,67):off=skip_matrix(p,off+2)
   else:raise ValueError(('Unsupported fill',kind))
  nline=p[off];off+=1
  if nline==255:nline=struct.unpack_from('<H',p,off)[0];off+=2
  if code==83:
   for _ in range(nline):
    width=struct.unpack_from('<H',p,off)[0];off+=2;b=t.Bits(p,off);cap=b.unsigned(2);join=b.unsigned(2);hasfill=b.unsigned(1);b.unsigned(11);off=b.end
    if join==2:off+=2
    if hasfill:raise ValueError('Unexpected stroke fill')
    off+=4
    widths.append(width)
  else:
   for _ in range(nline):widths.append(struct.unpack_from('<H',p,off)[0]);off+=2+(4 if rgba else 3)
  return off,n
 off,fillcount=styles(off);b=t.Bits(p,off);nf=b.unsigned(4);nl=b.unsigned(4);x=y=0;f0=f1=line=0;edges=[]
 while True:
  if not b.unsigned(1):
   flags=b.unsigned(5)
   if not flags:break
   if flags&1:n=b.unsigned(5);x=b.signed(n);y=b.signed(n)
   if flags&2:f0=b.unsigned(nf)
   if flags&4:f1=b.unsigned(nf)
   if flags&8:line=b.unsigned(nl)
   if flags&16:
    off,_=styles(b.end);b=t.Bits(p,off);nf=b.unsigned(4);nl=b.unsigned(4)
   continue
  straight=b.unsigned(1);n=b.unsigned(4)+2;start=[x,y]
  if straight:
   if b.unsigned(1):x+=b.signed(n);y+=b.signed(n)
   elif b.unsigned(1):y+=b.signed(n)
   else:x+=b.signed(n)
   edge=start+[x,y]
  else:
   cx=x+b.signed(n);cy=y+b.signed(n);x=cx+b.signed(n);y=cy+b.signed(n);edge=start+[cx,cy,x,y]
  if f0!=f1 or line:edges.append([f0,f1,line]+edge)
 return {'bounds':bounds,'nonzeroWinding':winding,'edges':edges,'fillCount':fillcount,'strokeWidths':widths}

def extract(path):
 raw=path.read_bytes()
 if hashlib.sha256(raw).hexdigest()!=t.EXPECTED_SWF_SHA256:raise ValueError('Unexpected SWF')
 tags,_=t.swf_tags(raw);_,sprites=t.exports_and_sprites(tags);defs={struct.unpack_from('<H',p)[0]:(c,p) for c,p,_ in tags if c in (2,22,32,83,37,11,33)}
 frames=list(t.display_frames(sprites[1979]['tags']));world=frames[0][1];names={}
 for c,p,_ in sprites[1979]['tags']:
  if c==26:
   nm=name(p)
   if nm:names[nm]=world[struct.unpack_from('<H',p,1)[0]]
  if c==1:break
 def bounds(id,seen=()):
  if id in seen:raise ValueError('Recursive display list')
  if id in defs:return rect(defs[id][1],2)[0]
  if id not in sprites:raise ValueError(('Unknown bounds',id))
  ds=next(t.display_frames(sprites[id]['tags']))[1];pts=[]
  for st in ds.values():
   bd=bounds(st['characterId'],seen+(id,));m=st['matrix']
   for x in bd[:2]:
    for y in bd[2:]:pts.append((m['a']*x+m['c']*y+m['tx'],m['b']*x+m['d']*y+m['ty']))
  return [min(p[0] for p in pts),max(p[0] for p in pts),min(p[1] for p in pts),max(p[1] for p in pts)]
 out={'source':{'sha256':t.EXPECTED_SWF_SHA256,'worldSprite':1979,'coordinates':'twips; 20 per pixel'},'masks':{},'towns':{},'questAvatars':{}}
 for nm,st in names.items():
  id=st['characterId'];m=st['matrix']
  if nm in ['ground','sea','seashore','landRus','landGer','landViz','landJap']:
   if id in sprites:
    ds=next(t.display_frames(sprites[id]['tags']))[1]
    if len(ds)!=1:raise ValueError('Mask has multiple children')
    child=next(iter(ds.values()));id=child['characterId']
    if child['matrix']!={'a':1.0,'b':0.0,'c':0.0,'d':1.0,'tx':0,'ty':0}:raise ValueError('Unexpected mask transform')
   c,p=defs[id];out['masks'][nm]={**shape(c,p),'characterId':id,'matrix':m}
  elif nm!='avatar':
   bd=bounds(id);entry={'x':m['tx']/20,'y':m['ty']/20,'bounds':[(bd[0]+m['tx'])/20,(bd[1]+m['tx'])/20,(bd[2]+m['ty'])/20,(bd[3]+m['ty'])/20],'characterId':id}
   out['questAvatars' if nm.startswith('quest_avatar_') else 'towns'][nm]=entry
 # City frames follow original Town constructor order; do not infer facilities from art.
 order=list(json.loads((path.parent.parent/'src/original-data.json').read_text())['towns']);named={};frame=0;out['facilities']={}
 for code,p,_ in sprites[1958]['tags']:
  if code==26:
   depth=struct.unpack_from('<H',p,1)[0]
   if not p[0]&1:named.pop(depth,None)
   nm=name(p)
   if nm:named[depth]=nm
  elif code==28:named.pop(struct.unpack_from('<H',p)[0],None)
  elif code==1:
   out['facilities'][order[frame]]={'harbor':'harbor_btn' in named.values(),'stables':'barn_btn' in named.values()};frame+=1
 return out
if __name__=='__main__':
 root=pathlib.Path(__file__).resolve().parent.parent;out=extract(root/'reference/feudalism.swf');(root/'src/world-geometry.json').write_text(json.dumps(out,separators=(',',':'))+'\n');print({k:len(v['edges']) for k,v in out['masks'].items()});print('towns',len(out['towns']),'quests',len(out['questAvatars']))
