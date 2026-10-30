// Reproducible diagnostic map from the actual v4 field, not concept art.
const fs = require('node:fs'), ts = require('typescript');
require.extensions['.ts'] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, file);
const { createV4Generator } = require('../src/world/generator-v4.ts');
const { sampleTerrain } = require('../src/world/geography/terrain.ts');
const g = createV4Generator('jade-harbor');
const start = -900, end = 900, step = 8, scale = .48, left = 60, top = 110;
const X = x => left + (x - start) * scale, Z = z => top + (z - start) * scale;
const colors = { 'metropolitan-core': '#c5baa2', 'urban-terrace': '#ab947d', 'urban-lowland': '#bcc6a8',
  'harbor-waterfront': '#a2c6bf', 'river-corridor': '#a2c6bf', 'canal-lowland': '#c4d9b2',
  'imperial-plateau': '#e2c682', 'ridge': '#6d716e', 'highland': '#92a28e', 'mountain': '#7c917d',
  'valley': '#d4d3a7', 'cliff': '#a99f8e', 'scenic-protected': '#71978e', 'archaeology-outskirts': '#d6b391', 'rural-transition': '#d0d6b6' };
const svg = ['<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="1050" viewBox="0 0 1280 1050">',
  '<rect width="1280" height="1050" fill="#f4f2eb"/>',
  '<g font-family="Arial, sans-serif" fill="#223b35"><text x="60" y="48" font-size="28" font-weight="700">Jade Harbor / world foundation</text>',
  '<text x="60" y="78" font-size="15">Generator v4 · seed jade-harbor · semantic field sampled every 8 blocks</text></g>',
  `<g shape-rendering="crispEdges">`];
for (let z = start; z < end; z += step) for (let x = start; x < end; x += step) {
  const t = sampleTerrain(g.plan, x, z), color = t.water ? '#548c9d' : colors[t.region];
  svg.push(`<rect x="${X(x)}" y="${Z(z)}" width="${step * scale + .1}" height="${step * scale + .1}" fill="${color}"/>`);
}
svg.push('</g>');
const path = points => points.map((p, i) => `${i ? 'L' : 'M'}${X(p.x)},${Z(p.z)}`).join(' ');
for (const c of g.plan.connections) svg.push(`<path d="${path(c.points)}" fill="none" stroke="#fff9eb" stroke-width="2" stroke-dasharray="5 4"/>`);
for (const r of g.landmarks.reservations) {
  const f = r.footprint;
  if (f.kind === 'area') svg.push(`<rect x="${X(f.bounds.x1)}" y="${Z(f.bounds.z1)}" width="${(f.bounds.x2-f.bounds.x1)*scale}" height="${(f.bounds.z2-f.bounds.z1)*scale}" fill="none" stroke="#8a493a" stroke-width="2.5"/>`);
  else if (f.kind === 'point') svg.push(`<circle cx="${X(f.center.x)}" cy="${Z(f.center.z)}" r="${Math.max(4, f.radius*scale)}" fill="none" stroke="#8a493a" stroke-width="2.5"/>`);
  else svg.push(`<path d="${path(f.points)}" fill="none" stroke="#8a493a" stroke-width="${Math.max(3,f.halfWidth*scale*2)}" opacity=".75"/>`);
}
const labels = [['Panda Plaza',0,-48],['Primary city',-20,100],['Harbor',160,535],['River',460,50],['Imperial plateau',0,-430],['Ridge corridor',50,-660],['Western pass',-440,-580],['Cliff',620,-430],['Archaeology',-530,160],['Scenic highlands',-660,-250],['Mine',360,0]];
svg.push('<g font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="#193d35" stroke="#f4f2eb" stroke-width="3" paint-order="stroke">');
for (const [label,x,z] of labels) svg.push(`<text x="${X(x)}" y="${Z(z)-8}" text-anchor="middle">${label}</text>`);
svg.push('</g><g font-family="Arial, sans-serif" fill="#223b35">');
let y = 130;
svg.push('<text x="955" y="112" font-size="18" font-weight="700">Geographic regions</text>');
for (const [name,color] of Object.entries(colors)) { y += 32; svg.push(`<rect x="955" y="${y-13}" width="16" height="16" fill="${color}"/><text x="982" y="${y}" font-size="13">${name}</text>`); }
svg.push('<text x="955" y="700" font-size="14" font-weight="700">Red: future landmark footprints</text><text x="955" y="726" font-size="13">White dashed: connection plans</text><text x="955" y="752" font-size="13">Blue: realized water</text><text x="955" y="792" font-size="13">Reserved sites contain terrain only.</text><text x="955" y="815" font-size="13">No finished monuments are implied.</text>');
svg.push(`<text x="60" y="1004" font-size="14">X: −900 → +900 · Z: −900 (top) → +900 (bottom) · map extent 1,800 × 1,800 blocks</text>`);
svg.push('<text x="60" y="1031" font-size="13">Reproduce: node scripts/world-plan-map.cjs · Actual browser screenshots are indexed separately.</text></g></svg>');
fs.mkdirSync('docs/proof/world-foundation', {recursive:true});
fs.writeFileSync('docs/proof/world-foundation/world-plan.svg', svg.join('\n'));
console.log('Wrote docs/proof/world-foundation/world-plan.svg');
