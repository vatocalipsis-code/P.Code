/** Generic Picot controller for an installed visual style catalog. */
const boot=typeof document==='undefined'?null:document.querySelector('script[data-picot-boot]');
const config={
  catalogUrl:boot?.dataset.catalogUrl??'/skins/catalog.json',
  storageKey:boot?.dataset.styleStorageKey??'picot.visualStyle',
  defaultSkin:boot?.dataset.defaultSkin,
  rootSelector:boot?.dataset.rootSelector??'[data-picot-root]',
  styleAttribute:boot?.dataset.styleAttribute??'data-picot-skin',
  uiBase:boot?.dataset.uiBase??'Standard'
};
export const VISUAL_STYLES=Object.create(null);
let switchController=null;
const styleName=/^[A-Z][A-Za-z0-9]*$/;
const defaultVisualStyle=()=>Object.hasOwn(VISUAL_STYLES,config.defaultSkin)?config.defaultSkin:Object.keys(VISUAL_STYLES)[0];
const documentRoot=()=>globalThis.document?.documentElement;
const skinRoot=()=>globalThis.document?.querySelector(config.rootSelector);
export async function loadVisualStyleCatalog(){
  const response=await fetch(config.catalogUrl,{cache:'no-store'});
  if(!response.ok)throw new Error('Не удалось загрузить каталог шкурок');
  const entries=await response.json();
  if(!Array.isArray(entries)||!entries.length)throw new Error('Каталог шкурок пуст');
  const next=Object.create(null);
  for(const entry of entries){
    if(!entry||typeof entry.key!=='string'||!styleName.test(entry.key)||
      typeof entry.label!=='string'||!entry.label.trim()||Object.hasOwn(next,entry.key))
      throw new Error('Каталог шкурок повреждён');
    next[entry.key]=Object.freeze({label:entry.label,splFile:entry.key});
  }
  for(const key of Object.keys(VISUAL_STYLES))delete VISUAL_STYLES[key];
  Object.assign(VISUAL_STYLES,next);
  return VISUAL_STYLES;
}
export function readVisualStyle(storage){
  try{const value=(storage??globalThis.localStorage)?.getItem(config.storageKey);return Object.hasOwn(VISUAL_STYLES,value)?value:defaultVisualStyle()}catch{return defaultVisualStyle()}
}
export function applyVisualStyle(style,root=skinRoot(),doc=documentRoot()){
  const selected=Object.hasOwn(VISUAL_STYLES,style)?style:defaultVisualStyle();
  if(!selected)throw new Error('Каталог шкурок пуст');
  if(doc?.getAttribute?.(config.styleAttribute)!==selected)doc?.setAttribute?.(config.styleAttribute,selected);
  if(root){
    if(root.dataset.ucStyle!==selected)root.dataset.ucStyle=selected;
    if(root.dataset.skin!==selected)root.dataset.skin=selected;
    if(root.dataset.splSkin!==VISUAL_STYLES[selected].splFile)root.dataset.splSkin=VISUAL_STYLES[selected].splFile;
    if(root.dataset.uiBase!==config.uiBase)root.dataset.uiBase=config.uiBase;
  }
  return selected;
}
export function commitVisualStyle(style,{storage,root=skinRoot(),doc=documentRoot()}={}){
  if(!Object.hasOwn(VISUAL_STYLES,style))throw new RangeError('Unknown visual style');
  try{(storage??globalThis.localStorage)?.setItem(config.storageKey,style)}catch{}
  return applyVisualStyle(style,root,doc);
}
export function bindVisualStyleSwitch(controller){switchController=controller}
export async function selectVisualStyle(style,options={}){
  if(!Object.hasOwn(VISUAL_STYLES,style))throw new RangeError('Unknown visual style');
  return switchController?switchController(style):commitVisualStyle(style,options);
}
