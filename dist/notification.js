// Shared classic-worker helper, also executed in isolated unit tests.
self.RegaNotification={
 build(data,scope,now=Date.now()){
  const valid=data&&typeof data.body==='string'&&data.expiresAt>now;
  const id=valid&&/^[a-z0-9-]{1,80}$/.test(data.factId||'')?data.factId:null;
  const url=new URL(scope);if(id)url.searchParams.set('fact',id);
  return {title:valid&&typeof data.title==='string'?data.title.slice(0,80):'רגע · משהו קטן לדעת',options:{body:valid?data.body.slice(0,250):'רגע של סקרנות מחכה לך באפליקציה.',dir:'rtl',lang:'he',icon:new URL('icon-192.png',scope).href,tag:data?.tag==='rega-test'?'rega-test':'rega-fact',data:{url:url.href}}};
 },
 safeURL(value,scope){
  try{const url=new URL(value),base=new URL(scope);if(url.origin===base.origin&&url.pathname===base.pathname)return url.href;}catch{}
  return scope;
 }
};
