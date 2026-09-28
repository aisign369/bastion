/** Logical route and grid geometry. These coordinates are independent of rendering. */
export const CELL = 48;
export const COLS = 32;
export const ROWS = 18;
export const W = COLS * CELL;
export const H = ROWS * CELL;

export interface Point { x: number; y: number }
export interface RoutePoint extends Point { dx: number; dy: number }
interface Segment extends RoutePoint { len: number; acc: number }

export const WPC: ReadonlyArray<readonly [number, number]> = [
  [-1, 2], [8, 2], [8, 7], [2, 7], [2, 12], [12, 12],
  [12, 5], [20, 5], [20, 14], [26, 14], [26, 9], [30, 9],
];
export const WAY: Point[] = WPC.map(([c, r]) => ({ x: (c + .5) * CELL, y: (r + .5) * CELL }));
export const BREACH: Point = { x: (WPC[0][0] + 1.5) * CELL, y: (WPC[0][1] + .5) * CELL };
export const GATE: Point = { x: (WPC.at(-1)![0] + .5) * CELL, y: (WPC.at(-1)![1] + .5) * CELL };

export const SEGS: Segment[] = [];
export let PATHLEN = 0;
for (let i = 0; i < WAY.length - 1; i++) {
  const a = WAY[i], b = WAY[i + 1], len = Math.hypot(b.x - a.x, b.y - a.y);
  SEGS.push({ x: a.x, y: a.y, dx: (b.x - a.x) / len, dy: (b.y - a.y) / len, len, acc: PATHLEN });
  PATHLEN += len;
}

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

export const pathSet = new Set<string>();
function mark(c: number, r: number): void {
  if (c >= 0 && c < COLS && r >= 0 && r < ROWS) pathSet.add(`${c},${r}`);
}
for (let i = 0; i < WPC.length - 1; i++) {
  const [c1, r1] = WPC[i], [c2, r2] = WPC[i + 1];
  if (c1 === c2) for (let r = Math.min(r1, r2); r <= Math.max(r1, r2); r++) mark(c1, r);
  else for (let c = Math.min(c1, c2); c <= Math.max(c1, c2); c++) mark(c, r1);
}
