/** Picot owns modality, focus restoration and dismissal; commands remain opaque. */
import {MODEL,semanticValue} from './semantic-model.js';
const scenes=new WeakMap();
const focusable=panel=>[...panel.querySelectorAll('button,input,select,textarea,[tabindex="0"]')].filter(node=>!node.disabled&&node.getAttribute('aria-disabled')!=='true'&&!node.hidden&&node.getClientRects().length);
export function createModalScene(panel,node,interaction){
  const wrapper=document.createElement('div');wrapper.dataset.planeModal=node.Login;wrapper.className=node.Visual.ModalClass??'';wrapper.hidden=true;
  panel.dataset.planeManaged='';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label',node.Visual.AriaLabel??node.Login);wrapper.append(panel);
  const scene={wrapper,panel,node,open:false,focus:null};
  const dismiss=()=>{if(scene.open&&interaction?.isEnabled()&&node.Visual.Dismiss)interaction.emit('OffPress',node.Login,node.Visual.Dismiss)};
  scene.dismiss=dismiss;
  wrapper.addEventListener('click',event=>{if(event.target===wrapper){event.preventDefault();event.stopPropagation();dismiss()}});
  wrapper.addEventListener('keydown',event=>{
    if(event.key==='Escape'){event.preventDefault();event.stopPropagation();dismiss();return}
    if(event.key!=='Tab')return;
    const nodes=focusable(panel),first=nodes[0],last=nodes.at(-1);
    if(!first){event.preventDefault();panel.focus();return}
    if(event.shiftKey&&document.activeElement===first||!event.shiftKey&&document.activeElement===last){event.preventDefault();(event.shiftKey?last:first).focus()}
  });
  panel.tabIndex=-1;return scene;
}
export function installModalScenes(root,records){
  const abort=new AbortController();scenes.set(root,{records,stack:[],previous:null,initialFocus:null,abort});
  if(!records.length)return;
  const doc=root.ownerDocument??globalThis.document;
  doc.addEventListener('keydown',event=>{
    const active=scenes.get(root)?.stack.at(-1);
    if(!active||event.defaultPrevented)return;
    // Disabling a focused submit control can move focus to the document body.
    // Modal dismissal and focus containment must still belong to the runtime.
    if(event.key==='Escape'){event.preventDefault();event.stopPropagation();active.dismiss()}
    else if(event.key==='Tab'&&!active.wrapper.contains(doc.activeElement)){
      event.preventDefault();const nodes=focusable(active.panel);((event.shiftKey?nodes.at(-1):nodes[0])??active.panel).focus();
    }
  },{signal:abort.signal});
}
// Freeze an outgoing scene before semantic patches can replace its contents.
export function prepareModalUpdate(root,data){
  const state=scenes.get(root);if(!state)return false;
  for(const record of state.records){
    const open=semanticValue(record.node.Visual.VisibleSource,data[MODEL])===true;
    if(open&&record.exit){record.exit.cancel();record.exit=null;delete record.wrapper.dataset.planeExiting;record.wrapper.inert=false;record.wrapper.style.pointerEvents=''}
    if(!open&&record.open&&record.node.Visual.ModalExit&&record.wrapper.animate){
      const animation=record.wrapper.animate([{opacity:1},{opacity:0}],{duration:record.node.Visual.ModalExit.Duration,easing:'ease',fill:'forwards'});
      record.exit=animation;record.wrapper.dataset.planeExiting='';record.wrapper.style.pointerEvents='none';
      animation.finished.then(()=>{
        if(record.exit!==animation)return;
        record.wrapper.hidden=true;record.wrapper.style.display='none';record.panel.hidden=true;record.panel.setAttribute('aria-hidden','true');
        record.exit=null;delete record.wrapper.dataset.planeExiting;record.wrapper.style.pointerEvents='';animation.cancel();
      },()=>{});
    }
  }
  return state.records.some(record=>record.exit);
}
export function updateModalScenes(root,data){
  const state=scenes.get(root);if(!state)return;
  const doc=root.ownerDocument??globalThis.document,previousActive=state.stack.at(-1),opened=[];
  for(const record of state.records){
    const open=semanticValue(record.node.Visual.VisibleSource,data[MODEL])===true;
    if(open&&!record.open){record.focus=doc.activeElement;opened.push(record)}
    record.open=open;
    // Avoid style invalidation on unrelated semantic updates.
    if(record.exit)continue;
    if(record.wrapper.hidden===open){record.wrapper.hidden=!open;record.wrapper.style.display=open?'':'none'}
    if(record.panel.hidden===open)record.panel.hidden=!open;
    if(record.panel.getAttribute('aria-hidden')!==String(!open))record.panel.setAttribute('aria-hidden',String(!open));
  }
  state.stack=state.stack.filter(record=>record.open);
  state.stack.push(...opened);
  const active=state.stack.at(-1);
  if(active){
    if(!state.previous){state.previous=new Map();state.initialFocus=opened[0]?.focus??doc.activeElement}
    for(const node of root.children){
      if(!state.previous.has(node))state.previous.set(node,node.inert);
      const inert=node!==active.wrapper;if(node.inert!==inert)node.inert=inert;
    }
    if(opened.length){
      // Preserve authored stacking as a floor, then order nested scenes by activation.
      // Reading computed style happens only when opening, never on data updates.
      const level=record=>Number(doc.defaultView.getComputedStyle(record.wrapper).zIndex)||0;
      let top=Math.max(0,...state.stack.filter(record=>!opened.includes(record)).map(level));
      for(const record of opened){record.previousZ=record.wrapper.style.zIndex;top=Math.max(top+1,level(record));record.wrapper.style.zIndex=String(top)}
    }
  }
  for(const record of state.records)if(!record.open&&record.previousZ!==undefined){record.wrapper.style.zIndex=record.previousZ;delete record.previousZ}
  if(!active&&state.previous){for(const [node,inert]of state.previous)if(node.inert!==inert)node.inert=inert;state.previous=null}
  for(const record of state.records)if(record.exit)record.wrapper.inert=true;
  if(active!==previousActive){
    const restore=active?(previousActive?.focus&&active.wrapper.contains(previousActive.focus)?previousActive.focus:null):state.initialFocus;
    queueMicrotask(()=>{
      if(scenes.get(root)!==state||state.stack.at(-1)!==active)return;
      const target=restore?.isConnected&&!restore.disabled?restore:active?.wrapper.isConnected?(focusable(active.panel)[0]??active.panel):null;
      target?.focus({preventScroll:true});
    });
  }
  if(!active)state.initialFocus=null;
}
export function disposeModalScenes(root){
  const state=scenes.get(root);if(state?.previous)for(const [node,inert]of state.previous)node.inert=inert;
  for(const record of state?.records??[])if(record.previousZ!==undefined){record.wrapper.style.zIndex=record.previousZ;delete record.previousZ}
  for(const record of state?.records??[]){record.exit?.cancel();record.exit=null}
  state?.abort.abort();
  scenes.delete(root);
}
