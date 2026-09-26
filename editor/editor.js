
import { setLang as initialSetLang } from '../release/set-lang.js';
import { setData as initialSetData } from '../release/set-data.js';
import { setRender as initialSetRender } from '../release/set-render.js';
import { validatePLang, validateSetRender } from '../runtime/validator.js';
import { compileSetLang } from '../runtime/setlang-compiler.js';
import { renderPlaneCode } from '../runtime/web-renderer.js';
import { parseSPL, serializeSPL } from './spl.js';
import { sliderSpecFor } from './control-specs.js';

const CAPABILITIES=['pcode.editable-input.v1'];
const clone=value=>structuredClone(value);
const $=selector=>document.querySelector(selector);
const root=$('#plane-code-root');
const tree=$('#tree');
const inspector=$('#inspector');
const status=$('#status');
const sourceName=$('#sourceName');
const sceneMode=$('#sceneMode');
const selectionBox=$('#selectionBox');
const resizeHandle=$('#resizeHandle');

let project={SetLang:clone(initialSetLang),SetData:clone(initialSetData),SetRender:clone(initialSetRender)};
let baseline=clone(project);
let dataInvariant=JSON.stringify(project.SetData);
let selectedPath=['Data',0];
let openedName='P.Code release';
let resizeState=null;

const COLLECTIONS=['Layout','Containers','SimplePanels','ActivePanels'];

function setStatus(message,ok=true){
  status.textContent=message;
  status.className=ok?'ok':'bad';
}
function pathKey(path){return JSON.stringify(path)}
function get(path){let value=project.SetLang;for(const part of path)value=value[part];return value}
function selectedNode(){try{return get(selectedPath)}catch{return null}}

function kind(path,node){
  const owner=path.at(-2);
  if(owner==='Layout') return node.Type==='Group'?'Group':node.Type==='EditableInput'?'EditableInput':'Container';
  if(owner==='Containers') return 'Container';
  if(owner==='SimplePanels') return 'SimplePanel';
  if(owner==='ActivePanels') return 'ActivePanel';
  if(owner==='AggregateActivePanels') return 'AggregateActivePanel';
  if(path.length===2&&path[0]==='Data') return 'BasePanel';
  return node.Type??'Entity';
}

function childCollections(node,path){
  const result=[];
  const aggregates=node.Properties?.AggregateActivePanels;
  if(Array.isArray(aggregates)) result.push({name:'AggregateActivePanels',array:aggregates,path:[...path,'Properties','AggregateActivePanels']});
  for(const name of COLLECTIONS){
    if(Array.isArray(node[name])) result.push({name,array:node[name],path:[...path,name]});
  }
  return result;
}

function walkNodes(visitor){
  const walk=(node,path)=>{
    if(visitor(node,path)===false)return false;
    for(const group of childCollections(node,path)){
      for(let i=0;i<group.array.length;i++) if(walk(group.array[i],[...group.path,i])===false)return false;
    }
  };
  for(let i=0;i<project.SetLang.Data.length;i++) if(walk(project.SetLang.Data[i],['Data',i])===false)return;
}

function findPathByLogin(login){
  let found=null;
  walkNodes((node,path)=>{if(node.Login===login){found=path;return false}});
  return found;
}

function section(title){
  const el=document.createElement('div');
  el.className='sectionTitle';
  el.textContent=title;
  return el;
}
function note(text){
  const el=document.createElement('p');
  el.className='hint';
  el.textContent=text;
  return el;
}
function row(label){
  const el=document.createElement('label');
  el.className='field';
  const name=document.createElement('span');
  name.textContent=label;
  const control=document.createElement('div');
  control.className='fieldControl';
  el.append(name,control);
  return {el,control};
}
function clearButton(onClear){
  const b=document.createElement('button');
  b.type='button';
  b.className='clearButton';
  b.title='Use inherited/default value';
  b.textContent='×';
  b.onclick=onClear;
  return b;
}
function setProp(node,key,value){
  node.Properties??={};
  if(value===undefined||value==='') delete node.Properties[key];
  else node.Properties[key]=value;
  renderAll();
}
function setPropLive(node,key,value){
  node.Properties??={};
  if(value===undefined||value==='') delete node.Properties[key];
  else node.Properties[key]=value;
  renderPreview();
}
function numberField(node,key,label=key){
  const {el,control}=row(label);
  const wrap=document.createElement('div');wrap.className='numericControl';
  const slider=document.createElement('input');slider.type='range';slider.className='rangeInput';
  const input=document.createElement('input');input.type='number';input.className='numberInput';
  const current=node.Properties?.[key];
  const spec=sliderSpecFor(key,current);
  slider.min=String(spec.min);slider.max=String(spec.max);slider.step=String(spec.step);
  slider.value=String(current??Math.max(spec.min,Math.min(spec.max,0)));
  input.step=String(spec.step);input.value=current??'';
  const apply=value=>{
    node.Properties??={};
    node.Properties[key]=value;
    slider.value=String(value);input.value=String(value);
    renderPreview();
  };
  slider.oninput=()=>apply(Number(slider.value));
  input.oninput=()=>{
    if(input.value==='')return;
    const value=Number(input.value);if(!Number.isFinite(value))return;
    const live=sliderSpecFor(key,value);slider.min=String(live.min);slider.max=String(live.max);slider.value=String(value);
    node.Properties??={};node.Properties[key]=value;renderPreview();
  };
  input.onchange=()=>{if(input.value==='')setProp(node,key,undefined);else renderAll()};
  const clear=clearButton(()=>setProp(node,key,undefined));
  wrap.append(slider,input);
  control.append(wrap,clear);
  inspector.append(el);
}
function textField(node,key,label=key){
  const {el,control}=row(label);
  const input=document.createElement('input');
  input.type='text'; input.value=node.Properties?.[key]??'';
  input.onchange=()=>setProp(node,key,input.value||undefined);
  control.append(input,clearButton(()=>setProp(node,key,undefined)));
  inspector.append(el);
}
function colorField(node,key,label=key){
  const {el,control}=row(label);
  const text=document.createElement('input');
  text.type='text'; text.className='colorText'; text.value=node.Properties?.[key]??'';
  const picker=document.createElement('input');
  picker.type='color'; picker.className='colorPicker';
  const candidate=String(node.Properties?.[key]??'');
  picker.value=/^#[0-9a-f]{6}$/i.test(candidate)?candidate:'#000000';
  picker.oninput=()=>{text.value=picker.value;setProp(node,key,picker.value)};
  text.onchange=()=>setProp(node,key,text.value||undefined);
  control.append(picker,text,clearButton(()=>setProp(node,key,undefined)));
  inspector.append(el);
}
function selectField(node,key,options,label=key){
  const {el,control}=row(label);
  const select=document.createElement('select');
  const blank=document.createElement('option'); blank.value=''; blank.textContent='— default / inherit —'; select.append(blank);
  for(const option of options){const op=document.createElement('option');op.value=option;op.textContent=option;select.append(op)}
  select.value=node.Properties?.[key]??'';
  select.onchange=()=>setProp(node,key,select.value||undefined);
  control.append(select,clearButton(()=>setProp(node,key,undefined)));
  inspector.append(el);
}
function booleanField(node,key,label=key){
  selectField(node,key,['true','false'],label);
  const select=inspector.lastElementChild.querySelector('select');
  const raw=node.Properties?.[key];
  select.value=raw===undefined?'':String(raw);
  select.onchange=()=>setProp(node,key,select.value===''?undefined:select.value==='true');
}
function sceneNumber(key,label=key){
  const {el,control}=row(label);
  const wrap=document.createElement('div');wrap.className='numericControl';
  const slider=document.createElement('input');slider.type='range';slider.className='rangeInput';
  const input=document.createElement('input');input.type='number';input.className='numberInput';
  const current=project.SetRender.Data[key];
  const spec=sliderSpecFor(key,current);
  slider.min=String(spec.min);slider.max=String(spec.max);slider.step=String(spec.step);
  slider.value=String(current??Math.max(spec.min,Math.min(spec.max,0)));
  input.step=String(spec.step);input.value=current??'';
  const apply=value=>{project.SetRender.Data[key]=value;slider.value=String(value);input.value=String(value);renderPreview()};
  slider.oninput=()=>apply(Number(slider.value));
  input.oninput=()=>{
    if(input.value==='')return;
    const value=Number(input.value);if(!Number.isFinite(value))return;
    const live=sliderSpecFor(key,value);slider.min=String(live.min);slider.max=String(live.max);slider.value=String(value);
    project.SetRender.Data[key]=value;renderPreview();
  };
  input.onchange=()=>{if(input.value===''){delete project.SetRender.Data[key];renderPreview()}};
  wrap.append(slider,input);control.append(wrap);inspector.append(el);
}
function sceneColor(key,label=key){
  const {el,control}=row(label);
  const text=document.createElement('input'); text.type='text'; text.className='colorText'; text.value=project.SetRender.Data[key]??'';
  const picker=document.createElement('input'); picker.type='color'; picker.className='colorPicker';
  const candidate=String(project.SetRender.Data[key]??'');
  picker.value=/^#[0-9a-f]{6}$/i.test(candidate)?candidate:'#000000';
  picker.oninput=()=>{text.value=picker.value;project.SetRender.Data[key]=picker.value;renderPreview()};
  text.onchange=()=>{project.SetRender.Data[key]=text.value;renderPreview()};
  control.append(picker,text); inspector.append(el);
}

function renderTreeNode(node,path,parent){
  const wrap=document.createElement('div');
  const button=document.createElement('button');
  button.type='button';
  button.className='treeNode'+(pathKey(path)===pathKey(selectedPath)?' selected':'');
  const k=kind(path,node);
  const type=document.createElement('span'); type.className='treeType'; type.textContent=k;
  const label=document.createElement('span'); label.textContent=node.Login??'Group';
  button.append(type,label);
  button.onclick=()=>{selectedPath=path;sceneMode.checked=false;renderAll()};
  wrap.append(button);

  const children=document.createElement('div');
  children.className='treeChildren';
  for(const group of childCollections(node,path)){
    for(let i=0;i<group.array.length;i++) renderTreeNode(group.array[i],[...group.path,i],children);
  }
  if(children.childElementCount)wrap.append(children);
  parent.append(wrap);
}
function renderTree(){
  tree.replaceChildren();
  project.SetLang.Data.forEach((node,i)=>renderTreeNode(node,['Data',i],tree));
}

function orderControls(){
  const index=selectedPath.at(-1);
  if(typeof index!=='number'||selectedPath.length<2)return;
  const arrayPath=selectedPath.slice(0,-1);
  let arr=project.SetLang;
  for(const part of arrayPath)arr=arr[part];
  if(!Array.isArray(arr)||arr.length<2)return;
  const bar=document.createElement('div');bar.className='orderBar';
  const earlier=document.createElement('button');earlier.type='button';earlier.textContent='↑ Earlier';
  const later=document.createElement('button');later.type='button';later.textContent='↓ Later';
  earlier.disabled=index===0; later.disabled=index===arr.length-1;
  const move=delta=>{const next=index+delta;if(next<0||next>=arr.length)return;[arr[index],arr[next]]=[arr[next],arr[index]];selectedPath=[...arrayPath,next];renderAll()};
  earlier.onclick=()=>move(-1);later.onclick=()=>move(1);
  bar.append(earlier,later);
  inspector.append(section('Layout order'),bar,note('Order is changed only inside the current canonical collection. No reparenting or invented X/Y coordinates.'));
}

function commonVisual(node){
  inspector.append(section('Surface & color'));
  for(const key of ['Background','BorderColor','BorderLeftColor','BorderRightColor','BorderTopColor','BorderBottomColor','TextColor','PictureTint']) colorField(node,key);
  inspector.append(section('Border & size'));
  for(const key of ['BorderWidth','BorderLeftWidth','BorderRightWidth','BorderTopWidth','BorderBottomWidth','Width','Height','Padding','Gap']) numberField(node,key);
  inspector.append(section('Typography & motion'));
  for(const key of ['FontSize','FontWeight','Parallax']) numberField(node,key);
}

function renderGroupInspector(node){
  inspector.append(section('Group layout'));
  selectField(node,'Orientation',['Horizontal','Vertical']);
  numberField(node,'Width'); numberField(node,'Height'); numberField(node,'Gap');
  booleanField(node,'FillHorizontal','Fill horizontal');
  booleanField(node,'FillVertical','Fill vertical');
  orderControls();
  inspector.append(note('Group is an invisible PLang layout node. It has no color, Login, data slot, or absolute position.'));
}

function renderContainerLayout(node){
  inspector.append(section('Container layout'));
  booleanField(node,'FillHorizontal','Fill horizontal');
  booleanField(node,'FillVertical','Fill vertical');
  selectField(node,'HorizontalAlignment',['Left','Center','Right'],'Horizontal content');
  selectField(node,'VerticalAlignment',['Top','Center','Bottom'],'Vertical content');
  selectField(node,'Direction',['Horizontal','Vertical'],'Content direction');
  selectField(node,'Order',['Positive','Negative'],'Picture / text order');
}

function renderPanelLayout(node){
  inspector.append(section('Panel layout'));
  selectField(node,'Alignment',['Start','Center','End','Stretch']);
  selectField(node,'Distribution',['Start','Center','End','Between','Around','Evenly']);
  selectField(node,'Direction',['Horizontal','Vertical']);
}

function renderInspector(){
  inspector.replaceChildren();
  const node=selectedNode();
  if(!node){inspector.append(note('Select a layer.'));return}
  const k=kind(selectedPath,node);
  inspector.append(section(`${k}${node.Login?' · '+node.Login:''}`));

  if(k==='Group'){renderGroupInspector(node);return}

  commonVisual(node);
  if(k==='Container')renderContainerLayout(node);
  if(k==='EditableInput'){
    inspector.append(section('Editable input layout'));
    booleanField(node,'FillHorizontal','Fill horizontal');
    booleanField(node,'FillVertical','Fill vertical');
  }
  if(['BasePanel','SimplePanel','ActivePanel','AggregateActivePanel'].includes(k))renderPanelLayout(node);
  if(['SimplePanel','ActivePanel','AggregateActivePanel'].includes(k)){
    inspector.append(section('Panel effects'));
    numberField(node,'PanelTransparency','Panel transparency');
    numberField(node,'Shadow');
  }
  orderControls();
  inspector.append(note('Numeric visual properties use live sliders plus precise numeric input. Font family/resource selection is not shown because Container.Font grammar and embedded SPL resources are NOT YET SPECIFIED.'));
}

function renderSceneInspector(){
  inspector.replaceChildren();
  inspector.append(section('Scene · SetRender'));
  for(const key of ['BackgroundColor','PanelColor','BorderColor','TextColor'])sceneColor(key);
  for(const key of ['PanelSpacing','Transparency','TextTransparency','PictureTransparency','Parallax'])sceneNumber(key);
  inspector.append(note('SetRender remains scene-global. It never addresses or styles an individual PLang object.'));
}

function previewData(){
  const data=clone(project.SetData.Data);
  for(const item of Object.values(data)){
    if(typeof item.SourcePicture==='string'&&item.SourcePicture.startsWith('./assets/')) item.SourcePicture='.'+item.SourcePicture;
  }
  return data;
}

function selectRenderedElement(){
  root.querySelectorAll('.pc-editor-selected').forEach(el=>el.classList.remove('pc-editor-selected'));
  selectionBox.hidden=true;
  const node=selectedNode();
  if(!node?.Login)return;
  const el=[...root.querySelectorAll('[data-plane-login]')].find(item=>item.dataset.planeLogin===node.Login);
  if(!el)return;
  el.classList.add('pc-editor-selected');
  const surface=$('.previewSurface');
  const er=el.getBoundingClientRect(), sr=surface.getBoundingClientRect();
  selectionBox.style.left=`${er.left-sr.left}px`;
  selectionBox.style.top=`${er.top-sr.top}px`;
  selectionBox.style.width=`${er.width}px`;
  selectionBox.style.height=`${er.height}px`;
  selectionBox.hidden=false;
}

function renderPreview(){
  try{
    validatePLang(project.SetLang.Data,project.SetData.Data,CAPABILITIES);
    validateSetRender(project.SetRender.Data);
    if(JSON.stringify(project.SetData)!==dataInvariant)throw new Error('SetData changed inside Theme/Skin Editor');
    const plan=compileSetLang(project.SetLang.Data,CAPABILITIES);
    renderPlaneCode(root,plan,previewData(),project.SetRender.Data);
    setStatus('valid · SetData unchanged',true);
    requestAnimationFrame(selectRenderedElement);
  }catch(error){
    root.replaceChildren();
    const pre=document.createElement('pre');pre.className='previewError';pre.textContent=error.message;root.append(pre);
    selectionBox.hidden=true;
    setStatus(error.message,false);
  }
}
function renderAll(){renderTree();sceneMode.checked?renderSceneInspector():renderInspector();renderPreview()}

function setProject(next,name){
  project=clone(next);
  baseline=clone(project);
  dataInvariant=JSON.stringify(project.SetData);
  selectedPath=['Data',0];
  openedName=name;
  sourceName.textContent=name;
  sceneMode.checked=false;
  renderAll();
}

function download(name,text,type='text/plain'){
  const blob=new Blob([text],{type});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);a.download=name;a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),0);
}
function safeStem(name){
  return (name||'pcode').replace(/\.[^.]+$/,'').replace(/[^A-Za-z0-9._-]+/g,'-')||'pcode';
}

$('#openSpl').onchange=async event=>{
  const file=event.target.files?.[0]; if(!file)return;
  try{
    const parsed=parseSPL(await file.text());
    validatePLang(parsed.SetLang.Data,parsed.SetData.Data,CAPABILITIES);
    validateSetRender(parsed.SetRender.Data);
    setProject(parsed,file.name);
  }catch(error){setStatus(error.message,false)}
  event.target.value='';
};
$('#importSkin').onchange=async event=>{
  const file=event.target.files?.[0];if(!file)return;
  try{
    const skin=JSON.parse(await file.text());
    if(!skin.SetLang||!skin.SetRender)throw new Error('Skin must contain SetLang and SetRender');
    project.SetLang=clone(skin.SetLang);project.SetRender=clone(skin.SetRender);selectedPath=['Data',0];renderAll();
  }catch(error){setStatus(error.message,false)}
  event.target.value='';
};
$('#saveSpl').onclick=()=>download(`${safeStem(openedName)}-themed.SPL`,serializeSPL(project),'text/plain');
$('#exportSkin').onclick=()=>download(`${safeStem(openedName)}-skin.json`,JSON.stringify({SetLang:project.SetLang,SetRender:project.SetRender},null,2)+'\n','application/json');
$('#resetSkin').onclick=()=>{project=clone(baseline);dataInvariant=JSON.stringify(project.SetData);selectedPath=['Data',0];renderAll()};
sceneMode.onchange=()=>{sceneMode.checked?renderSceneInspector():renderInspector();};

root.addEventListener('click',event=>{
  const el=event.target.closest('[data-plane-login]');
  if(!el)return;
  const path=findPathByLogin(el.dataset.planeLogin);
  if(!path)return;
  event.preventDefault();event.stopPropagation();
  selectedPath=path;sceneMode.checked=false;renderAll();
},true);

resizeHandle.addEventListener('pointerdown',event=>{
  const node=selectedNode();if(!node||kind(selectedPath,node)==='Group')return;
  const selected=root.querySelector('.pc-editor-selected');if(!selected)return;
  const rect=selected.getBoundingClientRect();
  resizeState={node,startX:event.clientX,startY:event.clientY,startW:rect.width,startH:rect.height,width:rect.width,height:rect.height,selected};
  resizeHandle.setPointerCapture?.(event.pointerId);
  event.preventDefault();
});
resizeHandle.addEventListener('pointermove',event=>{
  if(!resizeState)return;
  resizeState.width=Math.max(0,resizeState.startW+(event.clientX-resizeState.startX));
  resizeState.height=Math.max(0,resizeState.startH+(event.clientY-resizeState.startY));
  resizeState.selected.style.width=`${resizeState.width}px`;
  resizeState.selected.style.height=`${resizeState.height}px`;
  selectRenderedElement();
});
const finishResize=()=>{
  if(!resizeState)return;
  resizeState.node.Properties??={};
  resizeState.node.Properties.Width=Math.round(resizeState.width);
  resizeState.node.Properties.Height=Math.round(resizeState.height);
  resizeState=null;renderAll();
};
resizeHandle.addEventListener('pointerup',finishResize);
resizeHandle.addEventListener('pointercancel',()=>{resizeState=null;renderPreview()});

window.addEventListener('resize',()=>requestAnimationFrame(selectRenderedElement));
sourceName.textContent=openedName;
renderAll();
