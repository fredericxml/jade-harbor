// Dependency-free structural validation for a Jade Harbor source+dist ZIP.
import { execFileSync } from "node:child_process";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
const packageMeta = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const defaultArchive = `../JadeHarbor_v${packageMeta.version}_Source_and_Dist.zip`;
const archive = resolve(process.argv[2] ?? process.env.JADE_HARBOR_ARCHIVE ?? defaultArchive);
const candidates = process.platform === "win32" ? ["python", "py"] : ["python3", "python"];
try { if (!(await stat(archive)).isFile()) throw new Error(); }
catch { throw new Error(`Archive not found: ${archive}\nUsage: npm run test:archive-structure -- ../Your_JadeHarbor.zip`); }
let python;
for (const c of candidates) { try { execFileSync(c,["-c","import sys"],{stdio:"ignore"}); python=c; break; } catch {} }
if(!python) throw new Error(`Python unavailable. Tried: ${candidates.join(", ")}`);
const script = String.raw`
import zipfile,sys,re,json,stat
p=sys.argv[1]
with zipfile.ZipFile(p) as z:
    bad=z.testzip(); assert bad is None, f"ZIP CRC failure: {bad}"
    name_list=z.namelist(); names=set(name_list)
    assert len(name_list)==len(names), 'Duplicate ZIP paths'
    assert all(not n.startswith('/') and '\\' not in n and '..' not in n.split('/') for n in name_list), 'Unsafe ZIP path'
    required=['JadeHarbor/package.json','JadeHarbor/package-lock.json','JadeHarbor/README.md','JadeHarbor/docs/project-history.md','JadeHarbor/docs/quality-assurance.md','JadeHarbor/docs/performance.md','JadeHarbor/docs/save-schema.md','JadeHarbor/scripts/check-documentation.mjs','JadeHarbor/src/main.ts','JadeHarbor/dist/index.html','JadeHarbor/dist/release-integrity.json','JadeHarbor/src/world/city/panda.ts','JadeHarbor/src/persistence/saves.ts']
    assert all(n.startswith('JadeHarbor/') for n in name_list), 'Unexpected archive root'
    for info in z.infolist(): assert not stat.S_ISLNK(info.external_attr >> 16), f'Symlink not allowed: {info.filename}'
    missing=[x for x in required if x not in names]; assert not missing, f"Missing: {missing}"
    pkg=json.loads(z.read('JadeHarbor/package.json')); lock=json.loads(z.read('JadeHarbor/package-lock.json'))
    assert pkg['version']=='2.0.0' and pkg['version']==lock['version']==lock['packages']['']['version'], 'Package version mismatch'
    assert any(n.startswith('JadeHarbor/dist/assets/index-') and n.endswith('.js') for n in names), 'Missing active JS bundle'
    assert any(n.startswith('JadeHarbor/dist/assets/generation.worker-') and n.endswith('.js') for n in names), 'Missing generation worker'
    html=z.read('JadeHarbor/dist/index.html').decode('utf-8')
    refs=re.findall(r'(?:src|href)=["\'](?:\./)?([^"\'#?]+)',html)
    for ref in refs:
        if ref.startswith(('http:','https:','data:')): continue
        assert 'JadeHarbor/dist/'+ref.lstrip('/') in names, f"Missing dist reference: {ref}"
    forbidden=['/node_modules/','/.git/','/.openai/','/test-results/','/__pycache__/','/.pytest_cache/','/.cache/','/.turbo/','/.parcel-cache/','/coverage/','/playwright-report/','/blob-report/','/artifacts/','/reports/']
    bad_names=[n for n in names if any(x in n for x in forbidden)]; assert not bad_names, f"Forbidden files: {bad_names[:5]}"
    assert not any(n.startswith('JadeHarbor/docs/proof/') for n in names), 'Curated release archive includes docs/proof'
    forbidden_suffixes=('.log','.tmp','.trace','.pyc','.zip','.7z','.rar','.har','.prof','.heapprofile','.cpuprofile','.tsbuildinfo')
    assert not any(n.endswith(forbidden_suffixes) or n.rsplit('/',1)[-1] in {'.DS_Store','Thumbs.db','desktop.ini'} for n in names), 'Archive contains transient files'
    print(f'PASS archive structure: {len(names)} entries, CRC/assets/worker/source/dist/proof-exclusion all verified')
`;
execFileSync(python,["-c",script,archive],{stdio:"inherit"});
