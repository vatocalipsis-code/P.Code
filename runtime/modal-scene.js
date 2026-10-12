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
  const abort=new AbortController();scenes.set(root,{records,previous:null,abort});
  if(!records.length)return;
  const doc=root.ownerDocument??globalThis.document;
  doc.addEventListener('keydown',event=>{
    const active=records.filter(record=>record.open).at(-1);
    if(!active||event.defaultPrevented)return;
    // Disabling a focused submit control can move focus to the document body.
    // Modal dismissal and focus containment must still belong to the runtime.
    if(event.key==='Escape'){event.preventDefault();event.stopPropagation();active.dismiss()}
    else if(event.key==='Tab'&&!active.wrapper.contains(doc.activeElement)){
      event.preventDefault();const nodes=focusable(active.panel);((event.shiftKey?nodes.at(-1):nodes[0])??active.panel).focus();
    }
  },{signal:abort.signal});
}
export function updateModalScenes(root,data){
  const state=scenes.get(root);if(!state)return;
  let opened=null,closed=null;
  for(const record of state.records){
    const open=semanticValue(record.node.Visual.VisibleSource,data[MODEL])===true;
    if(open&&!record.open){record.focus=document.activeElement;opened=record}
    if(!open&&record.open)closed=record;
    record.open=open;record.wrapper.hidden=!open;record.wrapper.style.display=open?'':'none';record.panel.hidden=!open;record.panel.setAttribute('aria-hidden',String(!open));
  }
  const active=state.records.filter(record=>record.open).at(-1);
  if(active){
    if(!state.previous)state.previous=new Map([...root.children].map(node=>[node,node.inert]));
    for(const node of root.children)node.inert=node!==active.wrapper;
  }else if(state.previous){for(const [node,inert]of state.previous)node.inert=inert;state.previous=null}
  if(opened)queueMicrotask(()=>{if(opened.open&&opened.wrapper.isConnected)(focusable(opened.panel)[0]??opened.panel).focus({preventScroll:true})});
  else if(closed&&closed.focus?.isConnected)closed.focus.focus({preventScroll:true});
}
export function disposeModalScenes(root){
  const state=scenes.get(root);if(state?.previous)for(const [node,inert]of state.previous)node.inert=inert;
  state?.abort.abort();
  scenes.delete(root);
}
