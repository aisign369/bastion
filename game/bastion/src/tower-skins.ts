import type { MapId } from './maps';
export type TowerKey='bolt'|'frost'|'mortar'|'rail'|'tesla';
export const TOWER_KEYS:readonly TowerKey[]=['bolt','frost','mortar','rail','tesla'];
export interface TowerSkin { name:string; metal:string; dark:string; edge:string; trim:string; energy:string; light:string; motif:'leaf'|'forge'|'ice'|'sun' }
const WORLDS:Record<MapId,{metal:string;dark:string;edge:string;trim:string;light:string;motif:TowerSkin['motif'];names:string[];energies:string[]}>= {
  orchid:{metal:'#657f72',dark:'#233c3d',edge:'#bfcbab',trim:'#cca86b',light:'#ecf1d5',motif:'leaf',
    names:['THORN STINGER','ORCHID CRYSTAL','SEEDPOD HOWITZER','PETAL LANCE','VERDANT COIL'],energies:['#f6cd88','#abdfed','#eca975','#e6b6df','#afe2b8']},
  ember:{metal:'#5d5966',dark:'#222535',edge:'#aaa0a7',trim:'#c98252',light:'#ffe1b2',motif:'forge',
    names:['CINDER STINGER','OBSIDIAN RIME','CALDERA MORTAR','MAGMA LANCE','FURNACE COIL'],energies:['#ffb46b','#b6c7ff','#ff8259','#ffa4d1','#f9d88c']},
  frost:{metal:'#799dad',dark:'#2b485e',edge:'#d3edf5',trim:'#acc9d7',light:'#f0fcff',motif:'ice',
    names:['POLAR STINGER','GLACIER HEART','AVALANCHE MORTAR','AURORA LANCE','BOREAL COIL'],energies:['#ffe0ab','#b7f0ff','#f6c294','#ccaaff','#a0ffe1']},
  sunspire:{metal:'#b28b57',dark:'#5d463d',edge:'#e5c488',trim:'#f0d28b',light:'#fff1c4',motif:'sun',
    names:['SCARAB STINGER','OASIS HEART','PHARAOH MORTAR','SUN SPEAR','OBELISK COIL'],energies:['#ffe0a0','#8dded7','#ffa775','#ffb4cb','#a7e3b8']},
};
function worldSkins(map:MapId):Record<TowerKey,TowerSkin>{
  const {names,energies,...palette}=WORLDS[map];
  return Object.fromEntries(TOWER_KEYS.map((key,i)=>[key,{...palette,name:names[i],energy:energies[i]}])) as Record<TowerKey,TowerSkin>;
}
export const TOWER_SKINS:Record<MapId,Record<TowerKey,TowerSkin>>={orchid:worldSkins('orchid'),ember:worldSkins('ember'),frost:worldSkins('frost'),sunspire:worldSkins('sunspire')};
export const getTowerSkin=(map:MapId,key:TowerKey):TowerSkin=>TOWER_SKINS[map][key];
export const isLegendaryTower=(damage:number,rate:number)=>damage===3&&rate===3;
const TAU=Math.PI*2;
function poly(g:CanvasRenderingContext2D,p:number[][],fill:string,stroke?:string){g.beginPath();p.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fillStyle=fill;g.fill();if(stroke){g.strokeStyle=stroke;g.lineWidth=1.4;g.stroke();}}
function circle(g:CanvasRenderingContext2D,x:number,y:number,r:number,color:string,edge?:string){g.beginPath();g.arc(x,y,r,0,TAU);g.fillStyle=color;g.fill();if(edge){g.strokeStyle=edge;g.lineWidth=1.3;g.stroke();}}
function plate(g:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,s:TowerSkin){
  const bevel=Math.min(s.motif==='forge'?4:s.motif==='sun'?3:2,w*.25,h*.25),inset=Math.min(3,w*.2);
  poly(g,[[x+bevel,y],[x+w-bevel,y],[x+w,y+bevel],[x+w,y+h-bevel],[x+w-bevel,y+h],[x+bevel,y+h],[x,y+h-bevel],[x,y+bevel]],s.metal,s.dark);
  g.fillStyle=s.edge;g.fillRect(x+inset,y+1,w-inset*2,1.5);g.fillStyle=s.dark;g.fillRect(x+inset,y+h-3,w-inset*2,2);
  if(s.motif==='ice'){g.fillStyle=s.light;g.fillRect(x+inset,y,w-inset*2,2);}
  if(s.motif==='sun'&&w>=10&&h>=10){g.strokeStyle=s.trim;g.lineWidth=.7;g.strokeRect(x+4,y+4,w-8,h-8);}
}
function leaf(g:CanvasRenderingContext2D,x:number,y:number,angle:number,s:TowerSkin,size=9){g.save();g.translate(x,y);g.rotate(angle);poly(g,[[0,0],[-size*.4,-size*.7],[0,-size],[size*.4,-size*.7]],s.metal,s.edge);g.strokeStyle=s.trim;g.beginPath();g.moveTo(0,0);g.lineTo(0,-size+2);g.stroke();g.restore();}
function crystal(g:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,s:TowerSkin){poly(g,[[x,y-h],[x+w,y],[x,y+h*.38],[x-w,y]],s.energy,s.light);poly(g,[[x,y-h],[x+w,y],[x,y+h*.38]],s.metal);}
function rays(g:CanvasRenderingContext2D,x:number,y:number,r:number,s:TowerSkin,n=8){g.strokeStyle=s.trim;g.lineWidth=1.5;for(let j=0;j<n;j++){const a=j*TAU/n;g.beginPath();g.moveTo(x+Math.cos(a)*r,y+Math.sin(a)*r);g.lineTo(x+Math.cos(a)*(r+4),y+Math.sin(a)*(r+4));g.stroke();}}
function base(g:CanvasRenderingContext2D,s:TowerSkin,key:TowerKey){
  g.fillStyle='#08142266';g.beginPath();g.ellipse(1,7,33,19,0,0,TAU);g.fill();
  if(s.motif==='leaf'){
    for(let j=0;j<6;j++){g.save();g.scale(1,.65);leaf(g,0,0,j*TAU/6,s,31);g.restore();}
    g.beginPath();g.ellipse(0,0,24,15,0,0,TAU);g.fillStyle=s.dark;g.fill();g.strokeStyle=s.trim;g.lineWidth=2;g.stroke();
  }else if(s.motif==='forge'){
    poly(g,[[-29,-10],[-18,-22],[18,-22],[29,-10],[29,9],[18,21],[-18,21],[-29,9]],s.dark,s.edge);
    for(const side of [-1,1]){plate(g,side*22-5,-10,10,23,s);g.fillStyle=s.energy;g.fillRect(side*22-3,-7,2,16);for(let j=0;j<3;j++){g.fillStyle=s.dark;g.fillRect(side*22-5,-3+j*6,10,2);}}
  }else if(s.motif==='ice'){
    poly(g,[[-31,-5],[-16,-22],[18,-22],[31,-5],[17,19],[-17,19]],s.dark,s.edge);
    poly(g,[[-26,-7],[-14,-18],[16,-18],[25,-7],[14,13],[-15,13]],s.metal,s.light);
    for(const side of [-1,1])crystal(g,side*25,5,4,9,s);
    poly(g,[[-30,-5],[-16,-22],[18,-22],[23,-15],[-13,-16],[-23,-3]],s.light);
  }else{
    poly(g,[[-31,-5],[0,-23],[31,-5],[31,9],[0,26],[-31,9]],s.dark,s.trim);
    poly(g,[[-27,-8],[0,-23],[27,-8],[0,8]],s.edge,s.trim);
    poly(g,[[-21,-5],[0,-17],[21,-5],[0,7]],s.metal,s.dark);
    for(let j=-1;j<=1;j++){g.fillStyle=s.trim;g.fillRect(j*9-2,12-Math.abs(j)*4,4,3);}
  }
  g.beginPath();g.ellipse(0,-2,15,9,0,0,TAU);g.fillStyle=s.dark;g.fill();g.strokeStyle=s.energy;g.lineWidth=1.4;g.stroke();
  // Five different base emblems keep roles legible even below a rotating head.
  const mark=TOWER_KEYS.indexOf(key);for(let j=0;j<=mark;j++){g.fillStyle=s.energy;g.fillRect(-mark*2+j*4,14,2,2);}
}
function details(g:CanvasRenderingContext2D,s:TowerSkin,lv:number,x=-13,y=-8){
  if(s.motif==='leaf'){leaf(g,x-3,y+6,-.7,s,9+lv);leaf(g,x+5,y+6,.7,s,7+lv);}
  else if(s.motif==='forge'){for(let j=0;j<3+lv;j++){g.fillStyle=s.dark;g.fillRect(x+j*4,y,2,9);g.fillStyle=s.trim;g.fillRect(x+j*4,y-2,2,2);}}
  else if(s.motif==='ice'){for(let j=0;j<2+lv;j++)poly(g,[[x+j*5,y],[x+j*5+2,y+5],[x+j*5+3,y]],s.light);}
  else{rays(g,x+9,y+5,4,s,6);circle(g,x+9,y+5,3,s.energy,s.dark);}
}
function head(g:CanvasRenderingContext2D,s:TowerSkin,key:TowerKey,lv:number){
  if(key==='bolt'){
    const barrels=lv===0?[0]:lv<3?[-5,5]:[-7,0,7];
    for(const y of barrels){plate(g,4,y-2.5,25+lv,5,s);g.fillStyle=s.dark;g.fillRect(25,y-3.5,5,7);g.fillStyle=s.trim;g.fillRect(30,y-2.5,3,5);}
    plate(g,-18,-11-lv,28,22+lv*2,s);details(g,s,lv);
    if(s.motif==='sun')poly(g,[[-9,-12-lv],[-2,-18-lv],[5,-12-lv],[0,-8]],s.trim,s.dark);
    if(s.motif==='leaf')leaf(g,-14,6,-1.2,s,14);
    for(let j=0;j<lv;j++)plate(g,-22,-12-j*4,10,3,s);
    circle(g,-3,0,4,s.energy,s.dark);
  }else if(key==='mortar'){
    g.save();g.rotate(-.85);
    plate(g,-17,-11,34,25,s);
    if(s.motif==='sun'){g.beginPath();g.ellipse(0,-7,19,13,0,0,TAU);g.fillStyle=s.metal;g.fill();g.strokeStyle=s.trim;g.lineWidth=2;g.stroke();}
    for(const x of lv===3?[-8,8]:[0]){
      const w=lv===3?12:15+lv*2,top=-32-lv*3;
      plate(g,x-w/2,top,w,35+lv*3,s);g.fillStyle=s.trim;g.fillRect(x-w/2,-17,w,4);
      g.beginPath();g.ellipse(x,top,w*.6,4,0,0,TAU);g.fillStyle=s.dark;g.fill();g.strokeStyle=s.edge;g.lineWidth=2;g.stroke();circle(g,x,top,2,s.energy);
    }details(g,s,lv,-12,5);g.restore();
  }else if(key==='rail'){
    const length=39+lv*4;plate(g,-19,-10,23,20,s);
    for(const side of [-1,1]){plate(g,-4,side*7-3,length,6,s);g.fillStyle=s.dark;g.fillRect(5,side*7-1,length-12,2);}
    for(let j=0;j<3+lv;j++){plate(g,2+j*7,-13,3,26,s);if(s.motif==='ice')crystal(g,3+j*7,-14,2,5,s);}
    if(s.motif==='sun')poly(g,[[length-1,-13],[length+9,0],[length-1,13],[length+2,0]],s.trim,s.dark);
    if(s.motif==='leaf'){leaf(g,-16,-8,-.6,s,13);leaf(g,-16,8,-2.5,s,13);}
    circle(g,-11,0,5,s.energy,s.trim);g.fillStyle=s.energy;g.fillRect(-5,-1.2,length+2,2.4);
  }else if(key==='frost'){
    g.beginPath();g.ellipse(0,9,16+lv*2,8,0,0,TAU);g.strokeStyle=s.trim;g.lineWidth=2;g.stroke();
    if(s.motif==='leaf')for(let j=0;j<5;j++)leaf(g,Math.cos(j*TAU/5)*13,9+Math.sin(j*TAU/5)*6,j*TAU/5,s,10+lv);
    if(s.motif==='forge')for(const side of [-1,1]){plate(g,side*16-3,-9-lv*2,6,23+lv*2,s);g.fillStyle=s.energy;g.fillRect(side*16-1,-6-lv*2,2,13);}
    if(s.motif==='sun'){poly(g,[[-17,10],[-11,-18-lv*3],[0,-27-lv*3],[11,-18-lv*3],[17,10]],s.metal,s.trim);g.strokeStyle=s.trim;g.lineWidth=2;g.strokeRect(-11,-17,22,22);}
    for(const side of [-1,1])crystal(g,side*(11+lv),4,3+lv,7+lv*2,s);
    crystal(g,0,-6,9+lv,19+lv*3,s);circle(g,0,-9,2,s.light);
  }else{
    // Distinct vertical silhouettes: vine coils, furnace forks, aurora antenna, sun obelisk.
    plate(g,-9,3,18,14,s);
    if(s.motif==='sun'){poly(g,[[-9,6],[-7,-26-lv*3],[0,-39-lv*3],[7,-26-lv*3],[9,6]],s.metal,s.trim);poly(g,[[0,-39-lv*3],[7,-26-lv*3],[0,-21-lv*3],[-7,-26-lv*3]],s.trim);for(let j=0;j<3;j++){g.fillStyle=s.energy;g.fillRect(-3,-18+j*8,6,2);}}
    else{
      plate(g,-4,-31-lv*3,8,38+lv*3,s);
      for(let j=0;j<3+lv;j++){const y=-j*7;g.beginPath();g.ellipse(0,y,12-j*.8,5,0,0,TAU);g.strokeStyle=j%2?s.energy:s.trim;g.lineWidth=2.6;g.stroke();}
      if(s.motif==='leaf')for(const side of [-1,1])leaf(g,side*13,5,side*.5,s,26+lv*2);
      else for(const side of [-1,1]){poly(g,[[side*10,8],[side*18,-18-lv*3],[side*11,-29-lv*3],[side*14,-13],[side*7,7]],s.metal,s.edge);circle(g,side*11,-29-lv*3,3,s.energy,s.light);}
    }circle(g,0,-28-lv*3,5,s.energy,s.dark);
  }
}
interface SkinArt { bases:Record<TowerKey,HTMLCanvasElement>;heads:Record<TowerKey,HTMLCanvasElement[]>;icons:Map<string,string> }
let cachedMap:MapId|undefined,cachedArt:SkinArt|undefined;
function canvas(w:number,h:number,x:number,y:number,draw:(g:CanvasRenderingContext2D)=>void){const c=document.createElement('canvas');c.width=w*2;c.height=h*2;const g=c.getContext('2d')!;g.scale(2,2);g.translate(x,y);draw(g);return c;}
/** Only the current map's 25 sprites are kept. Switching maps releases the previous cache. */
export function getTowerArt(map:MapId):SkinArt{
  if(cachedMap===map&&cachedArt)return cachedArt;
  const bases={} as SkinArt['bases'],heads={} as SkinArt['heads'];
  for(const key of TOWER_KEYS){const s=getTowerSkin(map,key);bases[key]=canvas(96,96,48,52,g=>{g.scale(.72,.72);base(g,s,key);});heads[key]=Array.from({length:4},(_,lv)=>canvas(128,112,56,56,g=>head(g,s,key,lv)));}
  cachedMap=map;cachedArt={bases,heads,icons:new Map()};return cachedArt;
}
export function drawSkinHead(g:CanvasRenderingContext2D,map:MapId,key:TowerKey,lv:number,recoil=0,flash=0,time=0,motion=true){
  lv=Math.min(3,Math.max(0,lv));const art=getTowerArt(map),s=getTowerSkin(map,key);
  g.save();if(key==='frost')g.translate(0,motion?Math.sin(time*2.2)*1.1:0);else if(key!=='tesla')g.translate(-recoil,0);
  g.drawImage(art.heads[key][lv],-56,-56,128,112);
  if((key==='frost'||key==='tesla')&&motion){
    const n=key==='frost'?3+lv:2,cy=key==='frost'?2:-24-lv*3;
    for(let j=0;j<n;j++){const a=time*.5+j*TAU/n,x=Math.cos(a)*(14+lv),y=cy+Math.sin(a)*6;circle(g,x,y,1.7,s.energy,s.light);}
  }
  if(flash>0){
    const x=key==='rail'?41+lv*4:key==='bolt'?35:key==='mortar'?-Math.sin(.85)*(32+lv*3):0,y=key==='mortar'?-Math.cos(.85)*(32+lv*3):key==='tesla'?-28-lv*3:0;
    const size=5+lv*1.5;poly(g,[[x,y-size],[x+size*2,y],[x,y+size],[x+size*.5,y]],s.energy);circle(g,x+size*.5,y,size*.45,s.light);
  }g.restore();
}
export function drawLegendary(g:CanvasRenderingContext2D,map:MapId,key:TowerKey,time:number,motion:boolean){
  const s=getTowerSkin(map,key);g.save();g.strokeStyle='#f8d88a';g.lineWidth=1.4;g.beginPath();g.ellipse(0,7,27,16,0,0,TAU);g.stroke();
  for(const side of [-1,1]){
    if(s.motif==='leaf')for(let j=0;j<3;j++)leaf(g,side*(18+j*3),11-j*7,side*.5,{...s,metal:'#a68e4b',edge:'#ffe5a1'},8);
    else if(s.motif==='forge')poly(g,[[side*21,15],[side*29,5],[side*25,-11],[side*20,-3]],'#b8884a','#ffe2a3');
    else if(s.motif==='ice')crystal(g,side*23,-1,4,16,{...s,energy:'#ffd88f',light:'#fff0c3'});
    else{g.save();g.translate(side*23,5);rays(g,0,0,5,{...s,trim:'#ffe2a1'},6);circle(g,0,0,4,'#b99a52','#ffe7b0');g.restore();}
  }
  poly(g,[[-6,21],[-4,15],[0,18],[4,15],[6,21]],'#ffe0a0',s.dark);
  if(motion){g.globalAlpha=.5+.2*Math.sin(time*2);circle(g,0,18,1.7,s.light);}
  g.restore();
}
export function towerPortrait(map:MapId,key:TowerKey,lv=0,legendary=false):string{
  const art=getTowerArt(map),cacheKey=`${key}:${lv}:${legendary}`;const found=art.icons.get(cacheKey);if(found)return found;
  const c=canvas(64,64,32,36,g=>{g.drawImage(art.bases[key],-48,-52,96,96);g.scale(.64,.64);if(key==='bolt'||key==='rail')g.rotate(-.6);drawSkinHead(g,map,key,lv,0,0,0,false);});
  if(legendary){const g=c.getContext('2d')!;g.save();g.scale(2,2);g.translate(32,36);g.scale(.7,.7);drawLegendary(g,map,key,0,false);g.restore();}
  const url=c.toDataURL();art.icons.set(cacheKey,url);return url;
}
