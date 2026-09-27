import {FACTS,CATEGORIES} from '../dist/content.mjs';
import {isEligible} from '../dist/core.mjs';
export const APP_URL='https://kvetchooch-sketch.github.io/rega-microlearning/';
export const ORIGIN=new URL(APP_URL).origin;
export const LEASE_MS=90*86400000;
export function validateSubscription(s){
 if(!s||typeof s.endpoint!=='string'||s.endpoint.length>2048)throw Error('invalid_subscription');
 const u=new URL(s.endpoint),host=u.hostname;
 const allowed=host==='web.push.apple.com'||host.endsWith('.push.apple.com')||host==='fcm.googleapis.com'||host==='updates.push.services.mozilla.com'||host.endsWith('.notify.windows.com');
 if(u.protocol!=='https:'||!allowed||u.port||u.username||u.password||u.hash)throw Error('invalid_endpoint');
 if(!/^[A-Za-z0-9_-]{87}$/.test(s.keys?.p256dh||'')||!/^B/.test(s.keys.p256dh)||!/^[A-Za-z0-9_-]{22}$/.test(s.keys?.auth||''))throw Error('invalid_keys');
 return {endpoint:u.href,keys:{p256dh:s.keys.p256dh,auth:s.keys.auth}};
}
export function preferences(body){
 const topics=[...new Set(Array.isArray(body.topics)?body.topics:[])].filter(id=>CATEGORIES.some(c=>c.id===id)&&FACTS.some(f=>f.category===id));
 if(!topics.length||!['daily','few'].includes(body.frequency)||!Number.isInteger(body.hour)||body.hour<8||body.hour>20||typeof body.timezone!=='string'||body.timezone.length>80)throw Error('invalid_preferences');
 new Intl.DateTimeFormat('en',{timeZone:body.timezone}).format();
 return {topics,frequency:body.frequency,hour:body.hour,timezone:body.timezone};
}
export function nextDelivery(p,now=Date.now()){
 const formatter=new Intl.DateTimeFormat('en-GB',{timeZone:p.timezone,year:'numeric',month:'numeric',day:'numeric',hour:'numeric',minute:'numeric',hourCycle:'h23'});
 const parts=t=>Object.fromEntries(formatter.formatToParts(t).filter(x=>x.type!=='literal').map(x=>[x.type,Number(x.value)]));
 const local=parts(now),base=Date.UTC(local.year,local.month-1,local.day);
 const hours=p.frequency==='few'?[9,14,19]:[p.hour];
 for(let day=0;day<3;day++)for(const hour of hours){
  const nominal=base+day*86400000+hour*3600000;let utc=nominal;
  for(let i=0;i<3;i++){const v=parts(utc);const offset=Date.UTC(v.year,v.month-1,v.day,v.hour,v.minute)-utc;utc=nominal-offset;}
  if(utc>now+1000)return utc;
 }
 throw Error('schedule_failed');
}
export function selectFact(topics,sent,now=Date.now(),random=Math.random){
 const available=FACTS.filter(f=>isEligible(f,new Date(now))&&!sent.includes(f.id));
 const personal=available.filter(f=>topics.includes(f.category));
 const pool=personal.length?personal:available;
 return pool.length?pool[Math.min(pool.length-1,Math.floor(random()*pool.length))]:null;
}
export async function hash(value){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,'0')).join('');}
export function payloadFor(f,test=false){return {title:test?'רגע · התראת ניסיון':'רגע · משהו קטן לדעת',body:test?'ההתראות מחוברות. לחיצה תחזיר אותך לאפליקציה.':f.shortFact,factId:test?null:f.id,tag:test?'rega-test':'rega-fact',expiresAt:Date.now()+3600000};}
