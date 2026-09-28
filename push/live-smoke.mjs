// Explicit operator test. Uses a synthetic registration and never requests a push.
import {randomBytes,createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const wrangler=process.argv[2];
if(!wrangler||!process.argv.includes('--remote'))throw Error('Requires Wrangler JS path and explicit --remote');
const token=randomBytes(32).toString('base64url'),code=randomBytes(24).toString('base64url');
const hash=s=>createHash('sha256').update(s).digest('hex'),id=hash(token),invite=hash(code);
function sql(command){const r=spawnSync(process.execPath,[wrangler,'d1','execute','rega-push','--remote','--command',command],{cwd:fileURLToPath(new URL('./',import.meta.url)),encoding:'utf8',stdio:['ignore','pipe','pipe']});if(r.status!==0)throw Error('Operator database action failed');}
const base='https://rega-push.build-a-polished-mvp-for-a.workers.dev';
async function api(path,method='GET',data,registration=false){const r=await fetch(base+path,{method,headers:{Authorization:'Bearer '+token,Origin:'https://kvetchooch-sketch.github.io','Content-Type':'application/json',...(registration?{'X-Enrollment-Code':code}:{})},...(data?{body:JSON.stringify(data)}:{}),signal:AbortSignal.timeout(15000)});assert.equal(r.status,200,path+' returned '+r.status);return r.json();}
try{
 sql(`INSERT INTO invitations(code_hash,expires_at) VALUES ('${invite}',${Date.now()+600000})`);
 assert.equal((await api('/health')).version,2);
 const body={subscription:{endpoint:'https://web.push.apple.com/rega-synthetic-'+randomBytes(12).toString('hex'),keys:{p256dh:'B'+'A'.repeat(86),auth:'A'.repeat(22)}},topics:['ai'],frequency:'daily',hour:9,timezone:'Asia/Jerusalem',options:{days:[0,1,2,3,4],quietStart:21,quietEnd:8,pauseUntil:Date.now()+7*86400000,syncRead:true}};
 assert.equal((await api('/subscription','POST',body,true)).active,true);
 const saved=await api('/subscription');assert.deepEqual(saved.options.days,[0,1,2,3,4]);assert.equal(saved.options.syncRead,true);assert.ok(saved.nextAt>Date.now()+6*86400000);
 assert.deepEqual((await api('/sync','POST',{read:['ai-confidence'],topics:['ai']})).sent,[]);
 body.options.syncRead=false;await api('/subscription','POST',body);assert.equal((await api('/subscription')).options.syncRead,false);
 await api('/subscription','DELETE');assert.equal((await api('/subscription')).active,false);
 console.log('PASS live API: single-device invitation, persisted schedule/pause, consent sync, disable and deletion. No notification was sent.');
}finally{
 // IDs are hashes of this test's freshly generated secrets only; real rows are untouched.
 sql(`DELETE FROM devices WHERE token_hash='${id}'; DELETE FROM invitations WHERE code_hash='${invite}';`);
}
