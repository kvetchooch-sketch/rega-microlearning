import fs from 'node:fs/promises';
const data=JSON.parse(await fs.readFile(new URL('../content/catalog.json',import.meta.url),'utf8'));
for(const c of data.categories){const n=data.facts.filter(f=>f.category===c.id&&f.workflow==='approved').length;console.log(`${c.name}: ${n}${n<15?' — needs content':''}`);}
for(const f of data.facts)if(f.nextReviewAt&&Date.parse(f.nextReviewAt)<Date.now()+30*86400000)console.log(`REVIEW DUE: ${f.id} ${f.nextReviewAt}`);
console.log('Drafts:',data.facts.filter(f=>f.workflow==='draft').length);
