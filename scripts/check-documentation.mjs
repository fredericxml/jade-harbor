import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';

const root = process.cwd();
const docs = [join(root, 'README.md'), ...walk(join(root, 'docs')).filter(p => p.endsWith('.md'))];
const failures = [];
const forbidden = [
  [/\bPhase\s+[1-9]\b/i, 'internal phase label'],
  [/\bShot\s+[1-9]\b/i, 'internal shot label'],
  [/\bPatch\s+[A-D]\b/i, 'internal patch label'],
  [/\b2\.0\.0-dev\.\d+\b/i, 'development package version'],
  [/\b(?:RC|release candidate)\s*(?:archive|build|package)\b/i, 'release-candidate wording'],
  [/docs\/(?:development-history|testing-results)\.md/i, 'obsolete internal document path'],
];

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return entry.isFile() ? [full] : [];
  });
}

for (const file of docs) {
  const source = readFileSync(file, 'utf8');
  const rel = relative(root, file);
  for (const [pattern, label] of forbidden) if (pattern.test(source)) failures.push(`${rel}: contains ${label}`);
  for (const match of source.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)) {
    let target = match[1].trim().replace(/^<|>$/g, '');
    if (!target || /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(target)) continue;
    target = target.split('#')[0].split('?')[0];
    if (!target) continue;
    const resolved = resolve(dirname(file), decodeURIComponent(target));
    const relTarget = relative(root, resolved);
    if (isAbsolute(relTarget) || relTarget === '..' || relTarget.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`)) failures.push(`${rel}: link escapes repository: ${match[1]}`);
    else if (!existsSync(resolved)) failures.push(`${rel}: broken link target: ${match[1]}`);
  }
}

const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const lock = JSON.parse(readFileSync(join(root, 'package-lock.json'), 'utf8'));
if (pkg.version !== '2.0.1') failures.push(`package.json: expected release version 2.0.1, found ${pkg.version}`);
if (lock.version !== pkg.version || lock.packages?.['']?.version !== pkg.version) failures.push('package-lock.json: package version does not match package.json');
if (!/supported generators 3–10/.test(readFileSync(join(root, 'docs/save-schema.md'), 'utf8'))) failures.push('docs/save-schema.md: supported generator range must be 3–10');
if (!/New worlds use generator 10/.test(readFileSync(join(root, 'docs/save-schema.md'), 'utf8'))) failures.push('docs/save-schema.md: new-world generator must be 10');
if (/docs\/proof/.test(readFileSync(join(root, '.gitignore'), 'utf8'))) failures.push('.gitignore: docs/proof must not be ignored');
if (!/relative\.parts\[:2\] == \("docs", "proof"\)/.test(readFileSync(join(root, 'scripts/package-release.py'), 'utf8'))) failures.push('package-release.py: release archive must exclude docs/proof');
for (const [name, command] of Object.entries(pkg.scripts ?? {})) {
  for (const match of command.matchAll(/(?:scripts|tests)\/[A-Za-z0-9_./-]+\.(?:mjs|cjs|ts|js|py)/g)) if (!existsSync(join(root, match[0]))) failures.push(`package.json script ${name}: missing ${match[0]}`);
}
if (failures.length) {
  console.error(`Documentation/release metadata check failed (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else console.log(`Documentation/release metadata check passed: ${docs.length} Markdown files, local links, release metadata, generator compatibility, and curated archive rules.`);
