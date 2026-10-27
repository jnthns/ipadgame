#!/usr/bin/env python3
"""Extract hash-verified original progression/terrain methods as clean-checkout oracle fixtures."""
import importlib.util,pathlib,struct,json,hashlib,base64
sp=importlib.util.spec_from_file_location('t','tools/extract-terrain.py');t=importlib.util.module_from_spec(sp);sp.loader.exec_module(t)
raw=pathlib.Path('reference/feudalism.swf').read_bytes();assert hashlib.sha256(raw).hexdigest()==t.EXPECTED_SWF_SHA256
ts,_=t.swf_tags(raw);ex,sps=t.exports_and_sprites(ts)
def acts(p):
 pc=0
 while pc<len(p):
  at=pc;op=p[pc];pc+=1;n=0
  if op>=128:n=struct.unpack_from('<H',p,pc)[0];pc+=2
  payload=p[pc:pc+n];pc+=n;yield at,op,payload
  if not op:break
for cls,selected in [('Hero',{'Hero','experience'}),('Creature',{'strike'}),('Root',{'percent','onEnterFrame'})]:
 if cls=='Root':id=0;p=next(p for c,p,o in ts if c==12 and b'percent\x00' in p)
 else:id=next(k for k,v in ex.items() if v=='__Packages.'+cls);p=next(p[2:] for c,p,o in ts if c==59 and struct.unpack_from('<H',p)[0]==id)
 pool=[];recent=[];out={}
 for at,op,pl in acts(p):
  if op==0x88:
   pool=pl[2:].split(b'\0')[:-1];pool=[x.decode() for x in pool]
  if op==0x96:
   q=0;recent=[]
   while q<len(pl):
    typ=pl[q];q+=1
    if typ==8:recent.append(pool[pl[q]]);q+=1
    elif typ==9:recent.append(pool[struct.unpack_from('<H',pl,q)[0]]);q+=2
    elif typ==4:q+=1
    elif typ in [1,7]:q+=4
    elif typ==5:q+=1
    elif typ==6:q+=8
    elif typ in [2,3]:pass
    elif typ==0:end=pl.index(0,q);recent.append(pl[q:end].decode());q=end+1
    else:raise ValueError(typ)
  if op in [0x8e,0x9b]:
   end=pl.index(0);nm=pl[:end].decode();q=end+1;params=struct.unpack_from('<H',pl,q)[0];q+=2
   if op==0x8e:regs=pl[q];flags=struct.unpack_from('<H',pl,q+1)[0];q+=3
   else:regs=flags=0
   parameters=[]
   for i in range(params):
    reg=pl[q] if op==0x8e else 0;q+=op==0x8e;end=pl.index(0,q);parameters.append((reg,pl[q:end].decode()));q=end+1
   n=struct.unpack_from('<H',pl,q)[0];q+=2;body=p[at+3+q:at+3+q+n]
   key=nm or (recent[-1] if recent else '?');out[key]={'offset':at+3+q,'registers':regs,'flags':flags,'parameters':parameters,'code':body.hex()}
 out={k:{**{a:b for a,b in v.items() if a!='code'},'sha256':hashlib.sha256(bytes.fromhex(v['code'])).hexdigest(),'base64':base64.b64encode(bytes.fromhex(v['code'])).decode()} for k,v in out.items() if k in selected}
 assert set(out)==selected
 path=pathlib.Path('tests/fixtures/'+cls.lower()+'-bytecode.json');path.write_text(json.dumps({'swfSha256':t.EXPECTED_SWF_SHA256,'classSprite':id,'pool':pool,'methods':out},separators=(',',':'))+'\n')
 print(cls,{k:{a:b for a,b in v.items() if a not in ['base64','sha256']} for k,v in out.items()})
