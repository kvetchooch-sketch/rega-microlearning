import {PUSH_API} from './push-config.mjs';
import {defaultDelivery,deliveryFields,deliveryInput} from './delivery-settings.mjs';
const KEY='rega.push.v1';
let state={token:null,active:false,frequency:'daily',hour:9},registration=null,publicKey=null,busy=false,profileAccess=null,onSync=null,lastSync=0;
try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&/^[A-Za-z0-9_-]{43}$/.test(s.token||''))state={token:s.token,active:s.active===true,frequency:s.frequency==='few'?'few':'daily',hour:Number.isInteger(s.hour)&&s.hour>=8&&s.hour<=20?s.hour:9,lastStatus:typeof s.lastStatus==='string'?s.lastStatus:''};}catch{}
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function persist(){localStorage.setItem(KEY,JSON.stringify(state));}
function base64(bytes){return btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
function decode(s){return Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));}
export function pushSupport(){
 const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 if(ios&&!matchMedia('(display-mode: standalone)').matches&&!navigator.standalone)return 'install';
 if(!window.isSecureContext||!('serviceWorker'in navigator)||!('PushManager'in window)||!('Notification'in window))return 'unsupported';
 return 'supported';
}
function message(error){return ({invalid_code:'קוד ההפעלה לא נכון. בדוק את הקוד שקיבלת.',enrollment_cooldown:'יותר מדי ניסיונות הפעלה. נסה שוב בעוד עשר דקות.',invalid_request:'בדוק שבחרת יום ושעת שליחה מחוץ לשעות השקטות.',test_cooldown:'אפשר לבקש בדיקה נוספת בעוד חמש דקות.',capacity:'מכסת המכשירים של הגרסה האישית מלאה.',already_registered:'למכשיר יש חיבור קודם. כבה התראות והפעל מחדש.',not_registered:'החיבור פג. יש להפעיל התראות מחדש.',permission:'לא אושרו התראות. אפשר לשנות זאת בהגדרות האייפון.',not_ready:'החיבור עדיין נטען. נסה שוב בעוד רגע.',storage:'אי אפשר לשמור את החיבור במכשיר הזה.',unsupported:'יש להתקין במסך הבית ולהשתמש ב־iOS 16.4 ומעלה.'})[error.message]||'לא הצלחנו להשלים את הפעולה. בדוק חיבור לאינטרנט ונסה שוב.';}
async function api(path,method='GET',body,code){
 const res=await fetch(PUSH_API+path,{method,headers:{'Content-Type':'application/json',...(state.token?{Authorization:'Bearer '+state.token}:{}),...(code?{'X-Enrollment-Code':code}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(15000)});
 const result=await res.json();if(!res.ok)throw Error(result.error||'network');return result;
}
export async function preparePush(){
 if(!PUSH_API||pushSupport()!=='supported')return;
 const [reg,config]=await Promise.all([navigator.serviceWorker.ready,api('/config')]);registration=reg;publicKey=config.publicKey;
 if(state.token){try{const remote=await api('/subscription');state.active=remote.active;if(remote.active){state.frequency=remote.frequency;state.hour=remote.hour;state.nextAt=remote.nextAt;state.lastStatus=remote.lastStatus;state.options={...defaultDelivery(),...remote.options};state.sent=remote.sent||[];}persist();await syncPush();}catch{/* Offline does not erase the subscription. */}}
}
export function configureSync(getProfile,changed){profileAccess=getProfile;onSync=changed;}
export async function syncPush(){
 if(!state.active||!profileAccess||Date.now()-lastSync<16000)return;
 lastSync=Date.now();
 try{const p=profileAccess();if(!state.options?.syncRead)return;
  const result=await api('/sync','POST',{read:Object.keys(p.history).slice(-10000),topics:p.interests});
  p.notificationSeen=[...new Set(result.sent||[])];onSync?.();
 }catch{/* Leave local progress intact. A future online foreground sync retries. */}
}
async function saveDelivery(options,code){
 let sub=await registration.pushManager.getSubscription();if(!sub)sub=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:decode(publicKey)});
 const p=profileAccess();const result=await api('/subscription','POST',{subscription:sub.toJSON(),topics:p.interests,frequency:state.frequency,hour:state.hour,timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,options},code);
 state={...state,active:true,options,nextAt:result.nextAt};persist();lastSync=0;await syncPush();
}
export function pushPanel(){
 const support=pushSupport();
 const ready=registration&&publicKey;
 const denied=typeof Notification!=='undefined'&&Notification.permission==='denied';
 const status=!PUSH_API?'שירות ההתראות עדיין בהכנה.':support==='install'?'כדי לקבל התראות באייפון, פתח את רגע מהאייקון במסך הבית.':support==='unsupported'?'המכשיר או הדפדפן הזה אינם תומכים בהתראות רשת. באייפון נדרש iOS 16.4 ומעלה.':denied?'ההתראות חסומות. פתח הגדרות באייפון ← עדכונים ← רגע ואפשר עדכונים.':state.active?'ההתראות מחוברות. הצגתן במסך הנעילה תלויה בהגדרות האייפון ובמצב ריכוז.':ready?'בחר תדירות, הזן את קוד ההפעלה ואשר התראות.':'מכין את החיבור… נדרש חיבור לאינטרנט.';
 return `<section class="panel" id="push-panel"><h2>רגע במסך הנעילה</h2><p id="push-status" role="status">${status}</p>${PUSH_API&&support==='supported'?`<div class="settings-row"><label for="push-frequency">כמה התראות?</label><select id="push-frequency"><option value="daily" ${state.frequency==='daily'?'selected':''}>אחת ביום</option><option value="few" ${state.frequency==='few'?'selected':''}>שלוש ביום</option></select></div><div class="settings-row"><label for="push-hour">שעה להתראה יומית</label><select id="push-hour">${Array.from({length:13},(_,i)=>i+8).map(h=>`<option value="${h}" ${state.hour===h?'selected':''}>${String(h).padStart(2,'0')}:00</option>`).join('')}</select></div><p class="small muted">שלוש ביום: 09:00, 14:00 ו־19:00. לפי אזור הזמן במכשיר בזמן השמירה. ייתכנו עיכובים; זו לא תזכורת בשעה מדויקת. לאחר שינוי אזור זמן, שמור כאן שוב. עם סנכרון פעיל, תחומי העניין מתעדכנים אוטומטית.</p>${deliveryFields(state)}${!state.active?'<label for="push-code">קוד הפעלה אישי</label><input class="push-code" id="push-code" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="הקוד שקיבלת בצ׳אט" dir="ltr" maxlength="80">':''}<div class="push-actions"><button class="primary" data-push="enable" ${!ready||denied||busy?'disabled':''}>${state.active?'שמירת הגדרות ההתראות':'הפעלת התראות'}</button>${state.active?`<button class="secondary" data-push="test" ${busy?'disabled':''}>בדיקה בעוד דקה</button><button class="text-btn danger" data-push="disable" ${busy?'disabled':''}>כיבוי ומחיקת חיבור ההתראות</button>`:''}</div>${state.lastStatus==='exhausted'?'<p>כל הפריטים במאגר כבר נשלחו. לא נשלח שוב את אותו פריט.</p>':''}${state.lastStatus?.startsWith('delivery_error')?'<p>ניסיון המסירה האחרון נכשל. אפשר לבקש התראת ניסיון נוספת.</p>':''}`:''}<p class="small muted">בהפעלה נשמרים ב־Cloudflare כתובת מסירה למכשיר, הנושאים שבחרת, השעות ורשימת הפריטים שנשלחו בהתראות. השמורים והתגובות אינם נשלחים. החיבור פג אחרי 90 יום ללא שמירת הגדרות מחדש. אפשר להסכים לסנכרון מזהי פריטים כדי לצמצם כפילויות בין הפיד להתראות.</p><p class="small muted">אין חלון אוטומטי בכל פתיחת נעילה. אפשר לכבות התראות בכל עת גם בהגדרות האייפון.</p></section>`;
}
export function hasPush(){return !!state.token;}
export async function disablePush(){
 // Unsubscribe locally first: even if the server is unreachable it can no
 // longer deliver. Keep token until server deletion succeeds so retry is possible.
 const reg=registration||await navigator.serviceWorker?.getRegistration();
 const sub=await reg?.pushManager.getSubscription();if(sub)await sub.unsubscribe();
 if(state.token)await api('/subscription','DELETE');
 state={token:null,active:false,frequency:'daily',hour:9};localStorage.removeItem(KEY);
}
export function installPushHandlers(getProfile,render,announce){
 profileAccess=getProfile;
 document.addEventListener('click',async event=>{
  const button=event.target.closest('[data-push]');if(!button||busy)return;
  const action=button.dataset.push;
  // Permission request must happen synchronously in this user's tap, before
  // any network request or registration await (especially on iPhone).
  const permission=action==='enable'&&pushSupport()==='supported'&&Notification.permission!=='granted'?Notification.requestPermission():Promise.resolve(typeof Notification!=='undefined'?Notification.permission:'denied');
  busy=true;const panel=document.querySelector('#push-panel');panel?.querySelectorAll('button').forEach(b=>b.disabled=true);
  const feedback=t=>{announce(t);const el=document.querySelector('#push-status');if(el)el.textContent=t;};
  feedback('מעדכן את הבקשה…');
  try{
   if(action==='enable'){
    if(!registration||!publicKey)throw Error('not_ready');
    if(await permission!=='granted')throw Error('permission');
    if(!state.token){state.token=base64(crypto.getRandomValues(new Uint8Array(32)));try{persist();}catch{throw Error('storage');}}
    const frequency=document.querySelector('#push-frequency').value,hour=Number(document.querySelector('#push-hour').value),code=document.querySelector('#push-code')?.value.trim();
    const options=deliveryInput(state);if(!options.days.length){feedback('בחר לפחות יום אחד.');return;}
    state={...state,frequency,hour};await saveDelivery(options,code);render();feedback('הגדרות ההתראות נשמרו. אפשר לשלוח בדיקה ואז לנעול את האייפון.');
   }else if(action==='pause'){
    await saveDelivery({...defaultDelivery(),...state.options,pauseUntil:state.options?.pauseUntil>Date.now()?0:Date.now()+7*86400000});render();feedback('הגדרות ההשהיה נשמרו.');
   }else if(action==='test'){
    await api('/test','POST');feedback('בדיקה נקבעה. נעל עכשיו את האייפון; בדרך כלל היא מגיעה בתוך דקה–שתיים.');
   }else if(action==='disable'){
    await disablePush();render();feedback('ההתראות כובו ופרטי המסירה נמחקו מהשירות.');
   }
  }catch(error){feedback(message(error));}finally{busy=false;document.querySelectorAll('[data-push]').forEach(b=>b.disabled=false);}
 });
}
