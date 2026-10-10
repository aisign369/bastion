import { GEOMETRY, type MapId } from './maps.ts';
type Unit = Record<string, any>;
type Numbers = Record<string, number>;
const enemyFields = 'hp maxhp spd r armor lives regen mregen bounty dist lane slowF slowT shieldCd shieldT empCd sabT chanT lastHit seed'.split(' ');
const projectileFields = 'x y ang spd dmg slowF slowT trav t ft tx ty'.split(' ');
const shellFields = 'sx sy tx ty t ft dmg splash'.split(' ');
export const towerRuntimeFields = 'ang cool abCd odT abT disabledT spin'.split(' ');
const number = (value: unknown, fallback = 0, min = -1e9, max = 1e9): number => typeof value === 'number' && Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
const fields = (value: Unit, keys: string[]): Numbers => Object.fromEntries(keys.map(k => [k, number(value[k])]));
const index = (value: unknown, length: number): number => Number.isInteger(value) && (value as number) >= 0 && (value as number) < length ? value as number : -1;
export interface BattleSave {
  active: boolean; spawnI: number; clock: number; elapsed: number; time: number; seed: number;
  combo: number; comboT: number; comboMult: number; idleOn: boolean; idleTimer: number; cards: number[];
  creeps: Unit[]; projs: Unit[]; shells: Unit[];
}
export function serializeBattle(input: Unit): BattleSave {
  const creeps: Unit[] = input.creeps.filter((c: Unit) => !c.dead), towers: Unit[] = input.towers;
  return {
    active: !!input.active, spawnI: input.spawnI, clock: input.clock, elapsed: input.elapsed, time: input.time, seed: input.seed,
    combo: input.combo, comboT: input.comboT, comboMult: input.comboMult, idleOn: !!input.idleOn, idleTimer: input.idleTimer, cards: input.cards,
    creeps: creeps.map(c => ({ type: c.type, ...fields(c, enemyFields), elite: !!c.elite, shieldOn: !!c.shieldOn, enraged: !!c.enraged, chanIndex: towers.indexOf(c.chan) })),
    projs: input.projs.filter((p: Unit) => !p.dead).map((p: Unit) => ({ kind: p.kind, ...fields(p, projectileFields), targetIndex: creeps.indexOf(p.target), srcIndex: towers.indexOf(p.src), towerIndex: towers.indexOf(p.tower) })),
    shells: input.shells.filter((p: Unit) => !p.dead).map((p: Unit) => ({ ...fields(p, shellFields), srcIndex: towers.indexOf(p.src) })),
  };
}
export function sanitizeBattle(raw: unknown, map: MapId, towerCount: number, spawnCount: number): BattleSave | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const r = raw as Unit;
  const creeps: Unit[] = [];
  if (!Array.isArray(r.creeps) || !Array.isArray(r.projs) || !Array.isArray(r.shells)) return null;
  // Reject oversized snapshots rather than silently discarding live units.
  if (r.creeps.length > 2000 || r.projs.length > 5000 || r.shells.length > 2000) return null;
  for (const c of r.creeps) {
    if (!c || !['runner','soldier','brute','shade','swarm','warden','saboteur','boss'].includes(c.type)) return null;
    const n = fields(c, enemyFields);
    n.maxhp = number(c.maxhp, 1, 1); n.hp = number(c.hp, n.maxhp, .001, n.maxhp);
    n.dist = number(c.dist, 0, 0, GEOMETRY[map].length - .001); n.spd = number(c.spd, 1, 1, 5000);
    n.slowF = number(c.slowF, 1, .05, 1); n.lane = number(c.lane, 0, -12, 12); n.r = number(c.r, 7, 1, 40);
    n.lives = number(c.lives, 1, 1, 15); n.armor = number(c.armor, 0, 0, 1000);
    n.bounty = number(c.bounty, 0, 0); n.regen = number(c.regen, 0, 0); n.mregen = number(c.mregen, 0, 0, .1);
    creeps.push({ type: c.type, ...n, elite: !!c.elite, shieldOn: !!c.shieldOn, enraged: !!c.enraged, chanIndex: index(c.chanIndex, towerCount) });
  }
  const projs: Unit[] = [];
  for (const p of r.projs) {
    if (!p || !['dart','shard','sabot'].includes(p.kind)) return null;
    const n = fields(p, projectileFields); n.spd = number(p.spd, 1, 1, 5000); n.dmg = number(p.dmg, 0, 0); n.ft = number(p.ft, .22, .001, 30);
    n.slowF = number(p.slowF, 1, .05, 1); n.slowT = number(p.slowT, 0, 0, 60);
    projs.push({ kind: p.kind, ...n, targetIndex: index(p.targetIndex, creeps.length), srcIndex: index(p.srcIndex, towerCount), towerIndex: index(p.towerIndex, towerCount) });
  }
  if (r.shells.some((s: unknown) => !s || typeof s !== 'object')) return null;
  const shells = r.shells.map((s: Unit) => ({ ...fields(s, shellFields), ft: number(s.ft, .1, .001, 30), dmg: number(s.dmg, 0, 0), splash: number(s.splash, 58, 1, 500), srcIndex: index(s.srcIndex, towerCount) }));
  return {
    active: !!r.active, spawnI: Math.floor(number(r.spawnI, 0, 0, spawnCount)), clock: number(r.clock, 0, 0), elapsed: number(r.elapsed, 0, 0), time: number(r.time, 0, 0), seed: Math.floor(number(r.seed, 1, 1, 2147483646)),
    combo: Math.floor(number(r.combo, 0, 0)), comboT: number(r.comboT, 0, 0, 2), comboMult: number(r.comboMult, 1, 1, 100), idleOn: !!r.idleOn, idleTimer: number(r.idleTimer, 12, 0, 12),
    cards: Array.isArray(r.cards) ? [...new Set<number>(r.cards.filter((i: number) => Number.isInteger(i) && i >= 0 && i < 10))].slice(0, 3) : [], creeps, projs, shells,
  };
}
