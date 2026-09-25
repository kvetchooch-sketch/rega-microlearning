import fs from 'node:fs/promises';
const source=new URL('../dist/',import.meta.url),destination=new URL('../docs/',import.meta.url);
await fs.mkdir(destination,{recursive:true});
for(const name of await fs.readdir(source)){await fs.copyFile(new URL(name,source),new URL(name,destination));}
await fs.writeFile(new URL('.nojekyll',destination),'');
console.log('Prepared static GitHub Pages files in docs/. No personal data included.');
