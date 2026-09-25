import { setLang as initialSetLang } from '../release/set-lang.js';
import { setData as initialSetData } from '../release/set-data.js';
import { setRender as initialSetRender } from '../release/set-render.js';
import { validatePLang, validateSetRender } from '../runtime/validator.js';
import { compileSetLang } from '../runtime/setlang-compiler.js';
import { renderPlaneCode } from '../runtime/web-renderer.js';

const clone=v=>structuredClone(v);
let project={SetLang:clone(initialSetLang),SetData:clone(initialSetData),SetRender:clone(initialSetRender)};
let selectedPath=['Data',0];
let dragPath=null;
const root=document.querySelector('#plane-code-root'),tree=document.querySelector('#tree'),inspector=document.querySelector('#inspector'),status=document.querySelector('#status');

function get(path){let v=project.SetLang;for(const k of path)v=v[k];return v}
function pathKey(path){return JSON.stringify(path)}
function parentInfo(path){if(path.length<2)return null;const index=path.at(-1);if(typeof index!=='number')return null;const arrayPath=path.slice(0,-1);return {array:get(arrayPath),index,arrayPath}}
function kind(path,node){const owner=path.at(-2);if(owner==='Layout')return node.Type==='Group'?'Group':'Container';if(owner==='SimplePanels')return 'SimplePanel';if(owner==='ActivePanels')return 'ActivePanel';if(path.length===2&&path[0]==='Data')return 'BasePanel';return node.Type??'Entity'}
function labelFor(path,node){const k=kind(path,node);return k==='Group'?'Group':node.Login??k}
function isAncestor(a,b){return a.length<b.length&&a.every((v,i)=>v===b[i])}

function addTreeNode(node,path,parentEl){
  const k=kind(path,node);const wrap=document.createElement('div');wrap.className=k==='Group'?'treeGroup':'';
  const row=document.createElement('div');row.className='treeNode'+(pathKey(path)===pathKey(selectedPath)?' selected':'');row.dataset.path=pathKey(path);row.innerHTML=`<span class="treeType">${k}</span><span>${labelFor(path,node)}</span>`;row.onclick=e=>{e.stopPropagation();selectedPath=path;renderAll()};
  if(k==='Group'||k==='Container'){row.draggable=true;row.ondragstart=e=>{dragPath=path;e.dataTransfer.effectAllowed='move'};row.ondragend=()=>{dragPath=null;document.querySelectorAll('.dragOver').forEach(x=>x.classList.remove('dragOver'))}}
  row.ondragover=e=>{if(!dragPath)return;e.preventDefault();row.classList.add('dragOver')};row.ondragleave=()=>row.classList.remove('dragOver');row.ondrop=e=>{e.preventDefault();e.stopPropagation();row.classList.remove('dragOver');handleDrop(path,k)};
  wrap.append(row);const children=document.createElement('div');children.className='treeChildren';let has=false;
  if(Array.isArray(node.Layout)){node.Layout.forEach((n,i)=>{has=true;addTreeNode(n,[...path,'Layout',i],children)})}
  if(Array.isArray(node.SimplePanels)){node.SimplePanels.forEach((n,i)=>{has=true;addTreeNode(n,[...path,'SimplePanels',i],children)})}
  if(Array.isArray(node.ActivePanels)){node.ActivePanels.forEach((n,i)=>{has=true;addTreeNode(n,[...path,'ActivePanels',i],children)})}
  if(has)wrap.append(children);parentEl.append(wrap)
}
function renderTree(){tree.replaceChildren();project.SetLang.Data.forEach((n,i)=>addTreeNode(n,['Data',i],tree))}

function removeAt(path){const info=parentInfo(path);if(!info)return null;return info.array.splice(info.index,1)[0]}
function handleDrop(targetPath,targetKind){
  if(!dragPath||pathKey(dragPath)===pathKey(targetPath)||isAncestor(dragPath,targetPath))return;
  const moved=removeAt(dragPath);if(!moved)return;
  if(targetKind==='Group'||targetKind.endsWith('Panel')){const target=getAfterRemoval(targetPath,dragPath);target.Layout??=[];target.Layout.push(moved);selectedPath=findPathToNode(moved)??targetPath}else{
    const target=getAfterRemoval(targetPath,dragPath);const p=findPathToNode(target);const info=parentInfo(p);info.array.splice(info.index,0,moved);selectedPath=[...info.arrayPath,info.index]
  }
  renderAll()
}
function getAfterRemoval(original,removed){let p=[...original];for(let i=0;i<p.length;i++){if(typeof p[i]==='number'&&i<removed.length&&p.slice(0,i).every((v,j)=>v===removed[j])&&removed[i]===p[i]&&pathKey(original)!==pathKey(removed)){} }return get(p)}
function findPathToNode(needle){let found=null;const walk=(node,path)=>{if(node===needle){found=path;return}for(const key of ['Layout','SimplePanels','ActivePanels'])for(let i=0;i<(node[key]??[]).length&&!found;i++)walk(node[key][i],[...path,key,i])};project.SetLang.Data.forEach((n,i)=>{if(!found)walk(n,['Data',i])});return found}

function field(label,value,type,onchange,options){const row=document.createElement('label');row.className='field';const name=document.createElement('span');name.textContent=label;let input;if(type==='select'){input=document.createElement('select');for(const o of options){const op=document.createElement('option');op.value=o;op.textContent=o;input.append(op)}input.value=value??options[0]}else{input=document.createElement('input');input.type=type;if(type==='checkbox')input.checked=!!value;else input.value=value??''}input.oninput=()=>onchange(type==='checkbox'?input.checked:type==='number'?(input.value===''?undefined:Number(input.value)):input.value);row.append(name,input);return row}
function prop(node,key,value){node.Properties??={};if(value===undefined||value==='')delete node.Properties[key];else node.Properties[key]=value;renderPreview();renderTree()}
function section(text){const d=document.createElement('div');d.className='sectionTitle';d.textContent=text;return d}
function renderInspector(){
  inspector.replaceChildren();let node;try{node=get(selectedPath)}catch{return}const k=kind(selectedPath,node);inspector.append(section(k));
  if(k!=='Group') inspector.append(field('Login',node.Login,'text',v=>{node.Login=v;renderAll()}));
  const p=node.Properties??(node.Properties={});
  if(k==='Group'){
    inspector.append(field('Orientation',p.Orientation,'select',v=>prop(node,'Orientation',v),['Horizontal','Vertical']));
    inspector.append(field('Fill horizontal',p.FillHorizontal,'checkbox',v=>prop(node,'FillHorizontal',v)));
    inspector.append(field('Fill vertical',p.FillVertical,'checkbox',v=>prop(node,'FillVertical',v)));
    for(const x of ['Width','Height','Gap'])inspector.append(field(x,p[x],'number',v=>prop(node,x,v)));
  }else if(k==='Container'){
    inspector.append(field('Fill horizontal',p.FillHorizontal,'checkbox',v=>prop(node,'FillHorizontal',v)));
    inspector.append(field('Fill vertical',p.FillVertical,'checkbox',v=>prop(node,'FillVertical',v)));
    for(const x of ['Width','Height','Gap'])inspector.append(field(x,p[x],'number',v=>prop(node,x,v)));
    inspector.append(field('Horizontal align',p.HorizontalAlignment??'Center','select',v=>prop(node,'HorizontalAlignment',v),['Left','Center','Right']));
    inspector.append(field('Vertical align',p.VerticalAlignment??'Center','select',v=>prop(node,'VerticalAlignment',v),['Top','Center','Bottom']));
    inspector.append(field('Content direction',p.Direction??'Horizontal','select',v=>prop(node,'Direction',v),['Horizontal','Vertical']));
    inspector.append(field('Order',p.Order??'Positive','select',v=>prop(node,'Order',v),['Positive','Negative']));
    for(const x of ['TextColor','PictureTint'])inspector.append(field(x,p[x],'text',v=>prop(node,x,v)));
    for(const x of ['FontSize','FontWeight'])inspector.append(field(x,p[x],'number',v=>prop(node,x,v)));
    inspector.append(section('SetData'));const d=project.SetData.Data[node.Login]??(project.SetData.Data[node.Login]={});inspector.append(field('SourceText',d.SourceText,'text',v=>{if(v)d.SourceText=v;else delete d.SourceText;renderPreview()}));inspector.append(field('SourcePicture',d.SourcePicture,'text',v=>{if(v)d.SourcePicture=v;else delete d.SourcePicture;renderPreview()}));
  }else{
    inspector.append(field('Direction',p.Direction??'Vertical','select',v=>prop(node,'Direction',v),['Horizontal','Vertical']));
    for(const x of ['Width','Height','Padding','Gap','PanelTransparency','Shadow'])inspector.append(field(x,p[x],'number',v=>prop(node,x,v)));
  }
  const hint=document.createElement('p');hint.className='hint';hint.textContent='Drag Group/Container in the tree to reorder or reparent. Drop on Group or Panel to append inside its Layout.';inspector.append(hint)
}
function previewData(){const d=clone(project.SetData.Data);for(const v of Object.values(d))if(typeof v.SourcePicture==='string'&&v.SourcePicture.startsWith('./assets/'))v.SourcePicture='.'+v.SourcePicture;return d}
function renderPreview(){
  try{validatePLang(project.SetLang.Data,project.SetData.Data);validateSetRender(project.SetRender.Data);const plan=compileSetLang(project.SetLang.Data);renderPlaneCode(root,plan,previewData(),project.SetRender.Data);root.classList.toggle('showGroups',document.querySelector('#outlineGroups').checked);status.textContent='valid';status.style.color='#61d69b'}catch(e){status.textContent='invalid';status.style.color='#ff7b72';root.replaceChildren();const pre=document.createElement('pre');pre.textContent=e.message;pre.style.padding='16px';pre.style.whiteSpace='pre-wrap';root.append(pre)}
}
function renderAll(){renderTree();renderInspector();renderPreview()}
function selectedLayoutTarget(){const node=get(selectedPath),k=kind(selectedPath,node);if(k==='Group'||k.endsWith('Panel'))return node;const info=parentInfo(selectedPath);if(info&&selectedPath.at(-2)==='Layout')return get(info.arrayPath.slice(0,-1));return null}
function addNode(node){const target=selectedLayoutTarget();if(!target)return;target.Layout??=[];target.Layout.push(node);selectedPath=findPathToNode(node)??selectedPath;renderAll()}

document.querySelector('#addGroup').onclick=()=>addNode({Type:'Group',Properties:{Orientation:'Horizontal',FillHorizontal:false,FillVertical:false,Gap:8},Layout:[]});
document.querySelector('#addContainer').onclick=()=>{let n=1,login;do login=`Container ${n++}`;while(project.SetData.Data[login]);project.SetData.Data[login]={SourceText:login};addNode({Login:login,Properties:{FillHorizontal:false,FillVertical:false}})};
document.querySelector('#removeNode').onclick=()=>{const k=kind(selectedPath,get(selectedPath));if(k!=='Group'&&k!=='Container')return;const removed=removeAt(selectedPath);if(removed?.Login)delete project.SetData.Data[removed.Login];selectedPath=['Data',0];renderAll()};
function move(delta){const i=parentInfo(selectedPath);if(!i)return;const n=i.index+delta;if(n<0||n>=i.array.length)return;[i.array[i.index],i.array[n]]=[i.array[n],i.array[i.index]];selectedPath=[...i.arrayPath,n];renderAll()}
document.querySelector('#moveUp').onclick=()=>move(-1);document.querySelector('#moveDown').onclick=()=>move(1);
document.querySelector('#outlineGroups').onchange=()=>renderPreview();
document.querySelector('#copySetLang').onclick=async()=>{await navigator.clipboard.writeText(JSON.stringify(project.SetLang,null,2));status.textContent='copied'};
document.querySelector('#exportProject').onclick=()=>{const blob=new Blob([JSON.stringify(project,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='planecode-project.json';a.click();URL.revokeObjectURL(a.href)};
document.querySelector('#importProject').onchange=async e=>{const f=e.target.files?.[0];if(!f)return;project=JSON.parse(await f.text());selectedPath=['Data',0];renderAll()};
root.addEventListener('click',e=>{const el=e.target.closest('[data-plane-login]');if(!el)return;const login=el.dataset.planeLogin;const find=(node,path)=>{if(node.Login===login)return path;for(const key of ['Layout','SimplePanels','ActivePanels'])for(let i=0;i<(node[key]??[]).length;i++){const p=find(node[key][i],[...path,key,i]);if(p)return p}};for(let i=0;i<project.SetLang.Data.length;i++){const p=find(project.SetLang.Data[i],['Data',i]);if(p){selectedPath=p;renderTree();renderInspector();break}}});
renderAll();
