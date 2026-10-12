// Product-neutral browser adapter for loading an SPL and preparing P.Code.
// The application owns names, data bindings, actions, and navigation.
export function createPCodeHost({engine,parse,fetchText=async path=>{
  const response=await fetch(path);
  if(!response.ok)throw new Error('SPL download failed: '+response.status);
  return response.text();
}}){
  if(!engine?.connect||typeof parse!=='function'||typeof fetchText!=='function')throw new TypeError('P.Code host dependencies required');
  const sources=new Map();
  async function load({key,path,expectedName}){
    if(!key||!path)throw new TypeError('SPL key and path required');
    if(typeof path!=='string'||!path.startsWith('/')||path.startsWith('//')||path.split('/').includes('..'))throw new TypeError('SPL path must be local');
    const cached=sources.get(key);
    if(cached){
      if(cached.path!==path||cached.expectedName!==expectedName)throw new Error('SPL key reused for a different source: '+key);
      return cached.pending;
    }
    const pending=(async()=>{
      const text=await fetchText(path);
      const parsed=parse(text);
      if(expectedName&&parsed?.SetLang?.Name!==expectedName)throw new Error('SPL identity mismatch: '+key);
      return {text,parsed};
    })().catch(error=>{sources.delete(key);throw error});
    sources.set(key,{path,expectedName,pending});
    return pending;
  }
  async function prepare(skin){
    const descriptor=engine.getDescriptor?.();
    const connected=engine.connect({
      GenerationId:descriptor?.GenerationId??'pcode.layout-group.v1',SerializationVersion:descriptor?.SupportedSerializationVersions?.at(-1)??1,
      RequiredCapabilities:skin.SetLang.Requires??[],OptionalCapabilities:[]
    });
    if(connected.Acceptance.Status!=='Accepted')throw new Error(JSON.stringify(connected.Acceptance.Failure));
    const connection=connected.Connection;
    try{
      const result=await connection.prepare({
        SetLang:skin.SetLang,SetData:skin.SetData,SetRender:skin.SetRender,
        ...(skin.Resources?{Resources:skin.Resources}:{})
      });
      if(result.Outcome!=='Completed')throw new Error(JSON.stringify(result.Failure));
      return {connection,runtime:result.Runtime};
    }catch(error){await connection.close().catch(()=>{});throw error}
  }
  return Object.freeze({load,prepare,updatePresentation,getCached:key=>sources.get(key)?.pending});
}

// View continuity belongs to Picot. Snapshots never cross into application data.
const presentationUpdates=new WeakMap();
function identity(element){
 if(!element?.dataset?.planeLogin)return null;
 const repeated=[];
 for(let owner=element;owner;owner=owner.parentElement)if(owner.hasAttribute('data-plane-item-id'))repeated.push([owner.dataset.planeLogin,owner.dataset.planeItemId]);
 return JSON.stringify([element.dataset.planeLogin,repeated]);
}
function snapshot(root){
 const doc=root.ownerDocument,win=doc.defaultView,active=doc.activeElement;
 const focused=root.contains(active)?active:null;
 const scroll=[];
 for(const node of root.querySelectorAll('[data-plane-login]'))if(node.scrollTop||node.scrollLeft)scroll.push({key:identity(node),x:node.scrollLeft,y:node.scrollTop});
 return {doc,win,active,focused,key:identity(focused),start:focused?.selectionStart,end:focused?.selectionEnd,direction:focused?.selectionDirection,
  scroll,rootX:root.scrollLeft,rootY:root.scrollTop,windowX:win.scrollX,windowY:win.scrollY};
}
function restore(root,state){
 if(!root.isConnected)return;
 const nodes=new Map(),wanted=new Set([state.key,...state.scroll.map(position=>position.key)].filter(Boolean).map(key=>JSON.parse(key)[0]));
 for(const node of wanted.size?root.querySelectorAll('[data-plane-login]'):[]){
  if(!wanted.has(node.dataset.planeLogin))continue;
  const key=identity(node);if(!nodes.has(key))nodes.set(key,[]);nodes.get(key).push(node);
 }
 const current=state.doc.activeElement;
 // Never steal focus from a new overlay or a control outside this render target.
 if(state.key&&(current===state.active||current===state.doc.body||current===root||root.contains(current))){
  const candidates=(nodes.get(state.key)??[]).filter(field=>!field.closest('[hidden],[inert],[aria-hidden="true"],:disabled')&&field.getClientRects().length&&state.win.getComputedStyle(field).visibility!=='hidden');
  const field=candidates.length===1?candidates[0]:null;
  if(field){
   field.focus({preventScroll:true});
   if(typeof state.start==='number'&&typeof field.setSelectionRange==='function')try{field.setSelectionRange(state.start,state.end,state.direction??'none')}catch{}
  }
 }
 for(const position of state.scroll){const candidates=nodes.get(position.key)??[],node=candidates.length===1?candidates[0]:null;if(node){node.scrollLeft=position.x;node.scrollTop=position.y}}
 root.scrollLeft=state.rootX;root.scrollTop=state.rootY;
 if(state.win.scrollX!==state.windowX||state.win.scrollY!==state.windowY)state.win.scrollTo({left:state.windowX,top:state.windowY,behavior:'instant'});
}
export function updatePresentation(root,update){
 if(!root?.ownerDocument||typeof update!=='function')return Promise.reject(new TypeError('Render target and update required'));
 const run=async()=>{
  const state=snapshot(root),visibility=root.style.getPropertyValue('visibility'),priority=root.style.getPropertyPriority('visibility');
  root.style.setProperty('visibility','hidden','important');
  try{return await update()}
  finally{
   if(visibility)root.style.setProperty('visibility',visibility,priority);else root.style.removeProperty('visibility');
   restore(root,state);
  }
 };
 // Serialize updates of one target without locking independent applications.
 const result=(presentationUpdates.get(root)??Promise.resolve()).then(run,run);
 const tail=result.then(()=>undefined,()=>undefined);presentationUpdates.set(root,tail);
 void tail.then(()=>{if(presentationUpdates.get(root)===tail)presentationUpdates.delete(root)});
 return result;
}
