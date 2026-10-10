import type {TowerKey,TowerSkin} from './tower-skins';
type G=CanvasRenderingContext2D;
const TAU=Math.PI*2;
function shape(g:G,p:number[][],fill:string,edge?:string){g.beginPath();p.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fillStyle=fill;g.fill();if(edge){g.strokeStyle=edge;g.lineWidth=1.3;g.stroke();}}
function oval(g:G,x:number,y:number,rx:number,ry:number,fill:string,edge?:string){g.beginPath();g.ellipse(x,y,rx,ry,0,0,TAU);g.fillStyle=fill;g.fill();if(edge){g.strokeStyle=edge;g.lineWidth=1.4;g.stroke();}}
function line(g:G,p:number[][],color:string,width=2){g.beginPath();p.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.strokeStyle=color;g.lineWidth=width;g.lineJoin='round';g.lineCap='round';g.stroke();}
function gem(g:G,x:number,y:number,w:number,h:number,color='#72dbe7'){
  shape(g,[[x-w,y],[x-w*.55,y-h*.65],[x,y-h],[x+w,y],[x,y+h*.42]],color,'#d6fbff');
  shape(g,[[x,y-h],[x+w,y],[x,y+h*.42],[x-w*.2,y]],'#365d86');
  line(g,[[x-w*.55,y-h*.65],[x-w*.2,y],[x,y+h*.42]],'#e9ffff',.8);
}
function feather(g:G,x:number,y:number,side:number,lv:number){
  for(let j=0;j<5+lv;j++)shape(g,[[x,y+j*2],[x+side*(14+j*1.6),y-10+j*3],[x+side*(13+j*1.6),y-3+j*3],[x+side*4,y+10]],j%2?'#d2a64f':'#f0ce73','#614735');
}
function ankh(g:G,x:number,y:number,size:number){oval(g,x,y-size*.7,size*.3,size*.4,'#204c52','#e9ce80');line(g,[[x,y-size*.25],[x,y+size*.7]],'#e9ce80',2);line(g,[[x-size*.45,y+size*.02],[x+size*.45,y+size*.02]],'#e9ce80',2);}
function runes(g:G,x:number,y:number,n:number){for(let j=0;j<n;j++){const xx=x+j*6;line(g,[[xx,y+3],[xx,y-2],[xx+2,y-4],[xx+3,y+2]],'#e3c783',.8);}}

/** Each role has its own foundation rather than a shared recolored platform. */
export function frontierBase(g:G,s:TowerSkin,key:TowerKey){
  oval(g,1,8,32,17,'#07152466');
  if(s.motif==='ice'){
    if(key==='bolt'){
      for(const y of [-13,12]){shape(g,[[-30,y],[-22,y-5],[23,y-5],[31,y],[24,y+6],[-26,y+6]],'#3d586e','#b2d4e2');shape(g,[[-28,y],[-20,y-4],[23,y-4],[28,y]],'#f0faf9');}
      line(g,[[-18,-9],[-18,12]],'#7d9aa9',5);line(g,[[15,-9],[15,12]],'#7d9aa9',5);
    }else if(key==='frost'){
      for(let j=0;j<6;j++){g.save();g.rotate(j*TAU/6);shape(g,[[0,-27],[-7,-14],[0,-3],[7,-14]],'#93d7e1','#ecffff');g.restore();}oval(g,0,2,18,11,'#244e6b','#b5f4fc');
    }else if(key==='mortar'){
      oval(g,0,3,29,17,'#52758b','#d8f2f7');for(let j=0;j<7;j++){const a=Math.PI+j*Math.PI/6,x=Math.cos(a)*24,y=Math.sin(a)*15;shape(g,[[x-7,y+6],[x-7,y-5],[x+7,y-5],[x+7,y+6]],'#d7e9ec','#7799aa');}oval(g,0,4,18,10,'#253e56');
    }else if(key==='rail'){
      g.beginPath();g.ellipse(0,1,31,19,0,.2,Math.PI*1.8);g.strokeStyle='#567f94';g.lineWidth=7;g.stroke();g.strokeStyle='#c5eef3';g.lineWidth=2;g.stroke();for(const x of [-20,17])gem(g,x,9,5,12,'#b6c4f3');
    }else{
      for(const [x,y,w,h] of [[-22,5,8,18],[-9,12,8,13],[21,6,7,22],[10,15,7,16],[0,0,13,12]])gem(g,x,y,w,h,'#8bc8d9');
    }
  }else{
    if(key==='bolt'){
      oval(g,0,2,28,19,'#3b4142','#cfad62');for(let j=0;j<12;j++){const a=j*TAU/12;line(g,[[Math.cos(a)*22,2+Math.sin(a)*14],[Math.cos(a)*27,2+Math.sin(a)*18]],'#d9ba72',1.3);}oval(g,0,2,19,12,'#7f704b','#e4cf8a');
    }else if(key==='frost'){
      oval(g,0,5,29,18,'#a18752','#edd096');oval(g,0,3,24,13,'#204d56','#e3ce94');oval(g,0,3,18,9,'#5bb5b2','#93d6cb');for(let j=0;j<7;j++)line(g,[[-18+j*6,17],[-18+j*6,21-Math.abs(j-3)]],'#473f35',2);
    }else if(key==='mortar'){
      shape(g,[[-31,3],[0,-17],[31,3],[31,15],[0,27],[-31,15]],'#6f543b','#d9bd7d');shape(g,[[-25,0],[0,-14],[25,0],[0,13]],'#dbb675','#fae2a4');runes(g,-14,18,5);
    }else if(key==='rail'){
      shape(g,[[-29,-10],[29,-10],[33,7],[24,17],[-24,17],[-33,7]],'#655d47','#dfc88b');for(const side of [-1,1])for(let j=0;j<4;j++)shape(g,[[side*13,-7],[side*(23+j*3),-11+j*6],[side*(25+j*3),-6+j*6],[side*13,11]],j%2?'#b2995b':'#ddbc75','#6c553a');
    }else{
      shape(g,[[-25,12],[-22,-13],[-14,-22],[14,-22],[22,-13],[25,12],[16,24],[-16,24]],'#4b4642','#d9b66f');shape(g,[[-19,12],[-17,-11],[17,-11],[19,12],[11,19],[-11,19]],'#a98651','#e0c185');runes(g,-11,13,4);
    }
  }
}

export function frontierHead(g:G,s:TowerSkin,key:TowerKey,lv:number){
  if(s.motif==='ice')iceHead(g,key,lv);else desertHead(g,key,lv);
}
function iceHead(g:G,key:TowerKey,lv:number){
  if(key==='bolt'){
    // A harpoon ballista: bowed ice limbs, a tension string and spear magazine.
    const spread=18+lv*3;
    for(const side of [-1,1]){shape(g,[[3,side*5],[14,side*spread],[29,side*(spread+2)],[20,side*(spread-5)],[10,side*4]],'#8dc4d4','#effbff');line(g,[[29,side*(spread+2)],[-12,0]],'#e1eef7',1);}
    shape(g,[[-24,-6],[21,-6],[27,0],[21,6],[-24,6],[-30,0]],'#36566e','#b3d5e4');
    for(const y of lv===3?[-5,0,5]:[0]){line(g,[[-17,y],[37+lv*3,y]],'#d2e5eb',2);shape(g,[[36+lv*3,y-5],[47+lv*3,y],[36+lv*3,y+5],[39+lv*3,y]],'#b8f2fb','#f3ffff');}
    for(let j=0;j<lv+1;j++){line(g,[[-24+j*5,-8],[-24+j*5,-15]],'#687c93',3);gem(g,-23+j*5,-15,2,5);}
  }else if(key==='frost'){
    // Open snowflake rotor with six visibly forked crystal arms.
    oval(g,0,10,20,10,'#365777','#9acfe0');
    for(let j=0;j<6;j++){g.save();g.translate(0,-7);g.rotate(j*TAU/6);const r=24+lv*3;
      shape(g,[[-3,-7],[-3,-r],[0,-r-5],[3,-r],[3,-7]],'#9fdee8','#edffff');
      for(const side of [-1,1])line(g,[[0,-r+7],[side*(7+lv),-r+1]],'#cffbfa',2);
      if(lv>=2)gem(g,0,-r+2,3,7,'#b8f1ff');g.restore();
    }oval(g,0,-7,10,10,'#1e5a86','#c7faff');gem(g,0,-7,7,9,'#c2f7fb');
  }else if(key==='mortar'){
    // Counterweight trebuchet, with an icy projectile seated in the throwing cup.
    for(const side of [-1,1]){shape(g,[[-16,side*10],[-5,side*17],[9,side*16],[2,side*7]],'#527890','#d3e9f1');line(g,[[-11,side*10],[7,side*12]],'#c2dde8',2);}
    g.save();g.rotate(-.85);shape(g,[[-4,17],[-6,-28],[0,-37],[6,-28],[4,17]],'#678594','#d0e4eb');
    shape(g,[[-12,11],[-13,24],[13,24],[12,11]],'#2f506c','#b9d6e0');gem(g,0,23,7,8,'#a2c2db');
    oval(g,0,-30,17+lv,9,'#426381','#c5e4ef');oval(g,0,-36,11+lv*2,10+lv,'#e0f6f7','#83b3cc');
    line(g,[[-6,-43],[0,-36],[-3,-30]],'#a0cedf',1);if(lv===3){oval(g,-10,-30,6,6,'#c7ecf5','#729db5');oval(g,10,-30,6,6,'#c7ecf5','#729db5');}g.restore();oval(g,0,0,6,6,'#4a6d85','#e2f6fa');
  }else if(key==='rail'){
    // Floating aurora lenses inside a crescent cradle, without metal gun barrels.
    shape(g,[[-27,-14],[-13,-23],[0,-14],[-11,-13],[-16,-2],[-11,13],[0,14],[-13,23],[-27,14],[-20,0]],'#719fae','#dcf8ff');
    line(g,[[-15,0],[54+lv*3,0]],'#c5aaff',3);
    for(let j=0;j<3+lv;j++){const x=1+j*8,h=14-j*.8;gem(g,x,0,3,h,j%2?'#bcabed':'#90e5e8');}
    shape(g,[[48+lv*3,-6],[60+lv*3,0],[48+lv*3,6],[52+lv*3,0]],'#ecdeff','#b9eefb');
    oval(g,-15,0,6,9,'#735991','#d7c7f9');
  }else{
    // Antler conductor: branching natural ice with suspended aurora beads.
    shape(g,[[-7,15],[-5,-16],[0,-25],[5,-16],[7,15]],'#537993','#c5eef5');
    for(const side of [-1,1]){
      shape(g,[[side*3,0],[side*14,-13],[side*17,-38-lv*2],[side*23,-31],[side*21,-8],[side*5,10]],'#7ebacb','#dbffff');
      line(g,[[side*16,-18],[side*31,-23-lv*2],[side*29,-34-lv*2]],'#b4e5ec',3);
      if(lv>=1)line(g,[[side*18,-26],[side*10,-35-lv*2]],'#abdfed',3);
      if(lv>=2)line(g,[[side*25,-22],[side*35,-13],[side*38,-22]],'#a8d4e6',2);
      oval(g,side*17,-39-lv*2,3,3,'#b4ffeb','#ecffff');
    }oval(g,0,-19,7+lv,7+lv,'#69ccb9','#d4fff7');gem(g,0,-19,4,6,'#c1fff2');
  }
}
function desertHead(g:G,key:TowerKey,lv:number){
  if(key==='bolt'){
    // A living scarab machine: six legs, split lapis shell, spreading golden wings.
    for(const side of [-1,1])for(let j=0;j<3;j++)line(g,[[-13+j*10,side*8],[-18+j*11,side*(18+j%2*3)],[ -11+j*10,side*(23+j%2*3)]],'#a38a50',2);
    if(lv>=2)for(const side of [-1,1]){g.save();g.rotate(side*.12);feather(g,-14,side*9,side,lv-2);g.restore();}
    oval(g,-4,0,23,13,'#c8a451','#f5d88e');
    shape(g,[[-26,-1],[-20,-11],[-4,-14],[13,-7],[7,-1]],'#20666c','#dbbc69');shape(g,[[-26,1],[-20,11],[-4,14],[13,7],[7,1]],'#184b5b','#dbbc69');
    line(g,[[-23,0],[13,0]],'#edcf77',1.3);oval(g,16,0,8,9,'#c6a25b','#f3dba0');
    for(const y of lv===3?[-5,0,5]:[0]){line(g,[[20,y],[36+lv*2,y]],'#d5ba7c',3);shape(g,[[34+lv*2,y-3],[45+lv*2,y],[34+lv*2,y+3]],'#fff0bf','#967341');}
    oval(g,18,-4,2,2,'#9cefe6');oval(g,18,4,2,2,'#9cefe6');runes(g,-17,-5,3);
  }else if(key==='frost'){
    // Paired cobra guardians around an oasis fountain and a floating water droplet.
    oval(g,0,9,19,10,'#204d53','#ddc482');oval(g,0,9,13,6,'#62bdb5','#a2e1d2');
    for(const side of [-1,1]){g.save();g.scale(side,1);
      g.beginPath();g.moveTo(13,12);g.bezierCurveTo(28,14,24,-1,18,-8);g.bezierCurveTo(13,-18,18,-27-lv*3,23,-26-lv*3);g.strokeStyle='#c8a05c';g.lineWidth=6;g.stroke();
      shape(g,[[12,-14-lv*3],[10,-25-lv*3],[18,-36-lv*3],[27,-28-lv*3],[27,-17-lv*3],[20,-12-lv*3]],'#a8824a','#efd092');
      for(let j=0;j<4;j++)line(g,[[12+j,-26-lv*3+j*3],[24,-27-lv*3+j*3]],'#335e66',1.7);
      oval(g,20,-27-lv*3,5,4,'#cfb576','#ffe5a9');oval(g,18,-28-lv*3,1.5,1.5,'#91efe2');g.restore();
    }
    shape(g,[[0,-31-lv*2],[-8-lv,-17],[-6,-9],[0,-5],[6,-9],[8+lv,-17]],'#68cec1','#cffced');line(g,[[0,-26],[-3,-15],[0,-9]],'#e1fff3',1.5);
    if(lv>=2)ankh(g,0,-42,5);
  }else if(key==='mortar'){
    // Solar bombard: an open ritual dish held by winged sandstone supports.
    g.save();g.rotate(-.85);
    shape(g,[[-17,14],[-20,-9],[-10,-24],[10,-24],[20,-9],[17,14],[0,22]],'#7b5739','#e4c58c');
    for(const side of [-1,1]){shape(g,[[side*9,8],[side*26,-5],[side*25,-21],[side*19,-12],[side*10,-7]],'#c09a51','#edcd84');runes(g,side<0?-16:5,7,2);}
    oval(g,0,-24,22+lv*2,12+lv,'#edd28d','#634d38');oval(g,0,-25,16+lv*2,8+lv,'#654a34','#cb9b54');
    oval(g,0,-30-lv,8+lv*2,8+lv*2,'#efa752','#ffefb4');line(g,[[-4,-36-lv],[1,-31-lv],[4,-33-lv]],'#fff3c7',1.4);
    for(let j=0;j<lv+2;j++)line(g,[[-13+j*7,-17],[-13+j*7,-12]],'#c8ab68',2);g.restore();
  }else if(key==='rail'){
    // Eye of Ra, a feathered energy bow. The pupil is the focusing lens.
    feather(g,-18,-4,-1,lv);feather(g,8,-4,1,lv);
    shape(g,[[-25,0],[-13,-13],[6,-14],[26,0],[6,13],[-13,12]],'#e2c37c','#514234');
    shape(g,[[-21,0],[-10,-8],[7,-8],[21,0],[6,8],[-10,7]],'#1f535c','#f2d99a');oval(g,0,0,7+lv*.6,8+lv*.6,'#7cbfb1','#fbe7ae');oval(g,1,0,2,6,'#133947');
    line(g,[[-9,12],[-8,20],[0,24],[8,18]],'#e3c480',2);line(g,[[11,0],[49+lv*3,0]],'#f5df9d',3);
    for(let j=0;j<lv+2;j++){oval(g,25+j*7,0,2,8,'#305e62','#e5c776');}shape(g,[[47+lv*3,-5],[60+lv*3,0],[47+lv*3,5]],'#fff0c1','#b59258');
  }else{
    // Jackal-headed storm guardian, with headdress stripes and two ankh conductors.
    shape(g,[[-16,17],[-19,-3],[-12,-15],[12,-15],[19,-3],[16,17]],'#264448','#e4c77d');
    for(const side of [-1,1]){shape(g,[[side*6,-22],[side*16,-15],[side*21,4],[side*12,8]],'#d1ad60','#f4d996');for(let j=0;j<5;j++)line(g,[[side*11,-15+j*4],[side*18,-12+j*4]],'#335962',1.5);}
    shape(g,[[-10,-19],[-12,-35],[-8,-50],[0,-37],[8,-50],[12,-35],[10,-19],[0,-12]],'#243133','#baaa77');
    shape(g,[[-7,-48],[-4,-37],[-9,-37]],'#b88b53');shape(g,[[7,-48],[4,-37],[9,-37]],'#b88b53');
    shape(g,[[-7,-26],[0,-22],[7,-26],[5,-17],[0,-13],[-5,-17]],'#182a2f','#c9b67b');line(g,[[-6,-29],[-2,-28]],'#b4f2d8',2);line(g,[[2,-28],[6,-29]],'#b4f2d8',2);
    for(const side of [-1,1]){line(g,[[side*12,10],[side*25,-2],[side*27,-15]],'#c7a45d',3);ankh(g,side*27,-18-lv*2,6+lv);}
    oval(g,0,2,5+lv,7+lv,'#69bda5','#ffdd8e');runes(g,-6,14,3);if(lv>=2)oval(g,0,-36,4,3,'#f1cf75','#ffe8a8');
  }
}
