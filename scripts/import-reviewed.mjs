import fs from 'node:fs/promises';
import {sources,rows} from '../content/reviewed-additions.mjs';
import {sources as moreSources,rows as moreRows} from '../content/reviewed-additions-2.mjs';
Object.assign(sources,moreSources);rows.push(...moreRows);
import {sources as lastSources,rows as lastRows} from '../content/reviewed-additions-3.mjs';
Object.assign(sources,lastSources);rows.push(...lastRows);
const path=new URL('../content/catalog.json',import.meta.url),data=JSON.parse(await fs.readFile(path,'utf8'));
for(const [id,category,key,shortFact,explanation,example] of rows){
 if(data.facts.some(f=>f.id===id))continue;
 const [name,url,type,evidence]=sources[key];
 data.facts.push({id,category,subcategory:key,title:shortFact,shortFact,summary:explanation.split('。')[0],explanation,example,whyItMatters:example,sources:[{name,url,type,publicationDate:null}],dateVerified:'2026-09-27',verificationStatus:'sourceChecked',verificationNote:'נבדק מול המקור המקושר. הדוגמה והמשמעות המעשית הן הסבר עריכתי, לא ציטוט או הבטחת תוצאה.',tags:[category,key],difficulty:'easy',freshness:'evergreen',nextReviewAt:null,createdAt:'2026-09-27',updatedAt:'2026-09-27',kind:['ai','business','entrepreneurship','math','statistics','critical','communication'].includes(category)?'useful':'surprise',workflow:'approved',review:{reviewer:'Codex source review',sourceChecked:true,plainLanguageChecked:true,evidence,reviewedAt:'2026-09-27'}});
}
const addedToday=new Set(lastRows.map(r=>r[0]));
for(const f of data.facts){
 for(const s of f.sources||[])s.name=s.name.replace(' (CC BY 4.0)','');
 if(addedToday.has(f.id)){
  // Israel has crossed midnight; use the actual UTC verification instant.
  f.dateVerified=f.createdAt=f.updatedAt=f.review.reviewedAt='2026-09-27T21:00:00Z';
  f.kind=['life','learning','finance','decisions','critical'].includes(f.category)?'useful':'surprise';
  if(f.category==='learning'){f.verificationStatus='qualified';f.verificationNote='הנחיה המבוססת על מחקרי למידה; מידת התועלת תלויה בחומר, באדם ובאופן התרגול. אין הבטחת שיפור אישי.';}
  if(f.category==='finance')f.verificationNote+=' מידע לימודי כללי, לא ייעוץ השקעות אישי.';
  const dates={retrieval:'2016-06-23',learnplan:'2017-04-20',interleave:'2018-03-21',fees:'2025-07-23',sky:'2022-08-29',choices:'2022-12-14'};
  f.sources[0].publicationDate=dates[f.subcategory]||null;
 }
}
await fs.writeFile(path,JSON.stringify(data,null,2));console.log('Catalog entries:',data.facts.length);
