// Dependency-free structural validation for a Jade Harbor source+dist ZIP.
import { execFileSync } from "node:child_process";
import { stat } from "node:fs/promises";
import { resolve } from "node:path";
const defaultArchive = "../JadeHarbor_v1.0.0_Release_Source_and_Dist.zip";
const archive = resolve(process.argv[2] ?? process.env.JADE_HARBOR_ARCHIVE ?? defaultArchive);
const candidates = process.platform === "win32" ? ["python", "py"] : ["python3", "python"];
try { if (!(await stat(archive)).isFile()) throw new Error(); }
catch { throw new Error(`Archive not found: ${archive}\nUsage: npm run test:archive-structure -- ../Your_JadeHarbor.zip`); }
let python;
for (const c of candidates) { try { execFileSync(c,["-c","import sys"],{stdio:"ignore"}); python=c; break; } catch {} }
if(!python) throw new Error(`Python unavailable. Tried: ${candidates.join(", ")}`);
const script = String.raw`
import zipfile,sys,re
p=sys.argv[1]
with zipfile.ZipFile(p) as z:
    bad=z.testzip(); assert bad is None, f"ZIP CRC failure: {bad}"
    names=set(z.namelist())
    required=['JadeHarbor/package.json','JadeHarbor/package-lock.json','JadeHarbor/src/main.ts','JadeHarbor/dist/index.html','JadeHarbor/src/world/city/panda.ts','JadeHarbor/src/persistence/saves.ts']
    missing=[x for x in required if x not in names]; assert not missing, f"Missing: {missing}"
    assert any(n.startswith('JadeHarbor/dist/assets/index-') and n.endswith('.js') for n in names), 'Missing active JS bundle'
    assert any(n.startswith('JadeHarbor/dist/assets/generation.worker-') and n.endswith('.js') for n in names), 'Missing generation worker'
    html=z.read('JadeHarbor/dist/index.html').decode('utf-8')
    refs=re.findall(r'(?:src|href)=["\'](?:\./)?([^"\'#?]+)',html)
    for ref in refs:
        if ref.startswith(('http:','https:','data:')): continue
        assert 'JadeHarbor/dist/'+ref.lstrip('/') in names, f"Missing dist reference: {ref}"
    forbidden=['/node_modules/','/.git/','/.openai/','/test-results/','/__pycache__/']
    bad_names=[n for n in names if any(x in n for x in forbidden)]; assert not bad_names, f"Forbidden files: {bad_names[:5]}"
    assert len(names)==len(set(names)), 'Duplicate ZIP names'
    print(f'PASS archive structure: {len(names)} entries, CRC/assets/worker/source/dist all present')
`;
execFileSync(python,["-c",script,archive],{stdio:"inherit"});
