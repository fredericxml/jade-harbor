/** Verify player-facing English copy, source comments and release branding. */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const root = process.cwd();
const read = p => readFileSync(join(root, p), 'utf8');
const version = JSON.parse(read('package.json')).version;
const lock = JSON.parse(read('package-lock.json'));
assert.equal(version, lock.version, 'Package and lockfile versions differ');
assert.equal(version, lock.packages[''].version, 'Root dependency version differs');
const sourceFiles = [];
function scan(dir) {
  for (const entry of readdirSync(join(root, dir))) {
    const rel = join(dir, entry);
    if (statSync(join(root, rel)).isDirectory()) scan(rel);
    else if (/\.(ts|css|svg|html)$/.test(entry)) sourceFiles.push(rel);
  }
}
for (const dir of ['src', 'public']) scan(dir);
sourceFiles.push('index.html', 'README.md');
// Catch accidental Indonesian UI text or code comments in player-facing source.
// Project documentation is verified separately through repository hygiene checks.
const indonesian = /\b(?:silakan|jangan|sudah|belum|masih|tolong|tekan|kamu|anda|dengan|untuk|karena|sekarang|pengaturan|penyimpanan|berhasil|gagal|membuat|menghapus|memuat|keluar|masuk|permainan|mencari|perubahan|diterima|kembali|pilih|simpan|tersimpan|selesai)\b/gi;
const violations = [];
for (const file of sourceFiles) {
  const data = read(file);
  for (const match of data.matchAll(indonesian)) {
    const line = data.slice(0, match.index).split('\n').length;
    violations.push(`${file}:${line} contains Indonesian word '${match[0]}'`);
  }
  if (/lanterncraft/i.test(data)) violations.push(`${file}: outdated LanternCraft branding`);
}
assert.deepEqual(violations, [], `Language/brand verification:\n${violations.join('\n')}`);
const ui = read('src/ui/ui.ts');
assert(ui.includes(`JADE HARBOR · v${version}`), 'Menu version does not match package');
assert(!ui.includes('Engine save version 1'), 'Save schema details leaked into UI');
assert(ui.includes('Saved locally in this browser.'), 'Expected friendly save copy');
assert(ui.includes('toLocaleDateString("en-US"'), 'Dates must display English month names');
assert(read('index.html').includes('<html lang="en">'));

let distStatus = 'source copy verified';
if (existsSync(join(root, 'dist/index.html'))) {
  const html = read('dist/index.html');
  assert(html.includes('<html lang="en">'), 'Built HTML language is not English');
  const assets = [...html.matchAll(/(?:src|href)="\.\/assets\/([^"?#]+)"/g)].map(x => x[1]);
  assert.equal(assets.length, 2, 'Expected one JS and one CSS main asset');
  for (const file of assets) assert(statSync(join(root, 'dist/assets', file)).isFile(), `Missing ${file}`);
  distStatus = 'source copy and dist asset linkage verified';
}
console.log(`PASS: ${sourceFiles.length} player-facing source files English-only, correct Jade Harbor branding and v${version} UI; ${distStatus}.`);
