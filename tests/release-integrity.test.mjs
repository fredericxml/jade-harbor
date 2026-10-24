import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createReleaseManifest, verifyReleaseManifest } from '../scripts/release-integrity.mjs';

function fixture() {
  const root=mkdtempSync(join(tmpdir(),'jade-release-'));
  const put=(relative,body)=>{const p=join(root,relative);mkdirSync(join(p,'..'),{recursive:true});writeFileSync(p,body);};
  const pkg={name:'jade-harbor',version:'1.0.0'};
  put('package.json',JSON.stringify(pkg));
  put('package-lock.json',JSON.stringify({...pkg,packages:{'':pkg}}));
  put('tsconfig.json','{}');
  put('vite.config.ts','export default {}');
  put('index.html','<div id="app"></div>');
  put('src/main.ts','console.log("Jade Harbor")');
  put('public/favicon.svg','<svg/>');
  put('dist/index.html','<script type="module" src="./assets/index-AbCd1234.js"></script><link rel="stylesheet" href="./assets/index-EfGh5678.css">');
  put('dist/assets/index-AbCd1234.js','console.log("production")');
  put('dist/assets/index-EfGh5678.css','body{}');
  put('dist/assets/generation.worker-MnOp3456.js','onmessage=()=>{}');
  put('dist/.vite/manifest.json',JSON.stringify({'index.html':{file:'assets/index-AbCd1234.js',css:['assets/index-EfGh5678.css'],isEntry:true}}));
  return {root,put};
}
function withFixture(fn) {const f=fixture();try{fn(f);}finally{rmSync(f.root,{recursive:true,force:true});}}

test('fresh source and dist can be signed and verified',()=>withFixture(({root})=>{
  const manifest=createReleaseManifest(root);
  assert.equal(manifest.project,'jade-harbor');
  assert.equal(verifyReleaseManifest(root).sourceFiles,7);
}));
test('unsigned bundles are rejected even if they look playable',()=>withFixture(({root})=>{
  assert.throws(()=>verifyReleaseManifest(root),/Unverified dist/);
}));
test('source edits invalidate the build proof',()=>withFixture(({root,put})=>{
  createReleaseManifest(root);put('src/main.ts','console.log("changed")');
  assert.throws(()=>verifyReleaseManifest(root),/Source or build inputs changed/);
}));
test('production asset edits invalidate the build proof',()=>withFixture(({root,put})=>{
  createReleaseManifest(root);put('dist/assets/index-AbCd1234.js','console.log("tampered")');
  assert.throws(()=>verifyReleaseManifest(root),/Production assets changed/);
}));
test('missing terrain worker is rejected',()=>withFixture(({root})=>{
  rmSync(join(root,'dist/assets/generation.worker-MnOp3456.js'));
  assert.throws(()=>createReleaseManifest(root),/Missing built terrain generation worker/);
}));
test('missing Vite manifest is rejected even if assets exist',()=>withFixture(({root})=>{
  rmSync(join(root,'dist/.vite/manifest.json'));
  assert.throws(()=>createReleaseManifest(root),/Missing Vite build manifest/);
}));
test('stale manifest CSS reference is rejected',()=>withFixture(({root,put})=>{
  put('dist/.vite/manifest.json',JSON.stringify({'index.html':{file:'assets/index-AbCd1234.js',css:['assets/wrong.css'],isEntry:true}}));
  assert.throws(()=>createReleaseManifest(root),/manifest CSS does not match/);
}));
test('unlisted production file invalidates the manifest',()=>withFixture(({root,put})=>{
  createReleaseManifest(root);put('dist/assets/extraneous-old-bundle.js','some old bundle');
  assert.throws(()=>verifyReleaseManifest(root),/Production assets changed/);
}));
test('changing package identity invalidates the manifest',()=>withFixture(({root,put})=>{
  createReleaseManifest(root);put('package.json',JSON.stringify({name:'new',version:'1.0.0'}));
  assert.throws(()=>verifyReleaseManifest(root),/Source or build inputs changed/);
}));
