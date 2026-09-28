// Mocked browser/transport integration: this does NOT assert physical push delivery.
import {chromium,webkit,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {readFile} from 'node:fs/promises';
let remote=null,testCount=0,deleted=false,syncData=null;
const server=http.createServer(async(req,res)=>{
 try{
  const path=new URL(req.url,'http://localhost').pathname;
  if(path==='/push-config.mjs'){res.writeHead(200,{'Content-Type':'text/javascript'});res.end("export const PUSH_API='http://127.0.0.1:4176/push-api';");return;}
  if(path.startsWith('/push-api/')){
   let raw='';for await(const chunk of req)raw+=chunk;let data={},status=200;
   if(path.endsWith('/config'))data={publicKey:'B'+'A'.repeat(86)};
   else if(path.endsWith('/subscription')&&req.method==='GET')data=remote?{active:true,...remote}:{active:false};
   else if(path.endsWith('/subscription')&&req.method==='DELETE'){remote=null;deleted=true;data={active:false};}
   else if(path.endsWith('/subscription')&&req.method==='POST'){
    if(!remote&&req.headers['x-enrollment-code']!=='test-code'){status=403;data={error:'invalid_code'};}
    else{remote=JSON.parse(raw);assert.deepEqual(Object.keys(remote).sort(),['frequency','hour','options','subscription','timezone','topics']);data={active:true,nextAt:Date.now()+86400000};}
   }else if(path.endsWith('/sync')){syncData=JSON.parse(raw);data={sent:['moon-reflection']};}
   else if(path.endsWith('/test')){testCount++;data=testCount===1?{queued:true}:{error:'test_cooldown'};status=testCount===1?200:429;}
   res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(data));return;
  }
  const name=path==='/'?'index.html':path.slice(1);if(!/^[a-z0-9.-]+$/.test(name))throw Error();
  const body=await readFile(new URL('../dist/'+name,import.meta.url));res.writeHead(200,{'Content-Type':name.endsWith('.js')||name.endsWith('.mjs')?'text/javascript':name.endsWith('.html')?'text/html; charset=utf-8':name.endsWith('.css')?'text/css':name.endsWith('.png')?'image/png':'application/json'});res.end(body);
 }catch{res.writeHead(500);res.end();}
});
await new Promise(resolve=>server.listen(4176,'127.0.0.1',resolve));
try{
 for(const [name,type,options] of [['chromium',chromium,{channel:'msedge'}],['webkit',webkit,{}]]){
  const browser=await type.launch(options);
  try{
   const context=await browser.newContext({viewport:{width:390,height:844},timezoneId:'Asia/Jerusalem'});
   await context.addInitScript(()=>{
    let granted='default',subscribed=false;
    function MockNotification(){}
    Object.defineProperty(MockNotification,'permission',{get:()=>granted});
    MockNotification.requestPermission=()=>{window.permissionWasUserGesture=navigator.userActivation.isActive;granted='granted';return Promise.resolve(granted);};
    Object.defineProperty(window,'Notification',{value:MockNotification,configurable:true});
    Object.defineProperty(window,'PushManager',{value:function(){},configurable:true});
    const sub={toJSON:()=>({endpoint:'https://web.push.apple.com/browser-test-only',keys:{p256dh:'B'+'A'.repeat(86),auth:'A'.repeat(22)}}),unsubscribe:async()=>{subscribed=false;window.didUnsubscribe=true;return true;}};
    Object.defineProperty(ServiceWorkerRegistration.prototype,'pushManager',{configurable:true,get:()=>({getSubscription:async()=>subscribed?sub:null,subscribe:async()=>{subscribed=true;return sub;}})});
   });
   remote=null;testCount=0;deleted=false;syncData=null;
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='warning'||m.type()==='error')console.log(name,m.text());});
   await page.goto('http://127.0.0.1:4176/');await page.locator('[data-category=ai]').click();
   for(let i=0;i<3;i++)await page.locator('[data-action=continue]').click();
   await page.locator('[data-route=settings]').click();
   await expect(page.locator('[data-push=enable]')).toBeEnabled();
   await page.locator('#push-code').fill('wrong');await page.locator('[data-push=enable]').click();
   await expect(page.locator('#push-status')).toContainText('לא נכון');assert.equal(await page.evaluate(()=>permissionWasUserGesture),true);
   await page.locator('#push-code').fill('test-code');await page.locator('#push-frequency').selectOption('few');
   await page.locator('[data-push=enable]').click();await expect(page.locator('[data-push=test]')).toBeVisible();
   assert.deepEqual(remote.topics,['ai']);assert.equal(remote.frequency,'few');
   assert.equal(syncData,null,'no reading history is sent without consent');
   await page.locator('.delivery-settings summary').click();await page.locator('[data-delivery=weekdays]').click();await page.locator('#sync-read').check();await page.locator('#quiet-start').selectOption('20');
   await page.locator('[data-push=enable]').click();await expect(page.locator('#push-status')).toContainText('נשמרו');
   assert.deepEqual(remote.options.days,[0,1,2,3,4]);assert.equal(remote.options.quietStart,20);assert.equal(remote.options.syncRead,true);assert.deepEqual(syncData.topics,['ai']);assert.ok(syncData.read.length);assert.deepEqual(Object.keys(syncData).sort(),['read','topics']);
   await page.locator('[data-push=pause]').click();await expect(page.locator('[data-push=pause]')).toContainText('חידוש');assert.ok(remote.options.pauseUntil>Date.now());
   await page.locator('[data-push=pause]').click();await expect(page.locator('[data-push=pause]')).toContainText('השהיה');assert.equal(remote.options.pauseUntil,0);
   await page.locator('[data-push=test]').click();await expect(page.locator('#push-status')).toContainText('בדיקה נקבעה');
   await page.locator('[data-push=test]').click();await expect(page.locator('#push-status')).toContainText('חמש דקות');
   await page.reload();await page.locator('[data-route=settings]').click();await expect(page.locator('#push-frequency')).toHaveValue('few');
   await page.locator('[data-push=disable]').click();await expect(page.locator('#push-code')).toBeVisible();assert.ok(deleted);
   assert.equal(await page.evaluate(()=>localStorage.getItem('rega.push.v1')),null);
   await page.goto('http://127.0.0.1:4176/?fact=ai-confidence');await expect(page.locator('dialog')).toBeVisible();
   await expect(page.locator('.fact-card')).toHaveAttribute('data-fact','ai-confidence');
   await page.locator('[data-action=close]').click();
   assert.equal(new URL(page.url()).searchParams.has('fact'),false);
   if(name==='chromium'){await context.setOffline(true);await page.goto('http://127.0.0.1:4176/?fact=ai-confidence');await expect(page.locator('dialog')).toBeVisible();}
   assert.deepEqual(errors,[]);console.log(name+': mocked notification settings, permission gesture, privacy payload, errors, deletion, fact deep link passed.');
   await context.close();
  }finally{await browser.close();}
 }
}finally{await new Promise(resolve=>server.close(resolve));}
