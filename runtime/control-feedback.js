/** Transient control feedback declared by SPL; emits no application commands. */
const scenes=new WeakMap();
export function installControlFeedback(root,plan,interaction){
 disposeControlFeedback(root);
 const rule=plan.find(node=>node.Visual?.Feedback)?.Visual.Feedback;if(!rule)return;
 const doc=root.ownerDocument,win=doc.defaultView,abort=new win.AbortController(),pressed=new Map(),halos=new Map();
 const options={capture:true,signal:abort.signal};
 const target=event=>{
  if(interaction&&!interaction.isEnabled())return null;
  if(!(event.target instanceof win.Element))return null;
  const control=event.target.closest(rule.Target);
  if(!control||(rule.Scope!=='Document'&&!root.contains(control))||control.closest('[aria-disabled="true"],:disabled,[inert]'))return null;
  return control;
 };
 const removeHalo=halo=>{clearTimeout(halos.get(halo));halos.delete(halo);halo.remove()};
 function showHalo(control){
  if(!rule.HaloClass||win.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const rect=control.getBoundingClientRect();if(rect.width<rule.MinWidth||rect.height<rule.MinHeight)return;
  const halo=doc.createElement('span');halo.className=rule.HaloClass;halo.setAttribute('aria-hidden','true');
  Object.assign(halo.style,{left:rect.left+'px',top:rect.top+'px',width:rect.width+'px',height:rect.height+'px',borderRadius:win.getComputedStyle(control).borderRadius});
  doc.body.append(halo);halo.addEventListener('animationend',()=>removeHalo(halo),{once:true,signal:abort.signal});
  halos.set(halo,setTimeout(()=>removeHalo(halo),rule.HaloTimeout));
 }
 function press(control){if(!control)return;clearTimeout(pressed.get(control));pressed.set(control,null);control.classList.add(rule.PressedClass);showHalo(control)}
 function release(immediate=false){for(const [control,timer]of pressed){clearTimeout(timer);const clear=()=>{control.classList.remove(rule.PressedClass);pressed.delete(control)};if(immediate)clear();else pressed.set(control,setTimeout(clear,rule.ReleaseDelay))}}
 doc.addEventListener('pointerdown',event=>press(target(event)),options);
 doc.addEventListener('pointerup',()=>release(),options);
 doc.addEventListener('pointercancel',()=>release(true),options);
 doc.addEventListener('keydown',event=>{if(['Enter',' '].includes(event.key)&&!event.repeat&&event.target instanceof win.Element&&!event.target.matches(rule.KeyboardExclude))press(target(event))},options);
 doc.addEventListener('keyup',event=>{if(['Enter',' '].includes(event.key))release()},options);
 win.addEventListener('blur',()=>release(true),{signal:abort.signal});
 doc.addEventListener('visibilitychange',()=>{if(doc.hidden)release(true)},{signal:abort.signal});
 const cancel=()=>{release(true);for(const halo of halos.keys())removeHalo(halo)};
 scenes.set(root,{cancel,dispose(){abort.abort();cancel()}});
}
export function disposeControlFeedback(root){scenes.get(root)?.dispose();scenes.delete(root)}
export function cancelControlFeedback(root){scenes.get(root)?.cancel()}
