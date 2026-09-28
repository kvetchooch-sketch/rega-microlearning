import {isEligible,normalizeProfile,affinity} from './core.mjs';
export const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function reviewSet(profile,facts,now=Date.now()){
 const completed=Object.values(profile.reviewed||{}).filter(d=>{const t=Date.parse(d);return t<=now&&now-t<7*86400000;}).length;
 if(completed>=3)return [];
 const due=facts.filter(f=>isEligible(f,new Date(now))&&profile.history[f.id]?.read&&now-Date.parse(profile.reviewed?.[f.id]||profile.history[f.id].shownAt)>=7*86400000);
 const rank=f=> (profile.saved.includes(f.id)?4:0)+(profile.history[f.id].knowledge==='learned'?2:0);
 return due.sort((a,b)=>rank(b)-rank(a)||String(profile.reviewed?.[a.id]||profile.history[a.id].shownAt).localeCompare(String(profile.reviewed?.[b.id]||profile.history[b.id].shownAt))).slice(0,3-completed);
}
export function filteredSaved(profile,facts,{query='',category='',collection=''}={}){
 const words=query.toLocaleLowerCase('he').trim().split(/\s+/).filter(Boolean);
 const group=profile.collections?.find(c=>c.id===collection);
 return facts.filter(f=>profile.saved.includes(f.id)&&isEligible(f)&&(!category||f.category===category)&&(!collection||group?.facts.includes(f.id))&&words.every(w=>[f.shortFact,f.explanation,...(f.tags||[])].join(' ').toLocaleLowerCase('he').includes(w)));
}
export function recommendationReason(profile,fact,facts){
 if(profile.lessTopics?.includes(fact.category))return 'ביקשת פחות מהתחום הזה. הוא עדיין מופיע מדי פעם כדי לשמור על גיוון.';
 const positive=facts.filter(f=>f.category===fact.category&&profile.history[f.id]?.interest==='yes').length;
 if(positive>=2)return 'כמה פריטים מהתחום הזה עניינו אותך. התגובות החוזרות עוזרות להתאים את ההמשך.';
 if(profile.interests.includes(fact.category))return 'בחרת בתחום הזה בתחומי העניין שלך.';
 return 'זהו נושא לגלות מעבר לתחומים שבחרת. הפיד משאיר מקום לסקרנות חדשה.';
}
export function sourceKind(source){
 if(source.type)return source.type;
 const host=new URL(source.url).hostname;
 if(/(^|\.)[^.]+\.gov$|\.gov\./.test(host)||host.endsWith('.gov'))return 'government';
 if(host.endsWith('.edu')||host.includes('openstax.org')||host.includes('cornell.edu'))return 'academic';
 return 'reference';
}
export function trustLabel(f){return f.verificationStatus==='qualified'?'כולל הסתייגות':({government:'מקור ממשלתי',academic:'מקור אקדמי',primary:'מקור רשמי',research:'מחקר',reference:'מקור לעיון'})[sourceKind(f.sources[0])];}
export function backup(profile){return {format:'rega-backup',schema:1,exportedAt:new Date().toISOString(),profile:normalizeProfile(profile)};}
export function parseBackup(raw){
 const value=raw?.format==='rega-backup'&&raw.schema===1?raw.profile:raw;
 if(!value||value.version!==1||!Array.isArray(value.interests)||!value.history||typeof value.history!=='object'||Array.isArray(value.history))throw Error('invalid_backup');
 return normalizeProfile(value);
}
export function installGrowthUI({getProfile,facts,categories,persist,render,openDetail,announce,sync}){
 let filters={query:'',category:'',collection:''},weekly=[];
 const label=id=>categories.find(c=>c.id===id)?.name||id, e=escapeHTML;
 function savedResults(){const p=getProfile();const found=filteredSaved(p,facts,filters);return found.length?found.map(f=>`<button class="saved-item" data-detail="${f.id}"><span class="pill">${e(label(f.category))}</span><p>${e(f.shortFact)}</p></button>`).join(''):'<p class="muted">לא נמצאו פריטים מתאימים. אפשר לשנות את החיפוש או המסנן.</p>';}
 function decorate(route,editing){
  if(editing||!getProfile().onboarded)return;
  const p=getProfile(),main=document.querySelector('main');if(!main)return;
  if(route==='feed'){
   const card=document.querySelector('.card-body'),f=facts.find(x=>x.id===p.current);
   if(f?.verificationStatus==='qualified')document.querySelector('.source-row > span')?.insertAdjacentHTML('afterbegin','<strong>כולל הסתייגות</strong><br>');
   if(card&&f)card.insertAdjacentHTML('beforeend',`<details class="more-options"><summary>למה קיבלתי את זה?</summary><p>${e(recommendationReason(p,f,facts))}</p><button class="secondary" data-growth="less" data-topic="${f.category}">${p.lessTopics.includes(f.category)?'להחזיר את התדירות הרגילה':'פחות מהנושא הזה'}</button></details>`);
  }
  if(route==='saved'){
   main.innerHTML=`<div class="intro"><div class="eyebrow">האוסף האישי</div><h1>הדברים ששמרת</h1><p>חיפוש, תחומים ואוספים — כדי למצוא שוב רעיון טוב.</p></div><section class="panel"><label for="saved-query">חיפוש בשמורים</label><input id="saved-query" class="text-input" type="search" value="${e(filters.query)}" placeholder="מילה או רעיון"><div class="filter-row"><label>תחום<select id="saved-category"><option value="">כל התחומים</option>${categories.filter(c=>facts.some(f=>f.category===c.id&&p.saved.includes(f.id))).map(c=>`<option value="${c.id}" ${filters.category===c.id?'selected':''}>${e(c.name)}</option>`).join('')}</select></label><label>אוסף<select id="saved-collection"><option value="">כל האוספים</option>${p.collections.map(c=>`<option value="${c.id}" ${filters.collection===c.id?'selected':''}>${e(c.name)}</option>`).join('')}</select></label></div><div class="filter-row"><input class="text-input" id="collection-name" maxlength="50" aria-label="שם אוסף חדש" placeholder="למשל: לספר לחברים"><button class="secondary" data-growth="collection">יצירת אוסף</button>${filters.collection?'<button class="text-btn danger" data-growth="remove-collection">מחיקת האוסף</button>':''}</div><p class="small muted">פותחים פריט שמור כדי להוסיף או להסיר אותו מאוסף.</p></section><div class="saved-list" id="saved-results" aria-live="polite">${savedResults()}</div>`;
  }
  if(route==='profile'){
   const due=reviewSet(p,facts);const top=Object.entries(affinity(p,facts)).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]).slice(0,3);
   main.insertAdjacentHTML('beforeend',`<section class="panel"><h2>רגע של חזרה</h2><p>${due.length?`${due.length} רעיונות שפגשת לפני שבוע לפחות. מה נשאר איתך?`:'כשתעבור לפחות שבוע מהקריאה, יופיעו כאן עד שלושה רעיונות לחזרה.'}</p><button class="secondary" data-growth="weekly" ${due.length?'':'disabled'}>חזרה קצרה</button></section>${top.length?`<section class="panel"><h2>מסקרן אותך לאחרונה</h2><p>${top.map(([id])=>e(label(id))).join(' · ')}</p><small>לפי התגובות, השמורים והפתיחות שלך; זהו עניין, לא רמת ידע.</small></section>`:''}`);
  }
  if(route==='settings'){
   main.insertAdjacentHTML('beforeend',`<section class="panel"><h2>מקום להפתעות</h2><label for="discovery-mix">איזון הפיד</label><select id="discovery-mix"><option value="balanced" ${p.mix.discovery===.1?'selected':''}>מאוזן · 70% אישי, 20% קרוב, 10% מפתיע</option><option value="focused" ${p.mix.discovery===.05?'selected':''}>ממוקד · 85% אישי, 10% קרוב, 5% מפתיע</option><option value="curious" ${p.mix.discovery===.3?'selected':''}>סקרן · 40% אישי, 30% קרוב, 30% מפתיע</option></select><p class="small muted">אלה יעדי הבחירה; האוסף הזמין משפיע גם הוא.</p>${p.lessTopics.length?`<p>פחות תכנים מ: ${p.lessTopics.map(id=>e(label(id))).join('، ')}</p><button class="secondary" data-growth="clear-less">ביטול ההפחתות</button>`:''}</section><section class="panel"><h2>שקיפות ועדכונים</h2><p>כל פריט כולל מקור ותאריך בדיקה. מידע תלוי־זמן מוסתר לאחר מועד הבדיקה הבא.</p><button class="secondary" data-growth="corrections">תיקונים ועדכונים</button></section>`);
  }
 }
 function detail(id){const p=getProfile(),f=facts.find(x=>x.id===id);if(!f)return;const content=document.querySelector('#detail .dialog-content');if(!content)return;
  const report='https://github.com/kvetchooch-sketch/rega-microlearning/issues/new?title='+encodeURIComponent('בדיקת תוכן: '+f.id)+'&body='+encodeURIComponent('פריט: '+f.id+'\nנבדק: '+f.dateVerified+'\nמקור: '+f.sources[0].url+'\n\nמה דורש תיקון?\n\nמקור חלופי, אם יש:\n');
  content.insertAdjacentHTML('beforeend',`<p class="small"><a href="${e(report)}" target="_blank" rel="noopener noreferrer">דיווח על אי־דיוק</a><br>נפתח טופס GitHub. שליחה דורשת חשבון והדיווח יהיה ציבורי; אין לצרף מידע אישי. דבר לא נשלח אוטומטית.</p>`);
  content.insertAdjacentHTML('beforeend',`<section class="panel"><h3>${trustLabel(f)}</h3><p>${e(f.verificationNote||'נבדק מול המקור המקושר.')}</p>${f.freshness==='timeSensitive'?`<p>עשוי להשתנות · בדיקה הבאה עד ${e(f.nextReviewAt)}</p>`:''}${f.example&&f.example!==f.whyItMatters?`<h3>דוגמה פשוטה</h3><p>${e(f.example)}</p><small>דוגמה להמחשה</small>`:''}${f.glossary?.length?`<h3>מילים בפשטות</h3>${f.glossary.map(g=>`<p><strong>${e(g.term)}</strong>: ${e(g.meaning)}</p>`).join('')}`:''}</section>${p.saved.includes(id)&&p.collections.length?`<fieldset class="panel"><legend>להוסיף לאוסף</legend>${p.collections.map(c=>`<label class="check-row"><input type="checkbox" data-collection="${c.id}" data-fact="${id}" ${c.facts.includes(id)?'checked':''}>${e(c.name)}</label>`).join('')}</fieldset>`:''}`);
 }
 function weeklyCard(){const dialog=document.querySelector('#detail');const f=weekly[0];if(!f){dialog.close();announce('רגע החזרה הושלם.');render();return;}dialog.innerHTML=`<div class="dialog-content"><h2 id="detail-title">מה זכור לך?</h2><p>${e(f.shortFact)}</p><p>איך היית מסביר את הרעיון הזה לחבר, או משתמש בו בחיים?</p><details><summary>לגלות את ההסבר</summary><p>${e(f.explanation)}</p><p>${e(f.whyItMatters)}</p></details><button class="primary" data-growth="reviewed" data-fact="${f.id}">ממשיכים · ${weekly.length} נותרו</button><button class="secondary" data-action="close">לסיים כרגע</button></div>`;if(!dialog.open)dialog.showModal();}
 document.addEventListener('input',event=>{if(event.target.id==='saved-query'){filters.query=event.target.value;document.querySelector('#saved-results').innerHTML=savedResults();}});
 document.addEventListener('change',event=>{const t=event.target,p=getProfile();if(t.id==='saved-category'||t.id==='saved-collection'){filters[t.id==='saved-category'?'category':'collection']=t.value;render();}if(t.dataset.collection){const c=p.collections.find(c=>c.id===t.dataset.collection);if(c){c.facts=t.checked?[...new Set([...c.facts,t.dataset.fact])]:c.facts.filter(id=>id!==t.dataset.fact);persist();}}if(t.id==='discovery-mix'){p.mix={focused:{personalized:.85,adjacent:.1,discovery:.05},balanced:{personalized:.7,adjacent:.2,discovery:.1},curious:{personalized:.4,adjacent:.3,discovery:.3}}[t.value];persist();}});
 document.addEventListener('click',async event=>{const b=event.target.closest('[data-growth]');if(!b)return;const p=getProfile();switch(b.dataset.growth){
  case 'less':p.lessTopics=p.lessTopics.includes(b.dataset.topic)?p.lessTopics.filter(x=>x!==b.dataset.topic):[...p.lessTopics,b.dataset.topic];persist();render();break;
  case 'clear-less':p.lessTopics=[];persist();render();break;
  case 'collection':{const name=document.querySelector('#collection-name').value.trim();if(!name||p.collections.length>=50){announce('יש לבחור שם קצר. אפשר ליצור עד 50 אוספים.');break;}p.collections.push({id:'c-'+crypto.randomUUID(),name,facts:[]});persist();render();break;}
  case 'remove-collection':if(confirm('למחוק את האוסף? הפריטים יישארו בשמורים.')){p.collections=p.collections.filter(c=>c.id!==filters.collection);filters.collection='';persist();render();}break;
  case 'weekly':weekly=reviewSet(p,facts);weeklyCard();break;
  case 'reviewed':p.reviewed[b.dataset.fact]=new Date().toISOString();weekly.shift();persist();weeklyCard();break;
  case 'corrections':{const d=document.querySelector('#detail');d.innerHTML=`<div class="dialog-content"><h2 id="detail-title">תיקונים ועדכונים</h2><p>27.09.2026: תוקן פורמט שליחת ההתראות ל־iPhone. התקבלה התראה במכשיר בפועל.</p><p>בגרסה הזו נוספו חיפוש ואוספים, חזרה שבועית, הסברים לבחירת פריטים ואפשרויות התראות. תאריך הבדיקה מופיע בנפרד בכל פריט.</p><p>אם פריט מתוקן, סיבת השינוי נשמרת ברשומת התוכן. מידע שפג תוקפו אינו מוצג.</p>${facts.filter(f=>f.corrections?.length).map(f=>`<section><h3>${e(f.title)}</h3>${f.corrections.map(c=>`<p>${e(c.date)}: ${e(c.reason)}</p>`).join('')}</section>`).join('')}<button class="secondary" data-action="close">סגירה</button></div>`;d.showModal();break;}
 }});
 return {decorate,detail};
}
