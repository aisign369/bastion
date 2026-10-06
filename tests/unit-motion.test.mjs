import test from 'node:test';
import assert from 'node:assert/strict';
import {createUnitMotion,advanceUnitMotion,gaitPose,bossGaitPose,hitReaction} from '../game/bastion/src/unit-motion.ts';
const unit=(patch={})=>({type:'runner',dist:0,dx:1,dy:0,seed:0,...patch});
const progress=(hz,speed,seconds=1)=>{const u=unit(),v=createUnitMotion(u);for(let i=0;i<hz*seconds;i++){u.dist+=speed/hz;advanceUnitMotion(v,u,1/hz,true);}return v;};
test('gait follows distance at different frame rates, slow effects and game speeds',()=>{
  const normal=progress(60,20),lowFps=progress(30,20),slow=progress(60,10),fast=progress(60,40);
  assert.ok(Math.abs(normal.phase-lowFps.phase)<1e-12);
  assert.ok(Math.abs(normal.phase-slow.phase*2)<1e-12);
  assert.ok(Math.abs(normal.phase*2-fast.phase)<1e-12);
});
test('pause freezes pose; reduced motion resumes without replaying old distance',()=>{
  const u=unit(),v=createUnitMotion(u);u.dist=10;advanceUnitMotion(v,u,.1,true);const phase=v.phase;
  advanceUnitMotion(v,u,0,true);assert.equal(v.phase,phase);
  u.dist=100;advanceUnitMotion(v,u,.1,false);assert.equal(v.phase,phase);
  advanceUnitMotion(v,u,.1,true);assert.equal(v.phase,phase);assert.equal(v.moving,false);
});
test('stationary and channeling units never walk or mutate the simulation object',()=>{
  const u=unit({chan:{},dist:12}),v=createUnitMotion(unit());const before=JSON.stringify(u);
  advanceUnitMotion(v,u,.1,true);assert.equal(v.phase,0);assert.equal(v.moving,false);assert.equal(JSON.stringify(u),before);
});
test('turning takes the shortest angular path and settles without snapping',()=>{
  const u=unit({dx:-1,dy:.01}),v=createUnitMotion(u);u.dy=-.01;
  advanceUnitMotion(v,u,1/60,true);assert.ok(Math.abs(v.turn)<.01);
  u.dx=1;u.dy=0;advanceUnitMotion(v,u,1/60,true);assert.ok(v.facing>-1&&v.facing<1);
  for(let i=0;i<60;i++)advanceUnitMotion(v,u,1/60,true);assert.ok(v.facing>.99);
});
test('boss planted boot stays grounded; raised boot clears the ground',()=>{
  for(let i=0;i<48;i++){
    const phase=i/48,p=bossGaitPose(phase),a=phase*Math.PI*2;
    for(const [hip,knee,lift] of [[p.ll,p.kl,Math.max(0,Math.cos(a))],[p.lr,p.kr,Math.max(0,-Math.cos(a))]]){
      const y=-27+Math.cos(hip)*13.2+Math.cos(hip+knee)*12.1+p.bob;
      assert.ok(Math.abs(y-(-2-lift*5))<1e-10);
    }
  }
});
test('types have distinct periodic poses and hits decay to zero',()=>{
  assert.notDeepEqual(gaitPose('runner',.25),gaitPose('brute',.25));
  assert.notDeepEqual(gaitPose('warden',.25),gaitPose('saboteur',.25));
  assert.ok(Math.abs(gaitPose('runner',0).ll-gaitPose('runner',1).ll)<1e-12);
  const v=createUnitMotion(unit());v.hitAge=.06;assert.ok(hitReaction(v,'runner')>hitReaction(v,'boss'));
  v.hitAge=.21;assert.equal(hitReaction(v,'runner'),0);
});
