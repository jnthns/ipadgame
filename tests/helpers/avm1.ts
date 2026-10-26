type Value=any;
function less2(a:Value,b:Value):boolean|undefined{if(typeof a==='string'&&typeof b==='string')return a<b;const x=Number(a),y=Number(b);return Number.isNaN(x)||Number.isNaN(y)?undefined:x<y;}
/** Narrow AVM1 opcode oracle for these original methods; not a Flash player. */
export function runBytecode(fixture:{base64:string},initialPool:string[],registers:Record<number,Value>,scope:Record<string,Value>={}){
 const code=Buffer.from(fixture.base64,'base64'),stack:Value[]=[],stores:number[]=[];let pool=initialPool;let pc=0,steps=0;
 const pop=()=>stack.pop();
 while(pc<code.length){if(++steps>100000)throw new Error('Oracle loop limit');const op=code[pc++];let payload=Buffer.alloc(0);if(op>=128){const n=code.readUInt16LE(pc);pc+=2;payload=code.subarray(pc,pc+n);pc+=n;}
  switch(op){
   case 0x3e:case 0:return {stack,registers,stores};
   case 0x88:{const count=payload.readUInt16LE(0);let q=2;pool=[];for(let i=0;i<count;i++){const end=payload.indexOf(0,q);pool.push(payload.toString('utf8',q,end));q=end+1;}break;}
   case 0x1c:stack.push(scope[pop()]);break;
   case 0x3d:{const name=pop(),count=pop(),args=Array.from({length:count},()=>pop());stack.push(scope[name]?.(...args));break;}
   case 0x40:{const name=pop(),count=pop(),args=Array.from({length:count},()=>pop());stack.push(scope[name](...args));break;}
   case 0x42:{const count=pop();stack.push(Array.from({length:count},()=>pop()));break;}
   case 0x51:stack.push(Number(pop())-1);break;
   case 0x96:{let q=0;while(q<payload.length){const t=payload[q++];let value:Value;if(t===0){const end=payload.indexOf(0,q);value=payload.toString('utf8',q,end);q=end+1;}else if(t===1){value=payload.readFloatLE(q);q+=4;}else if(t===2)value=null;else if(t===3)value=undefined;else if(t===4)value=registers[payload[q++]];else if(t===5)value=!!payload[q++];else if(t===6){const n=Buffer.concat([payload.subarray(q+4,q+8),payload.subarray(q,q+4)]);value=n.readDoubleLE();q+=8;}else if(t===7){value=payload.readInt32LE(q);q+=4;}else if(t===8)value=pool[payload[q++]];else if(t===9){value=pool[payload.readUInt16LE(q)];q+=2;}else throw new Error('Push type '+t);stack.push(value);}break;}
   case 0x87:registers[payload[0]]=stack[stack.length-1];stores.push(payload[0]);break;
   case 0x17:pop();break;
   case 0x4e:{const key=pop(),obj=pop();stack.push(obj?.[key]);break;}
   case 0x4f:{const value=pop(),key=pop(),obj=pop();if(obj!=null)obj[key]=value;break;}
   case 0x52:{const key=pop(),obj=pop(),count=pop();const args=Array.from({length:count},()=>pop());stack.push((key===undefined||key==='')&&typeof obj==='function'?obj(...args):obj?.[key]?.apply(obj,args));break;}
   case 0x47:{const b=pop(),a=pop();stack.push(a+b);break;}
   case 0x0b:{const b=pop(),a=pop();stack.push(Number(a)-Number(b));break;}
   case 0x48:{const b=pop(),a=pop();stack.push(less2(a,b));break;}
   case 0x67:{const b=pop(),a=pop();stack.push(less2(b,a));break;}
   case 0x49:{const b=pop(),a=pop();stack.push(a==b);break;}
   case 0x12:stack.push(!pop());break;
   case 0x4c:stack.push(stack[stack.length-1]);break;
   case 0x50:stack.push(Number(pop())+1);break;
   case 0x9d:if(pop())pc+=payload.readInt16LE();break;
   case 0x99:pc+=payload.readInt16LE();break;
   default:throw new Error('Unsupported original opcode '+op.toString(16));
  }
 }
 return {stack,registers,stores};
}
