import test from 'node:test';
import assert from 'node:assert/strict';
import { MAPS, GEOMETRY, CELL, COLS, ROWS, isBuildableOnMap, mapGeometry } from '../game/bastion/src/maps.ts';
import { SAVE_KEY, SAVE_OWNER_KEY, readMapSave, writeMapSave, deleteMapSave, switchStorageOwner } from '../game/bastion/src/map-storage.ts';
class MemoryStorage {
  values=new Map();
  getItem(key){return this.values.get(key)??null;}
  setItem(key,value){this.values.set(key,value);}
  removeItem(key){this.values.delete(key);}
}
test('both routes are continuous grid paths and every road cell is blocked for towers',()=>{
  for(const map of MAPS){
    const geo=GEOMETRY[map.id];let length=0;
    for(const [i,s] of geo.segments.entries()){
      assert.equal(s.acc,length);length+=s.len;
      assert.ok(Math.abs(s.dx)+Math.abs(s.dy)===1);
      assert.equal(s.x+s.dx*s.len,geo.way[i+1].x);
      assert.equal(s.y+s.dy*s.len,geo.way[i+1].y);
    }
    assert.equal(length,geo.length);
    for(const cell of geo.path){const [c,r]=cell.split(',').map(Number);assert.ok(!isBuildableOnMap(map.id,c,r));assert.ok(!geo.blocked.has(cell));}
    assert.ok(geo.way.at(-1).x<COLS*CELL&&geo.way.at(-1).y<ROWS*CELL);
  }
});
test('Ember crosses molten fault at precisely three safe bridge rows',()=>{
  for(let r=0;r<ROWS;r++)for(const c of [18,19]){
    const key=`${c},${r}`;
    assert.equal(GEOMETRY.ember.path.has(key),[3,8,14].includes(r));
    assert.equal(GEOMETRY.ember.blocked.has(key),![3,8,14].includes(r));
    assert.ok(!isBuildableOnMap('ember',c,r));
  }
  assert.ok(isBuildableOnMap('ember',17,6));
  assert.throws(()=>mapGeometry({...MAPS[0],route:[[0,0],[1,1]]}),/grid/);
});
test('map slots preserve both journeys across repeated map changes',()=>{
  const store=new MemoryStorage();
  writeMapSave(store,'guest','orchid','garden-wave-7');
  writeMapSave(store,'guest','ember','rift-wave-2');
  assert.equal(readMapSave(store,'guest','orchid'),'garden-wave-7');
  assert.equal(readMapSave(store,'guest','ember'),'rift-wave-2');
  assert.equal(store.getItem(SAVE_KEY),'garden-wave-7');
  deleteMapSave(store,'guest','ember');
  assert.equal(readMapSave(store,'guest','ember'),null);
  assert.equal(readMapSave(store,'guest','orchid'),'garden-wave-7');
});
test('legacy save migrates to Orchid without populating Ember',()=>{
  const store=new MemoryStorage();store.setItem(SAVE_KEY,'legacy-progress');
  assert.equal(readMapSave(store,'guest','ember'),null);
  assert.equal(readMapSave(store,'guest','orchid'),'legacy-progress');
  deleteMapSave(store,'guest','orchid');
  assert.equal(readMapSave(store,'guest','orchid'),null);
});
test('account changes cannot import another player or guest save implicitly',()=>{
  const store=new MemoryStorage();store.setItem(SAVE_KEY,'guest-progress');
  switchStorageOwner(store,'alice');
  assert.equal(readMapSave(store,'alice','orchid'),null);
  writeMapSave(store,'alice','orchid','alice-progress');writeMapSave(store,'alice','ember','alice-rift');
  switchStorageOwner(store,'bob');
  assert.equal(readMapSave(store,'bob','orchid'),null);assert.equal(readMapSave(store,'bob','ember'),null);
  switchStorageOwner(store,'guest');assert.equal(readMapSave(store,'guest','orchid'),'guest-progress');
  switchStorageOwner(store,'alice');assert.equal(readMapSave(store,'alice','orchid'),'alice-progress');assert.equal(readMapSave(store,'alice','ember'),'alice-rift');
  assert.equal(store.getItem(SAVE_OWNER_KEY),'alice');
});
