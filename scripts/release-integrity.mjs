/** Verify that a production directory is complete and unchanged since its fresh build. */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

const INPUT_PATHS = ['src', 'public', 'index.html', 'package.json', 'package-lock.json', 'tsconfig.json', 'vite.config.ts'];
const MANIFEST = 'dist/release-integrity.json';
const hash = buffer => createHash('sha256').update(buffer).digest('hex');

function listFiles(root, entries) {
  const files = [];
  function walk(p) {
    if (!existsSync(p)) throw new Error(`Missing required release input: ${relative(root,p)}`);
    for (const dirent of readdirSync(p, {withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))) {
      const full = join(p, dirent.name);
      if (dirent.isSymbolicLink()) throw new Error(`Symlinks cannot be part of release: ${full}`);
      if (dirent.isDirectory()) walk(full);
      else if (dirent.isFile()) files.push(full);
    }
  }
  for (const entry of entries) {
    const p=join(root,entry);
    if (!existsSync(p)) throw new Error(`Missing required release input: ${entry}`);
    const statFiles = [p];
    if (readdirSafe(p)) walk(p); else files.push(p);
  }
  return files.sort((a,b)=>a.localeCompare(b));
}
function readdirSafe(p) { try { readdirSync(p); return true; } catch { return false; } }
function records(root, paths) {
  return paths.map(p=>({path:relative(root,p).split(sep).join('/'),sha256:hash(readFileSync(p))}));
}
function canonical(list) {return JSON.stringify(list);}
function has(array, value) {return array.includes(value);}
function inspectOutput(root) {
  const dist=join(root,'dist');
  const index=join(dist,'index.html');
  const viteManifest=join(dist,'.vite','manifest.json');
  if (!existsSync(index)) throw new Error('Missing dist/index.html');
  if (!existsSync(viteManifest)) throw new Error('Missing Vite build manifest: dist/.vite/manifest.json. Rebuild with npm run build; patched bundles are not verified.');
  const html=readFileSync(index,'utf8');
  if (/\bsrc=["']\/?src\/main\.ts["']/.test(html)) throw new Error('dist/index.html still loads the dev entry point');
  const assetRefs=[...html.matchAll(/\b(?:src|href)=["'](?:\.\/)?(assets\/[^"'#?]+)["']/g)].map(m=>m[1]);
  const js=assetRefs.filter(x=>x.endsWith('.js'));
  const css=assetRefs.filter(x=>x.endsWith('.css'));
  if (js.length!==1 || css.length<1) throw new Error('Expected one production entry JS and at least one CSS asset in dist/index.html');
  const vite=JSON.parse(readFileSync(viteManifest,'utf8'));
  const entry=vite['index.html'];
  if (!entry || !entry.isEntry || entry.file!==js[0]) throw new Error('Vite manifest entry does not match dist/index.html');
  if (!css.every(c=>entry.css?.includes(c))) throw new Error('Vite manifest CSS does not match dist/index.html');
  const outputPaths=listFiles(root,['dist']).filter(x=>relative(root,x).split(sep).join('/')!==MANIFEST);
  const distList=outputPaths.map(x=>relative(dist,x).split(sep).join('/'));
  if (!distList.some(f=>/^assets\/generation\.worker-.*\.js$/.test(f))) throw new Error('Missing built terrain generation worker');
  for (const asset of assetRefs) if (!has(distList,asset)) throw new Error(`Missing HTML asset: dist/${asset}`);
  if (!has(distList,'.vite/manifest.json')) throw new Error('Vite manifest is missing from final dist file list');
  return outputPaths;
}
export function createReleaseManifest(root=process.cwd()) {
  root=resolve(root);
  const source=records(root,listFiles(root,INPUT_PATHS));
  const dist=records(root,inspectOutput(root));
  const pkg=JSON.parse(readFileSync(join(root,'package.json'),'utf8'));
  const lock=JSON.parse(readFileSync(join(root,'package-lock.json'),'utf8'));
  if (pkg.name!==lock.name || pkg.version!==lock.version || pkg.name!==lock.packages?.['']?.name || pkg.version!==lock.packages?.['']?.version) throw new Error('package.json/package-lock.json identity mismatch');
  const manifest={schema:1,project:pkg.name,version:pkg.version,source,dist};
  writeFileSync(join(root,MANIFEST), JSON.stringify(manifest,null,2)+'\n');
  return manifest;
}
export function verifyReleaseManifest(root=process.cwd()) {
  root=resolve(root);
  const file=join(root,MANIFEST);
  if (!existsSync(file)) throw new Error('Unverified dist: release-integrity.json is missing. Run npm run build with dependencies installed.');
  const recorded=JSON.parse(readFileSync(file,'utf8'));
  if (recorded.schema!==1 || !Array.isArray(recorded.source) || !Array.isArray(recorded.dist)) throw new Error('Invalid release manifest schema');
  const actualSource=records(root,listFiles(root,INPUT_PATHS));
  const actualDist=records(root,inspectOutput(root));
  if(canonical(recorded.source)!==canonical(actualSource))throw new Error('Source or build inputs changed after the production build; rebuild before release.');
  if(canonical(recorded.dist)!==canonical(actualDist))throw new Error('Production assets changed after the build or are incomplete; rebuild before release.');
  const pkg=JSON.parse(readFileSync(join(root,'package.json'),'utf8'));
  if(recorded.project!==pkg.name || recorded.version!==pkg.version)throw new Error('Package version differs from build manifest');
  return {project:recorded.project,version:recorded.version,sourceFiles:actualSource.length,distFiles:actualDist.length};
}
