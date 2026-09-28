import {chromium,webkit,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
const server=http.createServer(async(req,res)=>{try{
 const name=new URL(req.url,'http://localhost').pathname.slice(1)||'index.html';
 if(!/^[a-z0-9.-]+$/.test(name))throw Error();
 const path=name==='editor.html'?'../content/editor.html':'../dist/'+name;
 const body=name==='push-config.mjs'?"export const PUSH_API='';":await fs.readFile(new URL(path,import.meta.url));
 res.writeHead(200,{'Content-Type':name.endsWith('.mjs')||name.endsWith('.js')?'text/javascript':name.endsWith('.html')?'text/html; charset=utf-8':name.endsWith('.css')?'text/css':name.endsWith('.png')?'image/png':'application/json'});res.end(body);
}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(4177,'127.0.0.1',r));
try{for(const [name,type,opts] of [['chromium',chromium,{channel:'msedge'}],['webkit',webkit,{}]]){
 const browser=await type.launch(opts);try{
 const context=await browser.newContext({viewport:{width:320,height:740},locale:'he-IL',timezoneId:'Asia/Jerusalem'}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const profile=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('rega.profile.v1')));
 await page.goto('http://127.0.0.1:4177/');await page.locator('[data-category=ai]').click();
 for(let i=0;i<3;i++)await page.locator('[data-action=continue]').click();
 const id=await page.locator('.fact-card').getAttribute('data-fact');
 await page.locator('.save').click();await page.locator('.more-options summary').click();await page.locator('[data-growth=less]').click();
 assert.deepEqual((await profile()).lessTopics,['ai']);
 await page.locator('[data-route=saved]').click();
 await page.locator('#collection-name').fill('רעיונות <אהובים>');await page.locator('[data-growth=collection]').click();
 const collection=(await profile()).collections[0];
 await page.locator('#saved-results [data-detail]').click();
 await expect(page.locator('dialog')).toContainText('נבדק מול המקור');
 await page.locator('[data-collection]').check();await page.locator('[data-action=close]').click();
 await page.locator('#saved-collection').selectOption(collection.id);await expect(page.locator('#saved-results [data-detail]')).toHaveCount(1);
 await page.locator('#saved-query').fill('zzzzzz');await expect(page.locator('#saved-results [data-detail]')).toHaveCount(0);
 await page.locator('#saved-query').fill('');await page.locator('#saved-category').selectOption('ai');
 await expect(page.locator('#saved-results [data-detail]')).toHaveCount(1);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.locator('[data-route=settings]').click();await page.locator('#discovery-mix').selectOption('curious');
 await page.locator('[data-growth=clear-less]').click();assert.deepEqual((await profile()).lessTopics,[]);
 const downloading=page.waitForEvent('download');await page.locator('[data-action=export]').click();const dl=await downloading;
 const raw=await fs.readFile(await dl.path(),'utf8'),data=JSON.parse(raw);
 assert.equal(data.format,'rega-backup');assert.deepEqual(data.profile.collections[0].facts,[id]);assert.equal(data.profile.mix.discovery,.3);assert.ok(!raw.includes('token'));
 await page.locator('#discovery-mix').selectOption('focused');
 page.once('dialog',d=>d.accept());await page.locator('#restore').setInputFiles({name:'restore.json',mimeType:'application/json',buffer:Buffer.from(raw)});
 await expect(page.locator('.fact-card')).toBeVisible();assert.equal((await profile()).mix.discovery,.3);
 await page.locator('[data-route=settings]').click();
 await page.locator('#restore').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{"version":999}')});
 await expect(page.locator('#notice')).toContainText('לא ניתן לקרוא');assert.equal((await profile()).saved[0],id);
 // Date travel is applied only to isolated local test data, never real user state.
 await page.evaluate(()=>{const p=JSON.parse(localStorage.getItem('rega.profile.v1'));p.history[p.current].read=true;p.history[p.current].shownAt=new Date(Date.now()-8*86400000).toISOString();localStorage.setItem('rega.profile.v1',JSON.stringify(p));});
 await page.reload();await page.locator('[data-route=profile]').click();await page.locator('[data-growth=weekly]').click();
 await expect(page.locator('dialog')).toContainText('מה זכור לך');await page.locator('dialog summary').click();await page.locator('[data-growth=reviewed]').click();
 await expect(page.locator('dialog')).not.toBeVisible();assert.ok((await profile()).reviewed[id]);await expect(page.locator('[data-growth=weekly]')).toBeDisabled();
 await page.locator('[data-route=settings]').click();await page.locator('[data-growth=corrections]').click();await expect(page.locator('dialog')).toContainText('תיקונים ועדכונים');await page.locator('[data-action=close]').click();
 await page.locator('[data-route=saved]').click();await page.locator('#saved-collection').selectOption(collection.id);page.once('dialog',d=>d.accept());await page.locator('[data-growth=remove-collection]').click();
 assert.equal((await profile()).collections.length,0);assert.ok((await profile()).saved.includes(id));
 await page.reload();assert.ok((await profile()).reviewed[id]);
 await page.goto('http://127.0.0.1:4177/?fact=learn-recall');await expect(page.locator('dialog')).toContainText('כולל הסתייגות');await expect(page.locator('dialog a[href*="issues/new"]')).toContainText('דיווח');await page.locator('[data-action=close]').click();await expect(page.locator('.source-row strong')).toHaveText('כולל הסתייגות');
 // Separate local editorial tool: incomplete review cannot approve, saved drafts remain drafts.
 await page.goto('http://127.0.0.1:4177/editor.html');await page.locator('#load').setInputFiles(new URL('../content/catalog.json',import.meta.url).pathname.replace(/^\/([A-Z]:)/,'$1'));
 await page.locator('#new').click();await page.locator('[data-save=approved]').click();await expect(page.locator('#message')).toContainText('נדרשים');
 await page.locator('[data-field=title]').fill('מועמד לבדיקה');await page.locator('[data-save=draft]').click();await expect(page.locator('#message')).toContainText('נשמר');
 const exporting=page.waitForEvent('download');await page.locator('#download').click();const catalog=JSON.parse(await fs.readFile(await (await exporting).path(),'utf8'));assert.equal(catalog.facts.at(-1).workflow,'draft');
 assert.deepEqual(errors,[]);console.log(name+': collections/search/filter, source trust, discovery controls, backup/restore, weekly review, correction history and editorial draft gate passed.');
 await context.close();
 }finally{await browser.close();}
}}finally{await new Promise(r=>server.close(r));}
