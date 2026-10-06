import { CELL, W, H, WAY, GATE, PATHLEN, posAt, pathSet, blockedSet, activeMap } from './path';

const TAU=Math.PI*2;
const noise=(n:number)=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
function polygon(g:CanvasRenderingContext2D,p:number[][],fill:string){g.beginPath();p.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fillStyle=fill;g.fill();}
function road(g:CanvasRenderingContext2D,frost:boolean){
  const line=()=>{g.beginPath();WAY.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));};
  g.lineJoin='round';g.lineCap='round';
  const layers=frost?[[64,'#122d4866'],[54,'#819daf'],[46,'#d0e2e9'],[37,'#748d9f'],[30,'#8fa8b8']]:[[64,'#211d2b55'],[54,'#614434'],[46,'#d7af76'],[37,'#927354'],[30,'#b99465']];
  for(const [width,color] of layers){line();g.lineWidth=width as number;g.strokeStyle=color as string;g.stroke();}
  for(let d=12;d<PATHLEN-12;d+=28){const p=posAt(d);g.save();g.translate(p.x,p.y);g.rotate(Math.atan2(p.dy,p.dx));g.strokeStyle=frost?'#364f6866':'#67453066';g.lineWidth=1;g.beginPath();g.moveTo(11,-15);g.lineTo(11,15);g.stroke();g.fillStyle=frost?'#e6f7fd99':'#f8dc9a88';g.fillRect(-3,-1,6,2);g.restore();}
}
function plaque(g:CanvasRenderingContext2D,title:string,subtitle:string,frost:boolean){
  g.fillStyle=frost?'#172e46db':'#30283adb';g.fillRect(35,H-72,232,36);g.strokeStyle=frost?'#c0e8ff66':'#edc18066';g.strokeRect(35,H-72,232,36);g.font='bold 10px Consolas,monospace';g.fillStyle=frost?'#caf0ff':'#ffe1a6';g.fillText(title,46,H-57);g.font='8px Consolas,monospace';g.fillStyle=frost?'#a9c7d8':'#cebcb0';g.fillText(subtitle,46,H-44);
}
function crystal(g:CanvasRenderingContext2D,x:number,y:number,s:number){
  polygon(g,[[x-s,y],[x-s*.65,y-s],[x,y-s*2.3],[x+s*.7,y-s],[x+s,y],[x,y+s*.35]],'#91d9ec');
  polygon(g,[[x,y-s*2.3],[x+s*.7,y-s],[x+s,y],[x,y+s*.35]],'#458ba8');
  polygon(g,[[x-s*.65,y-s],[x,y-s*2.3],[x-s*.15,y-s*.1]],'#e5fbff');
}
function pine(g:CanvasRenderingContext2D,x:number,y:number,s:number){
  g.fillStyle='#355067';g.fillRect(x-2,y-4,4,s*.65);
  for(let j=0;j<3;j++){const yy=y-j*s*.35,w=s*(1-j*.2);polygon(g,[[x-w,yy],[x,yy-s*1.1],[x+w,yy]],'#36576b');polygon(g,[[x-w*.7,yy-s*.32],[x,yy-s*1.1],[x+w*.7,yy-s*.32],[x,yy-s*.45]],'#d7edf3');}
}

/** Static terrain is cached with the board. Cosmetic noise never advances gameplay RNG. */
export function drawFrontierField(g:CanvasRenderingContext2D):void{
  const frost=activeMap.id==='frost';
  g.save();
  const wash=g.createLinearGradient(0,0,W,H);
  if(frost){wash.addColorStop(0,'#bfd6df');wash.addColorStop(.5,'#809ead');wash.addColorStop(1,'#45627a');}
  else{wash.addColorStop(0,'#c5a371');wash.addColorStop(.45,'#a17b58');wash.addColorStop(1,'#705343');}
  g.fillStyle=wash;g.fillRect(0,0,W,H);
  for(let i=0;i<65;i++){
    const x=noise(i+12)*W,y=noise(i+112)*H,s=30+noise(i+222)*90;
    g.beginPath();g.ellipse(x,y,s,s*.25,frost?-.3:-.15,0,TAU);g.fillStyle=frost?'#e9f7ff18':'#f3d49315';g.fill();
    g.beginPath();g.ellipse(x+3,y+7,s,s*.24,frost?-.3:-.15,Math.PI,TAU);g.strokeStyle=frost?'#22486712':'#513f351c';g.lineWidth=2;g.stroke();
  }
  // The exact occupied grid footprint remains visible around the entire lake/oasis.
  const x=(frost?9:10)*CELL,y=(frost?6:7)*CELL,w=(frost?5:6)*CELL,h=(frost?6:4)*CELL;
  g.fillStyle=frost?'#d7f3fb':'#e6c38a';g.fillRect(x-6,y-6,w+12,h+12);
  const water=g.createLinearGradient(x,y,x+w,y+h);
  water.addColorStop(0,frost?'#3e7fa5':'#254d5c');water.addColorStop(.5,frost?'#8dcddd':'#367b7d');water.addColorStop(1,frost?'#3b7094':'#235663');g.fillStyle=water;g.fillRect(x,y,w,h);
  if(frost){
    // Fractured ice gives an immediate visual reason towers cannot stand here.
    for(let i=0;i<12;i++){const px=x+noise(i+89)*w,py=y+noise(i+199)*h;g.beginPath();g.moveTo(px-24,py-17);g.lineTo(px,py);g.lineTo(px+18,py+28);g.moveTo(px,py);g.lineTo(px+28,py-9);g.strokeStyle=i%2?'#d6f8ff77':'#204f7699';g.lineWidth=i%2?1:2;g.stroke();}
    for(const [xx,yy] of [[x+12,y+16],[x+w-12,y+33],[x+24,y+h-15],[x+w-22,y+h-15]]){crystal(g,xx,yy,12);crystal(g,xx+17,yy+5,8);}
  }else{
    for(let i=0;i<12;i++){const px=x+20+noise(i+42)*(w-40),py=y+12+noise(i+97)*(h-24);g.beginPath();g.ellipse(px,py,11+noise(i)*20,3,0,0,Math.PI);g.strokeStyle='#9de6c035';g.lineWidth=1.4;g.stroke();}
    for(const side of [-1,1])for(let i=0;i<3;i++){
      const px=x+w/2+side*(w/2+17),py=y+25+i*58;
      g.strokeStyle='#73513c';g.lineWidth=5;g.beginPath();g.moveTo(px,py+13);g.quadraticCurveTo(px-6,py,px+3,py-26);g.stroke();
      for(let j=0;j<5;j++){const angle=(j/4)*Math.PI;g.strokeStyle=j%2?'#4d8270':'#315f5c';g.lineWidth=4;g.beginPath();g.moveTo(px+3,py-26);g.quadraticCurveTo(px+3+Math.cos(angle)*21,py-41,px+3+Math.cos(angle)*31,py-20+Math.sin(angle)*9);g.stroke();}
    }
  }
  // Decorations occupy only safe ground and remain small enough to leave tower cells readable.
  for(let i=0;i<100;i++){
    const c=Math.floor(noise(i+1200)*32),r=Math.floor(noise(i+1800)*18),key=`${c},${r}`;
    if(pathSet.has(key)||blockedSet.has(key))continue;
    const px=(c+.5)*CELL,py=(r+.6)*CELL,s=4+noise(i+55)*8;
    g.fillStyle='#10243922';g.beginPath();g.ellipse(px+3,py+5,s+3,4,0,0,TAU);g.fill();
    if(frost){if(i%4===0)pine(g,px,py,s);else if(i%5===0)crystal(g,px,py,s);else{polygon(g,[[px-s,py],[px-3,py-s],[px+s,py-s*.5],[px+s*.7,py+3]],'#5c7d93');polygon(g,[[px-s,py],[px-3,py-s],[px+s,py-s*.5],[px,py-2]],'#d2e6ee');}}
    else{
      polygon(g,[[px-s,py],[px-s,py-s],[px+s*.7,py-s*1.4],[px+s,py+2]],'#765642');polygon(g,[[px-s,py-s],[px+s*.7,py-s*1.4],[px+s,py-s*.8],[px,py-s*.4]],'#dab47a');
      if(i%5===0){g.fillStyle='#e2c48c';g.fillRect(px-4,py-17,8,14);g.fillStyle='#654b3c';g.fillRect(px-7,py-20,14,4);g.strokeStyle='#8c6748';g.lineWidth=1;g.strokeRect(px-4,py-17,8,14);}
    }
  }
  road(g,frost);
  // Border scenery is above/below all route rows, so no playable cell is obscured.
  for(let i=0;i<25;i++){const px=i*65;polygon(g,[[px-24,0],[px+9,22+noise(i+21)*15],[px+49,0]],frost?'#648498':'#6b5143');if(frost)polygon(g,[[px-24,0],[px+9,14],[px+49,0]],'#e6f4f7');}
  plaque(g,frost?'FROSTWATCH / SECTOR 13':'SUNSPIRE RUINS / SECTOR 14',frost?'THIN ICE. STEADY HANDS.':'THE OASIS HOLDS NO TOWERS.',frost);
  g.restore();
}

export function drawFrontierAtmosphere(g:CanvasRenderingContext2D,time:number,motion:boolean,count:number):void{
  const frost=activeMap.id==='frost';g.save();
  for(let i=0;i<count;i++){
    const speed=frost?8:3;
    const x=(noise(i+830)*W+(motion?time*speed:0))%W,y=(noise(i+440)*H+(motion?time*(frost?11:1.5):0))%H;
    g.globalAlpha=frost?.22+noise(i)*.2:.12+noise(i)*.12;g.fillStyle=frost?'#f3fbff':'#ffe0aa';g.beginPath();g.arc(x,y,frost?1+noise(i)*1.1:.8+noise(i),0,TAU);g.fill();
  }
  g.globalAlpha=1;const x=GATE.x,y=GATE.y;
  g.fillStyle='#14203066';g.beginPath();g.ellipse(x,y+8,33,15,0,0,TAU);g.fill();
  const aura=g.createRadialGradient(x,y-24,0,x,y-24,50);aura.addColorStop(0,frost?'#b0edff44':'#ffc85a44');aura.addColorStop(1,'#ffffff00');g.fillStyle=aura;g.fillRect(x-50,y-74,100,100);
  polygon(g,[[x-24,y+3],[x-24,y-32],[x,y-48],[x+24,y-32],[x+24,y+3],[x,y+12]],frost?'#678da6':'#aa8254');
  polygon(g,[[x-24,y-32],[x,y-48],[x+24,y-32],[x,y-21]],frost?'#dcf4ff':'#edd2a0');
  g.fillStyle=frost?'#233d58':'#493b3e';g.fillRect(x-7,y-21,14,25);g.fillStyle=frost?'#bdefff':'#ffe6a3';g.fillRect(x-3,y-16,6,20);
  for(const side of [-1,1]){
    g.fillStyle=frost?'#83acc1':'#c29e68';g.fillRect(x+side*24-7,y-33,14,34);
    if(frost)polygon(g,[[x+side*24-12,y-34],[x+side*24,y-55],[x+side*24+12,y-34]],'#e5f8ff');
    else{g.fillStyle='#efd09a';g.fillRect(x+side*24-10,y-37,20,7);polygon(g,[[x+side*24-6,y-38],[x+side*24,y-62],[x+side*24+6,y-38]],'#d4b476');}
  }
  if(frost)crystal(g,x,y-46,7);
  else{g.strokeStyle='#f8df9c';g.lineWidth=2;g.beginPath();g.arc(x,y-49,9,0,TAU);g.stroke();g.fillStyle='#ffe6aa';g.beginPath();g.arc(x,y-49,4,0,TAU);g.fill();}
  g.restore();
}

export const FROST_COVER=`<svg viewBox="0 0 460 550" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
<defs><linearGradient id="fSky" x2="0" y2="1"><stop stop-color="#1b354f"/><stop offset="1" stop-color="#789cac"/></linearGradient><linearGradient id="fIce" x2="1" y2="1"><stop stop-color="#b5e9f5"/><stop offset="1" stop-color="#376c8f"/></linearGradient></defs>
<rect width="460" height="550" fill="url(#fSky)"/><circle cx="108" cy="110" r="44" fill="#dcf7ff" opacity=".65"/>
<path d="M0 100Q148 15 287 99T460 68M0 124Q157 38 289 115T460 89" fill="none" stroke="#7ce2cc" stroke-width="13" opacity=".12"/>
<path d="M0 252L69 151 118 228 201 95 286 223 343 141 460 240V550H0Z" fill="#496980"/><path d="M144 187L201 95 245 158 207 147 192 169 180 158ZM32 205L69 151 93 189 66 180ZM315 182L343 141 378 175 341 161Z" fill="#d5eaf1"/>
<path d="M0 300L87 264 181 302 261 251 460 307V550H0Z" fill="#b7d1db"/>
<path d="M49 350L183 310 294 371 222 471 72 446Z" fill="url(#fIce)" stroke="#e1f8ff" stroke-width="7"/><path d="M83 374L151 390 183 341M151 390L165 445 205 401 251 395M165 445L102 426" fill="none" stroke="#d3f4ff" opacity=".6"/>
<path d="M0 327L54 302 302 312 315 401 372 401 383 481 460 469" fill="none" stroke="#46647c" stroke-width="25"/><path d="M0 327L54 302 302 312 315 401 372 401 383 481 460 469" fill="none" stroke="#91b4c6" stroke-width="15"/>
<path d="M295 340V290L344 265 391 290V345L344 373Z" fill="#6c98b1" stroke="#daeff8"/><path d="M295 290L344 316V373L295 340Z" fill="#4b738f"/><path d="M287 322V268H313V336M374 337V265H403V322" fill="#9cc2d4" stroke="#e0f6ff"/><path d="M280 271L300 233 320 271ZM366 268L389 222 410 268Z" fill="#eafaff"/>
<path d="M330 359V327Q344 309 357 327V359Z" fill="#27415d"/><path d="M339 354V328Q344 320 348 328V354Z" fill="#c5f6ff"/>
<path d="M344 264L332 244 344 207 358 244Z" fill="#b8f3ff" stroke="#ebfbff"/>
<g fill="#28485e" stroke="#d3e9ed" stroke-width="3"><path d="M14 430L36 380 56 430ZM26 403L36 364 48 403ZM67 478L91 420 113 478ZM78 451L91 403 104 451ZM393 470L418 405 444 470ZM403 439L418 390 434 439Z"/></g>
<path d="M0 509L98 483 161 504 242 478 336 509 460 488V550H0Z" fill="#2b4961"/><g fill="#f0fbff" opacity=".7"><circle cx="39" cy="88" r="2"/><circle cx="177" cy="223" r="2"/><circle cx="377" cy="116" r="2"/><circle cx="256" cy="61" r="1.5"/><circle cx="211" cy="315" r="2"/><circle cx="135" cy="467" r="2"/><circle cx="428" cy="260" r="1.5"/></g></svg>`;

export const SUNSPIRE_COVER=`<svg viewBox="0 0 460 550" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
<defs><linearGradient id="sSky" x2="0" y2="1"><stop stop-color="#393747"/><stop offset="1" stop-color="#c79b74"/></linearGradient><linearGradient id="sSand" x2=".5" y2="1"><stop stop-color="#d6b47c"/><stop offset="1" stop-color="#795344"/></linearGradient></defs>
<rect width="460" height="550" fill="url(#sSky)"/><circle cx="319" cy="124" r="60" fill="#f5d59d" opacity=".7"/><circle cx="319" cy="124" r="83" fill="#f5d59d" opacity=".06"/>
<path d="M0 256L67 233 146 251 222 214 315 249 391 231 460 265V550H0Z" fill="#82604f"/>
<path d="M0 322Q92 243 207 302T460 279V550H0Z" fill="url(#sSand)"/><path d="M0 414Q103 335 237 401T460 357V550H0Z" fill="#b58c60"/>
<ellipse cx="159" cy="361" rx="92" ry="40" fill="#ddc291"/><ellipse cx="159" cy="361" rx="80" ry="31" fill="#32676c"/><path d="M101 355Q146 342 204 357M118 368Q163 358 212 369" stroke="#9bc7a5" opacity=".6" fill="none"/>
<path d="M0 387L47 397 58 276 285 279 301 429 127 439 138 482 372 486 375 332 460 328" fill="none" stroke="#795941" stroke-width="25"/><path d="M0 387L47 397 58 276 285 279 301 429 127 439 138 482 372 486 375 332 460 328" fill="none" stroke="#e0bb80" stroke-width="14"/>
<path d="M75 350Q62 302 77 276M241 364Q251 312 238 299" stroke="#614b3c" stroke-width="8" fill="none"/><g stroke="#416e59" stroke-width="9" fill="none"><path d="M77 276Q48 259 27 285M77 276Q80 242 99 259M77 276Q115 254 125 280M238 299Q206 277 188 303M238 299Q248 271 266 282M238 299Q276 287 288 311"/></g>
<path d="M308 355V295L348 270 392 295V354L348 380Z" fill="#b08d60" stroke="#f4d6a0"/><path d="M308 295L348 318V380L308 355Z" fill="#826048"/>
<path d="M295 347V264H320V360M378 364V253H405V341" fill="#c3a474" stroke="#efd19c"/><path d="M290 264H324V255H290ZM372 253H411V244H372Z" fill="#efd6a4"/>
<path d="M301 254L307 219 314 254ZM381 243L391 199 401 243Z" fill="#d8b877"/><circle cx="349" cy="272" r="18" stroke="#f8dda0" stroke-width="4" fill="none"/><circle cx="349" cy="272" r="8" fill="#ffe2a1"/>
<path d="M335 369V338Q349 317 362 338V369Z" fill="#493b42"/><path d="M344 363V339Q349 330 353 339V363Z" fill="#ffe3a5"/>
<g fill="#b7996a" stroke="#e2c695"><path d="M23 463V426H43V468ZM204 506V472H227V511ZM426 430V400H447V438Z"/></g><path d="M0 524Q119 480 253 521T460 501V550H0Z" fill="#513c39"/></svg>`;
