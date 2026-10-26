import { compile } from 'svelte/compiler';
import fs from 'fs';
for (const f of process.argv.slice(2)) {
  try { const r = compile(fs.readFileSync(f,'utf8'), {filename:f, runes:true});
    console.log('OK', f, r.warnings.map(w=>w.code).join(' '));
  } catch(e){ console.log('ERR', f, e.message); }
}
