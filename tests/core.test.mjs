import {test} from 'node:test';
import assert from 'node:assert/strict';
import {blankProfile,normalizeProfile,loadProfile,saveProfile,isEligible,nextFact,ensureInteraction,setReaction,toggleSaved,affinity,statistics,isValidMix} from '../dist/core.mjs';
import {FACTS,CATEGORIES,AVAILABLE_CATEGORIES} from '../dist/content.mjs';
const now=new Date('2026-09-26T12:00:00Z');

test('every offered topic has at least four distinct readable cards',()=>{
 for(const c of AVAILABLE_CATEGORIES)assert.ok(FACTS.filter(f=>f.category===c.id).length>=4,c.id);
 assert.equal(new Set(FACTS.map(f=>f.shortFact)).size,FACTS.length);
 for(const f of FACTS.filter(f=>f.category==='ai'))assert.doesNotMatch(f.shortFact+' '+f.summary+' '+f.explanation,/confabulation|גנרטיבי|אסמכתה|LLM/);
});
test('all published facts have complete source-checked metadata',()=>{
 assert.equal(new Set(FACTS.map(f=>f.id)).size,FACTS.length);assert.equal(CATEGORIES.length,33);
 for(const f of FACTS){assert.ok(isEligible(f,now),f.id);for(const key of ['title','shortFact','summary','explanation','whyItMatters','dateVerified','createdAt','updatedAt'])assert.ok(f[key],f.id+key);assert.ok(CATEGORIES.some(c=>c.id===f.category));assert.ok(f.shortFact.length<180);}
});
test('first fact honors every selectable interest across 100 random runs',()=>{
 for(const c of AVAILABLE_CATEGORIES)for(let n=0;n<100;n++){const p=blankProfile();p.interests=[c.id];assert.equal(nextFact(FACTS,CATEGORIES,p,{now}).category,c.id);}
});
test('entire library has no repeats; exhaustion stops; review is explicit',()=>{
 const p=blankProfile(),seen=new Set();for(let n=0;n<FACTS.length;n++){const f=nextFact(FACTS,CATEGORIES,p,{now});assert.ok(f);assert.ok(!seen.has(f.id));seen.add(f.id);ensureInteraction(p,f.id,now);p.current=f.id;}
 assert.equal(nextFact(FACTS,CATEGORIES,p,{now}),null);assert.ok(nextFact(FACTS,CATEGORIES,p,{now,review:true}));
});
test('repeated reactions are idempotent and changing a vote replaces its effect',()=>{
 const p=blankProfile(),f=FACTS[0];setReaction(p,f.id,'interest','yes',now);const score=affinity(p,FACTS)[f.category];
 for(let i=0;i<100;i++)setReaction(p,f.id,'interest','yes',now);
 assert.equal(affinity(p,FACTS)[f.category],score);
 setReaction(p,f.id,'interest','no',now);assert.ok(affinity(p,FACTS)[f.category]<0);assert.equal(Object.keys(p.history).length,1);
});
test('saving then unsaving restores the original affinity',()=>{
 const p=blankProfile(),f=FACTS[0];ensureInteraction(p,f.id,now);const before=affinity(p,FACTS)[f.category];toggleSaved(p,f.id);assert.ok(affinity(p,FACTS)[f.category]>before);toggleSaved(p,f.id);assert.equal(affinity(p,FACTS)[f.category],before);
});
test('source gate rejects stale, undated, unreviewed and insecure content',()=>{
 const f=FACTS[0];assert.equal(isEligible({...f,verificationStatus:'draft'},now),false);
 assert.equal(isEligible({...f,dateVerified:'invalid'},now),false);
 assert.equal(isEligible({...f,dateVerified:'2027-01-01'},now),false);
 assert.equal(isEligible({...f,freshness:'timeSensitive'},now),false);
 assert.equal(isEligible({...f,freshness:'timeSensitive',nextReviewAt:'2026-09-24'},now),false);
 assert.equal(isEligible({...f,freshness:'timeSensitive',nextReviewAt:'2026-10-01'},now),true);
 assert.equal(isEligible({...f,sources:[{name:'x',url:'javascript:alert(1)'}]},now),false);
 assert.equal(isEligible({...f,verificationStatus:'qualified',verificationNote:''},now),false);
});
test('streak reflects consecutive calendar days and expires after a missed day',()=>{
 const p=blankProfile();p.activeDays=['2026-09-23','2026-09-24','2026-09-25'];
 assert.equal(statistics(p,FACTS,new Date(2026,8,25,12)).streak,3);
 assert.equal(statistics(p,FACTS,new Date(2026,8,26,12)).streak,3);
 assert.equal(statistics(p,FACTS,new Date(2026,8,27,12)).streak,0);
});
test('showing a card is not counted as learning or reading',()=>{
 const p=blankProfile();ensureInteraction(p,FACTS[0].id,now);assert.equal(statistics(p,FACTS,now).read,0);assert.equal(statistics(p,FACTS,now).learned,0);
 setReaction(p,FACTS[0].id,'knowledge','learned',now);assert.equal(statistics(p,FACTS,now).learned,1);
 setReaction(p,FACTS[0].id,'knowledge','knew',now);assert.equal(statistics(p,FACTS,now).learned,0);
});
test('profile survives serialization and rejects malformed state',()=>{
 const p=blankProfile();p.onboarded=true;p.interests=['space'];setReaction(p,FACTS[0].id,'knowledge','learned',now);
 const memory={getItem(){return this.value;},setItem(k,v){this.value=v;}};
 assert.ok(saveProfile(memory,p));assert.deepEqual(loadProfile(memory).profile,p);
 assert.deepEqual(normalizeProfile({version:999}),blankProfile());
 assert.deepEqual(normalizeProfile({version:1,interests:['<script>','space'],history:{x:{seconds:-8}}}).interests,['space']);
 assert.equal(normalizeProfile({version:1,history:{x:{seconds:-8}}}).history.x.seconds,0);
});
test('storage failures surface without throwing or destroying data',()=>{
 assert.ok(loadProfile({getItem(){return '{broken';}}).error);
 assert.equal(saveProfile({setItem(){throw Error('Quota');}},blankProfile()),false);
});
test('mix validation and discovery policy',()=>{
 assert.ok(isValidMix({personalized:.7,adjacent:.2,discovery:.1}));assert.ok(!isValidMix({personalized:-1,adjacent:1,discovery:1}));
 const p=blankProfile();p.interests=['space'];ensureInteraction(p,'old',now);p.mix={personalized:0,adjacent:0,discovery:1};
 for(let n=0;n<100;n++)assert.notEqual(nextFact(FACTS,CATEGORIES,p,{now}).category,'space');
});
test('invalid reactions do not mutate state',()=>{const p=blankProfile(),before=JSON.stringify(p);assert.throws(()=>setReaction(p,'x','interest','garbage'));assert.equal(JSON.stringify(p),before);});
