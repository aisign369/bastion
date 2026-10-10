import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { MAPS, getMap, isMapId, isBuildableOnMap, COLS, ROWS } from '../game/bastion/src/maps.ts';
import { serializeBattle, sanitizeBattle, towerRuntimeFields } from '../game/bastion/src/battle-save.ts';
import { waveHealth } from '../game/bastion/src/balance.ts';
import { createSessionStorage } from '../game/bastion/src/session-storage.ts';
import { writeMapSave, readMapSave } from '../game/bastion/src/map-storage.ts';

const source = fs.readFileSync(new URL('../game/bastion/src/game.ts', import.meta.url), 'utf8');
const ast = ts.createSourceFile('game.ts', source, ts.ScriptTarget.Latest, true);
const declarations = new Map(), functions = new Map();
for (const statement of ast.statements) {
  if (ts.isVariableStatement(statement)) for (const d of statement.declarationList.declarations) declarations.set(d.name.getText(ast), d.getText(ast));
  if (ts.isFunctionDeclaration(statement)) functions.set(statement.name.getText(ast), statement.getText(ast));
}

for (const map of MAPS) test(`${map.id}: actual saveGame output remains loadable before and during a wave`, () => {
  const storage = createSessionStorage();
  let cell;
  for (let c = 0; c < COLS && !cell; c++) for (let r = 0; r < ROWS && !cell; r++) if (isBuildableOnMap(map.id, c, r)) cell = { c, r };
  const context = vm.createContext({
    console, Date, performance, getMap, isMapId, isBuildableOnMap, COLS, ROWS, serializeBattle, sanitizeBattle, towerRuntimeFields, waveHealth,
    playerStorage: storage, activeMap: map, saveOwner: () => 'guest', writeMapSave, saveCareerProgress() {}, cloudAccount: null,
    MOTION_LAB: false, TOWER_LAB: false, PLAY_LAB: false, START_LIVES: 15, START_GOLD: 180,
    state: 'play', balanceVersion: 2, lastSave: 0, lives: 15, gold: 130, waveNum: 0, cleared: 0, endless: false,
    kills: 0, goldEarned: 0, bestWave: 0, journeyTypes: new Set(['bolt']), journeyLegendary: 0,
    waveActive: false, spawnI: 0, spawnClock: 0, waveElapsed: 0, time: 0, GRNG: { seed: () => 42 },
    combo: 0, comboT: 0, comboMult: 1, idleOn: false, idleTimer: 0, cardPool: [],
    creeps: [], projs: [], shells: [], towers: [{ key: 'bolt', ...cell, invested: 50, dmgLv: 0, rateLv: 0 }],
  });
  vm.runInContext(['TOWERS', 'TORDER', 'MOD'].map(k => `const ${declarations.get(k)};`).join('\n') +
    ['waveDef', 'buildSpawnQueue', 'sanitizeLoaded', 'saveGame'].map(k => functions.get(k)).join('\n'), context);
  for (const active of [false, true]) {
    context.waveNum = active ? 1 : 0; context.waveActive = active;
    vm.runInContext('saveGame(true)', context);
    const raw = readMapSave(storage, 'guest', map.id);
    assert.ok(raw, 'saveGame must write a checkpoint');
    context.saved = JSON.parse(raw);
    const restored = vm.runInContext('sanitizeLoaded(saved)', context);
    assert.ok(restored, 'the full checkpoint must pass the production loader');
    assert.equal(restored.towers.length, 1); assert.equal(restored.battle.active, active);
  }
});

test('fixture storage keeps records, careers, preferences and drafts separate across sessions', () => {
  const first = createSessionStorage(), second = createSessionStorage();
  for (const key of ['bastion_orchid_best:guest:orchid', 'career:guest', 'bastion_orchid_prefs', 'feedback:guest']) {
    first.setItem(key, 'fixture'); assert.equal(first.getItem(key), 'fixture'); assert.equal(second.getItem(key), null);
    first.removeItem(key); assert.equal(first.getItem(key), null);
  }
});
