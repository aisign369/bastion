/** Presentation only: distance comes from the simulation; this module never writes to a unit. */
export interface MotionUnit { type:string; dist:number; dx:number; dy:number; seed:number; chan?:unknown }
export interface Gait { stride:number; legs:number; arms:number; bounce:number; lean:number; crouch:number; weight:number }
export const GAITS:Record<string,Gait>={
  runner:{stride:46,legs:.92,arms:.85,bounce:2.6,lean:.24,crouch:0,weight:1},
  soldier:{stride:42,legs:.64,arms:.42,bounce:1.5,lean:.08,crouch:0,weight:.8},
  brute:{stride:48,legs:.43,arms:.28,bounce:.85,lean:.04,crouch:1,weight:.45},
  swarm:{stride:27,legs:.72,arms:.65,bounce:1.7,lean:.32,crouch:2,weight:1.1},
  warden:{stride:46,legs:.49,arms:.22,bounce:1.1,lean:.06,crouch:0,weight:.55},
  saboteur:{stride:36,legs:.58,arms:.32,bounce:1,lean:.2,crouch:2.2,weight:.8},
  elite:{stride:44,legs:.67,arms:.42,bounce:1.4,lean:.09,crouch:0,weight:.65},
  boss:{stride:55,legs:.4,arms:.2,bounce:1,lean:.06,crouch:0,weight:.25},
  shade:{stride:70,legs:0,arms:0,bounce:2,lean:0,crouch:0,weight:.65},
};
export const gaitFor=(type:string)=>GAITS[type]??GAITS.soldier;
const TAU=Math.PI*2;
const wrap=(a:number)=>((a+Math.PI)%TAU+TAU)%TAU-Math.PI;
const mix=(a:number,b:number,k:number)=>a+(b-a)*k;
export interface UnitMotion {
  distance:number; phase:number; heading:number; facing:number; side:number; turn:number; moving:boolean; travel:number; hitAge:number;
}
export function createUnitMotion(unit:MotionUnit):UnitMotion{
  return {distance:Number.isFinite(unit.dist)?unit.dist:0,phase:((unit.seed||0)/TAU)%1,
    heading:Math.atan2(unit.dy||0,unit.dx||1),facing:unit.dx<0?-1:1,side:unit.dx<0?-1:1,turn:0,moving:false,travel:0,hitAge:1};
}
export function advanceUnitMotion(v:UnitMotion,unit:MotionUnit,dt:number,enabled:boolean):void{
  const distance=Number.isFinite(unit.dist)?unit.dist:v.distance;
  const travelled=Math.max(0,distance-v.distance);v.distance=distance;
  v.travel=enabled?travelled:0;
  if(!enabled){v.moving=false;v.hitAge=1;v.turn=0;if(unit.dx!==0)v.side=unit.dx<0?-1:1;v.facing=v.side;v.heading=Math.atan2(unit.dy,unit.dx);return;}
  // Frozen frames retain the last pose. Changed settings consume distance without a catch-up jump.
  if(dt<=0)return;
  v.hitAge=Math.min(1,v.hitAge+dt);
  v.moving=travelled>.0001&&!unit.chan;
  if(v.moving)v.phase=(v.phase+travelled/gaitFor(unit.type).stride)%1;
  const heading=Math.atan2(unit.dy,unit.dx),error=wrap(heading-v.heading),ease=1-Math.exp(-14*dt);
  v.heading=wrap(v.heading+error*ease);v.turn=mix(v.turn,Math.sin(error)*.1,ease);
  if(unit.dx!==0)v.side=unit.dx<0?-1:1;
  v.facing=mix(v.facing,v.side,ease);
}
export function gaitPose(type:string,phase:number){
  const p=gaitFor(type),a=phase*TAU,s=Math.sin(a);
  return {ll:s*p.legs,lr:-s*p.legs,al:-s*p.arms+.12,ar:s*p.arms-.12,
    lean:p.lean+Math.sin(a)*.025*p.weight,bob:p.crouch-(1-Math.cos(2*a))*p.bounce*.5,bh:Math.sin(a+.4)*.6*p.weight};
}
/** Inverse kinematics keeps the planted boss boot on the ground throughout its support phase. */
function bossLeg(x:number,y:number){
  const upper=13.2,lower=12.1,d2=Math.min((upper+lower-.01)**2,x*x+y*y);
  const knee=-Math.acos(Math.max(-1,Math.min(1,(d2-upper*upper-lower*lower)/(2*upper*lower))));
  const hip=Math.atan2(x,y)-Math.atan2(lower*Math.sin(knee),upper+lower*Math.cos(knee));
  return {hip,knee};
}
export function bossGaitPose(phase:number){
  const a=phase*TAU,bob=1.2+Math.cos(2*a)*.5;
  const left=bossLeg(Math.sin(a)*7,25-bob-Math.max(0,Math.cos(a))*5);
  const right=bossLeg(-Math.sin(a)*7,25-bob-Math.max(0,-Math.cos(a))*5);
  return {ll:left.hip,lr:right.hip,kl:left.knee,kr:right.knee,bob,lean:.035+Math.sin(a)*.012,sw:Math.sin(a)*.08};
}
export function hitReaction(v:UnitMotion,type:string){
  const t=v.hitAge/.2;
  return t>=1?0:Math.sin(Math.PI*t)*(1-t)*gaitFor(type).weight;
}
