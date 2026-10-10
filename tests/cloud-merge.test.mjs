import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeCloudSaves } from '../game/bastion/src/cloud-merge.ts';
test('delayed cloud checkpoints cannot overwrite newer journeys or lower records',()=>{
  const old={at:100,bestWave:15},recent={at:200,bestWave:3},other={at:150,bestWave:8};
  const merged=mergeCloudSaves({mapSaves:{orchid:recent,frost:other},mapRecords:{orchid:12,frost:8},bestWave:12},new Map([['orchid',old],['sunspire',{at:180,bestWave:5}]]));
  assert.deepEqual(merged.mapSaves.orchid,recent);assert.deepEqual(merged.save,recent);assert.deepEqual(merged.mapSaves.frost,other);
  assert.equal(merged.mapRecords.orchid,15);assert.equal(merged.bestWave,15);assert.equal(merged.mapRecords.sunspire,5);
});
test('legacy Orchid checkpoint survives map synchronization and invalid records stay bounded',()=>{
  const legacy={bestWave:9},merged=mergeCloudSaves({save:legacy,bestWave:NaN,mapRecords:{ember:-2}},new Map([['ember',{at:1,bestWave:Infinity}]]));
  assert.deepEqual(merged.mapSaves.orchid,legacy);assert.equal(merged.bestWave,9);assert.equal(merged.mapRecords.ember,0);
});
