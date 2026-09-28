export const DEFAULT_MIX=Object.freeze({personalized:.7,adjacent:.2,discovery:.1});
export function formatVerifiedDate(value){
 const date=new Date(/^\d{4}-\d{2}-\d{2}$/.test(value)?value+'T12:00:00Z':value);
 if(!Number.isFinite(date.getTime()))return 'תאריך לא זמין';
 return new Intl.DateTimeFormat('he-IL',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(date);
}
export function blankProfile(){return {version:1,onboarded:false,interests:[],style:'mixed',cadence:'own',theme:'system',history:{},saved:[],current:null,activeDays:[],mix:{...DEFAULT_MIX},lessTopics:[],collections:[],reviewed:{},notificationSeen:[],syncRead:false};}
export function dayKey(date=new Date()){return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');}
const safeID=id=>typeof id==='string'&&/^[a-z0-9-]{1,80}$/.test(id)&&!['constructor','prototype'].includes(id);
export function normalizeProfile(value){
 const p=blankProfile();if(!value||value.version!==1)return p;
 p.onboarded=value.onboarded===true;
 p.interests=Array.isArray(value.interests)?[...new Set(value.interests.filter(safeID))]:[];
 p.style=['mixed','surprise','useful'].includes(value.style)?value.style:'mixed';
 p.cadence=['own','daily','few'].includes(value.cadence)?value.cadence:'own';
 p.theme=['system','light','dark'].includes(value.theme)?value.theme:'system';
 p.saved=Array.isArray(value.saved)?[...new Set(value.saved.filter(safeID))]:[];
 p.current=safeID(value.current)?value.current:null;
 p.lessTopics=Array.isArray(value.lessTopics)?[...new Set(value.lessTopics.filter(safeID))]:[];
 p.notificationSeen=Array.isArray(value.notificationSeen)?[...new Set(value.notificationSeen.filter(safeID))].slice(-10000):[];
 p.syncRead=value.syncRead===true;
 if(Array.isArray(value.collections))p.collections=value.collections.filter(c=>c&&safeID(c.id)&&typeof c.name==='string').slice(0,50).map(c=>({id:c.id,name:c.name.trim().slice(0,50),facts:Array.isArray(c.facts)?[...new Set(c.facts.filter(safeID))]:[]}));
 if(value.reviewed&&typeof value.reviewed==='object')for(const [id,date] of Object.entries(value.reviewed))if(safeID(id)&&typeof date==='string'&&Number.isFinite(Date.parse(date)))p.reviewed[id]=date;
 p.activeDays=Array.isArray(value.activeDays)?[...new Set(value.activeDays.filter(d=>/^\d{4}-\d{2}-\d{2}$/.test(d)))].sort():[];
 if(value.history&&typeof value.history==='object'&&!Array.isArray(value.history))for(const [id,h] of Object.entries(value.history)){
  if(!safeID(id)||!h||typeof h!=='object')continue;
  p.history[id]={shownAt:typeof h.shownAt==='string'?h.shownAt:null,
   knowledge:['knew','learned'].includes(h.knowledge)?h.knowledge:null,
   interest:['yes','no'].includes(h.interest)?h.interest:null,
   opened:h.opened===true,seconds:Number.isFinite(h.seconds)?Math.max(0,Math.min(120,h.seconds)):0,read:h.read===true};
 }
 if(isValidMix(value.mix))p.mix={...value.mix};
 return p;
}
export function loadProfile(storage){try{const raw=storage.getItem('rega.profile.v1');return {profile:raw?normalizeProfile(JSON.parse(raw)):blankProfile(),error:null};}catch{return {profile:blankProfile(),error:'לא הצלחנו לקרוא את השמירה המקומית. ההתקדמות הישנה לא נמחקה.'};}}
export function saveProfile(storage,profile){try{storage.setItem('rega.profile.v1',JSON.stringify(profile));return true;}catch{return false;}}
export function isValidMix(m){return !!m&&['personalized','adjacent','discovery'].every(k=>Number.isFinite(m[k])&&m[k]>=0)&&Math.abs(m.personalized+m.adjacent+m.discovery-1)<1e-8;}
export function isEligible(fact,now=new Date()){
 const verified=Date.parse(fact.dateVerified);
 if(!['sourceChecked','qualified'].includes(fact.verificationStatus)||!Number.isFinite(verified)||verified>now.getTime())return false;
 if(!fact.sources?.length||!fact.sources.every(s=>{try{return new URL(s.url).protocol==='https:'&&!!s.name;}catch{return false;}}))return false;
 if(fact.verificationStatus==='qualified'&&!fact.verificationNote)return false;
 if(fact.freshness==='timeSensitive'){const review=Date.parse(fact.nextReviewAt);return Number.isFinite(review)&&review>now.getTime();}
 return fact.freshness==='evergreen';
}
export function affinity(profile,facts){
 const scores={};
 for(const f of facts){const h=profile.history[f.id];if(!h)continue;const points=(h.interest==='yes'?2:h.interest==='no'?-3:0)+(h.knowledge==='learned'?.3:h.knowledge==='knew'?-.1:0)+(h.opened?.3:0)+(profile.saved.includes(f.id)?1.5:0)+Math.min(h.seconds,15)/150;scores[f.category]=(scores[f.category]||0)+points;}
 return scores;
}
const adjacent={tech:['science','ideas'],science:['tech','world'],world:['people','money'],money:['world','skills'],people:['ideas','skills'],ideas:['science','people'],skills:['life','people'],life:['skills','people']};
export function nextFact(facts,categories,profile,{rng=Math.random,now=new Date(),review=false}={}){
 const available=facts.filter(f=>isEligible(f,now)&&f.id!==profile.current&&(review||(!profile.history[f.id]&&!profile.notificationSeen?.includes(f.id))));
 if(!available.length)return null;
 const scores=affinity(profile,facts), preferred=new Set([...profile.interests,...Object.keys(scores).filter(c=>scores[c]>1)].filter(c=>!profile.lessTopics?.includes(c)));
 const mix=isValidMix(profile.mix)?profile.mix:DEFAULT_MIX;
 const groups=new Set(categories.filter(c=>preferred.has(c.id)).flatMap(c=>adjacent[c.group]||[]));
 const roll=rng();let pool;
 if(!Object.keys(profile.history).length||roll<mix.personalized)pool=available.filter(f=>preferred.has(f.category));
 else if(roll<mix.personalized+mix.adjacent)pool=available.filter(f=>!preferred.has(f.category)&&groups.has(categories.find(c=>c.id===f.category)?.group));
 else pool=available.filter(f=>!preferred.has(f.category));
 if(!pool.length)pool=available;
 const recent=Object.entries(profile.history).sort((a,b)=>String(b[1].shownAt).localeCompare(String(a[1].shownAt))).slice(0,3).map(([id])=>facts.find(f=>f.id===id)?.category);
 const weights=pool.map(f=>Math.max(.08,Math.exp(Math.max(-3,Math.min(3,scores[f.category]||0))*.4))*(profile.style===f.kind?1.6:1)*(profile.lessTopics?.includes(f.category)?.2:1)*(recent.filter(c=>c===f.category).length>=2?.4:1));
 let pick=rng()*weights.reduce((a,b)=>a+b,0);
 for(let i=0;i<pool.length;i++){pick-=weights[i];if(pick<0)return pool[i];}
 return pool.at(-1);
}
export function ensureInteraction(profile,id,now=new Date()){
 if(!safeID(id))throw new Error('Invalid fact ID');
 if(!profile.history[id])profile.history[id]={shownAt:now.toISOString(),knowledge:null,interest:null,opened:false,seconds:0,read:false};
 return profile.history[id];
}
export function markRead(profile,id,now=new Date()){const h=ensureInteraction(profile,id,now);h.read=true;const d=dayKey(now);if(!profile.activeDays.includes(d))profile.activeDays.push(d);}
export function setReaction(profile,id,axis,value,now=new Date()){
 if(!((axis==='knowledge'&&['knew','learned'].includes(value))||(axis==='interest'&&['yes','no'].includes(value))))throw new Error('Invalid reaction');
 const h=ensureInteraction(profile,id,now);h[axis]=value;markRead(profile,id,now);
}
export function toggleSaved(profile,id){if(!safeID(id))throw new Error('Invalid ID');profile.saved=profile.saved.includes(id)?profile.saved.filter(x=>x!==id):[...profile.saved,id];}
export function statistics(profile,facts,now=new Date()){
 const ids=new Set(facts.map(f=>f.id));const entries=Object.entries(profile.history).filter(([id,h])=>ids.has(id)&&h.read);
 const categories=new Set(entries.map(([id])=>facts.find(f=>f.id===id).category));
 const days=new Set(profile.activeDays);let date=new Date(now);date.setHours(12,0,0,0);let streak=0;
 if(!days.has(dayKey(date)))date.setDate(date.getDate()-1);
 while(days.has(dayKey(date))){streak++;date.setDate(date.getDate()-1);}
 return {read:entries.length,learned:entries.filter(([,h])=>h.knowledge==='learned').length,saved:profile.saved.filter(id=>ids.has(id)).length,streak,categories:[...categories]};
}
