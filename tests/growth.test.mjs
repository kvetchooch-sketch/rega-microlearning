import {test} from 'node:test';
import assert from 'node:assert/strict';
import {blankProfile,ensureInteraction,normalizeProfile,nextFact,formatVerifiedDate} from '../dist/core.mjs';
import {reviewSet,filteredSaved,backup,parseBackup} from '../dist/growth.mjs';
import {FACTS,CATEGORIES} from '../dist/content.mjs';
import {validateCatalog} from '../scripts/build-content.mjs';
const now=new Date('2026-10-10T12:00:00Z');
test('old backups migrate; new backups preserve collections and reviews but exclude push credentials',()=>{
 const p=blankProfile();p.collections=[{id:'c-test',name:'חשוב',facts:[FACTS[0].id]}];p.reviewed[FACTS[0].id]=now.toISOString();p.syncRead=true;
 assert.deepEqual(parseBackup(backup(p)),p);assert.deepEqual(parseBackup(p),p);assert.ok(!JSON.stringify(backup({...p,token:'private'})).includes('private'));assert.throws(()=>parseBackup({version:99}));
 assert.equal(normalizeProfile({...p,collections:[{id:'constructor',name:'bad'}]}).collections.length,0);
});
test('weekly review is due-only, capped, and respects completion without changing learned ratings',()=>{
 const p=blankProfile();for(const f of FACTS.slice(0,5)){ensureInteraction(p,f.id,new Date('2026-10-01')).read=true;}
 p.saved=[FACTS[2].id];let due=reviewSet(p,FACTS,now.getTime());assert.equal(due.length,3);assert.equal(due[0].id,FACTS[2].id);
 p.reviewed[FACTS[2].id]=now.toISOString();assert.ok(!reviewSet(p,FACTS,now.getTime()).some(f=>f.id===FACTS[2].id));
 p.reviewed[FACTS[0].id]=p.reviewed[FACTS[1].id]=now.toISOString();assert.equal(reviewSet(p,FACTS,now.getTime()).length,0);
});
test('saved search intersects category and collection and excludes stale content',()=>{
 const p=blankProfile(),f=FACTS[0];p.saved=[f.id];p.collections=[{id:'c-test',name:'מועדף',facts:[f.id]}];
 assert.equal(filteredSaved(p,FACTS,{query:f.shortFact.split(' ')[0],collection:'c-test',category:f.category}).length,1);
 assert.equal(filteredSaved(p,FACTS,{query:'zzzzzz'}).length,0);assert.equal(filteredSaved(p,FACTS,{collection:'missing'}).length,0);
});
test('synced notification IDs are excluded from discovery, but explicit review can use them',()=>{
 const p=blankProfile();p.notificationSeen=FACTS.map(f=>f.id);assert.equal(nextFact(FACTS,CATEGORIES,p,{now}),null);assert.ok(nextFact(FACTS,CATEGORIES,p,{now,review:true}));
});
test('publication gate excludes drafts and rejects missing evidence, stale facts and duplicate text',()=>{
 const f={...FACTS[0],workflow:'approved',review:{reviewer:'editor',sourceChecked:true,plainLanguageChecked:true,evidence:'source paragraph',reviewedAt:'2026-09-27'}};
 const base={schema:1,categories:CATEGORIES,facts:[f]};assert.equal(validateCatalog(base,now).length,1);assert.equal(validateCatalog({...base,facts:[{...f,workflow:'draft'}]},now).length,0);
 assert.throws(()=>validateCatalog({...base,facts:[{...f,review:{}}]},now));assert.throws(()=>validateCatalog({...base,facts:[{...f,freshness:'timeSensitive',nextReviewAt:'2026-09-01'}]},now));assert.throws(()=>validateCatalog({...base,facts:[f,{...f,id:'duplicate-text'}]},now));
});
test('less-topic preference actually reduces a sole chosen category, not only its within-pool weight',()=>{
 const p=blankProfile();p.interests=['ai'];ensureInteraction(p,FACTS.find(f=>f.category==='ai').id,now);
 const a=nextFact(FACTS,CATEGORIES,p,{now,rng:()=>.1});assert.equal(a.category,'ai');
 p.lessTopics=['ai'];assert.notEqual(nextFact(FACTS,CATEGORIES,p,{now,rng:()=>.1}).category,'ai');
});
test('verification instants work across Israel midnight without admitting genuinely future facts',()=>{
 const f={...FACTS[0],dateVerified:'2026-09-28T00:00:00+03:00'};
 assert.equal(validateCatalog({schema:1,categories:CATEGORIES,facts:[{...f,workflow:'approved',review:{reviewer:'reviewer',evidence:'source',sourceChecked:true,plainLanguageChecked:true,reviewedAt:f.dateVerified}}]},new Date('2026-09-27T21:10:00Z')).length,1);
});
test('date display supports both legacy dates and precise ISO timestamps',()=>{
 assert.equal(formatVerifiedDate('2026-09-27'),formatVerifiedDate('2026-09-27T21:00:00Z'));assert.equal(formatVerifiedDate('invalid'),'תאריך לא זמין');
 for(const f of FACTS)assert.notEqual(formatVerifiedDate(f.dateVerified),'תאריך לא זמין');
});
