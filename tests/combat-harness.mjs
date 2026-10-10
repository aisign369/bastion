import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { MAPS, GEOMETRY, CELL, COLS, ROWS, isBuildableOnMap } from '../game/bastion/src/maps.ts';
import { battlefieldEvent, environmentRange, EVENTS, EMBER_VENTS } from '../game/bastion/src/battlefield-events.ts';
import { roleTuning, chainMultiplier, splashMultiplier, waveHealth } from '../game/bastion/src/balance.ts';
import { serializeBattle, sanitizeBattle } from '../game/bastion/src/battle-save.ts';
const source=fs.readFileSync(new URL('../game/bastion/src/game.ts',import.meta.url),'utf8');
const ast=ts.createSourceFile('game.ts',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
const declarations=new Map(),functions=new Map();
for(const statement of ast.statements){
  if(ts.isVariableStatement(statement))for(const declaration of statement.declarationList.declarations)declarations.set(declaration.name.getText(ast),declaration.getText(ast));
  if(ts.isFunctionDeclaration(statement))functions.set(statement.name.getText(ast),statement.getText(ast));
}
/** Run the actual production combat functions with presentation/storage adapters.
 * No DOM, copied combat formulas, Firebase credentials or player saves are used. */
export function combatHarness(mapId='orchid',seed=42){
  const map=MAPS.find(m=>m.id===mapId),geometry=GEOMETRY[mapId];
  const node={style:{},classList:{remove(){},add(){}},innerHTML:'',offsetWidth:0};
  const context=vm.createContext({Math:Object.assign(Object.create(Math),{random:()=>.5}),performance,console,
    roleTuning,chainMultiplier,splashMultiplier,waveHealth,battlefieldEvent,environmentRange,EVENTS,EMBER_VENTS,serializeBattle,sanitizeBattle,
    activeMap:map,CELL,COLS,ROWS,W:COLS*CELL,H:ROWS*CELL,WAY:geometry.way,PATHLEN:geometry.length,BREACH:geometry.way[0],GATE:geometry.way.at(-1),isBuildableOnMap,
    posAt(dist){const d=Math.min(geometry.length-.001,Math.max(0,dist)),seg=geometry.segments.find(s=>d<s.acc+s.len)||geometry.segments.at(-1);return{x:seg.x+seg.dx*(d-seg.acc),y:seg.y+seg.dy*(d-seg.acc),dx:seg.dx,dy:seg.dy};},
    $:()=>node,sfx(){},sfxAt(){},showBanner(){},renderPreview(){},saveGame(){},saveCareerProgress(){},saveBest(){},removeSelectedSave(){},showOverlay(){},addShake(){},burst(){},jagged(){return[];},Q(){return{glow:0,parts:0};},ART:{motion:false},PREFS:{autoWave:false},TPAL:{breach:'#fff'},CREEPC:{},CRAND:()=>.5,
  });
  const constants=['TOWERS','CREEPS','TORDER','MOD','BOSS_NAMES','WMODS','GRNG','statDmg','statRate','statRange'];
  const body=`const MAXW=30,START_LIVES=15,TAU=Math.PI*2;
    let state='play',paused=false,speedMul=1,lives=15,gold=180,kills=0,goldEarned=0,waveNum=0,cleared=0,waveActive=false,endless=false,bestWave=0;
    let spawnQ=[],spawnI=0,spawnClock=0,hpMul=1,curMod=null,idleOn=false,idleTimer=0,balanceVersion=2,waveElapsed=0,eventState=battlefieldEvent(activeMap.id,0,0),lastEventPhase='calm';
    let creeps=[],towers=[],projs=[],shells=[],beams=[],zaps=[],parts=[],floaters=[],rings=[],booms=[],frostFx=[],empFx=[],combo=0,comboT=0,comboMult=1,time=0,gateFlash=0,bossVignette=0,bossDieFx=null;
    const towerAt=new Map();
    ${constants.map(k=>'const '+declarations.get(k)+';').join('\n')}
    function chillF(){return .55*(MOD._chillWeaken||1);}
    function offerCards(){MOD.dmgMul*=1.08;state='play';}
    ${['bossNameFor','waveMod','waveDef','buildSpawnQueue','startWave','endWave','doSpawn','disableTower','leak','applySlow','hurt','pickTarget','teslaFire','fire','explode','update'].map(k=>functions.get(k)).join('\n')}
    GRNG.set(${seed});
    function build(key,c,r,level=0){const cost=TOWERS[key].cost;if(gold<cost||!isBuildableOnMap(activeMap.id,c,r)||towerAt.has(c+','+r))return false;
      const t={key,c,r,x:(c+.5)*CELL,y:(r+.5)*CELL,ang:0,cool:0,dmgLv:level,rateLv:level,invested:cost,mode:key==='rail'?'strong':'first',flash:0,recoil:0,spin:0,kills:0,abCd:0,odT:0,disabledT:0};gold-=cost;towers.push(t);towerAt.set(c+','+r,t);return true;}
    function status(){return{state,lives,gold,kills,goldEarned,cleared,wave:waveNum,active:waveActive,enemyCount:creeps.length,seed:GRNG.seed(),towers:towers.map(t=>({...t})),events:eventState};}
    function tick(dt){time+=dt;update(dt);}
    function snapshot(){return serializeBattle({active:waveActive,spawnI,clock:spawnClock,elapsed:waveElapsed,time,seed:GRNG.seed(),combo,comboT,comboMult,idleOn,idleTimer,cards:[],creeps,towers,projs,shells});}
    function restore(data){const b=sanitizeBattle(data,activeMap.id,towers.length,spawnQ.length);if(!b)throw Error('Invalid snapshot');
      waveActive=b.active;spawnI=b.spawnI;spawnClock=b.clock;waveElapsed=b.elapsed;time=b.time;GRNG.set(b.seed);combo=b.combo;comboT=b.comboT;comboMult=b.comboMult;idleOn=b.idleOn;idleTimer=b.idleTimer;
      curMod=waveActive?waveMod(waveNum):null;hpMul=waveDef(waveNum).hp;eventState=battlefieldEvent(activeMap.id,waveNum,waveElapsed,balanceVersion>=2&&waveActive);lastEventPhase=eventState.phase;
      creeps=b.creeps.map(c=>{const p=posAt(c.dist);return{...c,x:p.x-p.dy*c.lane,y:p.y+p.dx*c.lane,dx:p.dx,dy:p.dy,flash:0,chan:towers[c.chanIndex]||null};});
      projs=b.projs.map(p=>({...p,target:creeps[p.targetIndex]||null,src:towers[p.srcIndex]||null,tower:towers[p.towerIndex]||null}));shells=b.shells.map(p=>({...p,src:towers[p.srcIndex]||null}));}
    function upgrade(i,track){const t=towers[i],b=TOWERS[t.key],level=track==='damage'?'dmgLv':'rateLv',price=track==='damage'?b.dmgU[t[level]]:b.rateU[t[level]];
      if(!price||gold<price)return false;gold-=price;t.invested+=price;t[level]++;return true;}
    function checkpoint(){return{battle:snapshot(),towers:towers.map(t=>({...t})),gold,lives,kills,goldEarned,cleared};}
    function replaceCheckpoint(c){towers=c.towers.map(t=>({...t}));towerAt.clear();for(const t of towers)towerAt.set(t.c+','+t.r,t);state='play';gold=c.gold;lives=c.lives;kills=c.kills;goldEarned=c.goldEarned;cleared=c.cleared;restore(c.battle);}
    ({build,status,tick,startWave,snapshot,restore,checkpoint,replaceCheckpoint,upgrade})`;
  return {api:vm.runInContext(body,context),geometry,map};
}
