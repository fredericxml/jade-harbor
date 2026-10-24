import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
function compiledMethod(path, className, methodName, bindings = {}) {
  const source = readFileSync(resolve(root, path), 'utf8');
  const tree = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true);
  const klass = tree.statements.find(n => ts.isClassDeclaration(n) && n.name?.text === className);
  assert.ok(klass, `${className} class exists`);
  const method = klass.members.find(n => ts.isMethodDeclaration(n) && n.name.getText(tree) === methodName);
  assert.ok(method, `${methodName} method exists`);
  const input = `class TestClass { ${method.getText(tree)} }`;
  const built = ts.transpileModule(input, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
    reportDiagnostics: true,
  });
  assert.equal(built.diagnostics?.filter(x => x.category === ts.DiagnosticCategory.Error).length, 0);
  return Function(...Object.keys(bindings), `${built.outputText};return TestClass;`)(...Object.values(bindings));
}

// The original bug: replacing inventory HTML reset both scrolling containers.
const UI = compiledMethod('src/ui/ui.ts', 'UI', 'inventory', {
  item: id => ({ name: id === 2 ? 'Jade roof' : 'Empty' }),
  esc: x => String(x),
  ARMOR_SLOTS: ['Head', 'Chest', 'Legs', 'Feet'],
  INVENTORY_CATEGORIES: ['All'],
  slot: (value, i, action = 'slot', options = {}) => `<button class="slot${options.className ? ` ${options.className}` : ''}" data-action="${action}" data-index="${i}"${options.ariaPressed === undefined ? '' : ` aria-pressed="${options.ariaPressed}"`}></button>`,
});
const ui = new UI();
ui.screen = 'inventory';
ui.catalog = () => '<button>Sample block</button>';
ui.overlay = {
  nodes: {
    '.inventory-scroll-area': { scrollTop: 510 },
    '#catalog': { scrollTop: 175 },
    '.categories': { scrollLeft: 90 },
  },
  querySelector(selector) { return this.nodes[selector] ?? null; },
};
ui.panel = (screen, title, subtitle, html) => {
  ui.lastHTML = html;
  ui.overlay.nodes = {
    '.inventory-scroll-area': { scrollTop: 0 },
    '#catalog': { scrollTop: 0 },
    '.categories': { scrollLeft: 0 },
    '#search': { value: '' },
  };
};
const inventory = { selected: 2, held: { id: 2 }, cursor: null,
  equipment: { slots: [null,null,null,null], protection: 0 }, slots: Array(36).fill(null) };
ui.inventory(inventory, true);
assert.equal(ui.overlay.querySelector('.inventory-scroll-area').scrollTop, 510);
assert.equal(ui.overlay.querySelector('#catalog').scrollTop, 175);
assert.equal(ui.overlay.querySelector('.categories').scrollLeft, 90);
assert.match(ui.lastHTML, /Selected: 3 · Jade roof/);
assert.match(ui.lastHTML, /class="slot chosen"[^>]*data-action="hotbar-select"[^>]*data-index="2"[^>]*aria-pressed="true"/);
assert.match(ui.lastHTML, /data-action="hotbar-select"/);
assert.match(ui.lastHTML, /class="inventory-hotbar-dock"/);
console.log('PASS creative inventory scroll preservation and selected-slot highlight');

// Digit selection remains active inside the inventory overlay.
const GameKey = compiledMethod('src/core/game.ts', 'Game', 'key');
const game = new GameKey();
let renders = 0, saves = 0;
game.inventory = { selected: 0 };
game.active = true;
game.ui = { screen: 'inventory', inventory: () => renders++ };
game.mode = 'creative'; game.category = 'All'; game.query = '';
game.scheduleSave = () => saves++;
game.key('Digit3');
assert.equal(game.inventory.selected, 2);
assert.equal(renders, 1);
assert.equal(saves, 1);
console.log('PASS digit shortcut updates selected slot while modal remains open');

// Clicking a Creative hotbar slot selects the destination, not cursor-swap.
const GameAction = compiledMethod('src/core/game.ts', 'Game', 'action');
const actions = new GameAction();
let updateCalls = 0;
actions.mode = 'creative'; actions.category = 'All'; actions.query = '';
actions.ui = { screen: 'inventory', inventory: () => updateCalls++ };
actions.audio = { play() {} }; actions.inventory = { selected: 0 };
actions.scheduleSave = () => {};
await actions.action('hotbar-select', { dataset: { index: '7' } }, { button: 0 });
assert.equal(actions.inventory.selected, 7);
assert.equal(updateCalls, 1);
console.log('PASS hotbar clicking selects destination slot');

// Real damage and exactly-once loot are exercised here through the actual
// applyHit class method; deeper wall, guard and entity tests live in combat-regression.test.cjs.
const EntityDamage = compiledMethod('src/game/entities.ts', 'Entities', 'applyHit');
const entities = new EntityDamage();
let lootCount = 0;
entities.drop = () => { lootCount++; return true; };
const spirit = { kind: 'spirit', name: 'Wandering spirit', health: 16,
  body: { velocity: { x: 0, y: 0, z: 0 }, position: { x: 1, y: 1, z: 1 } } };
entities.list = [spirit];
for (let i = 0; i < 15; i++) assert.equal(entities.applyHit(spirit, 1, { x: 0, y: 0, z: 0 }).status, 'hit');
assert.equal(spirit.health, 1);
assert.equal(entities.applyHit(spirit, 1, { x: 0, y: 0, z: 0 }).status, 'killed');
assert.equal(entities.applyHit(spirit, 1, { x: 0, y: 0, z: 0 }).status, 'invalid');
assert.equal(lootCount, 1);
console.log('PASS spirit health/damage progression, no duplicate death loot');
