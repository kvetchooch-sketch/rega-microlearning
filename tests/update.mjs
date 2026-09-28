import {chromium,expect} from '@playwright/test';
import {execFileSync} from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {FACTS} from '../dist/content.mjs';
const previous=process.env.PREVIOUS_RELEASE||'a4c5428';
const oldFiles=new Map();
for(const name of execFileSync('git',['ls-tree','--name-only',previous+':dist'],{encoding:'utf8'}).trim().split('\n'))oldFiles.set(name,execFileSync('git',['show',previous+':dist/'+name]));
let upgraded=false;
const server=http.createServer(async(req,res)=>{
 try{
  const name=new URL(req.url,'http://localhost').pathname.slice(1)||'index.html';
  if(!/^[a-z0-9.-]+$/.test(name))throw Error();
  const body=upgraded?await fs.readFile(new URL('../dist/'+name,import.meta.url)):oldFiles.get(name);
  if(!body)throw Error();
  res.writeHead(200,{'Content-Type':name.endsWith('.mjs')||name.endsWith('.js')?'text/javascript':name.endsWith('.html')?'text/html; charset=utf-8':name.endsWith('.css')?'text/css':name.endsWith('.png')?'image/png':'application/json','Cache-Control':'no-store'});res.end(body);
 }catch{res.writeHead(404);res.end();}
});
await new Promise(resolve=>server.listen(4175,'127.0.0.1',resolve));
let browser;
try{
 browser=await chromium.launch({channel:'msedge'});
 const context=await browser.newContext(),page=await context.newPage();
 await page.goto('http://127.0.0.1:4175/');
 await page.locator('[data-category=ai]').click();
 for(let i=0;i<3;i++)await page.locator('[data-action=continue]').click();
 await page.locator('.save').click();
 await page.locator('[data-value=learned]').click();
 await page.evaluate(async()=>{await navigator.serviceWorker.ready;});
 await page.reload();
 const before=await page.evaluate(()=>localStorage.getItem('rega.profile.v1'));
 upgraded=true;
 await page.evaluate(async()=>{
  const changed=new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));
  await (await navigator.serviceWorker.getRegistration()).update();await changed;
 });
 await page.reload();
 await expect(page.locator('.card-meta')).toContainText(String(FACTS.length));
 const profile=JSON.parse(await page.evaluate(()=>localStorage.getItem('rega.profile.v1'))),old=JSON.parse(before);
 assert.deepEqual(profile.saved,old.saved);assert.deepEqual(profile.interests,old.interests);
 assert.equal(profile.history[profile.current].knowledge,'learned');
 await page.locator('[data-route=settings]').click();
 await expect(page.locator('#main')).toContainText('28.09.2026');
 await page.locator('[data-action=update]').click();
 await expect(page.locator('.fact-card')).toBeVisible();
 await context.setOffline(true);await page.reload();
 await expect(page.locator('.card-meta')).toContainText(String(FACTS.length));
console.log('PASS: production v1 -> current update, bookmarks/interests/reaction preserved, update button, expanded offline cache.');
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
