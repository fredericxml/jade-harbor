/** Dependency-light tests for UX, language and return navigation. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const ts = require('typescript');
function method(file, className, methodName) {
  const source = readFileSync(file, 'utf8');
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const cls = ast.statements.find(x => ts.isClassDeclaration(x) && x.name?.text === className);
  assert(cls, `Missing class ${className}`);
  const node = cls.members.find(x => ts.isMethodDeclaration(x) && x.name.getText(ast) === methodName);
  assert(node, `Missing ${className}.${methodName}`);
  const emitted = ts.transpileModule(`class Test {${node.getText(ast)}}`, {compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
  return Function(`${emitted};return Test`)();
}
let passes = 0;
function test(description, fn) { fn(); passes++; console.log('PASS',description); }

const Back = method('src/core/game.ts', 'Game', 'backToPreviousScreen');
const back = new Back();
const calls = [];
back.ui = { menu: () => calls.push('menu'), create: () => calls.push('create'), pause: () => calls.push('pause') };
back.saves=[]; back.meta={name:'My world'};back.mode='creative';back.hardcoreEnded=false;
test('Settings from main menu returns to main menu', () => {
  back.active=false;back.returnScreen='menu';back.backToPreviousScreen();assert.equal(calls.pop(),'menu');
});
test('Controls from in-world Pause returns to Pause', () => {
  back.active=true;back.returnScreen='pause';back.backToPreviousScreen();assert.equal(calls.pop(),'pause');
});
test('Submenu from world creation returns to creation', () => {
  back.active=true;back.returnScreen='create';back.backToPreviousScreen();assert.equal(calls.pop(),'create');
});

const Panel = method('src/ui/ui.ts', 'UI', 'panel');
const ui = new Panel();
ui.show=(screen,html)=>{ui.last={screen,html};};
test('Close button in Settings says Back and uses parent navigation',()=>{
  ui.panel('settings','Settings','Tune things','');
  assert.match(ui.last.html,/data-action="back"/);
  assert.match(ui.last.html,/aria-label="Back to previous screen"/);
  assert.match(ui.last.html,/title="Back \(Esc\)"/);
});
test('Close button in Inventory still resumes gameplay',()=>{
  ui.panel('inventory','Inventory','Items','');
  assert.match(ui.last.html,/data-action="resume"/);
  assert.match(ui.last.html,/Close dialog and return to world/);
});

const source=readFileSync('src/core/game.ts','utf8');
test('Controls records previous screen and close is handled',()=>{
  assert.match(source,/if \(action === "controls"\) \{\s*this\.returnScreen = this\.ui\.screen/);
  assert.match(source,/if \(action === "back"\) \{\s*this\.backToPreviousScreen\(\)/);
});
test('Settings volume and mouse sensitivity show their real values',()=>{
  const text=readFileSync('src/ui/ui.ts','utf8');
  assert.match(text,/Mouse sensitivity <output>\$\{settings\.sensitivity\}<\/output>/);
  assert.match(text,/Sound volume <output>\$\{settings\.volume\}%<\/output>/);
  assert.match(source,/el\.id === "volume" \? "%"/);
});
test('World list keeps local-storage guidance visible above world cards',()=>{
  const text=readFileSync('src/ui/ui.ts','utf8');
  const heading=text.indexOf('class="panel-heading"');
  const note=text.indexOf('class="local-note"');
  const list=text.indexOf('class="world-list"');
  const card=text.indexOf('class="world-card"');
  assert(heading >= 0 && note > heading && list > note && card >= 0);
  const css=readFileSync('src/ui/style.css','utf8');
  assert.match(css,/\.world-panel-sticky\s*\{[^}]*position:\s*sticky/s);
});
test('World actions are grouped into two bars with visible async feedback',()=>{
  const text=readFileSync('src/ui/ui.ts','utf8');
  assert.match(text,/world-tool-bar world-tool-bar-main/);
  assert.match(text,/world-tool-bar world-tool-bar-danger/);
  assert.match(text,/worldProcessing\(id: string, message: string \| null\)/);
  assert.match(source,/worldProcessing\(s\.id, "Duplicating world…"\)/);
  assert.match(source,/worldProcessing\(s\.id, "Deleting world…"\)/);
});
test('Pause actions are single-column and use the requested action order',()=>{
  const text=readFileSync('src/ui/ui.ts','utf8');
  const pause=text.match(/const actions = \[([\s\S]*?)\]\.join\(""\);/)?.[1] ?? '';
  const labels=['Return to world','Save world','Save & return home','Export backup','Settings','Controls'];
  let last=-1;
  for(const label of labels){ const at=pause.indexOf(label); assert(at>last, `Pause action order mismatch at ${label}`); last=at; }
  const css=readFileSync('src/ui/style.css','utf8');
  assert.match(css,/\.pause-grid\s*\{[^}]*grid-template-columns:\s*1fr/s);
});
test('Settings provide an explicit reset-to-defaults action',()=>{
  const text=readFileSync('src/ui/ui.ts','utf8');
  assert.match(text,/data-action="reset-settings">Reset to defaults/);
  assert.match(source,/if \(action === "reset-settings"\)/);
  assert.match(source,/fov:\s*75[\s\S]*sensitivity:\s*4[\s\S]*distance:\s*5[\s\S]*simulationDistance:\s*4[\s\S]*volume:\s*30/);
});
console.log(`${passes} navigation/copy/source checks passed.`);
