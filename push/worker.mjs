import webpush from 'web-push';
import {APP_URL,ORIGIN,LEASE_MS,validateSubscription,preferences,nextDelivery,selectFact,hash,payloadFor,withinWindow} from './policy.mjs';
const cors={'Access-Control-Allow-Origin':ORIGIN,'Access-Control-Allow-Methods':'GET,POST,DELETE,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Authorization,X-Enrollment-Code','Vary':'Origin','Cache-Control':'no-store'};
const json=(data,status=200)=>Response.json(data,{status,headers:cors});
export async function sendPush(env,subscription,payload,transport=fetch){
 let stage='encryption';
 try{
  // The notification tag is UI metadata, not an encoded Web Push Topic.
  // Omit the optional collapse header rather than sending a noncanonical value.
  const request=webpush.generateRequestDetails(validateSubscription(subscription),JSON.stringify(payload),{TTL:3600,urgency:'normal',vapidDetails:{subject:APP_URL,publicKey:env.VAPID_PUBLIC_KEY,privateKey:env.VAPID_PRIVATE_KEY}});
  stage='transport';
  // Workers fetch supports manual/follow, not the browser's redirect:error.
  // Never follow a redirect: credentials and ciphertext stay at the validated host.
  const response=await transport(request.endpoint,{method:'POST',headers:request.headers,body:request.body,redirect:'manual',signal:AbortSignal.timeout(12000)});
  if(!response.ok&&response.status!==404&&response.status!==410){
   // Keep only known public protocol error codes; never persist response bodies,
   // device endpoints, authorization headers or other provider data.
   const allowed=new Set(['BadWebPushTopic','BadAuthorizationHeader','BadJwtToken','BadTtl','BadUrgency','BadWebPushRequest','VapidPkHashMismatch','BadVapidPublicKey','BadPath','MethodNotAllowed','PayloadTooLarge','TooManyRequests','InternalServerError','ServiceUnavailable','Shutdown','IdleTimeout']);
   const data=await response.json().catch(()=>null);
   if(allowed.has(data?.reason))return response.status+'_'+data.reason;
  }
  return response.status;
 }catch{
  throw Object.assign(new Error('Push failed'),{deliveryDiagnostic:stage});
 }
}
export async function handleRequest(request,env,now=Date.now()){
 const path=new URL(request.url).pathname;
 if(request.headers.get('Origin')&&request.headers.get('Origin')!==ORIGIN)return json({error:'origin_denied'},403);
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
 if(request.method==='GET'&&path==='/health')return json({ok:true,version:2});
 if(request.method==='GET'&&path==='/config')return env.VAPID_PUBLIC_KEY?json({publicKey:env.VAPID_PUBLIC_KEY,requiresCode:true}):json({error:'not_configured'},503);
 const token=request.headers.get('Authorization')?.replace(/^Bearer /,'');
 if(!/^[A-Za-z0-9_-]{43}$/.test(token||''))return json({error:'unauthorized'},401);
 const id=await hash(token);
 const existing=await env.DB.prepare('SELECT * FROM devices WHERE token_hash = ?').bind(id).first();
 if(path==='/subscription'&&request.method==='GET')return existing?json({active:true,frequency:existing.frequency,hour:existing.hour,timezone:existing.timezone,nextAt:existing.next_at,testAt:existing.test_at,lastStatus:existing.last_status,expiresAt:existing.expires_at,options:JSON.parse(existing.delivery_options||'{}'),sent:JSON.parse(existing.sent)}):json({active:false});
 if(path==='/sync'&&request.method==='POST'){
  if(!existing)return json({error:'not_registered'},404);
  const raw=await request.text();if(raw.length>200000)return json({error:'too_large'},413);
  let data;try{data=JSON.parse(raw);}catch{return json({error:'invalid_request'},400);}
  const options=JSON.parse(existing.delivery_options||'{}');
  if(options.syncRead!==true)return json({error:'sync_disabled'},403);
  if(!Array.isArray(data.read)||data.read.length>10000||data.read.some(id=>typeof id!=='string'||!/^[a-z0-9-]{1,80}$/.test(id)))return json({error:'invalid_request'},400);
  if(existing.last_sync>now-15000)return json({error:'sync_cooldown'},429);
  let p;try{p=preferences({...existing,topics:data.topics,options});}catch{return json({error:'invalid_request'},400);}
  await env.DB.prepare('UPDATE devices SET read_ids=?,topics=?,last_sync=? WHERE token_hash=?').bind(JSON.stringify([...new Set(data.read)]),JSON.stringify(p.topics),now,id).run();
  return json({sent:JSON.parse(existing.sent)});
 }
 if(path==='/subscription'&&request.method==='DELETE'){
  await env.DB.prepare('DELETE FROM devices WHERE token_hash = ?').bind(id).run();return json({active:false});
 }
 if(path==='/subscription'&&request.method==='POST'){
  if(!existing){
   const code=request.headers.get('X-Enrollment-Code')||'';
   const rateKey=await hash('enroll:'+request.headers.get('CF-Connecting-IP')+':'+Math.floor(now/600000));
   await env.DB.prepare('INSERT INTO rate_limits(key,count,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1').bind(rateKey,now+600000).run();
   const rate=await env.DB.prepare('SELECT count FROM rate_limits WHERE key=?').bind(rateKey).first();
   if(rate.count>5)return json({error:'enrollment_cooldown'},429);
   if(!code||code.length>100)return json({error:'invalid_code'},403);
   const codeHash=await hash(code),legacy=env.ALLOW_LEGACY_ENROLLMENT==='true'&&env.ENROLLMENT_CODE&&codeHash===await hash(env.ENROLLMENT_CODE);
   if(!legacy){const claim=await env.DB.prepare('UPDATE invitations SET used_by=? WHERE code_hash=? AND expires_at>? AND (used_by IS NULL OR used_by=?)').bind(id,codeHash,now,id).run();if(!claim.meta.changes)return json({error:'invalid_code'},403);}
  }
  if(Number(request.headers.get('Content-Length')||0)>8192)return json({error:'too_large'},413);
  const raw=await request.text();if(raw.length>8192)return json({error:'too_large'},413);
  let body,s,p,next;try{body=JSON.parse(raw);s=validateSubscription(body.subscription);p=preferences(body);next=nextDelivery(p,now);}catch{return json({error:'invalid_request'},400);}
  const endpointHash=await hash(s.endpoint);
  // Endpoint ownership cannot be replaced by a different device token. At most
  // 20 devices keeps this personal MVP bounded, even if a pairing code leaks.
  const owner=await env.DB.prepare('SELECT token_hash FROM devices WHERE endpoint_hash = ?').bind(endpointHash).first();
  if(owner&&owner.token_hash!==id)return json({error:'already_registered'},409);
  if(existing){
   await env.DB.prepare('UPDATE devices SET endpoint_hash=?,subscription=?,topics=?,frequency=?,hour=?,timezone=?,next_at=?,updated_at=?,expires_at=? WHERE token_hash=?').bind(endpointHash,JSON.stringify(s),JSON.stringify(p.topics),p.frequency,p.hour,p.timezone,next,now,now+LEASE_MS,id).run();
  }else{
   const result=await env.DB.prepare('INSERT INTO devices(token_hash,endpoint_hash,subscription,topics,frequency,hour,timezone,next_at,updated_at,expires_at) SELECT ?,?,?,?,?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM devices)<20').bind(id,endpointHash,JSON.stringify(s),JSON.stringify(p.topics),p.frequency,p.hour,p.timezone,next,now,now+LEASE_MS).run();
   if(!result.meta.changes)return json({error:'capacity'},503);
  }
  await env.DB.prepare('UPDATE devices SET delivery_options=?,read_ids=? WHERE token_hash=?').bind(JSON.stringify(p.options),p.options.syncRead?(existing?.read_ids||'[]'):'[]',id).run();
  return json({active:true,nextAt:next,expiresAt:now+LEASE_MS});
 }
 if(path==='/test'&&request.method==='POST'){
  if(!existing||existing.expires_at<=now)return json({error:'not_registered'},404);
  const at=now+60000;
  const result=await env.DB.prepare('UPDATE devices SET test_at=?,last_test=? WHERE token_hash=? AND last_test <= ?').bind(at,now,id,now-300000).run();
  return result.meta.changes?json({queued:true,testAt:at}):json({error:'test_cooldown'},429);
 }
 return json({error:'not_found'},404);
}
export async function scheduled(env,now=Date.now(),sender=sendPush){
 await env.DB.prepare('DELETE FROM devices WHERE expires_at <= ?').bind(now).run();
 await env.DB.prepare('DELETE FROM rate_limits WHERE expires_at <= ?').bind(now).run();
 await env.DB.prepare('DELETE FROM invitations WHERE expires_at <= ?').bind(now).run();
 // One encrypted send per invocation bounds CPU on Workers Free. This personal
 // deployment supports 20 devices; due notifications drain over subsequent minutes.
 const rows=(await env.DB.prepare('SELECT * FROM devices WHERE next_at<=? OR test_at<=? ORDER BY COALESCE(test_at,next_at) LIMIT 1').bind(now,now).all()).results;
 for(const row of rows){
  const test=row.test_at!==null&&row.test_at<=now;
  const next=test?0:nextDelivery(row,now);
  const result=test?await env.DB.prepare('UPDATE devices SET test_at=NULL WHERE token_hash=? AND test_at=?').bind(row.token_hash,row.test_at).run():await env.DB.prepare('UPDATE devices SET next_at=? WHERE token_hash=? AND next_at=?').bind(next,row.token_hash,row.next_at).run();
  if(!result.meta.changes)continue; // Atomic claim, no duplicated cron deliveries.
  if(!test&&!withinWindow(row,now))continue;
  const sent=JSON.parse(row.sent),fact=test?null:selectFact(JSON.parse(row.topics),[...sent,...JSON.parse(row.read_ids||'[]')],now);
  if(!test&&!fact){await env.DB.prepare("UPDATE devices SET last_status='exhausted' WHERE token_hash=?").bind(row.token_hash).run();continue;}
  // Don't deliver a late fact at night after a scheduler outage. Tests are
  // intentionally user-initiated and may run at any time, but expire after 10m.
  if(now-(test?row.test_at:row.next_at)>(test?600000:3600000))continue;
  let status;try{status=await sender(env,JSON.parse(row.subscription),payloadFor(fact,test));}catch(error){status=error.deliveryDiagnostic||0;}
  if(status===404||status===410){await env.DB.prepare('DELETE FROM devices WHERE token_hash=?').bind(row.token_hash).run();continue;}
  if(status>=200&&status<300){
   if(fact)sent.push(fact.id);
   await env.DB.prepare('UPDATE devices SET sent=?,last_status=? WHERE token_hash=?').bind(JSON.stringify(sent),test?'test_accepted':'accepted',row.token_hash).run();
  }else await env.DB.prepare('UPDATE devices SET last_status=? WHERE token_hash=?').bind('delivery_error_'+status,row.token_hash).run();
 }
}
export default {
 async fetch(request,env){try{return await handleRequest(request,env);}catch{return json({error:'service_unavailable'},503);}},
 async scheduled(event,env,ctx){ctx.waitUntil(scheduled(env,event.scheduledTime));}
};
