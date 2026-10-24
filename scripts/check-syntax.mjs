import { createRequire } from 'node:module';
const ts = createRequire(import.meta.url)('typescript');
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
let count = 0, errors = 0;
function visit(p) {
  for (const f of readdirSync(p, {withFileTypes: true})) {
    const full=join(p,f.name);
    if (f.isDirectory()) visit(full);
    else if (f.name.endsWith('.ts')) {
      const result = ts.transpileModule(readFileSync(full,'utf8'),{fileName:full,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}});
      count++;
      const diagnostics=(result.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error);
      if (diagnostics.length) {
        console.error(full,diagnostics.map(d=>ts.flattenDiagnosticMessageText(d.messageText,'\n')));
        errors+=diagnostics.length;
      }
    }
  }
}
visit('src');visit('tests');
console.log(`Checked ${count} TypeScript files: ${errors} syntax diagnostics`);
if (errors) process.exitCode=1;
