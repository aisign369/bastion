import { MAPS, type MapId } from './maps.ts';

type Save = { at?: unknown; bestWave?: unknown };
export const recordScore = (value: unknown): number => typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 1000000 ? value : 0;
export const saveTime = (save: unknown): number => {
  const value = (save as Save | null)?.at;
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;
};
/** Keep the newest checkpoint per map while records only advance. Called inside a transaction. */
export function mergeCloudSaves(existing: Record<string, unknown>, incoming: Map<MapId, unknown>) {
  const rawMaps = existing.mapSaves as Partial<Record<MapId, unknown>> | undefined;
  const rawRecords = existing.mapRecords as Partial<Record<MapId, unknown>> | undefined;
  const mapSaves: Partial<Record<MapId, unknown>> = {}, mapRecords: Partial<Record<MapId, number>> = {};
  let bestWave = recordScore(existing.bestWave);
  for (const map of MAPS) {
    const previous = rawMaps?.[map.id] ?? (map.id === 'orchid' ? existing.save : undefined), next = incoming.get(map.id);
    const chosen = next != null && (previous == null || saveTime(next) >= saveTime(previous)) ? next : previous;
    if (chosen != null) mapSaves[map.id] = chosen;
    const score = Math.max(recordScore(rawRecords?.[map.id]), recordScore((previous as Save)?.bestWave), recordScore((next as Save)?.bestWave));
    if (score || rawRecords?.[map.id] != null || chosen != null) mapRecords[map.id] = score;
    bestWave = Math.max(bestWave, score);
  }
  return { mapSaves, mapRecords, bestWave, ...(mapSaves.orchid != null ? { save: mapSaves.orchid } : {}) };
}
