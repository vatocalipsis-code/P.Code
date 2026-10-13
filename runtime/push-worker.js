/* Picot's service-worker presentation of semantic push messages. */
{
 const config=self.picotNotificationIdentity??{};
 const normalizeTitle=value=>String(value??'').toLocaleLowerCase().replace(/\./g,'');
 self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
 self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
 async function showCompactNotification(payload,url){
  const author=typeof payload.title==='string'?payload.title.trim():'';
  const prefix=author&&normalizeTitle(author)!==normalizeTitle(config.applicationTitle)?author+' . ':'';
  const options={body:prefix+(payload.body||config.fallbackBody||''),icon:config.icon,tag:payload.tag,data:{url}};
  const titles=['',' ','_','__','___','____','_____','-','.'];
  for(let i=0;i<titles.length;i++){
   try{return await self.registration.showNotification(titles[i],options)}
   catch(error){if(error?.name!=='TypeError'||i===titles.length-1)throw error}
  }
 }
 self.addEventListener('push',event=>{
  let payload={};try{payload=event.data?.json()??{}}catch{}
  let target;try{target=new URL(payload.url||'/',self.location.origin)}catch{target=new URL('/',self.location.origin)}
  const url=target.origin===self.location.origin&&target.pathname==='/'?target.href:self.location.origin+'/';
  event.waitUntil(showCompactNotification(payload,url));
 });
 self.addEventListener('notificationclick',event=>{
  event.notification.close();
  event.waitUntil((async()=>{
   const target=new URL(event.notification.data?.url||'/',self.location.origin);
   const url=target.origin===self.location.origin?target.href:self.location.origin+'/';
   const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
   const client=windows.find(item=>new URL(item.url).origin===self.location.origin);
   if(client){client.postMessage({type:config.openMessageType,url});await client.focus()}
   else await self.clients.openWindow(url);
  })());
 });
}
