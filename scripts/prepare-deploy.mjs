import { cpSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, '.release/streak');
mkdirSync(output, {recursive:true});
// Keep the Vercel project link while replacing every public asset.
for(const name of readdirSync(output)){
  if(name !== '.vercel') rmSync(path.join(output, name), {recursive:true, force:true});
}
// Deliberately omit Git history, documentation, tests, and personal backups.
for(const name of ['index.html','manifest.webmanifest','sw.js','css','js','icons','vercel.json']){
  cpSync(path.join(root,name), path.join(output,name), {recursive:true});
}
console.log('Static deployment prepared in .release/streak');
