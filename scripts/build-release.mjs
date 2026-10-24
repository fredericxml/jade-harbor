/** The only supported release build entrypoint. Never edit dist bundles manually. */
import { spawnSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { createReleaseManifest, verifyReleaseManifest } from './release-integrity.mjs';

function run(file,args) {
  console.log(`Running ${file} ${args.join(' ')}`);
  const result=spawnSync(process.execPath,[file,...args], {stdio:'inherit'});
  if(result.error)throw result.error;
  if(result.status!==0)throw new Error(`Build step failed: ${file} (exit ${result.status ?? 'unknown'})`);
}
const root=process.cwd();
const tsc=join(root,'node_modules/typescript/bin/tsc');
const vite=join(root,'node_modules/vite/bin/vite.js');
for(const binary of [tsc,vite])if(!existsSync(binary)) {
  console.error(`Missing ${binary}; run npm ci on a computer with npm registry access.`);
  process.exit(1);
}
try {
  run(tsc,['--noEmit']);
  // Vite clears the old output by default. Remove it here too to make stale
  // manually patched bundles impossible to ship after a failed build.
  rmSync(join(root,'dist'), {recursive:true,force:true});
  run(vite,['build']);
  createReleaseManifest(root);
  const result=verifyReleaseManifest(root);
  console.log('Verified fresh build:',JSON.stringify(result));
} catch(error) {
  // Never leave a misleading/partial production output on disk.
  rmSync(join(root,'dist'), {recursive:true,force:true});
  console.error(error.message);
  process.exitCode=1;
}
