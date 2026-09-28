import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {FACTS} from '../dist/content.mjs';
const {chromium,webkit,expect}=await import('@playwright/test');
const output=new URL('../test-results/',import.meta.url);await fs.mkdir(output,{recursive:true});
const base=process.env.TEST_URL||'http://127.0.0.1:4174/';
let testServer;
async function startServer(){
 if(process.env.TEST_URL||testServer)return;
 testServer=spawn(process.execPath,[fileURLToPath(new URL('../scripts/serve.mjs',import.meta.url))],{env:{...process.env,PORT:'4174'},stdio:['ignore','pipe','pipe']});
 await new Promise((resolve,reject)=>{testServer.stdout.once('data',resolve);testServer.once('error',reject);testServer.once('exit',code=>{if(code)reject(Error('Test server failed'));});});
}
async function stopServer(){if(!testServer)return;const child=testServer;testServer=null;await new Promise(resolve=>{child.once('exit',resolve);child.kill();});}
const results=[];
try{
for(const [name,type,options] of [['chromium',chromium,process.platform==='win32'?{channel:'msedge'}:{}],['webkit',webkit,{}]]){
 const browser=await type.launch({headless:true,...options});
 try{
 for(const round of [1,2]){
  await startServer();
  console.log('Starting',name,'round',round);
  const context=await browser.newContext({viewport:{width:round===1?390:320,height:round===1?844:740},deviceScaleFactor:1,locale:'he-IL',timezoneId:'Asia/Jerusalem',isMobile:true,hasTouch:true});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);await expect(page.locator('h1')).toHaveText('מה מעניין אותך?');
  await expect(page.locator('[data-action=continue]')).toBeDisabled();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.locator('[data-category=space]').click();
  await page.locator('[data-action=continue]').click();
  await page.locator('[data-style=surprise]').click();
  await page.locator('[data-action=continue]').click();
  await page.locator('[data-cadence=daily]').click();
  await page.locator('[data-action=continue]').click();
  await expect(page.locator('.fact-card')).toBeVisible();
  await expect(page.locator('.card-top .pill')).toContainText('חלל');
  const firstID=await page.locator('.fact-card').getAttribute('data-fact');
  await page.locator('[data-axis=knowledge][data-value=learned]').click();
  await page.locator('[data-axis=interest][data-value=yes]').click();
  await page.locator('[data-axis=interest][data-value=yes]').click();
  await page.locator('[data-axis=interest][data-value=no]').click();
  await page.locator('.save').click();
  await expect(page.locator('.save')).toHaveAttribute('aria-pressed','true');
  await page.reload();await expect(page.locator('.fact-card')).toHaveAttribute('data-fact',firstID);
  await expect(page.locator('[data-axis=knowledge][data-value=learned]')).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('[data-axis=interest][data-value=no]')).toHaveAttribute('aria-pressed','true');
  await page.locator('[data-detail]').first().click();
  await expect(page.locator('dialog')).toBeVisible();
  assert.match(await page.locator('.sources a').getAttribute('href'),/^https:\/\//);
  await page.locator('[data-action=close]').click();
  await page.locator('[data-route=saved]').click();await expect(page.locator('#main .saved-item')).toHaveCount(1);
  await page.locator('[data-route=profile]').click();await expect(page.locator('.metric strong').first()).toHaveText('1');
  await page.locator('[data-route=settings]').click();
  await page.locator('#theme').selectOption('dark');await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  await page.reload();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  await page.locator('[data-route=settings]').click();await page.locator('[data-action=interests]').click();
  await expect(page.locator('[data-category=space]')).toHaveAttribute('aria-pressed','true');
  await page.locator('[data-category=space]').click();await expect(page.locator('[data-action=continue]')).toBeDisabled();
  await page.locator('[data-category=technology]').click();
  await page.locator('[data-action=cancel-edit]').click();
  await page.locator('[data-route=feed]').click();
  await page.evaluate(()=>{window.testClicks=[];for(const type of ['pointerdown','pointerup','click'])document.addEventListener(type,e=>{window.testClicks.push({type,target:e.target.closest('button')?.dataset?.action||e.target.tagName,y:scrollY});window.testClicks=window.testClicks.slice(-18);},true);});
  const seen=new Set([firstID]);
  for(let i=0;i<FACTS.length-1;i++){const prev=await page.locator('.fact-card').getAttribute('data-fact');await page.locator('[data-action=next]').click();try{await expect(page.locator('.fact-card')).not.toHaveAttribute('data-fact',prev);}catch(e){console.log('UI diagnostic',await page.evaluate(()=>({clicks:window.testClicks,current:JSON.parse(localStorage.getItem('rega.profile.v1')).current})));throw e;}const id=await page.locator('.fact-card').getAttribute('data-fact');assert.ok(!seen.has(id),'duplicate in normal feed');seen.add(id);}
  await page.locator('[data-action=next]').click();await expect(page.locator('.empty h2')).toHaveText('הגעת לסוף האוסף');
  await page.locator('[data-action=review]').click();await expect(page.locator('.review-label')).toBeVisible();
  await page.locator('[data-route=settings]').click();await page.locator('[data-action=reset]').click();await page.locator('[data-action=close]').click();
  await page.locator('[data-route=saved]').click();await expect(page.locator('#main .saved-item')).toHaveCount(1);
  // Wait on actual readiness, not an arbitrary timeout.
  await page.evaluate(async()=>{await Promise.race([navigator.serviceWorker.ready,new Promise((_,reject)=>setTimeout(()=>reject(Error('SW readiness timeout')),15000))]);if(!navigator.serviceWorker.controller)await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));});
  console.log(name,'round',round,'online journeys passed; cache:',await page.evaluate(async()=>({controller:!!navigator.serviceWorker.controller,cache:await caches.keys()})));
  // Playwright 1.63 WebKit offline emulation has confirmed upstream bug #42775.
  // With WebKit, stop our isolated HTTP origin instead; this is an origin-outage
  // check, not a claim of full device offline emulation.
  if(name==='chromium')await context.setOffline(true);else if(!process.env.TEST_URL)await stopServer();
  await page.reload();await expect(page.locator('h1')).toHaveText('יש לך רגע?');
  await page.locator('[data-route=saved]').click();await expect(page.locator('#main .saved-item')).toHaveCount(1);
  if(name==='chromium')await context.setOffline(false);else await startServer();
  await page.locator('[data-route=feed]').click();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:fileURLToPath(new URL(name+'-round'+round+'.png',output)),fullPage:true});
  assert.deepEqual(errors,[]);
  results.push({engine:name,round,width:round===1?390:320,status:'passed',connectivityCheck:name==='chromium'?'offline emulation':process.env.TEST_URL?'online reload only':'origin unavailable; offline emulation blocked by upstream #42775',checks:['onboarding','interest match','reaction replacement','bookmark','reload persistence','sources dialog','profile','dark mode','edit cancel','no repeats','explicit review','delete cancel','cached reload','no horizontal overflow','no JS errors']});
  await fs.writeFile(new URL('results.json',output),JSON.stringify(results,null,2));
  console.log('Passed',name,'round',round);
  await context.close();
 }
 }finally{await browser.close();}
}
}finally{await stopServer();}
await fs.writeFile(new URL('results.json',output),JSON.stringify(results,null,2));
console.log(JSON.stringify(results,null,2));
