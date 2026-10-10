import test from 'node:test';
import assert from 'node:assert/strict';
import { combatHarness } from './combat-harness.mjs';
import { isBuildableOnMap, CELL } from '../game/bastion/src/maps.ts';
function bestCell(h,key){
  const {geometry,map}=h,range={bolt:130,frost:134.2,mortar:155,rail:250,tesla:118}[key],occupied=new Set(h.api.status().towers.map(t=>`${t.c},${t.r}`));
  const samples=[];for(let d=0;d<geometry.length;d+=32){const s=geometry.segments.find(s=>d<s.acc+s.len)||geometry.segments.at(-1);samples.push({x:s.x+s.dx*(d-s.acc),y:s.y+s.dy*(d-s.acc),weight:d<geometry.length*.45?1.15:1});}
  let best=null,score=0;for(let c=0;c<32;c++)for(let r=0;r<18;r++){if(!isBuildableOnMap(map.id,c,r)||occupied.has(`${c},${r}`))continue;
    const value=samples.reduce((n,p)=>n+(Math.hypot(p.x-(c+.5)*CELL,p.y-(r+.5)*CELL)<range?p.weight:0),0);
    if(value>score){score=value;best={c,r};}}
  return best;
}
for(const map of ['orchid','ember','frost','sunspire'])test(`${map}: affordable starter defense survives the first five waves`,()=>{
  const h=combatHarness(map);for(let i=0;i<3;i++){const p=bestCell(h,'bolt');assert.ok(h.api.build('bolt',p.c,p.r));}
  for(let w=1;w<=5;w++){
    if(w>1){let count=0;while(h.api.status().gold>=50&&count++<20){const key=w===3&&count===1?'frost':'bolt',p=bestCell(h,key);if(!h.api.build(key,p.c,p.r))break;}}
    h.api.startWave();for(let i=0;i<60*300&&h.api.status().active&&h.api.status().state==='play';i++)h.api.tick(1/60);
    assert.equal(h.api.status().state,'play',JSON.stringify(h.api.status()));assert.equal(h.api.status().cleared,w);assert.ok(h.api.status().lives>0);
  }
});
test('restoring a live battle produces the same kills, gold, lives and wave as an uninterrupted battle',()=>{
  const h=combatHarness('orchid',777);for(let i=0;i<3;i++){const p=bestCell(h,'bolt');h.api.build('bolt',p.c,p.r);}h.api.startWave();
  for(let i=0;i<270;i++)h.api.tick(1/60);const checkpoint=JSON.parse(JSON.stringify(h.api.checkpoint()));
  const finish=()=>{for(let i=0;i<60*300&&h.api.status().active;i++)h.api.tick(1/60);const s=h.api.status();return{lives:s.lives,gold:s.gold,kills:s.kills,wave:s.wave,cleared:s.cleared,seed:s.seed};};
  const uninterrupted=finish();h.api.replaceCheckpoint(checkpoint);assert.deepEqual(finish(),uninterrupted);
});

for(const map of ['orchid','ember','frost','sunspire'])test(`${map}: a mixed defense can complete all thirty waves including battlefield events`,()=>{
  const h=combatHarness(map,310);for(let i=0;i<3;i++){const p=bestCell(h,'bolt');h.api.build('bolt',p.c,p.r);}
  const roles=['frost','mortar','rail','tesla','bolt','rail','mortar','tesla'];
  for(let w=1;w<=30;w++){
    if(w>1){
      for(let purchase=0;purchase<60;purchase++){
        const towers=h.api.status().towers;
        const targetCount=w<10?7:w<16?14:w<21?24:40;
        if(towers.length<targetCount){const key=roles[(towers.length-3)%roles.length],p=bestCell(h,key);if(h.api.build(key,p.c,p.r))continue;}
        const priorities=towers.flatMap((t,i)=>['damage','rate'].map(track=>({i,track,lv:track==='damage'?t.dmgLv:t.rateLv,key:t.key})))
          .filter(p=>p.lv<3).sort((a,b)=>a.lv-b.lv+(a.key==='frost'&&a.track==='damage'?.4:0)-(b.key==='frost'&&b.track==='damage'?.4:0));
        if(!priorities.some(p=>h.api.upgrade(p.i,p.track)))break;
      }
    }
    h.api.startWave();
    let checkpoint=null;
    for(let i=0;i<60*300&&h.api.status().active&&h.api.status().state==='play';i++){
      h.api.tick(1/60);if(w===16&&i===24*60)checkpoint=JSON.parse(JSON.stringify(h.api.checkpoint()));
    }
    const result=h.api.status();assert.equal(result.cleared,w,`wave ${w}: lives ${result.lives}, state ${result.state}, gold ${result.gold}`);
    assert.ok(result.lives>0);assert.equal(result.state,w===30?'win':'play');
    if(checkpoint){
      assert.equal(checkpoint.battle.active,true);h.api.replaceCheckpoint(checkpoint);
      for(let i=0;i<60*300&&h.api.status().active;i++)h.api.tick(1/60);
      const replay=h.api.status();for(const key of ['lives','gold','kills','cleared','seed'])assert.equal(replay[key],result[key],`${map} weather checkpoint ${key}`);
    }
  }
});
