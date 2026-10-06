import { CELL, W, H, WAY, GATE, PATHLEN, posAt, pathSet, blockedSet } from './path';
const TAU=Math.PI*2;
const noise=(n:number)=>{const value=Math.sin(n*127.1+311.7)*43758.5453;return value-Math.floor(value);};
function polygon(g:CanvasRenderingContext2D,points:number[][],fill:string){g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fillStyle=fill;g.fill();}
function glow(g:CanvasRenderingContext2D,x:number,y:number,r:number,opacity:number){
  const gradient=g.createRadialGradient(x,y,0,x,y,r);gradient.addColorStop(0,`rgba(255,109,46,${opacity})`);gradient.addColorStop(1,'rgba(255,70,23,0)');g.fillStyle=gradient;g.fillRect(x-r,y-r,r*2,r*2);
}

/** Terrain, molten cells and road detail are baked once, not painted every frame. */
export function drawEmberField(g:CanvasRenderingContext2D):void {
  const wash=g.createLinearGradient(0,0,W,H);wash.addColorStop(0,'#453340');wash.addColorStop(.55,'#262734');wash.addColorStop(1,'#181b29');g.fillStyle=wash;g.fillRect(0,0,W,H);
  for(let i=0;i<110;i++){
    const x=noise(i+10)*W,y=noise(i+90)*H,s=14+noise(i+400)*42;
    polygon(g,[[x-s,y],[x-s*.4,y-s*.45],[x+s*.8,y-s*.3],[x+s,y+s*.3],[x,y+s*.65]],i%3?'#77616712':'#080d1929');
  }
  // A continuous two-cell fault, interrupted only by the three playable bridges.
  g.fillStyle='#100f19';g.fillRect(18*CELL-13,0,2*CELL+26,H);
  for(const key of blockedSet){
    const [c,r]=key.split(',').map(Number),x=c*CELL,y=r*CELL;
    const lava=g.createLinearGradient(x,y,x+CELL,y+CELL);lava.addColorStop(0,'#ffb64d');lava.addColorStop(.25,'#f07532');lava.addColorStop(.75,'#a72c29');lava.addColorStop(1,'#ff8f39');g.fillStyle=lava;g.fillRect(x,y,CELL,CELL);
    for(let j=0;j<3;j++){
      const a=noise(r*20+c+j)*CELL,b=noise(r*31+c+j)*CELL;
      polygon(g,[[x+a-9,y+b],[x+a,y+b-5],[x+a+16,y+b+2],[x+a+6,y+b+8]],'#501c2960');
    }
    glow(g,x+CELL/2,y+CELL/2,55,.13);
  }
  // Basalt strata frame the canyon; smaller rocks leave build cells legible.
  for(let i=0;i<150;i++){
    const c=Math.floor(noise(i+1000)*32),r=Math.floor(noise(i+1300)*18),key=`${c},${r}`;
    if(pathSet.has(key)||blockedSet.has(key))continue;
    const x=(c+.25+noise(i)*.5)*CELL,y=(r+.25+noise(i+22)*.5)*CELL,s=4+noise(i+33)*9;
    polygon(g,[[x-s,y],[x-s*.4,y-s],[x+s*.6,y-s*.7],[x+s,y+s*.3],[x-s*.7,y+s*.5]],'#131925');
    polygon(g,[[x-s,y],[x-s*.4,y-s],[x+s*.6,y-s*.7],[x+s*.2,y]],'#73606c88');
    if(i%4===0){g.strokeStyle='#ec935649';g.lineWidth=.8;g.beginPath();g.moveTo(x-s*.3,y-s*.6);g.lineTo(x+s*.25,y-s*.2);g.stroke();}
  }
  const road=()=>{g.beginPath();WAY.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));};
  g.lineJoin='round';g.lineCap='round';
  for(const [width,color] of [[65,'#060b1677'],[54,'#171e2a'],[48,'#ba86786e'],[42,'#404553'],[34,'#59616b']] as const){road();g.lineWidth=width;g.strokeStyle=color;g.stroke();}
  for(let d=15;d<PATHLEN-12;d+=24){
    const p=posAt(d);g.save();g.translate(p.x,p.y);g.rotate(Math.atan2(p.dy,p.dx));
    g.strokeStyle='#1a233299';g.lineWidth=1.4;g.beginPath();g.moveTo(10,-17);g.lineTo(10,17);g.stroke();
    g.fillStyle='#e9c79870';g.fillRect(-4,-1,8,2);g.restore();
  }
  for(const r of [3,8,14]){
    const y=(r+.5)*CELL,x=18*CELL-12;
    // Riveted bridge decks and warm lamps establish the three chokepoints.
    g.fillStyle='#6b7380';g.fillRect(x,y-17,2*CELL+24,34);
    for(let j=0;j<8;j++){g.fillStyle=j%2?'#323d4c':'#4c5866';g.fillRect(x+j*15,y-16,12,32);}
    for(const side of [-1,1]){
      g.fillStyle='#b69980';g.fillRect(x,y+side*24-2,2*CELL+24,4);
      for(let j=0;j<5;j++){g.fillStyle='#202b3b';g.fillRect(x+j*30-3,y+side*24-4,6,8);glow(g,x+j*30,y+side*24,15,.25);g.fillStyle='#ffd399';g.fillRect(x+j*30-1,y+side*24-1,2,2);}
    }
  }
  // Outer cliffs never cover the route or alter placement geometry.
  for(let i=0;i<27;i++){
    const x=i*60+noise(i)*15;
    polygon(g,[[x-25,0],[x,27+noise(i+5)*19],[x+42,0]],'#171c2b');
    polygon(g,[[x-20,H],[x+4,H-22-noise(i+7)*20],[x+49,H]],'#131a26');
  }
  g.fillStyle='#111c2bd9';g.fillRect(36,H-73,200,36);g.strokeStyle='#de916953';g.strokeRect(36,H-73,200,36);
  g.font='bold 10px Consolas,monospace';g.fillStyle='#ffc58d';g.fillText('EMBER RIFT / SECTOR 12',47,H-58);g.font='8px Consolas,monospace';g.fillStyle='#bfb4b5';g.fillText('THREE BRIDGES. ONE LAST KEEP.',47,H-45);
}

export function drawEmberAtmosphere(g:CanvasRenderingContext2D,time:number,motion:boolean,count:number):void {
  g.save();
  for(let i=0;i<count;i++){
    const y=((noise(i+830)*H-(motion?time*(5+noise(i)*7):0))%H+H)%H;
    const x=(18.1+noise(i+71)*1.8)*CELL+Math.sin(time*.4+i)*6;
    const row=Math.floor(y/CELL);if([3,8,14].includes(row))continue;
    g.globalAlpha=.2+.25*noise(i+3);g.fillStyle=i%3?'#ffac60':'#ffe1b3';g.beginPath();g.arc(x,y,1+noise(i)*1.3,0,TAU);g.fill();
  }
  g.globalAlpha=1;
  const x=GATE.x,y=GATE.y;
  glow(g,x,y-23,58,.12);
  polygon(g,[[x-29,y-9],[x-29,y-37],[x-17,y-45],[x+17,y-45],[x+29,y-37],[x+29,y-9],[x,y+12]],'#5c6678');
  polygon(g,[[x-29,y-37],[x-17,y-45],[x+17,y-45],[x+29,y-37],[x,y-26]],'#91909a');
  g.fillStyle='#1f293d';g.fillRect(x-7,y-22,14,27);g.fillStyle='#ffc185';g.fillRect(x-3,y-18,6,20);
  for(const side of [-1,1]){g.fillStyle='#81838c';g.fillRect(x+side*26-7,y-36,14,31);g.fillStyle='#c39c87';g.fillRect(x+side*26-10,y-40,20,7);g.fillStyle='#ffc186';g.fillRect(x+side*26-2,y-27,4,7);}
  polygon(g,[[x-15,y-45],[x,y-65],[x+15,y-45],[x,y-35]],'#e3b095');
  g.restore();
}

export const EMBER_COVER=`<svg viewBox="0 0 460 550" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
<defs><linearGradient id="eSky" x2=".2" y2="1"><stop stop-color="#382c43"/><stop offset="1" stop-color="#161b2a"/></linearGradient><linearGradient id="eLava" x2="0" y2="1"><stop stop-color="#ffcf78"/><stop offset=".4" stop-color="#f97940"/><stop offset="1" stop-color="#7b263e"/></linearGradient><radialGradient id="eGlow"><stop stop-color="#ffad6b" stop-opacity=".4"/><stop offset="1" stop-color="#f56b44" stop-opacity="0"/></radialGradient></defs>
<rect width="460" height="550" fill="url(#eSky)"/><circle cx="102" cy="112" r="48" fill="#e5b9a1" opacity=".15"/><circle cx="105" cy="109" r="34" fill="#ba9292" opacity=".25"/>
<path d="M0 223L62 170 108 207 172 109 237 211 296 162 338 211 398 134 460 209V550H0Z" fill="#272a3b"/><path d="M142 192L172 109 198 180 176 166Z" fill="#cc937b" opacity=".35"/>
<path d="M185 208L221 219 201 284 239 326 213 369 247 422 213 550H298L292 415 271 367 281 322 245 278 256 220Z" fill="url(#eLava)"/>
<path d="M0 301L67 269 165 251 189 292 165 340 194 394 162 455 0 488Z" fill="#4b4556" stroke="#a87c76"/><path d="M288 252L366 220 460 277V480L355 438 318 378 305 319Z" fill="#514956" stroke="#aa8581"/>
<path d="M0 386L68 346 144 369 121 312 182 292M247 278L307 262 339 304 313 349 274 367M192 394L152 408 175 441 239 422 332 401 360 356" fill="none" stroke="#182032" stroke-width="28"/>
<path d="M0 386L68 346 144 369 121 312 182 292M247 278L307 262 339 304 313 349 274 367M192 394L152 408 175 441 239 422 332 401 360 356" fill="none" stroke="#7e8491" stroke-width="18"/>
<path d="M178 293L249 278M190 394L279 367M236 422L312 412" stroke="#b6a594" stroke-width="22"/><path d="M178 293L249 278M190 394L279 367M236 422L312 412" stroke="#394859" stroke-width="14" stroke-dasharray="3 5"/>
<ellipse cx="365" cy="345" rx="61" ry="18" fill="#151b2c"/><path d="M324 334V281L360 258 405 277V334L365 357Z" fill="#758090" stroke="#c7b2a2"/><path d="M324 281L365 299V357L324 334Z" fill="#4d5c76"/><path d="M319 292V252L334 238 349 251V311M384 310V235L402 220 419 233V316" fill="#8992a1" stroke="#d5b49f"/><path d="M316 254L334 224 352 252 335 263M381 237L402 201 422 234 403 246" fill="#bf937e" stroke="#eed0aa"/>
<path d="M352 345V315Q363 295 375 315V345" fill="#1b263e" stroke="#d8b499"/><path d="M359 339V317Q364 308 368 317V339" fill="#ffd499"/><path d="M402 201V172L429 178 425 189 402 185" fill="#e5b590" stroke="#e0c7a9"/>
<circle cx="238" cy="348" r="139" fill="url(#eGlow)"/><path d="M0 451L70 414 125 466 182 430 213 493 287 462 345 493 407 447 460 475V550H0Z" fill="#121d2b"/>
<g fill="#ffd298"><circle cx="194" cy="218" r="1.5"/><circle cx="216" cy="261" r="2"/><circle cx="235" cy="307" r="1.5"/><circle cx="203" cy="346" r="2"/><circle cx="252" cy="394" r="1.5"/><circle cx="278" cy="451" r="2"/><circle cx="155" cy="95" r="1"/></g></svg>`;
