/** SPL-owned, batched native field measurement; independent of application data. */
export function installSteppedFields(panel,rule,signal){
 const doc=panel.ownerDocument,win=doc.defaultView;
 let frame=0,cache=new WeakMap(),disposed=false;
 const visible=node=>{for(let p=node;p;p=p.parentElement)if(p.hidden||p.style.display==='none'||p.getAttribute('aria-hidden')==='true')return false;return node.isConnected};
 const measure=()=>{
  frame=0;if(disposed||!visible(panel))return;
  const raw=parseFloat(win.getComputedStyle(doc.documentElement).getPropertyValue(rule.UnitVariable)),unit=Number.isFinite(raw)&&raw>0?raw:rule.DefaultUnit;
  const rows=[];
  for(const area of panel.querySelectorAll(rule.Selector)){
   if(!area.matches('textarea')||!visible(area)||!area.getClientRects().length)continue;
   const style=win.getComputedStyle(area),key=[area.value,area.clientWidth,style.font,unit].join('|');if(cache.get(area)===key)continue;
   rows.push({area,key,line:parseFloat(style.lineHeight)||22,padding:(parseFloat(style.paddingTop)||0)+(parseFloat(style.paddingBottom)||0)});
  }
  for(const {area}of rows)area.style.setProperty('height','0px','important');
  for(const row of rows)row.height=unit*Math.max(1,Math.round((row.area.scrollHeight-row.padding)/row.line));
  for(const {area,key,height}of rows){area.style.setProperty('height',height+'px','important');area.classList.add(rule.Class);cache.set(area,key)}
 };
 const resize=()=>{if(!disposed&&!frame&&visible(panel))frame=win.requestAnimationFrame(measure)};
 panel.addEventListener('input',event=>{if(event.target.matches?.(rule.Selector))resize()},{signal});
 const observer=new win.ResizeObserver(resize);observer.observe(panel);
 win.addEventListener('resize',resize,{signal});
 const fonts=()=>{cache=new WeakMap();resize()};doc.fonts?.addEventListener('loadingdone',fonts,{signal});doc.fonts?.ready.then(fonts);
 return {resize,dispose:()=>{disposed=true;observer.disconnect();if(frame)win.cancelAnimationFrame(frame)}};
}
