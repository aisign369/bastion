import test from 'node:test';
import assert from 'node:assert/strict';
import { battlefieldEvent, environmentRange } from '../game/bastion/src/battlefield-events.ts';
import { emptyCareer, normalizeCareer, recordCareer, mergeCareer, careerMissions, canUseFinish, careerKey } from '../game/bastion/src/progression.ts';
import { serializeBattle, sanitizeBattle } from '../game/bastion/src/battle-save.ts';
import { validateFeedback, feedbackDraftKey } from '../game/bastion/src/feedback.ts';
import { pinchScale, gestureIsTap, fittedMapWidth } from '../game/bastion/src/mobile-input.ts';
import { waveHealth, roleTuning, chainMultiplier, splashMultiplier } from '../game/bastion/src/balance.ts';
test('forecast gives five full seconds of warning; repeat cycles and legacy runs stay deterministic',()=>{
  for(const map of ['orchid','ember','frost','sunspire']){
    assert.equal(battlefieldEvent(map,5,25).phase,'calm');assert.equal(battlefieldEvent(map,6,17.999).phase,'calm');
    assert.equal(battlefieldEvent(map,6,18).phase,'warning');assert.equal(battlefieldEvent(map,6,18).seconds,5);
    assert.equal(battlefieldEvent(map,6,22.999).phase,'warning');assert.equal(battlefieldEvent(map,6,23).phase,'active');
    assert.equal(battlefieldEvent(map,6,32).phase,'calm');assert.equal(battlefieldEvent(map,6,60).phase,'warning');
    assert.equal(battlefieldEvent(map,30,100,false).phase,'calm');
    assert.deepEqual(battlefieldEvent(map,16,26),battlefieldEvent(map,16,26));
  }
});
test('weather has explicit counters, boss protection and no compounded range penalty',()=>{
  const storm=battlefieldEvent('sunspire',6,25), snow=battlefieldEvent('frost',6,25);
  assert.equal(environmentRange('rail',storm,false),1);assert.equal(environmentRange('bolt',storm,false),.85);
  assert.equal(environmentRange('bolt',storm,true),.85);assert.equal(environmentRange('rail',storm,true),.85);
  assert.equal(snow.enemySpeed,.82);assert.equal(snow.bossSpeed,.9);assert.equal(snow.rate,.92);
  assert.equal(battlefieldEvent('ember',6,25).splash,1.15);assert.equal(battlefieldEvent('orchid',6,25).range,1.12);
});
test('legacy balance and current role corrections are independent',()=>{
  assert.equal(roleTuning('rail',1).damage,1);assert.equal(roleTuning('rail',2).damage,1.12);
  assert.equal(roleTuning('frost',2).range,1.1);assert.equal(chainMultiplier(3,1),.75**3);assert.equal(chainMultiplier(3,2),.72**3);
  assert.ok(Math.abs(splashMultiplier(58,58,2)-.6)<1e-12);assert.ok(Math.abs(splashMultiplier(58,58,1)-.45)<1e-12);
  for(let w=1;w<=100;w++){assert.ok(waveHealth(w,2)>0);if(w>1)assert.ok(waveHealth(w,2)>waveHealth(w-1,2));}
  assert.equal(waveHealth(30,1),1+29*.30+20**2*.022);assert.ok(waveHealth(30,2)<waveHealth(30,1));
});
test('career progress never farms rewards by replaying or restoring a wave',()=>{
  const record={wave:5,kills:60,gold:800,variety:3,legendary:0,perfect:0};
  const once=recordCareer(emptyCareer(),'orchid',record),twice=recordCareer(once,'orchid',record);
  assert.deepEqual(once.maps,twice.maps);assert.equal(careerMissions(twice).filter(m=>m.value>=m.goal).length,2);
  assert.equal(canUseFinish(twice,'copper'),true);assert.equal(canUseFinish(twice,'royal'),false);
});
test('device merges preserve every map and use the newer cosmetic choice',()=>{
  const first=recordCareer(emptyCareer(),'orchid',{wave:8,kills:120,gold:900,variety:5,legendary:1,perfect:0});first.finish='aurora';first.updatedAt=10;
  const second=recordCareer(emptyCareer(),'ember',{wave:10,kills:200,gold:1500,variety:1,legendary:0,perfect:0});second.finish='copper';second.updatedAt=20;
  const merged=mergeCareer(first,second);assert.equal(merged.maps.orchid.wave,8);assert.equal(merged.maps.ember.wave,10);assert.equal(merged.finish,'copper');
  assert.deepEqual(mergeCareer(second,first),merged);assert.deepEqual(mergeCareer(merged,merged),merged);
});
test('all four maps must earn the frontier finish, and malformed career data cannot unlock it',()=>{
  let c=emptyCareer();for(const map of ['orchid','ember','frost'])c=recordCareer(c,map,{wave:5,kills:20,gold:100,variety:1,legendary:0,perfect:0});
  assert.equal(canUseFinish(c,'royal'),false);c=recordCareer(c,'sunspire',{wave:5,kills:20,gold:100,variety:1,legendary:0,perfect:0});assert.equal(canUseFinish(c,'royal'),true);
  assert.equal(normalizeCareer({finish:'royal',maps:{orchid:{wave:NaN}}}).finish,'standard');assert.notEqual(careerKey('alice'),careerKey('bob'));
});
test('battle snapshot survives JSON with enemy, tower and projectile references intact',()=>{
  const towers=[{key:'frost'},{key:'mortar'}], enemy={type:'saboteur',hp:60,maxhp:95,spd:62,r:9,lives:2,dist:600,lane:2,slowF:.55,slowT:1.7,chan:towers[1],chanT:.4,shieldOn:false};
  const live={active:true,spawnI:12,clock:26.3,elapsed:26.3,time:48,seed:4321,combo:7,comboT:.6,comboMult:1.56,idleOn:false,idleTimer:0,cards:[],creeps:[enemy],towers,projs:[{kind:'shard',x:10,y:20,ang:1,spd:340,dmg:6,slowF:.55,slowT:1.7,target:enemy,src:towers[0]}],shells:[{sx:3,sy:4,tx:100,ty:200,t:.4,ft:1.2,dmg:35,splash:58,src:towers[1]}]};
  const stored=JSON.parse(JSON.stringify(serializeBattle(live))),restored=sanitizeBattle(stored,'orchid',2,100);
  assert.equal(restored.creeps[0].chanIndex,1);assert.equal(restored.creeps[0].hp,60);assert.equal(restored.projs[0].targetIndex,0);assert.equal(restored.projs[0].srcIndex,0);
  assert.equal(restored.shells[0].srcIndex,1);assert.equal(restored.shells[0].t,.4);assert.equal(restored.clock,26.3);assert.equal(restored.seed,4321);assert.equal(restored.comboT,.6);
  assert.equal(battlefieldEvent('orchid',16,restored.elapsed).phase,'active');
});
test('corrupt live units reject a snapshot; pending cards and cooldown values are preserved',()=>{
  const base={active:false,creeps:[],projs:[],shells:[],cards:[2,4,8],seed:77};
  assert.deepEqual(sanitizeBattle(base,'frost',0,10).cards,[2,4,8]);assert.equal(sanitizeBattle({...base,shells:[null]},'frost',0,10),null);
  assert.equal(sanitizeBattle({...base,creeps:[{type:'unknown'}]},'frost',0,10),null);
  const clamped=sanitizeBattle({...base,projs:[{kind:'shard',targetIndex:1000,srcIndex:1000,slowF:NaN}]},'frost',1,10);assert.equal(clamped.projs[0].targetIndex,-1);assert.equal(clamped.projs[0].slowF,1);
});
test('pinch moves both directions and cannot accidentally build after panning or a two-finger gesture',()=>{
  assert.equal(pinchScale(1,100,200),2);assert.equal(pinchScale(2,200,100),1);assert.equal(pinchScale(2,100,1000),3);assert.equal(pinchScale(1,100,1),1);
  assert.equal(gestureIsTap({startX:50,startY:50,moved:false},51,51,false),true);assert.equal(gestureIsTap({startX:50,startY:50,moved:false},51,51,true),false);
  assert.equal(gestureIsTap({startX:50,startY:50,moved:true},50,50,false),false);assert.ok(Math.abs(fittedMapWidth(640,300,16/9)-300*16/9)<1e-10);
});
test('feedback trims messages, limits length and keeps technical diagnostics opt-in',()=>{
  const valid={id:'test-report-001',kind:'balance',message:'  Tower placement feels good.  ',rating:4,createdAt:1,version:'test',map:'ember',wave:8,username:'Tester'};
  assert.equal(validateFeedback(valid).message,'Tower placement feels good.');assert.equal('diagnostics' in validateFeedback(valid),false);
  assert.throws(()=>validateFeedback({...valid,message:'short'}),/10/);assert.throws(()=>validateFeedback({...valid,message:'a'.repeat(1501)}),/1500/);assert.throws(()=>validateFeedback({...valid,rating:8}),/rating/);
  assert.notEqual(feedbackDraftKey('guest'),feedbackDraftKey('alice'));
});
