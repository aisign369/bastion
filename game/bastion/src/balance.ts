/** New journeys use measured role corrections; existing journeys keep version 1. */
export const BALANCE_VERSION = 2;
export const ROLE_TUNING = {
  bolt: { damage: 1, rate: 1, range: 1, role: 'FAST SINGLE TARGET', tip: 'Low-cost sustained fire. Strong against runners; armor reduces each bolt.' },
  frost: { damage: 1, rate: 1, range: 1.10, role: 'CONTROL / SUPPORT', tip: 'Slows enemies for the whole defense. Pair with splash damage; slows do not stack.' },
  mortar: { damage: 1, rate: 1, range: 1, role: 'AREA / SWARMS', tip: 'Predicted splash hits packed groups. Minimum splash damage 60%; fast isolated units can dodge.' },
  rail: { damage: 1.12, rate: 1, range: 1, role: 'ARMOR / SHIELDS', tip: 'Ignores armor and boss shields. Full visibility in sandstorms; choose STRONG for priority targets.' },
  tesla: { damage: 1, rate: 1, range: 1, role: 'CLOSE CHAIN', tip: 'Four arcs in crowded bends. Each hop loses 28% damage; weak against distant isolated enemies.' },
} as const;
export function roleTuning(key: keyof typeof ROLE_TUNING, version: number) {
  return version >= BALANCE_VERSION ? ROLE_TUNING[key] : { ...ROLE_TUNING[key], damage: 1, rate: 1, range: 1 };
}
export const splashMultiplier = (distance: number, radius: number, version: number) => Math.max(0, 1 - (version >= 2 ? .4 : .55) * Math.max(0, distance) / radius);
export const chainMultiplier = (hop: number, version: number) => Math.pow(version >= 2 ? .72 : .75, hop);
/** Early bosses teach focus fire; late waves ramp continuously with no wave-11 slope jump. */
export const waveHealth = (wave: number, version: number) => version >= 2
  ? 1 + (wave - 1) * .30 + Math.max(0, wave - 10) ** 2 * .018
  : 1 + (wave - 1) * .30 + Math.max(0, wave - 10) ** 2 * .022;
