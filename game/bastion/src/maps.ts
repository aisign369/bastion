export const CELL = 48, COLS = 32, ROWS = 18;
export type MapId = 'orchid' | 'ember';
export type GridPoint = readonly [number, number];
export interface MapDefinition {
  id: MapId; name: string; sector: string; subtitle: string; briefing: string; caption: string; accent: string;
  route: ReadonlyArray<GridPoint>; blocked: ReadonlyArray<GridPoint>;
}
export const MAPS: readonly MapDefinition[] = [
  { id: 'orchid', name: 'ORCHID RESERVE', sector: 'SECTOR 11',
    subtitle: 'THE GARDEN / ORIGINAL', accent: '#b9d6c2',
    briefing: 'A winding garden road. Build around the turns and keep the light alive.',
    caption: 'THE LAST LIGHT IN THE GARDEN',
    route: [[-1,2],[8,2],[8,7],[2,7],[2,12],[12,12],[12,5],[20,5],[20,14],[26,14],[26,9],[30,9]], blocked: [] },
  { id: 'ember', name: 'EMBER RIFT', sector: 'SECTOR 12',
    subtitle: 'THE CALDERA / THREE BRIDGES', accent: '#ffad6a',
    briefing: 'Hold three bridges over a molten fault. Lava blocks construction; the inner bends reward overlapping fire.',
    caption: 'KEEP THE FIRE BELOW THE WALLS',
    route: [[-1,14],[6,14],[6,8],[2,8],[2,3],[24,3],[24,8],[12,8],[12,14],[28,14],[28,10],[30,10]],
    blocked: Array.from({length: ROWS}, (_,r) => r).filter(r => ![3,8,14].includes(r)).flatMap(r => [[18,r],[19,r]] as GridPoint[]) },
];
export function isMapId(id: unknown): id is MapId { return id === 'orchid' || id === 'ember'; }
export function getMap(id: unknown): MapDefinition { return MAPS.find(map => map.id === id) ?? MAPS[0]; }
export interface RoutePoint { x: number; y: number; dx: number; dy: number }
export interface Segment extends RoutePoint { len: number; acc: number }
export function mapGeometry(map: MapDefinition) {
  const way = map.route.map(([c,r]) => ({x:(c+.5)*CELL,y:(r+.5)*CELL}));
  const path = new Set<string>(), blocked = new Set(map.blocked.map(([c,r]) => `${c},${r}`));
  const segments: Segment[] = [];
  let length = 0;
  for (let i=0; i<map.route.length-1; i++) {
    const [c1,r1]=map.route[i], [c2,r2]=map.route[i+1];
    if (c1!==c2 && r1!==r2) throw new Error('Map route must follow the grid.');
    const a=way[i], b=way[i+1], len=Math.hypot(b.x-a.x,b.y-a.y);
    if (!len) throw new Error('Map route has a duplicate waypoint.');
    segments.push({x:a.x,y:a.y,dx:(b.x-a.x)/len,dy:(b.y-a.y)/len,len,acc:length});
    length+=len;
    for (let r=Math.min(r1,r2);r<=Math.max(r1,r2);r++)
      for(let c=Math.min(c1,c2);c<=Math.max(c1,c2);c++)
        if(c>=0&&c<COLS&&r>=0&&r<ROWS)path.add(`${c},${r}`);
  }
  return {way,path,blocked,segments,length};
}
export const GEOMETRY = Object.fromEntries(MAPS.map(map => [map.id,mapGeometry(map)])) as Record<MapId,ReturnType<typeof mapGeometry>>;
export function isBuildableOnMap(id: MapId, c: number, r: number): boolean {
  const geometry=GEOMETRY[id], key=`${c},${r}`;
  return c>=0&&c<COLS&&r>=0&&r<ROWS&&!geometry.path.has(key)&&!geometry.blocked.has(key);
}
export function mapPreview(map: MapDefinition): string {
  const points=map.route.map(([c,r])=>`${(c+.5)*10},${(r+.5)*10}`).join(' ');
  const lava=map.blocked.map(([c,r])=>`<rect x="${c*10}" y="${r*10}" width="10" height="10" fill="#ee743e" opacity=".6"/>`).join('');
  const [gc,gr]=map.route.at(-1)!;
  return `<svg viewBox="0 0 320 180" aria-hidden="true"><rect width="320" height="180" rx="12" fill="${map.id==='ember'?'#2b232d':'#233735'}"/>${lava}<polyline points="${points}" fill="none" stroke="#101c29" stroke-width="14" stroke-linejoin="round"/><polyline points="${points}" fill="none" stroke="${map.accent}" stroke-width="6" stroke-linejoin="round"/><circle cx="${(gc+.5)*10}" cy="${(gr+.5)*10}" r="7" fill="#f5e7cb"/></svg>`;
}
