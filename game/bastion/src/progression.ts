import { MAPS, type MapId } from './maps.ts';
export type FinishId = 'standard' | 'copper' | 'aurora' | 'solar' | 'royal';
export interface CareerRecord { wave: number; kills: number; gold: number; variety: number; legendary: number; perfect: number }
export interface Career { v: 1; maps: Partial<Record<MapId, CareerRecord>>; finish: FinishId; updatedAt: number }
export const emptyCareer = (): Career => ({ v: 1, maps: {}, finish: 'standard', updatedAt: 0 });
const bounded = (x: unknown, max = 1e9) => typeof x === 'number' && Number.isFinite(x) ? Math.min(max, Math.max(0, Math.floor(x))) : 0;
export const FINISHES = [
  { id: 'standard', name: 'FIELD ORIGINAL', color: '#a9bccb', mission: '', desc: 'Original map armory.' },
  { id: 'copper', name: 'VETERAN COPPER', color: '#edab78', mission: 'hold5', desc: 'Riveted copper laurel.' },
  { id: 'aurora', name: 'AURORA SEAL', color: '#a0f5ee', mission: 'combined', desc: 'A crystal compass beneath every tower.' },
  { id: 'solar', name: 'SOLAR CREST', color: '#f5d38c', mission: 'legend', desc: 'A winged sun engraved into each foundation.' },
  { id: 'royal', name: 'FOUR FRONTIERS', color: '#d1b0ff', mission: 'explorer', desc: 'The four-point frontier crown.' },
] as const;
export function normalizeCareer(raw: unknown): Career {
  const c = emptyCareer();
  if (!raw || typeof raw !== 'object') return c;
  const r = raw as Partial<Career>;
  for (const map of MAPS) {
    const m = r.maps?.[map.id]; if (!m || typeof m !== 'object') continue;
    c.maps[map.id] = { wave: bounded(m.wave, 1e6), kills: bounded(m.kills), gold: bounded(m.gold), variety: bounded(m.variety, 5), legendary: bounded(m.legendary, 400), perfect: bounded(m.perfect, 1e6) };
  }
  if (FINISHES.some(f => f.id === r.finish)) c.finish = r.finish!;
  c.updatedAt = bounded(r.updatedAt, Number.MAX_SAFE_INTEGER);
  if (!canUseFinish(c, c.finish)) c.finish = 'standard';
  return c;
}
export function recordCareer(career: Career, map: MapId, record: CareerRecord): Career {
  const next = normalizeCareer(career), previous = next.maps[map];
  next.maps[map] = Object.fromEntries(Object.keys(record).map(k => [k, Math.max(previous?.[k as keyof CareerRecord] || 0, bounded(record[k as keyof CareerRecord]))])) as unknown as CareerRecord;
  next.updatedAt = Date.now(); return normalizeCareer(next);
}
/** Maxima make replaying/restoring a wave and concurrent device sync idempotent. */
export function mergeCareer(a: unknown, b: unknown): Career {
  const x = normalizeCareer(a), y = normalizeCareer(b);
  const merged: Career = { v: 1, maps: {}, finish: y.updatedAt > x.updatedAt ? y.finish : x.finish, updatedAt: Math.max(x.updatedAt, y.updatedAt) };
  for (const { id } of MAPS) {
    const l = x.maps[id], r = y.maps[id]; if (!l && !r) continue;
    merged.maps[id] = Object.fromEntries(['wave', 'kills', 'gold', 'variety', 'legendary', 'perfect'].map(k => [k, Math.max(l?.[k as keyof CareerRecord] || 0, r?.[k as keyof CareerRecord] || 0)])) as unknown as CareerRecord;
  }
  return normalizeCareer(merged);
}
export function careerMissions(c: Career) {
  const values = Object.values(c.maps), highest = (key: keyof CareerRecord) => Math.max(0, ...values.map(m => m[key]));
  return [
    { id: 'first', name: 'FIRST LIGHT', desc: 'Clear your first wave.', value: highest('wave'), goal: 1 },
    { id: 'hold5', name: 'HOLD THE LINE', desc: 'Clear wave 5 on any map.', value: highest('wave'), goal: 5 },
    { id: 'hunter', name: 'MECH HUNTER', desc: 'Defeat 500 enemies in one journey.', value: highest('kills'), goal: 500 },
    { id: 'combined', name: 'COMBINED ARMS', desc: 'Use all five tower types in one journey.', value: highest('variety'), goal: 5 },
    { id: 'legend', name: 'LEGEND FORGED', desc: 'Fully upgrade both tracks of a tower.', value: highest('legendary'), goal: 1 },
    { id: 'explorer', name: 'FOUR FRONTIERS', desc: 'Clear wave 5 on all four maps.', value: MAPS.filter(m => (c.maps[m.id]?.wave || 0) >= 5).length, goal: 4 },
    { id: 'victory', name: 'BASTION KEEPER', desc: 'Complete thirty waves on any map.', value: highest('wave'), goal: 30 },
    { id: 'perfect', name: 'UNBROKEN', desc: 'Complete thirty waves with all 15 lives.', value: highest('perfect'), goal: 30 },
  ];
}
export function canUseFinish(c: Career, id: FinishId): boolean {
  const finish = FINISHES.find(f => f.id === id);
  return !!finish && (!finish.mission || careerMissions(c).some(m => m.id === finish.mission && m.value >= m.goal));
}
export const careerKey = (owner: string) => 'bastion_career:' + owner;
