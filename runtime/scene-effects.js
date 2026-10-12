import {installSteppedButtons} from './stepped-buttons.js';
import {installAudioCapture} from './audio-capture.js';
import {installSteppedFields} from './stepped-fields.js';
import {MODEL,semanticValue} from './semantic-model.js';
/** Optional, SPL-authored browser behavior. No application state or commands are interpreted. */
const scenes=new WeakMap();
export function validateSceneEffects(effects){
 const fail=()=>{throw Error('Invalid SceneEffects')};
 if(!effects||typeof effects!=='object'||Array.isArray(effects))fail();
 const schemas={SteppedButtons:['Selector','LabelSelector','LinesVariable','FixedSelector','FixedClass'],AudioCapture:['Source','SessionSource','ColorScope','Command','Waveform','Width','Height','Bars','BarInset','BarWidth','SampleStride','Divisor','MinBarHeight','ColorVariable','FallbackColor'],SteppedFields:['Selector','UnitVariable','DefaultUnit','Class'],Viewport:['TopVariable','HeightVariable'],AutoSize:['Target','RowHeight','MultilineHeight','MultilineClass'],Scroll:['Target','Threshold','LatestSource'],Resize:['Handle','Target','MinHeight','ViewportMargin'],Focus:['Target','CompactTarget','CompactWidth'],Outside:['Target','Scope','Command'],Confirm:['Source','Messages','Accept','Reject']};
 for(const [kind,rule] of Object.entries(effects)){
  const fields=schemas[kind];if(!fields||!rule||typeof rule!=='object'||Array.isArray(rule)||Object.keys(rule).some(key=>!fields.includes(key))||fields.some(key=>key!=='LatestSource'&&!Object.hasOwn(rule,key)))fail();
  if(kind==='AudioCapture'&&(!Number.isInteger(rule.Bars)||!Number.isInteger(rule.SampleStride)||rule.Bars*rule.SampleStride>128))fail();
  for(const [key,value]of Object.entries(rule)){
   if(kind==='Confirm'&&key==='Messages'){if(!value||typeof value!=='object'||Array.isArray(value)||!Object.keys(value).length||Object.values(value).some(text=>typeof text!=='string'||!text||text.length>4000))fail();continue}
   if(['Width','Height','Bars','BarInset','BarWidth','SampleStride','Divisor','MinBarHeight','DefaultUnit','RowHeight','MultilineHeight','Threshold','MinHeight','ViewportMargin','CompactWidth'].includes(key)){if(typeof value!=='number'||!Number.isFinite(value)||value<0||value>10000)fail()}
   else if(typeof value!=='string'||!value.trim()||value.length>256)fail();
   if((key==='LatestSource'||key==='Source'||key==='SessionSource')&&!/^\$\.[a-zA-Z0-9_.-]+$/.test(value))fail();
   if(['DefaultUnit','Width','Height','Bars','BarWidth','SampleStride','Divisor'].includes(key)&&value<=0)fail();
   if(kind==='AudioCapture'&&key==='ColorScope'&&!['Root','Panel'].includes(value))fail();
   if(kind==='AudioCapture'&&key==='FallbackColor'&&!/^#[0-9a-fA-F]{6}$/.test(value))fail();
   if(key.endsWith('Variable')&&!/^--[-a-zA-Z0-9]+$/.test(value))fail();
   if(key.endsWith('Class')&&!/^[-_a-zA-Z][-_a-zA-Z0-9]*$/.test(value))fail();
  }
 }
}
export function installSceneEffects(root,plan,interaction){
 disposeSceneEffects(root);
 if(!plan.some(node=>node.Visual?.SceneEffects))return;
 const doc=root.ownerDocument,win=doc.defaultView,abort=new win.AbortController(),records=[],byLogin=new Map();
 for(const el of root.querySelectorAll('[data-plane-login]'))if(!byLogin.has(el.dataset.planeLogin))byLogin.set(el.dataset.planeLogin,el);
 for(const node of plan){
  const rules=node.Visual?.SceneEffects;if(!rules)continue;
  const panel=byLogin.get(node.Login);if(!panel)continue;
  const wrapper=panel.closest('[data-plane-modal]')??panel;
  const get=login=>{const cached=byLogin.get(login);if(cached&&(cached===panel||panel.contains(cached)))return cached;const fresh=panel.querySelector('[data-plane-login="'+win.CSS.escape(login)+'"]');if(fresh)byLogin.set(login,fresh);return fresh};
  const record={panel,wrapper,rules,get,interaction,login:node.Login,open:false,scroll:null};records.push(record);
  const listen=(target,type,handler)=>target?.addEventListener(type,handler,{signal:abort.signal});
  if(rules.Viewport){const r=rules.Viewport;const update=()=>{if(wrapper.hidden)return;wrapper.style.setProperty(r.TopVariable,(win.visualViewport?.offsetTop??0)+'px');wrapper.style.setProperty(r.HeightVariable,(win.visualViewport?.height??win.innerHeight)+'px')};listen(win.visualViewport,'resize',update);listen(win.visualViewport,'scroll',update);listen(win,'resize',update);record.viewport=update;update()}
  if(rules.AudioCapture){const rule=rules.AudioCapture;record.audio=installAudioCapture(panel,rule,value=>{if(interaction?.isEnabled())interaction.emit('OnInput',node.Login,rule.Command,{Payload:value})},root)}
  if(rules.SteppedButtons)record.buttons=installSteppedButtons(panel,rules.SteppedButtons,abort.signal);
  if(rules.SteppedFields)record.stepped=installSteppedFields(panel,rules.SteppedFields,abort.signal);
  if(rules.AutoSize){
   const r=rules.AutoSize,area=get(r.Target);if(!area)throw Error('Unknown AutoSize target '+r.Target);
   const resize=()=>{if(wrapper.hidden||panel.getAttribute('aria-hidden')==='true'||!area.isConnected)return;const parent=area.parentElement;parent.classList.remove(r.MultilineClass);area.style.setProperty('height','0px','important');const multiple=area.scrollHeight>r.RowHeight;parent.classList.toggle(r.MultilineClass,multiple);area.style.setProperty('height','0px','important');area.style.setProperty('height',Math.max(multiple?r.MultilineHeight:r.RowHeight,area.scrollHeight)+'px','important')};
   listen(area,'input',resize);let width=0;const observer=new win.ResizeObserver(()=>{const next=area.parentElement.clientWidth;if(next!==width){width=next;resize()}});observer.observe(area.parentElement);record.resize=resize;record.observer=observer;
  }
  if(rules.Resize){const r=rules.Resize,handle=get(r.Handle),target=get(r.Target);if(!handle||!target)throw Error('Unknown Resize target');let drag=null;listen(handle,'pointerdown',e=>{e.preventDefault();handle.setPointerCapture(e.pointerId);drag={id:e.pointerId,y:e.clientY,height:target.getBoundingClientRect().height}});listen(handle,'pointermove',e=>{if(drag?.id===e.pointerId)target.style.height=Math.max(r.MinHeight,Math.min(win.innerHeight-r.ViewportMargin,drag.height+e.clientY-drag.y))+'px'});for(const event of ['pointerup','pointercancel','lostpointercapture'])listen(handle,event,()=>{drag=null})}
  if(rules.Outside){const r=rules.Outside,target=get(r.Target),scope=get(r.Scope);if(!target||!scope)throw Error('Unknown Outside target');wrapper.addEventListener('click',e=>{if(target.getClientRects().length&&!scope.contains(e.target)&&interaction?.isEnabled())interaction.emit('OffPress',node.Login,r.Command)},{capture:true,signal:abort.signal})}
 }
 scenes.set(root,{records,abort});updateSceneEffects(root);
}
export function beforeSceneUpdate(root){for(const r of scenes.get(root)?.records??[]){if(!r.rules.Scroll||r.wrapper.hidden||!r.open)continue;const el=r.get(r.rules.Scroll.Target);if(el)r.scroll={el,top:el.scrollTop,bottom:el.scrollHeight-el.clientHeight-el.scrollTop<r.rules.Scroll.Threshold}}}
export function updateSceneEffects(root,data={}){
 for(const r of scenes.get(root)?.records??[]){
  const open=!r.wrapper.hasAttribute('data-plane-exiting')&&!r.wrapper.hidden&&r.panel.getAttribute('aria-hidden')!=='true'&&r.panel.isConnected;
  if(open){if(!r.open)r.viewport?.();r.resize?.();r.stepped?.resize();r.buttons?.resize();if(!r.open&&r.rules.Scroll){const el=r.get(r.rules.Scroll.Target);if(el)r.scroll={el,top:0,bottom:true}}}
  if(open&&!r.open&&r.rules.Focus){const rule=r.rules.Focus;const target=r.get(root.ownerDocument.defaultView.innerWidth<=rule.CompactWidth?rule.CompactTarget:rule.Target);queueMicrotask(()=>{if(target?.isConnected&&!r.wrapper.hidden){if(!target.matches('input,textarea,select,button,a,[tabindex]'))target.tabIndex=-1;target.focus({preventScroll:true})}})}
  if(open&&r.rules.Scroll?.LatestSource){const latest=semanticValue(r.rules.Scroll.LatestSource,data[MODEL]);if(latest!==r.latest){r.latest=latest;const el=r.get(r.rules.Scroll.Target);if(el)r.scroll={el,top:0,bottom:true}}}
  if(r.rules.Confirm){
   const rule=r.rules.Confirm,value=open?semanticValue(rule.Source,data[MODEL]):null;
   if(value!==r.decision){
    r.decision=value;
    if(typeof value==='string'&&Object.hasOwn(rule.Messages,value))queueMicrotask(()=>{
     if(r.decision!==value||r.wrapper.hidden||!r.panel.isConnected||!r.interaction?.isEnabled()||!scenes.get(root)?.records.includes(r))return;
     const accepted=root.ownerDocument.defaultView.confirm(rule.Messages[value]);
     if(r.decision===value)r.interaction.emit('OffPress',r.login,accepted?rule.Accept:rule.Reject,{Value:value});
    });
   }
  }
  if(r.audio){if(open&&r.interaction?.isEnabled())r.audio.update(semanticValue(r.rules.AudioCapture.Source,data[MODEL]),semanticValue(r.rules.AudioCapture.SessionSource,data[MODEL]));else r.audio.cancel()}
  r.open=open;
  if(r.scroll){const {el,top,bottom}=r.scroll;queueMicrotask(()=>{if(el.isConnected)el.scrollTop=bottom?el.scrollHeight:top});r.scroll=null}
 }
}
export function disposeSceneEffects(root){const state=scenes.get(root);state?.abort.abort();for(const r of state?.records??[]){r.observer?.disconnect();r.stepped?.dispose();r.buttons?.dispose();r.audio?.dispose()}scenes.delete(root)}
export function appendLinkedText(el,value){
 const text=String(value??''),pattern=/https?:\/\/[^\s]+/gu;let cursor=0;
 for(const match of text.matchAll(pattern)){el.append(el.ownerDocument.createTextNode(text.slice(cursor,match.index)));const a=el.ownerDocument.createElement('a');a.href=match[0];a.textContent=match[0];a.target='_blank';a.rel='noopener noreferrer';el.append(a);cursor=match.index+match[0].length}
 el.append(el.ownerDocument.createTextNode(text.slice(cursor)));
}
