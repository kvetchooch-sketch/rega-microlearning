// Link availability is a triage signal, NEVER factual verification/auto-approval.
import fs from 'node:fs/promises';
const data=JSON.parse(await fs.readFile(new URL('../content/catalog.json',import.meta.url),'utf8'));
const urls=[...new Set(data.facts.filter(f=>f.workflow==='approved').flatMap(f=>f.sources.map(s=>s.url)))];
let next=0,attention=0;
await Promise.all(Array.from({length:4},async()=>{while(next<urls.length){const url=urls[next++];try{const r=await fetch(url,{method:'GET',signal:AbortSignal.timeout(15000),headers:{'User-Agent':'Rega-content-link-check/1.0'}});await r.body?.cancel();if(!r.ok)attention++;console.log(r.status+' '+url);}catch{attention++;console.log('CHECK MANUALLY '+url);}}}));
console.log(`${urls.length} unique source URLs; ${attention} require manual availability checks. A 200 does not verify the claim; 403/timeouts may be bot protection.`);
