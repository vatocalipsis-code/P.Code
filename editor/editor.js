import { setLang as initialSetLang } from '../release/set-lang.js';
import { setData as initialSetData } from '../release/set-data.js';
import { setRender as initialSetRender } from '../release/set-render.js';
import { validatePLang, validateSetRender } from '../runtime/validator.js';
import { compileSetLang } from '../runtime/setlang-compiler.js';
import { renderPlaneCode } from '../runtime/web-renderer.js';

const clone=v=>structuredClone(v);
const root=document.querySelector('#plane-code-root');
const tree=document.querySelector('#tree');
const inspector=document.querySelector('#inspector');
const status=document.querySelector('#status');
let project={SetLang:clone(initialSetLang),SetData:clone(initialSetData),SetRender:clone(initialSetRender)};
const originalData=JSON.stringify(project.SetData);
let selectedPath=['Data',0];

function get(path){let v=project.SetLang;for(const k of path)v=v[k];return v}
function key(path){return JSON.stringify(path)}
function kind(path,node){const owner=path.at(-2);if(owner==='Layout')return node.Type==='Group'?'Group':node.Type==='EditableInput'?'EditableInput':'Container';if(owner==='SimplePanels')return 'SimplePanel';if(owner==='ActivePanels')return 'ActivePanel';if(path.length===2&&path[0]==='Data')return 'BasePanel';return node.Type??'Entity'}
function section(text){const d=document.createElement('div');d.className='sectionTitle';d.textContent=text;return d}
function field(label,value,type,onchange,options=[]){const row=document.createElement('label');row.className='field';const name=document.createElement('span');name.textContent=label;let input;if(type==='select'){input=document.createElement('select');for(const o of options){const op=document.createElement('option');op.value=o;op.textContent=o;input.append(op)}input.value=value??options[0]}else{input=document.createElement('input');input.type=type;input.value=value??'';if(type==='number')input.step='any'}input.oninput=()=>onchange(type==='number'?(input.value===''?undefined:Number(input.value)):input.value);row.append(name,input);return row}
function prop(node,k,v){node.Properties??={};if(v===undefined||v==='')delete node.Properties[k];else node.Properties[k]=v;renderAll()}
function renderTreeNode(node,path,parent){const row=document.createElement('button');row.className='treeNode'+(key(path)===key(selectedPath)?' selected':'');row.type='button';const k=kind(path,node);row.innerHTML='<span class="treeType">'+k+'</span><span>'+(node.Login??'Group')+'</span>';row.onclick=()=>{selectedPath=path;renderAll()};parent.append(row);const kids=document.createElement('div');kids.className='treeChildren';for(const collection of ['Layout','SimplePanels','ActivePanels'])for(let i=0;i<(node[collection]??[]).length;i++)renderTreeNode(node[collection][i],[...path,collection,i],kids);if(kids.childElementCount)parent.append(kids)}
function renderTree(){tree.replaceChildren();project.SetLang.Data.forEach((n,i)=>renderTreeNode(n,['Data',i],tree))}
function colorFields(node){for(const p of ['Background','BorderColor','TextColor','PictureTint'])inspector.append(field(p,node.Properties?.[p],'color',v=>prop(node,p,v)))}
function numericFields(node,names){for(const p of names)inspector.append(field(p,node.Properties?.[p],'number',v=>prop(node,p,v)))}
function renderInspector(){
 inspector.replaceChildren();const node=get(selectedPath);const k=kind(selectedPath,node);inspector.append(section(k+(node.Login?' · '+node.Login:'')));
 if(k==='Group'){const note=document.createElement('p');note.className='hint';note.textContent='Group is structural. Theme/Skin Editor does not change structure or Group semantics.';inspector.append(note);return}
 colorFields(node);
 numericFields(node,['BorderWidth','BorderLeftWidth','BorderRightWidth','BorderTopWidth','BorderBottomWidth','FontSize','FontWeight','Width','Height','Padding','Gap','Parallax']);
 if(k==='SimplePanel'||k==='ActivePanel'||k==='AggregateActivePanel')numericFields(node,['PanelTransparency','Shadow']);
 const note=document.createElement('p');note.className='hint';note.textContent='Only existing SetLang visual properties are edited. Login, hierarchy, layout structure and SetData stay untouched.';inspector.append(note)
}
function sceneField(label,keyName,type='text'){inspector.append(field(label,project.SetRender.Data[keyName],type,v=>{if(v===undefined||v==='')delete project.SetRender.Data[keyName];else project.SetRender.Data[keyName]=v;renderPreview()}))}
function renderSceneInspector(){inspector.replaceChildren();inspector.append(section('SetRender · scene'));for(const p of ['BackgroundColor','PanelColor','BorderColor','TextColor'])sceneField(p,p,'color');for(const p of ['PanelSpacing','Transparency','TextTransparency','PictureTransparency','Parallax'])sceneField(p,p,'number');const note=document.createElement('p');note.className='hint';note.textContent='SetRender remains scene/global only. No object addressing is introduced.';inspector.append(note)}
function previewData(){const d=clone(project.SetData.Data);for(const v of Object.values(d))if(typeof v.SourcePicture==='string'&&v.SourcePicture.startsWith('./assets/'))v.SourcePicture='.'+v.SourcePicture;return d}
function renderPreview(){try{validatePLang(project.SetLang.Data,project.SetData.Data,['pcode.editable-input.v1']);validateSetRender(project.SetRender.Data);if(JSON.stringify(project.SetData)!==originalData)throw new Error('Theme editor invariant: SetData changed');const plan=compileSetLang(project.SetLang.Data,['pcode.editable-input.v1']);renderPlaneCode(root,plan,previewData(),project.SetRender.Data);status.textContent='valid · SetData unchanged';status.className='ok'}catch(e){status.textContent=e.message;status.className='bad'}}
function renderAll(){renderTree();if(document.querySelector('#sceneMode').checked)renderSceneInspector();else renderInspector();renderPreview()}
function download(name,value){const blob=new Blob([JSON.stringify(value,null,2)+'\n'],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();URL.revokeObjectURL(a.href)}
document.querySelector('#sceneMode').onchange=renderAll;
document.querySelector('#exportSkin').onclick=()=>download('pcode-skin.json',{SetLang:project.SetLang,SetRender:project.SetRender});
document.querySelector('#exportProject').onclick=()=>download('pcode-themed-project.json',project);
document.querySelector('#resetSkin').onclick=()=>{project={SetLang:clone(initialSetLang),SetData:clone(initialSetData),SetRender:clone(initialSetRender)};selectedPath=['Data',0];renderAll()};
document.querySelector('#importSkin').onchange=async e=>{const f=e.target.files?.[0];if(!f)return;const skin=JSON.parse(await f.text());if(!skin.SetLang||!skin.SetRender)throw new Error('Skin must contain SetLang and SetRender');project.SetLang=skin.SetLang;project.SetRender=skin.SetRender;selectedPath=['Data',0];renderAll()};
root.addEventListener('click',e=>{const el=e.target.closest('[data-plane-login]');if(!el)return;const login=el.dataset.planeLogin;const walk=(node,path)=>{if(node.Login===login)return path;for(const c of ['Layout','SimplePanels','ActivePanels'])for(let i=0;i<(node[c]??[]).length;i++){const p=walk(node[c][i],[...path,c,i]);if(p)return p}};for(let i=0;i<project.SetLang.Data.length;i++){const p=walk(project.SetLang.Data[i],['Data',i]);if(p){selectedPath=p;document.querySelector('#sceneMode').checked=false;renderAll();break}}});
renderAll();
