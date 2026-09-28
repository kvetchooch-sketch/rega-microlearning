import fs from 'node:fs/promises';
const path=new URL('../content/catalog.json',import.meta.url),data=JSON.parse(await fs.readFile(path,'utf8'));
const mappings={
 'https://www.nist.gov/artificial-intelligence/ai-fundamental-research-managing-ai-bias':['NIST · AI risks and trustworthiness','https://airc.nist.gov/airmf-resources/airmf/3-sec-characteristics/','government','Fair with harmful bias managed'],
 'https://pages.nist.gov/REPO/sections/intro/what-is-genai.html':['ISO · What is artificial intelligence?','https://www.iso.org/artificial-intelligence/what-is-ai','primary','Supervised, unsupervised and reinforcement learning'],
 'https://pages.nist.gov/REPO/sections/tutorials/prompt-engineering.html':['Microsoft · Writing clear prompts','https://support.microsoft.com/en-us/microsoft-365-copilot/get-started-writing-prompts-in-microsoft-365-copilot','primary','Goal, context, expectations and source']
};
for(const f of data.facts){let changed=false;for(const s of f.sources){let m=mappings[s.url];if(!m)continue;if(f.id==='ai-retrieval')m=['NIST · RAG glossary','https://csrc.nist.gov/glossary/term/rag','government','Model paired with separate information retrieval system'];[s.name,s.url,s.type]=m;s.publicationDate=null;f.review.evidence=m[3];changed=true;}
 if(changed){f.explanation=f.explanation.replace('מדריך NIST ממליץ','המדריך של Microsoft ממליץ');f.updatedAt=f.dateVerified=f.review.reviewedAt=new Date().toISOString();f.corrections=[...(f.corrections||[]),{date:'2026-09-28',reason:'הקישור הקודם לא היה זמין. הטענה נבדקה מחדש מול מקור רשמי חלופי.'}];}
}
await fs.writeFile(path,JSON.stringify(data,null,2));
