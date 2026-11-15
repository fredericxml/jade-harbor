/** Verify source-only ZIPs without relying on historical source snapshots. */
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const archive = process.argv[2];
assert.ok(archive && fs.existsSync(archive), 'Usage: node tests/release-source-archive.test.cjs /path/to/JadeHarbor_2.1.0_Source.zip');
const python = process.platform === 'win32' ? 'python' : 'python3';
const script = String.raw`
import json,sys,zipfile
with zipfile.ZipFile(sys.argv[1]) as z:
    bad=z.testzip();assert bad is None,f'CRC error: {bad}'
    ns=[i.filename for i in z.infolist() if not i.is_dir()]
    assert len(set(ns))==len(ns),'duplicate paths'
    assert all(n.startswith('JadeHarbor/') and not n.startswith('/') and '..' not in n.split('/') for n in ns),'unsafe paths'
    assert not any(any(s in n for s in ['/node_modules/','/dist/','/.git/','/test-results/','/coverage/']) for n in ns),'development output present'
    for required in ['README.md','LICENSE','THIRD_PARTY_NOTICES.md','package.json','package-lock.json','src/main.ts','src/render/renderer.ts','src/persistence/saves.ts','docs/architecture.md','docs/save-format.md','docs/release.md','tests/release-source-integrity.test.cjs']:
        assert 'JadeHarbor/'+required in ns,'missing '+required
    pkg=json.loads(z.read('JadeHarbor/package.json'));lock=json.loads(z.read('JadeHarbor/package-lock.json'))
    assert pkg['version']=='2.1.0' and lock['version']==pkg['version'] and lock['packages']['']['version']==pkg['version'],'version mismatch'
    for n in ns:
        if n.startswith('JadeHarbor/docs/'):
            assert '-manifest.json' not in n and not '/stage-' in n and not '/batch' in n,'old development doc '+n
    print('PASS source archive:',len(ns),'files; CRC/version/path/license/doc/source checks')
`;
const call = spawnSync(python, ['-c', script, path.resolve(archive)], { encoding:'utf8' });
if (call.stdout) process.stdout.write(call.stdout);
if (call.stderr) process.stderr.write(call.stderr);
assert.equal(call.status, 0, 'Source archive verification failed');
