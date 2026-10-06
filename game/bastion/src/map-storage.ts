import type { MapId } from './maps';
export const SAVE_KEY='bastion_orchid_save', SAVE_OWNER_KEY='bastion_orchid_save_owner';
export interface StorageLike { getItem(key: string): string|null; setItem(key: string,value: string): void; removeItem(key: string): void }
export const mapSaveKey=(owner: string,map: MapId)=>`${SAVE_KEY}:${owner}:${map}`;
/** Legacy saves always belong to Orchid, never to the newly selected map. */
export function readMapSave(storage: StorageLike,owner: string,map: MapId): string|null {
  const current=storage.getItem(mapSaveKey(owner,map));
  if(current||map!=='orchid')return current;
  const legacy=storage.getItem(`${SAVE_KEY}:${owner}`) ??
    ((storage.getItem(SAVE_OWNER_KEY)||'guest')===owner?storage.getItem(SAVE_KEY):null);
  if(legacy)storage.setItem(mapSaveKey(owner,map),legacy);
  return legacy;
}
export function writeMapSave(storage: StorageLike,owner: string,map: MapId,raw: string): void {
  storage.setItem(mapSaveKey(owner,map),raw);
  if(map==='orchid'){
    storage.setItem(`${SAVE_KEY}:${owner}`,raw);
    if((storage.getItem(SAVE_OWNER_KEY)||'guest')===owner)storage.setItem(SAVE_KEY,raw);
  }
}
export function deleteMapSave(storage: StorageLike,owner: string,map: MapId): void {
  storage.removeItem(mapSaveKey(owner,map));
  if(map==='orchid'){
    storage.removeItem(`${SAVE_KEY}:${owner}`);
    if((storage.getItem(SAVE_OWNER_KEY)||'guest')===owner)storage.removeItem(SAVE_KEY);
  }
}
export function switchStorageOwner(storage: StorageLike,owner: string): void {
  const previous=storage.getItem(SAVE_OWNER_KEY)||'guest';
  readMapSave(storage,previous,'orchid');
  if(previous===owner)return;
  const next=storage.getItem(mapSaveKey(owner,'orchid'))??storage.getItem(`${SAVE_KEY}:${owner}`);
  if(next)storage.setItem(SAVE_KEY,next);else storage.removeItem(SAVE_KEY);
  storage.setItem(SAVE_OWNER_KEY,owner);
}
