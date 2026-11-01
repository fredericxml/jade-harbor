// Dependency-free structural validation for a Jade Harbor source+dist ZIP.
import { execFileSync } from "node:child_process";
import { stat } from "node:fs/promises";
import { resolve } from "node:path";
const defaultArchive = "../JadeHarbor_2.0.1_Release.zip";
const archive = resolve(process.argv[2] ?? process.env.JADE_HARBOR_ARCHIVE ?? defaultArchive);
const candidates = process.platform === "win32" ? ["python", "py"] : ["python3", "python"];
try { if (!(await stat(archive)).isFile()) throw new Error(); }
catch { throw new Error(`Archive not found: ${archive}\nUsage: npm run test:archive-structure -- ../Your_JadeHarbor.zip`); }
let python;
for (const c of candidates) { try { execFileSync(c,["-c","import sys"],{stdio:"ignore"}); python=c; break; } catch {} }
if(!python) throw new Error(`Python unavailable. Tried: ${candidates.join(", ")}`);
const script = String.raw`
import zipfile,sys,re,json
p=sys.argv[1]
with zipfile.ZipFile(p) as z:
    bad=z.testzip(); assert bad is None, f"ZIP CRC failure: {bad}"
    names=set(z.namelist())
    required=['package.json','package-lock.json','README.md','LICENSE','THIRD_PARTY_NOTICES.md','docs/project-history.md','docs/quality-assurance.md','docs/performance.md','docs/assets/geographic-plan.svg','docs/assets/district-plan.svg','docs/licenses/THREE-MIT.txt','scripts/check-documentation.mjs','src/main.ts','dist/index.html','dist/release-integrity.json','src/world/city/panda.ts','src/persistence/saves.ts']
    missing=[x for x in required if x not in names]; assert not missing, f"Missing: {missing}"
    assert any(n.startswith('dist/assets/index-') and n.endswith('.js') for n in names), 'Missing active JS bundle'
    assert any(n.startswith('dist/assets/generation.worker-') and n.endswith('.js') for n in names), 'Missing generation worker'
    html=z.read('dist/index.html').decode('utf-8')
    refs=re.findall(r'(?:src|href)=["\'](?:\./)?([^"\'#?]+)',html)
    for ref in refs:
        if ref.startswith(('http:','https:','data:')): continue
        assert 'dist/'+ref.lstrip('/') in names, f"Missing dist reference: {ref}"
    forbidden=['/node_modules/','/.git/','/.openai/','/test-results/','/__pycache__/']
    bad_names=[n for n in names if any(x in n for x in forbidden)]; assert not bad_names, f"Forbidden files: {bad_names[:5]}"
    assert not any(n.startswith('docs/proof/') for n in names), 'Release archive includes raw proof assets'
    assert len(names)==len(set(names)), 'Duplicate ZIP names'
    pkg=json.loads(z.read('package.json')); lock=json.loads(z.read('package-lock.json'))
    assert pkg['version']=='2.0.1' and pkg['version']==lock['version']==lock['packages']['']['version'], 'Package/lock version mismatch'
    assert all(not n.startswith('/') and '\\' not in n and '..' not in n.split('/') for n in names), 'Unsafe archive path'
    assert not any(any(part in {'node_modules','.git','.openai','test-results','__pycache__','coverage','playwright-report','blob-report'} for part in n.split('/')) for n in names), 'Archive contains development output'
    print(f'PASS archive structure: {len(names)} entries, CRC/assets/worker/source/dist all present')
`;
execFileSync(python,["-c",script,archive],{stdio:"inherit"});
