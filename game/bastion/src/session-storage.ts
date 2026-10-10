import type { StorageLike } from './map-storage';

/** Development fixtures share temporary data without reading or writing player slots. */
export function createSessionStorage(): StorageLike {
  const values = new Map<string, string>();
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); },
    removeItem: key => { values.delete(key); },
  };
}
