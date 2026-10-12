/** Route composition is authored by SPL. Route IDs, history and commands are opaque. */
import {MODEL,semanticValue} from './semantic-model.js';
import {createRouteGestures} from './route-gestures.js';
const scenes=new WeakMap();
const classes=(node,names,on)=>{for(const name of (names??'').split(/\s+/).filter(Boolean))node.classList.toggle(name,on)};

export function routeFrame(records,model){
  const selected=records.find(record=>semanticValue(record.route.Source,model)?.id===record.route.Id);
  const location=selected?semanticValue(selected.route.Source,model):null;
  const enabled=Boolean(selected&&(!selected.route.EnabledSource||semanticValue(selected.route.EnabledSource,model)===true));
  const layered=enabled&&selected.route.Mode==='Stack';
  const history=layered?[...new Set((location.history??[]).slice().reverse().filter(id=>id!==location.id))]:[];
  if(selected&&!enabled&&selected.route.Fallback)history.push(selected.route.Fallback);
  return {selected,location,enabled,layered,history};
}

export function slideFrames(width,speed,acceleration,closing=false){
  const duration=1/speed+acceleration/2,count=Math.ceil(duration*120);
  return {duration:duration*1000,frames:Array.from({length:count+1},(_,i)=>{
    const offset=i/count,t=offset*duration,u=t/acceleration;
    const progress=t>=acceleration?speed*(t-acceleration/2):speed*acceleration*(u*u*u-u*u*u*u/2);
    return {offset,transform:'translate3d('+((closing?progress:1-progress)*width)+'px,0,0)'};
  })};
}

function cancelMotions(scene){
  for(const [record,animation]of scene.motions){animation.cancel();classes(record.panel,record.route.ExitClass,false)}
  scene.motions.clear();
}
function animate(scene,record,closing){
  const rule=record.route,view=scene.root.ownerDocument.defaultView;
  if(!rule.Speed||closing&&rule.Exit===false||!closing&&rule.Enter===false||view.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const {frames,duration}=slideFrames(view.innerWidth,rule.Speed,rule.Acceleration??0,closing);
  if(closing)classes(record.panel,rule.ExitClass,true);
  const animation=record.panel.animate(frames,{duration,easing:'linear'});scene.motions.set(record,animation);
  animation.finished.catch(()=>{}).finally(()=>{
    if(scene.motions.get(record)!==animation)return;
    scene.motions.delete(record);classes(record.panel,rule.ExitClass,false);
    if(record.panel.getAttribute('aria-hidden')==='true'&&!record.context)record.panel.style.display='none';
  });
}
export function installRouteScenes(root,records,interaction){
  if(!records.length)return;
  const scene={root,records,interaction,motions:new Map(),signature:null,frame:null,abort:new AbortController(),press:null,suppressUntil:0};
  scenes.set(root,scene);
  scene.gestures=createRouteGestures(root,{slide:slideFrames,onBack:record=>{scene.skipExit=record},emit:(record,command)=>{if(command&&interaction?.isEnabled())interaction.emit('OffPress',record.node.Login,command)}});
  const doc=root.ownerDocument,options={capture:true,signal:scene.abort.signal};
  const current=()=>{
    const record=scene.frame?.selected;
    return scene.frame?.enabled&&!root.inert&&record&&!record.panel.inert&&interaction?.isEnabled()?record:null;
  };
  const emit=record=>{if(record.route.Dismiss)interaction.emit('OffPress',record.node.Login,record.route.Dismiss)};
  doc.addEventListener('pointerdown',event=>{
    const record=current();if(!record||!record.route.Outside||event.isPrimary===false||!scene.dismissible||record.panel.contains(event.target)||record.route.Exclude&&event.target.closest?.(record.route.Exclude))return;
    scene.press={record,id:event.pointerId,x:event.clientX,y:event.clientY};event.preventDefault();event.stopImmediatePropagation();
  },options);
  doc.addEventListener('pointerup',event=>{
    const press=scene.press;if(!press||press.id!==event.pointerId)return;scene.press=null;
    event.preventDefault();event.stopImmediatePropagation();scene.suppressUntil=performance.now()+400;
    if(current()===press.record&&scene.dismissible&&press.record.route.Outside==='Dismiss'&&!press.record.panel.contains(event.target)&&Math.hypot(event.clientX-press.x,event.clientY-press.y)<10)emit(press.record);
  },options);
  doc.addEventListener('pointercancel',()=>{scene.press=null},options);
  doc.addEventListener('click',event=>{if(performance.now()<scene.suppressUntil){event.preventDefault();event.stopImmediatePropagation()}},options);
  doc.addEventListener('keydown',event=>{
    const record=current();if(event.key==='Escape'&&!event.defaultPrevented&&record&&scene.dismissible&&record.route.Escape){event.preventDefault();emit(record)}
  },{signal:scene.abort.signal});
}
export function updateRouteScenes(root,data){
  const scene=scenes.get(root);if(!scene||!scene.records.length)return;
  const model=data[MODEL],frame=routeFrame(scene.records,model),{selected,location,enabled,layered,history}=frame;
  scene.gestures.update(frame,model);
  scene.dismissible=Boolean(selected&&(!selected.route.DismissEnabledSource||semanticValue(selected.route.DismissEnabledSource,model)===true));
  const signature=JSON.stringify([location,enabled,history]);if(signature===scene.signature)return;
  const previous=scene.frame?.selected;scene.signature=signature;scene.frame=frame;cancelMotions(scene);
  for(const record of scene.records){
    const {panel,route}=record,active=record===selected,context=history.includes(route.Id);
    const available=!route.EnabledSource||semanticValue(route.EnabledSource,model)===true;
    classes(root,route.RootClass,false);classes(root,route.LayerClass,false);
    classes(panel,route.PanelClass,available);classes(panel,route.ContextClass,context);classes(panel,route.GroupClass,available&&(active||context));classes(panel,route.ActiveClass,active);
    panel.style.zIndex=active?'30':context?String(20-history.indexOf(route.Id)):'';
    panel.style.display=active||context?'flex':'none';panel.inert=context;panel.setAttribute('aria-hidden',String(!active));record.context=context;
    if(active&&layered){panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label',(route.LabelSelector?panel.querySelector(route.LabelSelector)?.textContent.trim():null)||route.Label||record.node.Visual.AriaLabel||record.node.Login)}
    else{panel.removeAttribute('role');panel.removeAttribute('aria-modal')}
    panel.dataset.planeRouteManaged='';
  }
  if(selected){
    root.dataset.surface=selected.node.Login;
    classes(root,selected.route.RootClass,enabled);classes(root,selected.route.LayerClass,layered);
  }else delete root.dataset.surface;
  if(enabled&&previous&&previous!==selected){
    if(scene.skipExit!==previous&&!history.includes(previous.route.Id))animate(scene,previous,true);
    if(location.direction!=='return')animate(scene,selected,false);
  }
  scene.skipExit=null;
}
export function disposeRouteScenes(root){const scene=scenes.get(root);if(!scene)return;cancelMotions(scene);scene.gestures.dispose();scene.abort.abort();for(const record of scene.records){classes(root,record.route.RootClass,false);classes(root,record.route.LayerClass,false)}scenes.delete(root)}
