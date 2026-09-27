import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {createECDH,randomBytes,createPublicKey,verify} from 'node:crypto';
import ece from 'http_ece';
import vm from 'node:vm';
import webpush from 'web-push';
import {preferences,nextDelivery,validateSubscription,selectFact,ORIGIN,APP_URL,hash} from '../policy.mjs';
import {handleRequest,scheduled,sendPush} from '../worker.mjs';
const now=Date.parse('2026-09-26T06:00:00Z');
const pair=webpush.generateVAPIDKeys();
function fixture(){
 const db=new DatabaseSync(':memory:');db.exec(readFileSync(new URL('../schema.sql',import.meta.url),'utf8'));
 const DB={prepare(sql){return {bind(...args){return {async first(){return db.prepare(sql).get(...args)||null;},async all(){return {results:db.prepare(sql).all(...args)};},async run(){return {meta:{changes:Number(db.prepare(sql).run(...args).changes)}};}};}};}};
 return {db,env:{DB,VAPID_PUBLIC_KEY:pair.publicKey,VAPID_PRIVATE_KEY:pair.privateKey,ENROLLMENT_CODE:'test-only-invite'}};
}
const token=randomBytes(32).toString('base64url');
function subscription(endpoint='https://web.push.apple.com/test-only-endpoint'){
 const ecdh=createECDH('prime256v1');ecdh.generateKeys();return {endpoint,keys:{p256dh:ecdh.getPublicKey().toString('base64url'),auth:randomBytes(16).toString('base64url')}};
}
const body=()=>({subscription:subscription(),topics:['ai'],frequency:'daily',hour:9,timezone:'Asia/Jerusalem'});
const request=(path,method='GET',payload,code='test-only-invite',auth=token)=>new Request('https://push.example'+path,{method,headers:{Origin:ORIGIN,Authorization:'Bearer '+auth,'X-Enrollment-Code':code,'Content-Type':'application/json'},...(payload?{body:JSON.stringify(payload)}:{})});
test('endpoint validation rejects SSRF, userinfo, ports, suffix tricks and malformed keys',()=>{
 for(const url of ['http://web.push.apple.com/x','https://web.push.apple.com.evil.test/x','https://localhost/x','https://127.0.0.1/x','https://user@web.push.apple.com/x','https://web.push.apple.com:8443/x'])assert.throws(()=>validateSubscription(subscription(url)));
 assert.throws(()=>validateSubscription({...subscription(),keys:{p256dh:'x',auth:'x'}}));assert.ok(validateSubscription(subscription()));
});
test('preferences reject invalid zones, categories, frequency and night hours',()=>{
 for(const p of [{timezone:'invalid/zone'},{topics:['unknown']},{frequency:'everyminute'},{hour:3},{hour:9.2}])assert.throws(()=>preferences({...body(),...p}));
});
test('daily/few schedule respects local times and DST changes',()=>{
 const p={timezone:'Asia/Jerusalem',frequency:'daily',hour:9};
 assert.equal(new Date(nextDelivery(p,now)).toISOString(),'2026-09-27T06:00:00.000Z');
 assert.equal(new Date(nextDelivery({...p,frequency:'few'},now)).toISOString(),'2026-09-26T11:00:00.000Z');
 assert.equal(new Date(nextDelivery(p,Date.parse('2026-10-24T07:00Z'))).toISOString(),'2026-10-25T07:00:00.000Z');
 assert.equal(new Date(nextDelivery({...p,timezone:'Asia/Kathmandu'},Date.parse('2026-09-26T00:00Z'))).toISOString(),'2026-09-26T03:15:00.000Z');
});
test('content selector uses approved facts, chosen topics, no repeated notifications',()=>{
 const sent=[];assert.equal(selectFact(['ai'],sent,now,()=>0).category,'ai');
 for(let i=0;i<62;i++){const f=selectFact(['ai'],sent,now,()=>0);assert.ok(f);assert.ok(!sent.includes(f.id));sent.push(f.id);}
 assert.equal(selectFact(['ai'],sent,now),null);
});
test('registration requires pairing code, can be updated by owner and deleted',async()=>{
 const {db,env}=fixture();try{
  assert.equal((await handleRequest(request('/subscription','POST',body(),'wrong'),env,now)).status,403);
  assert.equal((await handleRequest(request('/subscription','POST',body()),env,now)).status,200);
  let row=db.prepare('SELECT * FROM devices').get();assert.equal(row.token_hash,await hash(token));assert.ok(!JSON.stringify(row).includes(token));
  assert.equal((await handleRequest(request('/subscription','POST',{...body(),frequency:'few'},''),env,now)).status,200);
  assert.equal((await (await handleRequest(request('/subscription'),env,now)).json()).frequency,'few');
  await handleRequest(request('/subscription','DELETE'),env,now);assert.equal(db.prepare('SELECT count(*) AS n FROM devices').get().n,0);
 }finally{db.close();}
});
test('unconfigured service fails closed and rejects cross-origin enrollment',async()=>{
 const {db,env}=fixture();try{
  assert.equal((await handleRequest(request('/subscription','POST',body()),{...env,ENROLLMENT_CODE:undefined},now)).status,503);
  const req=request('/subscription');req.headers.set('Origin','https://evil.test');assert.equal((await handleRequest(req,env,now)).status,403);
 }finally{db.close();}
});
test('endpoint cannot be stolen by another token',async()=>{
 const {db,env}=fixture();try{
  const payload=body();await handleRequest(request('/subscription','POST',payload),env,now);
  assert.equal((await handleRequest(request('/subscription','POST',payload,'test-only-invite',randomBytes(32).toString('base64url')),env,now)).status,409);
 }finally{db.close();}
});
test('test notification is server scheduled, cooldown applies, repeated ticks send once',async()=>{
 const {db,env}=fixture();try{
  await handleRequest(request('/subscription','POST',body()),env,now);
  const res=await (await handleRequest(request('/test','POST'),env,now)).json();assert.equal(res.testAt,now+60000);
  assert.equal((await handleRequest(request('/test','POST'),env,now)).status,429);
  const messages=[];const sender=async(e,s,p)=>{messages.push(p);return 201;};
  await scheduled(env,now,sender);assert.equal(messages.length,0);
  await scheduled(env,now+60000,sender);await scheduled(env,now+60000,sender);assert.equal(messages.length,1);assert.equal(messages[0].tag,'rega-test');
  assert.equal(db.prepare('SELECT sent FROM devices').get().sent,'[]');
 }finally{db.close();}
});
test('scheduled facts are recorded only after acceptance and no late-night catchup',async()=>{
 const {db,env}=fixture();try{
  await handleRequest(request('/subscription','POST',body()),env,now);db.prepare('UPDATE devices SET next_at=?').run(now);
  const messages=[];await scheduled(env,now,async(e,s,p)=>{messages.push(p);return 201;});
  assert.equal(messages.length,1);assert.equal(JSON.parse(db.prepare('SELECT sent FROM devices').get().sent).length,1);
  db.prepare('UPDATE devices SET next_at=?').run(now);await scheduled(env,now+2*3600000,async()=>{throw Error('must not send');});assert.equal(messages.length,1);
 }finally{db.close();}
});
test('expired endpoints are removed; transient errors do not consume facts',async()=>{
 for(const status of [410,503]){const {db,env}=fixture();try{
  await handleRequest(request('/subscription','POST',body()),env,now);db.prepare('UPDATE devices SET next_at=?').run(now);
  await scheduled(env,now,async()=>status);const row=db.prepare('SELECT * FROM devices').get();
  if(status===410)assert.equal(row,undefined);else {assert.equal(row.sent,'[]');assert.equal(row.last_status,'delivery_error_503');}
 }finally{db.close();}}
});
test('real Web Push encryption produces signed encrypted request and blocks redirects',async()=>{
 const {db,env}=fixture();try{
  const receiver=createECDH('prime256v1');receiver.generateKeys();const auth=randomBytes(16).toString('base64url');
  const sub={endpoint:'https://web.push.apple.com/test-only-endpoint',keys:{p256dh:receiver.getPublicKey().toString('base64url'),auth}};
  const status=await sendPush(env,sub,{body:'private sample',tag:'rega-test'},async(url,options)=>{
   assert.equal(options.redirect,'manual');assert.equal(options.headers['Content-Encoding'],'aes128gcm');assert.match(options.headers.Authorization,/^vapid /);
   assert.ok(options.body.length>20);assert.ok(!options.body.includes(Buffer.from('private sample')));
   const plain=ece.decrypt(options.body,{version:'aes128gcm',privateKey:receiver,authSecret:auth});assert.equal(JSON.parse(plain).body,'private sample');
   const jwt=options.headers.Authorization.match(/t=([^,]+)/)[1],segments=jwt.split('.'),pub=Buffer.from(pair.publicKey,'base64url');
   const key=createPublicKey({format:'jwk',key:{kty:'EC',crv:'P-256',x:pub.subarray(1,33).toString('base64url'),y:pub.subarray(33).toString('base64url')}});
   assert.ok(verify('sha256',Buffer.from(segments[0]+'.'+segments[1]),{key,dsaEncoding:'ieee-p1363'},Buffer.from(segments[2],'base64url')));
   assert.equal(JSON.parse(Buffer.from(segments[1],'base64url')).aud,'https://web.push.apple.com');
   return new Response(null,{status:201});
  });assert.equal(status,201);
 }finally{db.close();}
});
test('notification helper prevents external navigation and degrades malformed/expired payloads visibly',()=>{
 const context=vm.createContext({self:{},URL,Date});vm.runInContext(readFileSync(new URL('../../dist/notification.js',import.meta.url),'utf8'),context);
 const helper=context.self.RegaNotification;
 assert.equal(helper.safeURL('https://evil.test',APP_URL),APP_URL);
 assert.equal(helper.safeURL(ORIGIN+'/another-app/',APP_URL),APP_URL);
 assert.ok(helper.build(null,APP_URL,now).options.body);
 assert.equal(helper.build({factId:'../../evil',body:'hi',expiresAt:now+1000},APP_URL,now).options.data.url,APP_URL);
 assert.equal(new URL(helper.build({factId:'ai-confidence',body:'hi',expiresAt:now+1000},APP_URL,now).options.data.url).searchParams.get('fact'),'ai-confidence');
});
