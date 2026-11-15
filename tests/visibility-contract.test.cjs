const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

function methodSource(relativePath, className, methodName) {
  const source = fs.readFileSync(relativePath, 'utf8');
  const file = ts.createSourceFile(relativePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  let result = '';
  function visit(node) {
    if (ts.isClassDeclaration(node) && node.name?.text === className) {
      const method = node.members.find(member => ts.isMethodDeclaration(member) && member.name?.getText(file) === methodName);
      if (method) result = method.getText(file);
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  assert.ok(result, `${className}.${methodName} exists in ${relativePath}`);
  return result;
}

test('render actor selection stays bounded to active residents and encounter actors', () => {
  const source = methodSource('src/game/entities.ts', 'Entities', 'renderActors');
  assert.match(source, /this\.life\s*\?\s*this\.life\.activeActors\s*:\s*this\.residentEntities/);
  assert.match(source, /for\s*\(const e of residents\)\s*if\s*\(e\.health\s*>\s*0\)\s*out\.push\(e\)/);
  assert.match(source, /for\s*\(const e of this\.otherActors\)\s*if\s*\(e\.health\s*>\s*0\)\s*out\.push\(e\)/);
  assert.doesNotMatch(source, /for\s*\([^)]*this\.list/);
});

test('NPC presentation checks loaded columns and a conservative camera frustum before batch writes', () => {
  const source = methodSource('src/render/entity-view.ts', 'EntityView', 'update');
  assert.match(source, /for\s*\(const e of entities\.renderActors\(\)\)/);
  assert.match(source, /!entities\.world\.loaded\(p\.x,\s*p\.z\)/);
  assert.match(source, /distanceToSquared\(camera\.position\)\s*>\s*16\s*&&\s*!this\.frustum\.intersectsSphere\(this\.actorSphere\)/);
  assert.match(source, /this\.civilianBatch\(residents/);
  assert.doesNotMatch(source, /entities\.list/);
});

test('simulation candidate selection remains independent of presentation visibility', () => {
  const source = methodSource('src/game/entities.ts', 'Entities', 'simulationActors');
  assert.match(source, /activeSimulationCandidates\(/);
  assert.match(source, /this\.world,\s*player,\s*this\.radius/);
  assert.doesNotMatch(source, /frustum|camera|visible|culled/i);
});

test('hidden distant-world presentation pauses without discarding its resumable work', () => {
  const source = methodSource('src/render/distant-world.ts', 'DistantWorld', 'update');
  assert.match(source, /this\.disposed\s*\|\|\s*!this\.plan\s*\|\|\s*!this\.group\.visible/);
  assert.match(source, /this\.work/);
  assert.match(source, /coverageIndex\?\.update/);
  assert.doesNotMatch(source, /this\.work\?\.return|this\.pending\.length\s*=\s*0|this\.group\.clear/);
});
