import Phaser from 'phaser';
import {renderPixelRatio,type RenderPreset} from './render-presets';
/** Drawing buffer may change; logical camera, world positions and hit areas never do. */
export function renderDimensions(p:RenderPreset){const ratio=renderPixelRatio(p,window.devicePixelRatio);return {ratio,width:Math.round(806*ratio),height:Math.round(601*ratio)};}
export function setupCamera(scene:Phaser.Scene,p:RenderPreset){const {ratio}=renderDimensions(p);scene.cameras.main.setZoom(ratio).centerOn(403,300.5);}
/** Optional flat terrain texture: lower source resolution + broad color bands.
 * It is a render cache, never a new layout or simulation input. Characters/UI use shared assets.
 */
export function environmentTexture(scene:Phaser.Scene,key:string,p:RenderPreset){
 if(p.terrainVariant!=='simplified')return key;
 const flatKey=key+'-flat';if(scene.textures.exists(flatKey))return flatKey;
 const source=scene.textures.get(key).getSourceImage() as HTMLImageElement;
 const width=512,height=Math.round(source.height*width/source.width);
 const tex=scene.textures.createCanvas(flatKey,width,height);if(!tex)return key;
 const ctx=tex.getContext();ctx.drawImage(source,0,0,width,height);
 const pixels=ctx.getImageData(0,0,width,height);
 for(let i=0;i<pixels.data.length;i+=4){for(let c=0;c<3;c++)pixels.data[i+c]=Math.min(255,Math.round(pixels.data[i+c]/32)*32);}
 ctx.putImageData(pixels,0,0);tex.refresh();return flatKey;
}
export function townIcon(scene:Phaser.Scene,x:number,y:number,color:number,castle:boolean,p:RenderPreset){
 const root=scene.add.container(x,y);const g=scene.add.graphics();const size=castle?1.12:.82;g.fillStyle(0x245854,p.contactShadowAlpha);g.fillEllipse(0,5,35,13);g.fillStyle(0xcda260);g.fillRoundedRect(-13,-15,26,20,2);g.fillStyle(0xffe0a0);g.fillRect(-10,-15,17,16);g.fillStyle(0x6f543d);g.fillRoundedRect(-3,-6,7,11,3);
 for(const side of [-1,1]){g.fillStyle(0xf7d99d);g.fillRoundedRect(side*12-5,-23,10,28,2);g.fillStyle(0xdf6c45);g.fillTriangle(side*12-7,-23,side*12+7,-23,side*12,-35);g.fillStyle(0x617987);g.fillRoundedRect(side*12-1,-17,3,6,1);}
 if(castle){g.fillStyle(0xf6d79b);g.fillRect(-6,-30,12,15);g.fillStyle(0xe67745);g.fillTriangle(-10,-30,10,-30,0,-43);}g.lineStyle(2,0x795b37);g.lineBetween(0,-40,0,-55);g.fillStyle(color);g.fillPoints([{x:1,y:-55},{x:17,y:-55},{x:15,y:-43},{x:9,y:-46},{x:1,y:-43}],true);g.fillStyle(0xffe39d);g.fillCircle(8,-51,2);root.add(g);root.setScale(size);return root;
}
