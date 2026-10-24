import { verifyReleaseManifest } from './release-integrity.mjs';
try {
  console.log('Dist integrity verified:',JSON.stringify(verifyReleaseManifest()));
} catch (error) {
  console.error('Dist verification FAILED:',error.message);
  process.exitCode=1;
}
