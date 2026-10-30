// Planner-derived diagram. This is explicitly not a gameplay screenshot.
const fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(mod,file)=>mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
const {createV5Generator}=require('../src/world/generator-v5.ts');const g=createV5Generator('jade-harbor'),p=g.metropolis;
const colors=['#bd7754','#b85849','#829786','#6c9ea5','#c69b48','#5f7b9c','#a57e57','#66906b','#ad6980','#85829e'];
let svg='<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="1300" viewBox="-410 -530 880 1080"><rect x="-410" y="-530" width="880" height="1080" fill="#f5f1e7"/>';
svg+='<text x="-380" y="-497" font-family="sans-serif" font-size="24" fill="#253b3b">JADE HARBOR / TEN DISTRICTS</text><text x="-380" y="-477" font-family="sans-serif" font-size="11">Generator v5 · actual planned lots and routes · default seed · not a game screenshot</text>';
for(const [i,d] of p.districts.entries()){const b=d.bounds;svg+=`<rect x="${b.x1}" y="${b.z1}" width="${b.x2-b.x1}" height="${b.z2-b.z1}" fill="${colors[i]}" opacity=".12"/>`;}
for(const c of p.canals)svg+=`<rect x="${c.x1}" y="${c.z1}" width="${c.x2-c.x1}" height="${c.z2-c.z1}" fill="#72a4b4"/>`;
const path=r=>r.points.map(q=>`${q.x},${q.z}`).join(' ');
svg+=`<polyline points="${path(p.canalLink)}" fill="none" stroke="#72a4b4" stroke-width="8"/>`;
for(const r of p.roads)svg+=`<polyline points="${path(r)}" fill="none" stroke="${r.owner?'#c7b797':'#c4beb1'}" stroke-width="${r.half*2}" stroke-linecap="round" stroke-linejoin="round"/>`;
for(const l of p.lots)svg+=`<rect x="${l.x1}" y="${l.z1}" width="${l.x2-l.x1+1}" height="${l.z2-l.z1+1}" fill="${colors[p.districts.findIndex(d=>d.id===l.districtId)]}" stroke="#fff" stroke-width=".6"><title>${l.id} / ${l.archetype} / ${l.floors} floors / ${l.roofFamily}</title></rect>`;
svg+='<rect x="-21" y="-71" width="42" height="44" fill="#fff" stroke="#334f48" stroke-width="2"/><text x="-14" y="-45" font-size="8" font-family="sans-serif">PANDA</text>';
for(const reserve of g.landmarks.reservations){const f=reserve.footprint;if(f.kind==='point')svg+=`<circle cx="${f.center.x}" cy="${f.center.z}" r="${f.radius+reserve.margin}" fill="none" stroke="#a54c47" stroke-width="2" stroke-dasharray="3 3"/>`;else if(f.kind==='area')svg+=`<rect x="${f.bounds.x1-reserve.margin}" y="${f.bounds.z1-reserve.margin}" width="${f.bounds.x2-f.bounds.x1+reserve.margin*2}" height="${f.bounds.z2-f.bounds.z1+reserve.margin*2}" fill="none" stroke="#a54c47" stroke-width="2" stroke-dasharray="3 3"/>`;}
for(const [i,d] of p.districts.entries()){const x=-380+(i%2)*405,y=465+Math.floor(i/2)*17;svg+=`<rect x="${x}" y="${y-8}" width="9" height="9" fill="${colors[i]}"/><text x="${x+15}" y="${y}" font-size="10" font-family="sans-serif" fill="#253b3b">${d.name} · ${p.lots.filter(l=>l.districtId===d.id).length} lots</text>`;}
svg+='</svg>';fs.mkdirSync('test-results/metropolis',{recursive:true});fs.writeFileSync('test-results/metropolis/district-plan.svg',svg);console.log('Wrote actual district-plan.svg');
