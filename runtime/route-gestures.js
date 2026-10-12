/** Declarative navigation gestures. This module emits commands and never loads data. */
import {numericEditorOpen} from './numeric-editor.js';
import {semanticValue} from './semantic-model.js';
export function gestureRegion(x,y,width,height,rule){
 const within=(value,range)=>Array.isArray(range)&&value>=range[0]&&value<=range[1];
 return {backAllowed:within(x/width,rule.BackRegion),menuAllowed:within(x/width,rule.MenuRegion),pullAllowed:within(y/height,rule.PullRegion)};
}
export function createRouteGestures(root,{emit,slide,onBack}){
 const doc=root.ownerDocument,view=doc.defaultView,abort=new AbortController(),signal=abort.signal;
 let frame=null,model=null,start=null,busy=false,animation=null,suppressUntil=0,badge=null,fade=null,disposed=false;
 const rule=()=>frame?.selected?.route.Gestures;
 const enabled=()=>!numericEditorOpen(root)&&frame?.enabled&&rule();
 const loading=()=>semanticValue(rule()?.LoadingSource,model)===true;
 function notice(show){
  const r=rule();if(!r?.IndicatorClass)return;
  if(!badge&&show){badge=doc.createElement('div');badge.className=r.IndicatorClass;badge.hidden=true;badge.setAttribute('role','status');badge.setAttribute('aria-label',r.Label??'');const spinner=doc.createElement('span');spinner.className=r.SpinnerClass??'';spinner.setAttribute('aria-hidden','true');badge.append(spinner);root.append(badge)}
  if(!badge)return;clearTimeout(fade);badge.dataset.state='loading';badge.setAttribute('aria-busy',String(show));
  if(show){badge.hidden=false;if(r.FadingClass)badge.classList.remove(r.FadingClass)}
  else if(!badge.hidden){if(r.FadingClass)badge.classList.add(r.FadingClass);fade=setTimeout(()=>{if(badge)badge.hidden=true},r.FadeDuration??0)}
 }
 function canPull(target,r){
  if(semanticValue(r.RefreshEnabledSource,model)!==true)return false;
  for(let node=target;node;node=node.parentElement){if(node.scrollTop>1)return false;if(r.ScrollBoundary&&node.matches?.(r.ScrollBoundary))return true}
  return (doc.scrollingElement?.scrollTop??0)<=1;
 }
 const reset=()=>{start=null;if(!loading())notice(false)};
 async function back(record,node){
  if(!node||busy)return;busy=true;
  try{
   const r=record.route;
   if(r.Speed&&!view.matchMedia('(prefers-reduced-motion: reduce)').matches){const {frames,duration}=slide(view.innerWidth,r.Speed,r.Acceleration??0,true);animation=node.animate(frames,{duration,easing:'linear',fill:'forwards'});await animation.finished}
   if(!disposed){onBack(record);emit(record,r.Gestures.Back)}
  }catch{}finally{animation?.cancel();animation=null;busy=false}
 }
 doc.addEventListener('touchstart',event=>{
  start=null;const r=enabled();if(!r||busy)return;
  if(event.touches.length!==1){if(event.cancelable)event.preventDefault();return}
  if(r.Exclude&&event.target.closest?.(r.Exclude)||String(view.getSelection()??''))return;
  const t=event.touches[0],region=gestureRegion(t.clientX,t.clientY,view.innerWidth,view.innerHeight,r);
  start={record:frame.selected,x:t.clientX,y:t.clientY,axis:null,window:event.target.closest?.(r.Target??'[data-plane-route-managed]'),pull:region.pullAllowed&&canPull(event.target,r),menuAllowed:Boolean(r.Menu)&&!root.inert&&region.menuAllowed,backAllowed:region.backAllowed};
 },{signal,passive:false,capture:true});
 doc.addEventListener('touchmove',event=>{
  if(enabled()&&event.touches.length>1){if(event.cancelable)event.preventDefault();reset();return}
  if(!start)return;const r=start.record.route.Gestures,t=event.touches[0],dx=t.clientX-start.x,dy=t.clientY-start.y;
  if(!start.axis&&Math.max(Math.abs(dx),Math.abs(dy))>=r.IntentDistance){
   if(Math.abs(dx)>Math.abs(dy)*r.AxisRatio&&dx<0&&start.menuAllowed)start.axis='menu';
   else if(Math.abs(dx)>Math.abs(dy)*r.AxisRatio)start.axis=dx>0&&start.backAllowed&&start.window&&!(r.RootBack===false&&start.window===start.record.panel)?'back':'horizontal';
   else if(Math.abs(dy)>Math.abs(dx)*r.AxisRatio)start.axis=start.pull&&dy>0?'refresh':'scroll';
  }
  if(start.axis==='refresh'&&dy>r.NoticeDistance)notice(true);
  if(['back','refresh','menu'].includes(start.axis)&&event.cancelable)event.preventDefault();
 },{signal,passive:false,capture:true});
 doc.addEventListener('touchend',event=>{
  const s=start;start=null;const t=event.changedTouches[0];if(!s?.axis)return;
  const r=s.record.route.Gestures;suppressUntil=performance.now()+400;
  if(s.axis==='refresh'&&t&&t.clientY-s.y>=r.PullDistance&&Math.abs(t.clientX-s.x)<(t.clientY-s.y)/r.AxisRatio){emit(s.record,r.Refresh);return}
  if(!loading())notice(false);
  if(s.axis==='menu'){if(t&&s.x-t.clientX>=r.SwipeDistance)emit(s.record,r.Menu);return}
  if(s.axis==='back'&&t&&t.clientX-s.x>=r.SwipeDistance&&Math.abs(t.clientY-s.y)<Math.abs(t.clientX-s.x)/r.AxisRatio){doc.activeElement?.blur?.();void back(s.record,s.window)}
 },{signal,passive:true,capture:true});
 doc.addEventListener('touchcancel',reset,{signal,passive:true,capture:true});
 for(const name of ['gesturestart','gesturechange'])doc.addEventListener(name,event=>{if(rule()?.PreventZoom)event.preventDefault()},{signal,passive:false});
 doc.addEventListener('pointerdown',()=>{suppressUntil=0},{signal,capture:true});
 doc.addEventListener('pointerup',event=>{if(start?.axis){event.preventDefault();event.stopImmediatePropagation()}},{signal,capture:true});
 doc.addEventListener('click',event=>{if(performance.now()<suppressUntil){event.preventDefault();event.stopImmediatePropagation()}},{signal,capture:true});
 return {update(next,data){frame=next;model=data;notice(loading()||start?.axis==='refresh')},dispose(){disposed=true;abort.abort();clearTimeout(fade);animation?.cancel();badge?.remove();badge=null}};
}
