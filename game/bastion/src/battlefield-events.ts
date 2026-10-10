import type { MapId } from './maps';
export type EventPhase = 'calm' | 'warning' | 'active';
export const EVENTS = {
  orchid: { name: 'LUMEN BLOOM', color: '#bdeca8', icon: '✧', effect: 'All towers gain 12% range for 9 seconds.', tactic: 'Cover two bends with one tower.' },
  ember: { name: 'CALDERA ERUPTION', color: '#ffad6a', icon: '▲', effect: 'Marked bridge vents burn enemies. Mortar blast radius +15%.', tactic: 'Slow enemies inside the marked circles. Towers are safe.' },
  frost: { name: 'WHITEOUT', color: '#b9ecff', icon: '❄', effect: 'Enemies move 18% slower (bosses 10%). Tower rate −8%; frost coils stay steady.', tactic: 'Use frost coils to hold the long approach.' },
  sunspire: { name: 'SANDSTORM', color: '#f5cd86', icon: '◈', effect: 'Tower range −15% for 9 seconds. Rail towers retain full sight.', tactic: 'Place short-range towers close to the road; rail cuts through sand.' },
} as const;
export interface BattlefieldEvent { phase: EventPhase; seconds: number; cycle: number; range: number; rate: number; enemySpeed: number; bossSpeed: number; splash: number }
/** Simulation seconds only: pausing, hiding the page and resuming a save preserve the forecast. */
export function battlefieldEvent(map: MapId, wave: number, elapsed: number, enabled = true): BattlefieldEvent {
  const e: BattlefieldEvent = { phase: 'calm', seconds: 0, cycle: -1, range: 1, rate: 1, enemySpeed: 1, bossSpeed: 1, splash: 1 };
  if (!enabled || wave < 6 || !Number.isFinite(elapsed)) return e;
  const t = Math.max(0, elapsed), offset = t - 18;
  if (offset < 0) { e.seconds = Math.ceil(-offset); return e; }
  const phase = offset % 42; e.cycle = Math.floor(offset / 42);
  e.phase = phase < 5 ? 'warning' : phase < 14 ? 'active' : 'calm';
  e.seconds = Math.max(1, Math.ceil((phase < 5 ? 5 : phase < 14 ? 14 : 42) - phase));
  if (e.phase !== 'active') return e;
  if (map === 'orchid') e.range = 1.12;
  if (map === 'ember') e.splash = 1.15;
  if (map === 'frost') { e.rate = .92; e.enemySpeed = .82; e.bossSpeed = .9; }
  if (map === 'sunspire') e.range = .85;
  return e;
}
export const EMBER_VENTS = [{ x: 18.5 * 48, y: 3.5 * 48 }, { x: 19.5 * 48, y: 8.5 * 48 }, { x: 18.5 * 48, y: 14.5 * 48 }];
export function environmentRange(key: string, event: BattlefieldEvent, shadow: boolean): number {
  // Sandstorm and Shadow never compound into an unannounced 28% range penalty.
  return Math.max(.85, Math.min(shadow ? .85 : 1.12, key === 'rail' && event.range < 1 ? 1 : event.range));
}
