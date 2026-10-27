import geometry from './world-geometry.json';
export {geometry};
export type Point={x:number;y:number};
type Mask=typeof geometry.masks.ground;
const EPS=1e-9;
function roots(a:number,b:number,c:number){if(Math.abs(a)<EPS)return Math.abs(b)<EPS?[]:[-c/b];const d=b*b-4*a*c;if(d<0)return [];const r=Math.sqrt(d);return d===0?[-b/(2*a)]:[(-b-r)/(2*a),(-b+r)/(2*a)];}
const value=(a:number,b:number,c:number,t:number)=>(a*t+b)*t+c;
function strokeHit(p:number[],x:number,y:number,r:number){
 if(p.length===4){const [x0,y0,x1,y1]=p,dx=x1-x0,dy=y1-y0,t=Math.max(0,Math.min(1,((x-x0)*dx+(y-y0)*dy)/(dx*dx+dy*dy||1)));return (x-x0-t*dx)**2+(y-y0-t*dy)**2<=r*r;}
 const [x0,y0,cx,cy,x1,y1]=p;
 if(x<Math.min(x0,cx,x1)-r||x>Math.max(x0,cx,x1)+r||y<Math.min(y0,cy,y1)-r||y>Math.max(y0,cy,y1)+r)return false;
 const ax=x0-2*cx+x1,bx=2*(cx-x0),ay=y0-2*cy+y1,by=2*(cy-y0),dx=x0-x,dy=y0-y;
 const a=2*(ax*ax+ay*ay),b=3*(ax*bx+ay*by),c=bx*bx+by*by+2*(ax*dx+ay*dy),d=bx*dx+by*dy;
 const derivative=(t:number)=>((a*t+b)*t+c)*t+d;
 const cuts=[0,...roots(3*a,2*b,c).filter(t=>t>0&&t<1).sort((a,b)=>a-b),1],points=[...cuts];
 for(let i=0;i<cuts.length-1;i++){let lo=cuts[i],hi=cuts[i+1];if(derivative(lo)*derivative(hi)>=0)continue;for(let n=0;n<45;n++){const mid=(lo+hi)/2;if(derivative(lo)*derivative(mid)<=0)hi=mid;else lo=mid;}points.push((lo+hi)/2);}
 return points.some(t=>value(ax,bx,dx,t)**2+value(ay,by,dy,t)**2<=r*r+EPS);
}
/** Filled vector hit test uses exact quadratic edges, with source stroke widths.
 * Coordinates are original map pixels; no dependency on rendering resolution. */
export function maskContains(mask:Mask,point:Point){
 const m=mask.matrix,det=m.a*m.d-m.b*m.c,px=point.x*20-m.tx,py=point.y*20-m.ty,x=(m.d*px-m.c*py)/det,y=(-m.b*px+m.a*py)/det;
 const winding=new Map<number,number>();
 for(const edge of mask.edges){const [left,right,line,...p]=edge;if(line&&strokeHit(p,x,y,Math.max(1,mask.strokeWidths[line])/2))return true;if(left===right)continue;
  const [x0,y0]=p;let hits:{x:number;sign:number}[]=[];
  if(p.length===4){const [, ,x1,y1]=p;if((y0<=y&&y<y1)||(y1<=y&&y<y0))hits=[{x:x0+(y-y0)*(x1-x0)/(y1-y0),sign:y1>y0?1:-1}];}
  else{const [, ,cx,cy,x1,y1]=p,ay=y0-2*cy+y1,by=2*(cy-y0);for(const t of roots(ay,by,y0-y)){const slope=2*ay*t+by;if((t>EPS&&t<1-EPS||Math.abs(t)<=EPS&&slope>0||Math.abs(t-1)<=EPS&&slope<0)&&Math.abs(slope)>EPS)hits.push({x:value(x0-2*cx+x1,2*(cx-x0),x0,t),sign:slope>0?1:-1});}}
  for(const hit of hits){if(hit.x<=x)continue;if(left)winding.set(left,(winding.get(left)??0)+hit.sign);if(right)winding.set(right,(winding.get(right)??0)-hit.sign);}
 }
 return [...winding.values()].some(n=>mask.nonzeroWinding?n!==0:Math.abs(n)%2===1);
}
export type WorldMask=keyof typeof geometry.masks;
export function worldHit(mask:WorldMask,point:Point){return Number.isFinite(point.x)&&Number.isFinite(point.y)&&maskContains(geometry.masks[mask],point);}
export function inBounds(bounds:readonly number[],p:Point){return p.x>=bounds[0]&&p.x<=bounds[1]&&p.y>=bounds[2]&&p.y<=bounds[3];}
export function townAt(p:Point){return Object.entries(geometry.towns).find(([,town])=>inBounds(town.bounds,p))?.[0]??null;}
export function questAt(id:number,p:Point){const avatar=(geometry.questAvatars as Record<string,{bounds:number[]}>)[`quest_avatar_${id}`];return !!avatar&&inBounds(avatar.bounds,p);}
