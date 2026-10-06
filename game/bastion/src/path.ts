import { CELL, COLS, ROWS, GEOMETRY, getMap, type GridPoint, type RoutePoint, type Segment } from './maps';
export { CELL, COLS, ROWS } from './maps';
export const W = COLS * CELL, H = ROWS * CELL;
export interface Point { x: number; y: number }
export type { RoutePoint } from './maps';
export const WPC: GridPoint[] = [], WAY: Point[] = [], SEGS: Segment[] = [];
export const BREACH: Point = {x:0,y:0}, GATE: Point = {x:0,y:0};
export const pathSet = new Set<string>(), blockedSet = new Set<string>();
export let PATHLEN = 0, activeMap = getMap('orchid');
/** Keep exported containers stable so rendering and simulation switch together. */
export function activateMap(id: unknown): void {
  activeMap=getMap(id);
  const geometry=GEOMETRY[activeMap.id];
  WPC.splice(0,WPC.length,...activeMap.route);
  WAY.splice(0,WAY.length,...geometry.way);
  SEGS.splice(0,SEGS.length,...geometry.segments);
  PATHLEN=geometry.length;
  pathSet.clear();geometry.path.forEach(cell=>pathSet.add(cell));
  blockedSet.clear();geometry.blocked.forEach(cell=>blockedSet.add(cell));
  Object.assign(BREACH,{x:(WPC[0][0]+1.5)*CELL,y:(WPC[0][1]+.5)*CELL});
  Object.assign(GATE,WAY.at(-1));
}
activateMap('orchid');

export function posAt(distance: number): RoutePoint {
  if (!Number.isFinite(distance)) distance = 0;
  const d = Math.max(0, Math.min(PATHLEN - .01, distance));
  let segment = SEGS.at(-1)!;
  for (const candidate of SEGS) {
    if (d < candidate.acc + candidate.len) { segment = candidate; break; }
  }
  const t = d - segment.acc;
  return { x: segment.x + segment.dx * t, y: segment.y + segment.dy * t,
    dx: segment.dx, dy: segment.dy };
}
