import {installSceneEffects,beforeSceneUpdate,updateSceneEffects,disposeSceneEffects,appendLinkedText} from './scene-effects.js';
import {applySequence} from './sequence.js';
import {renderVector} from './vector.js';
import {installNumericEditor,updateNumericEditor,disposeNumericEditor,consumeNumericBack,patchDecimalInput,installDecimalPreviews,updateDecimalPreviews,disposeDecimalPreviews} from './numeric-editor.js';
import {installControlFeedback,disposeControlFeedback,cancelControlFeedback} from './control-feedback.js';
/** Browser renderer for compiled P.Code Object Plans. */
import {formatValue} from './value-format.js';
import {MODEL,semanticValue,decimalParts,textTemplate} from './semantic-model.js';
import {createInputElement,patchInputElement,patchInputState,inputValue} from './semantic-controls.js';
import {createModalScene,installModalScenes,prepareModalUpdate,updateModalScenes,disposeModalScenes} from './modal-scene.js';
import {installRouteScenes,updateRouteScenes,disposeRouteScenes} from './route-scene.js';
const activeParallax=new WeakMap();
const activeTilt=new WeakMap();
const tiltScenes=new WeakMap();
const activeInteraction=new WeakMap();
const activeResourceStyles=new WeakMap();
const activeResources=new WeakMap();
const activeSkinStyles=new WeakMap();
const activeRepeatLists=new WeakMap();
let resourceScopeCounter=0;
const pictureObserver=typeof globalThis.IntersectionObserver==='function'?new IntersectionObserver(entries=>{
  for(const entry of entries)if(entry.isIntersecting){
    const img=entry.target;img.src=img.dataset.planeDeferredSrc;
    delete img.dataset.planeDeferredSrc;pictureObserver.unobserve(img);
  }
},{rootMargin:'160px'}):null;
function pictureSource(img,url){
  if(!pictureObserver||url.startsWith('data:'))img.src=url;
  else {img.dataset.planeDeferredSrc=url;pictureObserver.observe(img)}
}
function releaseDeferredPictures(scope){
  if(!pictureObserver)return;
  for(const image of scope.querySelectorAll('[data-plane-deferred-src]'))pictureObserver.unobserve(image);
}
const px=v=>String(v)+"px";
const opacityFromTransparency=v=>String(1-v);
const structuralPercent=t=>String((1-t)*100)+"%";
const combinedPanelTransparency=(r,p=0)=>1-((1-r.Transparency)*(1-p));
const structuralColor=(c,r,p=0)=>"color-mix(in srgb, "+c+" "+structuralPercent(combinedPanelTransparency(r,p))+", transparent)";
function resourceFamily(scope,name){return "PCodeRes_"+scope+"_"+String(name).replace(/[^A-Za-z0-9_-]/g,"_")}
function prepareResources(root,resources){
  const previous=activeResources.get(root);if(previous?.source===resources)return previous.index;
  activeResourceStyles.get(root)?.remove?.();activeResourceStyles.delete(root);
  const fonts=new Map(),pictures=new Map();
  if(!resources){const index={fonts,pictures};activeResources.set(root,{source:resources,index});return index}
  const scope=++resourceScopeCounter;
  const doc=root?.ownerDocument??globalThis.document;
  const rules=[];
  for(const item of resources.Fonts??[]){
    const family=resourceFamily(scope,item.Name);
    fonts.set(item.Name,family);
    rules.push('@font-face{font-family:"'+family+'";src:url("data:font/woff2;base64,'+item.Data+'") format("woff2");font-style:normal;font-weight:1 1000;}');
  }
  for(const item of resources.Pictures??[])pictures.set(item.Name,'data:image/png;base64,'+item.Data);
  if(rules.length&&doc?.createElement&&doc?.head){
    const style=doc.createElement("style");style.dataset.pcodeResources="";style.textContent=rules.join("\n");doc.head.append(style);activeResourceStyles.set(root,style);
  }
  const index={fonts,pictures};activeResources.set(root,{source:resources,index});return index;
}
function prepareSkinStyle(root,css){
  const old=activeSkinStyles.get(root);
  if(!css){old?.remove();activeSkinStyles.delete(root);return}
  if(old?.textContent===css)return;
  const doc=root?.ownerDocument??globalThis.document;
  if(!doc?.createElement||!doc?.head)throw new Error("WebRenderer: skin CSS requires a document head");
  const style=doc.createElement("style");style.dataset.pcodeSkinStyle="";style.textContent=css;
  doc.head.append(style);old?.remove();activeSkinStyles.set(root,style);
}
function resolvePicture(value,resources){
  if(typeof value!=="string"||!value.startsWith("res:"))return value;
  const name=value.slice(4),resolved=resources?.pictures?.get(name);
  if(!resolved)throw new Error("WebRenderer: missing picture resource "+name);
  return resolved;
}
function contentShadowFilter(d){return d>0?"drop-shadow("+(d/7)+"px "+d+"px "+(d*10/7)+"px rgba(0, 12, 22, .62))":""}
function alignmentValue(v){return {Start:"flex-start",Center:"center",End:"flex-end",Stretch:"stretch"}[v]}
function distributionValue(v){return {Start:"flex-start",Center:"center",End:"flex-end",Between:"space-between",Around:"space-around",Evenly:"space-evenly"}[v]}
function hValue(v){return {Left:"flex-start",Center:"center",Right:"flex-end"}[v]}
function vValue(v){return {Top:"flex-start",Center:"center",Bottom:"flex-end"}[v]}
function applyLayoutValue(el,property,name,value){
  const token="--pcode-layout-"+name;
  if(typeof el.style.setProperty==="function")el.style.setProperty(token,value);else el.style[token]=value;
  el.style[property]="var("+token+", "+value+")";
}

function applyBoxRule(el,rule={},renderSet,panelEffects=false){
  const pt=panelEffects?(rule.PanelTransparency??0):0;
  if(rule.Background!==undefined){el.style.setProperty("--plane-background",rule.Background);el.dataset.planeBackground="present"}else el.dataset.planeBackground="absent";
  if(rule.BorderColor!==undefined)el.style.borderColor=structuralColor(rule.BorderColor,renderSet,pt);
  if(rule.BorderWidth!==undefined)el.style.borderWidth=px(rule.BorderWidth);
  if(rule.CornerRadius!==undefined)el.style.borderRadius=px(rule.CornerRadius);
  for(const side of ["Left","Right","Top","Bottom"]){
    if(rule["Border"+side+"Color"]!==undefined)el.style["border"+side+"Color"]=structuralColor(rule["Border"+side+"Color"],renderSet,pt);
    if(rule["Border"+side+"Width"]!==undefined)el.style["border"+side+"Width"]=px(rule["Border"+side+"Width"]);
  }
  if(rule.Width!==undefined)applyLayoutValue(el,"width","width",px(rule.Width));
  if(rule.MinWidth!==undefined)applyLayoutValue(el,"minWidth","min-width",px(rule.MinWidth));
  if(rule.Height!==undefined)applyLayoutValue(el,"height","height",rule.Height==="Auto"?"auto":px(rule.Height));
  if(rule.MinHeight!==undefined)applyLayoutValue(el,"minHeight","min-height",px(rule.MinHeight));
  if(rule.Padding!==undefined)applyLayoutValue(el,"padding","padding",px(rule.Padding));
}
function applyPanelLayout(el,rule={}){
  if(rule.Gap!==undefined)applyLayoutValue(el,"gap","gap",px(rule.Gap));
  if(rule.Alignment!==undefined)el.style.alignItems=alignmentValue(rule.Alignment);
  if(rule.Distribution!==undefined)el.style.justifyContent=distributionValue(rule.Distribution);
  if(rule.Direction!==undefined)el.style.flexDirection=rule.Direction==="Horizontal"?"row":"column";
}
function applyFill(el,rule,parentOrientation){
  const mainFill=parentOrientation==="Horizontal"?rule.FillHorizontal===true:rule.FillVertical===true;
  const crossFill=parentOrientation==="Horizontal"?rule.FillVertical===true:rule.FillHorizontal===true;
  el.style.flex=mainFill?"1 1 0":"0 0 auto";
  if(crossFill)el.style.alignSelf="stretch";
  if(rule.MinWidth===undefined)el.style.minWidth="0";
  if(rule.MinHeight===undefined)el.style.minHeight="0";
}
function applyContainerContentLayout(content,rule={}){
  const direction=rule.Direction??"Horizontal";content.style.flexDirection=direction==="Horizontal"?"row":"column";
  const h=hValue(rule.HorizontalAlignment??"Center");const v=vValue(rule.VerticalAlignment??"Center");
  if(direction==="Horizontal"){content.style.justifyContent=h;content.style.alignItems=v}else{content.style.justifyContent=v;content.style.alignItems=h}
  if(rule.Gap!==undefined)applyLayoutValue(content,"gap","content-gap",px(rule.Gap));
}
function renderSource(source,renderSet,rule,shadow=0,resources=null){
  if(source.kind==='Vector')return renderVector(source.value);
  if(source.kind==='Formatted'){
    const el=document.createElement('span');el.dataset.planeSource='Text';
    for(const segment of source.value)el.append(segment.kind==='Text'?document.createTextNode(segment.value):renderSource(segment,renderSet,rule,shadow,resources));
    return el;
  }
  if(source.kind==='Decimal'){
    const parts=source.parts??decimalParts(source.value,rule.Format),el=document.createElement('span');el.dataset.planeSource='Decimal';el.dataset.planeNumberSign=BigInt(source.value.units??String(source.value).replace(/[.,]/g,''))===0n?'zero':String(source.value.units??source.value).startsWith('-')?'negative':'positive';
    const whole=document.createElement('span'),fraction=document.createElement('span'),unit=document.createElement('span');
    whole.dataset.planeNumberWhole='';fraction.dataset.planeNumberFraction='';unit.dataset.planeNumberUnit='';
    whole.textContent=parts.whole;fraction.textContent=parts.fraction;unit.textContent=parts.unit;
    const body=document.createElement('span');body.dataset.planeNumber='';body.append(whole,fraction);
    if(source.unitPlacement==='Outside'){
      unit.textContent=parts.unit.trimStart();el.append(body);
      if(parts.unit)el.append(document.createTextNode(' '),unit);
    }else{body.append(unit);el.append(body)}
    return el;
  }
  if(source.kind==="Text"){
    const e=document.createElement("span");e.dataset.planeSource="Text";e.textContent=source.value;e.style.opacity=opacityFromTransparency(renderSet.TextTransparency);
    if(rule?.TextColor!==undefined)e.style.color=rule.TextColor;if(rule?.FontSize!==undefined)e.style.fontSize=px(rule.FontSize);if(rule?.FontWeight!==undefined)e.style.fontWeight=String(rule.FontWeight);if(rule?.Font!==undefined){const family=resources?.fonts?.get(rule.Font);if(!family)throw new Error("WebRenderer: missing font resource "+rule.Font);e.style.fontFamily='"'+family+'"'}if(shadow>0)e.style.filter=contentShadowFilter(shadow);return e;
  }
  if(source.kind==="Picture"){
    if(rule?.PictureTint!==undefined){
      const resolved=resolvePicture(source.value,resources);const p=document.createElement("span");p.dataset.planeSource="Picture";p.dataset.planePictureTint="present";p.style.opacity=opacityFromTransparency(renderSet.PictureTransparency);if(shadow>0)p.style.filter=contentShadowFilter(shadow);
      const s=document.createElement("img");pictureSource(s,resolved);s.alt="";s.setAttribute("aria-hidden","true");s.dataset.planePictureSizer="";
      const t=document.createElement("span");t.dataset.planePictureTintLayer="";t.style.backgroundColor=rule.PictureTint;t.style.maskImage='url("'+resolved+'")';t.style.webkitMaskImage=t.style.maskImage;p.append(s,t);return p;
    }
    const i=document.createElement("img");i.dataset.planeSource="Picture";pictureSource(i,resolvePicture(source.value,resources));i.decoding="async";i.alt="";i.style.opacity=opacityFromTransparency(renderSet.PictureTransparency);if(shadow>0)i.style.filter=contentShadowFilter(shadow);return i;
  }
  throw new Error("WebRenderer: unsupported source kind "+source.kind);
}
function sourcesFromData(node,dataSet,repeatedItem=null){
  const rule=node.Visual??{};
  if(rule.Vector)return [{kind:"Vector",value:rule.Vector}];
  if(/^[$@]\./.test(rule.Source??'')){
    return formatValue(semanticValue(rule.Source,dataSet[MODEL],repeatedItem),rule.Format??{Kind:'Text'},dataSet[MODEL]);
  }
  const item=repeatedItem&&node.Visual?.Source?repeatedItem.Fields?.[node.Visual.Source]??{}:dataSet[node.dataSlot]??{};
  const text=typeof item.SourceText==="string"&&item.SourceText.length?{kind:"Text",value:item.SourceText}:null;
  const picture=typeof item.SourcePicture==="string"&&item.SourcePicture.length?{kind:"Picture",value:item.SourcePicture}:null;
  if(text&&picture)return node.Order==="Negative"?[text,picture]:[picture,text];
  return text?[text]:picture?[picture]:[];
}
function applySemanticState(el,rule,dataSet,item=null){
  if(rule.Sequence||rule.StateSource||rule.VisibleSource||rule.ExpandedSource||rule.EnabledSource||rule.ReadOnlySource||rule.ErrorSource||rule.PressedSource||rule.LabelSource||rule.TitleSource)el.dataset.planeSemanticState='';
  if(rule.Role)el.setAttribute('role',rule.Role);
  if(rule.AriaLevel)el.setAttribute('aria-level',String(rule.AriaLevel));
  if(rule.Sequence)applySequence(el,rule.Sequence,dataSet[MODEL]);
  if(rule.StateSource){const value=semanticValue(rule.StateSource,dataSet[MODEL],item);el.dataset.planeState=value==null?'':String(value)}
  if(rule.VisibleSource){el.hidden=semanticValue(rule.VisibleSource,dataSet[MODEL],item)!==true;el.setAttribute('aria-hidden',String(el.hidden));el.style.setProperty('display',el.hidden?'none':el.dataset.planeType==='Group'?'flex':'',el.hidden?'important':'')}
  if(rule.PressedSource)el.setAttribute('aria-pressed',String(semanticValue(rule.PressedSource,dataSet[MODEL],item)===true));
  if(rule.LabelSource){const value=semanticValue(rule.LabelSource,dataSet[MODEL],item);el.setAttribute('aria-label',textTemplate(value,rule.LabelTemplate))}
  if(rule.TitleSource){const value=semanticValue(rule.TitleSource,dataSet[MODEL],item);if(value==null||value==='')el.removeAttribute('title');else el.setAttribute('title',String(value))}
  if(rule.ExpandedSource)el.setAttribute('aria-expanded',String(semanticValue(rule.ExpandedSource,dataSet[MODEL],item)===true));
  if(rule.EnabledSource){const disabled=semanticValue(rule.EnabledSource,dataSet[MODEL],item)!==true;el.setAttribute('aria-disabled',String(disabled));if(el.tagName==='BUTTON')el.disabled=disabled;else if(!['INPUT','TEXTAREA','SELECT'].includes(el.tagName))el.inert=disabled}
}
function applyTextLayout(el,body,rule){
  const constrained=rule.FillHorizontal===true||rule.Width!==undefined;
  if(!constrained&&rule.TextOverflow===undefined)return;
  const mode=rule.TextOverflow??"Ellipsis";
  if(constrained){el.style.overflow=mode==="Wrap"?"visible":"hidden";body.style.minWidth="0";body.style.overflow=mode==="Wrap"?"visible":"hidden"}
  for(const text of body.querySelectorAll('[data-plane-source="Text"]')){
    text.style.minWidth="0";text.style.maxWidth="100%";
    text.style.overflow=mode==="Wrap"?"visible":"hidden";
    text.style.textOverflow=mode==="Ellipsis"?"ellipsis":"clip";
    text.style.whiteSpace=mode==="Wrap"?"normal":"nowrap";
    if(mode==="Wrap")text.style.overflowWrap="anywhere";
  }
}

function renderEditableInput(node,parentOrientation,dataSet,renderSet,interaction,cancellers,resources,repeatedItem=null){
  const rule=node.Visual??{},config=node.Input??{},events=node.Events??{};
  const el=createInputElement(config);el.dataset.planeType="EditableInput";el.dataset.planeLogin=node.Login;el.dataset.planeDataSlot=node.dataSlot;el.__planeVisual=rule;el.__planeInput=node;
  if(rule.Class)el.className=rule.Class;
  if(/^[$@]\./.test(rule.Source??''))el.dataset.planeSemanticSource='';
  if(rule.DecimalInput)el.dataset.planeDecimal='';
  el.required=config.Required===true;el.setAttribute('aria-label',config.AriaLabel??node.Login);
  applyBoxRule(el,rule,renderSet,false);applyFill(el,rule,parentOrientation);patchInputElement(el,node,dataSet,repeatedItem);applySemanticState(el,rule,dataSet,repeatedItem);
  let composing=false;
  const emit=(type,event)=>{
    if(!interaction||!interaction.isEnabled()||el.disabled||events[type]===undefined||events[type]===null)return;
    interaction.emit(type,node.Login,events[type],{Value:inputValue(el,config),InputType:config.InputType??"Text",IsComposing:Boolean(event?.isComposing||composing),...(repeatedItem?{ItemId:repeatedItem.Id}:{})});
  };
  el.addEventListener("compositionstart",()=>{composing=true});
  el.addEventListener("compositionend",event=>{composing=false;emit("OnInput",event)});
  el.addEventListener("focus",event=>emit("OnFocus",event));
  el.addEventListener("blur",event=>emit("OnBlur",event));
  el.addEventListener("input",event=>{if(!event.isComposing)emit("OnInput",event)});
  el.addEventListener("change",event=>emit("OnChange",event));
  el.addEventListener("keydown",event=>{if(event.key==="Enter"&&!event.isComposing&&!composing){emit("OnSubmit",event);if(events.OnSubmit)event.preventDefault?.()}});
  cancellers.push(()=>{composing=false;el.blur?.()});
  return el;
}
function renderLayoutItem(node,parentOrientation,dataSet,renderSet,parallaxNodes,ownerShadow,interaction,cancellers,resources,repeatedItem=null,repeatLists=[]){
  if(["SimplePanel","ActivePanel"].includes(node.type))return node.Repeat?renderRepeat(node,dataSet,renderSet,parallaxNodes,interaction,cancellers,resources,repeatLists):renderPanel(node,dataSet,renderSet,parallaxNodes,interaction,cancellers,resources,repeatLists,repeatedItem);
  if(node.type==="Flow"){if(node.Repeat)return renderRepeat(node,dataSet,renderSet,parallaxNodes,interaction,cancellers,resources,repeatLists);return renderFlow(node,dataSet,renderSet,parallaxNodes,interaction,cancellers,resources,repeatLists,repeatedItem)}
  if(node.type==="Group"){
    const rule=node.Layout??{};const el=document.createElement("div");el.dataset.planeType="Group";el.dataset.planeGroup="";el.style.display="flex";el.style.flexDirection=rule.Orientation==="Horizontal"?"row":"column";
    if(rule.Gap!==undefined)applyLayoutValue(el,"gap","gap",px(rule.Gap));
    if(rule.Width!==undefined)applyLayoutValue(el,"width","width",px(rule.Width));
    if(rule.MinWidth!==undefined)applyLayoutValue(el,"minWidth","min-width",px(rule.MinWidth));
    if(rule.Height!==undefined)applyLayoutValue(el,"height","height",rule.Height==="Auto"?"auto":px(rule.Height));
    if(rule.MinHeight!==undefined)applyLayoutValue(el,"minHeight","min-height",px(rule.MinHeight));
    applyFill(el,rule,parentOrientation);
    if(rule.Class)el.className=rule.Class;
    if(rule.VisibleSource||rule.StateSource||rule.EnabledSource){el.__planeVisual=rule;applySemanticState(el,rule,dataSet,repeatedItem)}
    for(const child of node.children??[])el.append(renderLayoutItem(child,rule.Orientation,dataSet,renderSet,parallaxNodes,ownerShadow,interaction,cancellers,resources,repeatedItem,repeatLists));
    return el;
  }
  if(node.type==="EditableInput")return renderEditableInput(node,parentOrientation,dataSet,renderSet,interaction,cancellers,resources,repeatedItem);
  return renderContainer(node,parentOrientation,dataSet,renderSet,parallaxNodes,ownerShadow,resources,repeatedItem);
}
function renderContainer(node,parentOrientation,dataSet,renderSet,parallaxNodes,ownerShadow,resources,repeatedItem=null){
  const rule=node.Visual??{};const el=document.createElement("div");el.dataset.planeType="Container";el.dataset.planeLogin=node.Login;el.dataset.planeDataSlot=node.dataSlot;el.dataset.planeOrder=node.Order;el.__planeVisual=rule;
  if(rule.Class)el.className=rule.Class;
  if(/^[$@]\./.test(rule.Source??''))el.dataset.planeSemanticSource='';
  applySemanticState(el,rule,dataSet,repeatedItem);
  el.style.setProperty("--plane-structural-opacity",structuralPercent(combinedPanelTransparency(renderSet,0)));el.style.setProperty("--plane-panel-surface-opacity","1");applyBoxRule(el,rule,renderSet,false);applyFill(el,rule,parentOrientation);
  const parallax=rule.Parallax??renderSet.Parallax??0;if(parallax!==0)parallaxNodes.push({element:el,parallax});
  const body=document.createElement("div");body.dataset.planeContainerContent="";applyContainerContentLayout(body,rule);
  const sources=sourcesFromData(node,dataSet,repeatedItem);
  el.__planeSourceSignature=JSON.stringify(sources);el.__planeSourceResources=resources;el.__planeSourceRender=renderSet;
  for(const source of sources)body.append(renderSource(source,renderSet,rule,ownerShadow,resources));
  applyTextLayout(el,body,rule);
  el.append(body);return el;
}
function bindActivePanel(el,node,interaction,cancellers,repeatedItem=null){
  el.dataset.planeActive="";
  el.setAttribute('role','button');el.tabIndex=0;
  let pointer=null,startX=0,startY=0,cancelled=false;
  const release=()=>{el.removeAttribute("data-plane-pressed");pointer=null;cancelled=true};
  const isEnabled=()=>!el.hidden&&el.isConnected!==false&&el.getAttribute?.('aria-disabled')!=='true'&&(!interaction||interaction.isEnabled());
  el.addEventListener('keydown',event=>{
    if(event.target&&event.target!==el||!['Enter',' '].includes(event.key)||event.repeat||!isEnabled())return;
    event.preventDefault?.();
    if(interaction&&node.OffPress!=null)interaction.emit('OffPress',node.Login,node.OffPress,repeatedItem?{ItemId:repeatedItem.Id}:null);
  });
  el.addEventListener("pointerdown",event=>{
    if(event.button!==undefined&&event.button!==0||!isEnabled())return;
    pointer=event.pointerId;startX=event.clientX??0;startY=event.clientY??0;cancelled=false;
    el.setAttribute("data-plane-pressed","");el.setPointerCapture?.(event.pointerId);
    if(interaction&&node.OnPress!==undefined&&node.OnPress!==null)interaction.emit("OnPress",node.Login,node.OnPress,repeatedItem?{ItemId:repeatedItem.Id}:null);
  });
  el.addEventListener("pointermove",event=>{
    if(pointer!==event.pointerId||cancelled)return;
    if(Math.abs((event.clientX??0)-startX)>8||Math.abs((event.clientY??0)-startY)>8)release();
  });
  el.addEventListener("pointerup",event=>{
    const success=pointer===event.pointerId&&!cancelled&&isEnabled();
    el.removeAttribute("data-plane-pressed");pointer=null;cancelled=true;
    if(success&&interaction&&node.OffPress!==undefined&&node.OffPress!==null)interaction.emit("OffPress",node.Login,node.OffPress,repeatedItem?{ItemId:repeatedItem.Id}:null);
  });
  el.addEventListener("pointercancel",release);el.addEventListener("lostpointercapture",release);
  el.__planeCancelPress=release;
  cancellers.push(release);
}
function bindSemanticAction(el,node,interaction,repeatedItem=null){
  const native=el.tagName==='BUTTON';if(native)el.type='button';else{el.setAttribute('role','button');el.tabIndex=0}
  const activate=event=>{
    if(el.disabled||el.getAttribute('aria-disabled')==='true'||!interaction?.isEnabled()||!node.OffPress)return;
    const child=event.target?.closest?.('a[href],button,input,textarea,select,[role="button"]');if(child&&child!==el&&el.contains(child))return;
    event.stopPropagation();interaction.emit('OffPress',node.Login,node.OffPress,repeatedItem?{ItemId:repeatedItem.Id}:null);
  };
  el.addEventListener('click',activate);
  if(!native)el.addEventListener('keydown',event=>{if(event.target===el&&!event.repeat&&['Enter',' '].includes(event.key)){event.preventDefault();activate(event)}});
}
function patchFlowContent(el,node,dataSet,renderSet,resources,item=null){
  const rule=node.Visual;
  if(rule.Source===undefined&&rule.Text===undefined)return;
  const sources=rule.Text!==undefined?[{kind:'Text',value:rule.Text}]:sourcesFromData(node,dataSet,item);
  const signature=JSON.stringify(sources);if(el.__planeSourceSignature===signature&&el.__planeSourceResources===resources&&el.__planeSourceRender===renderSet)return;
  el.__planeSourceSignature=signature;el.__planeSourceResources=resources;el.__planeSourceRender=renderSet;
  el.replaceChildren();for(const source of sources){if(source.kind==='Text'&&rule.Linkify)appendLinkedText(el,source.value);else el.append(source.kind==='Text'?document.createTextNode(source.value):renderSource(source,renderSet,rule,0,resources))}
}
function renderFlow(node,dataSet,renderSet,parallaxNodes,interaction,cancellers,resources,repeatLists,repeatedItem){
  const rule=node.Visual,el=document.createElement(rule.Tag);el.dataset.planeType='Flow';el.dataset.planeLogin=node.Login;el.__planeVisual=rule;el.__planeFlow=node;
  if(rule.Class)el.className=rule.Class;
  if(rule.AriaLabel)el.setAttribute('aria-label',rule.AriaLabel);
  if(repeatedItem)el.dataset.planeItemId=repeatedItem.Id;
  if(rule.Source){el.dataset.planeSemanticSource='';el.dataset.planeDataSlot=node.dataSlot}
  if(rule.Tag==='button'||node.OffPress)bindSemanticAction(el,node,interaction,repeatedItem);
  if(rule.Vector)el.append(renderVector(rule.Vector));
  applySemanticState(el,rule,dataSet,repeatedItem);patchFlowContent(el,node,dataSet,renderSet,resources,repeatedItem);
  for(const child of node.layout)el.append(renderLayoutItem(child,null,dataSet,renderSet,parallaxNodes,0,interaction,cancellers,resources,repeatedItem,repeatLists));
  return el;
}
function renderRepeat(node,dataSet,renderSet,parallaxNodes,interaction,cancellers,resources,repeatLists){
  const list=document.createElement('div');list.dataset.planeRepeat=node.Repeat;list.style.display='contents';
  const paths=new Set();
  const collect=value=>{if(!value||typeof value!=='object')return;for(const [key,v]of Object.entries(value))if(key!=='Repeat'&&typeof v==='string'&&v.startsWith('$.'))paths.add(v);else if(typeof v==='object')collect(v)};collect(node);
  const record={list,node,signature:null,renderSet,interaction,resources,rows:new Map(),parallaxNodes,paths:[...paths]};repeatLists.push(record);
  cancellers.push(()=>{for(const row of record.rows.values())for(const cancel of row.cancellers)cancel()});
  renderRepeatedItems(record,dataSet,parallaxNodes,cancellers,repeatLists);return list;
}
function renderPanel(node,dataSet,renderSet,parallaxNodes,interaction,cancellers,resources,repeatLists=[],repeatedItem=null){
  if(node.type==='Flow')return renderFlow(node,dataSet,renderSet,parallaxNodes,interaction,cancellers,resources,repeatLists,repeatedItem);
  const el=document.createElement(node.Visual?.NativeButton?'button':'div');if(node.Visual?.NativeButton)el.type='button';el.dataset.planeType=node.type;el.dataset.planeLogin=node.Login;const rule=node.Visual??{};el.__planeVisual=rule;
  if(rule.AriaLabel)el.setAttribute('aria-label',rule.AriaLabel);
  if(rule.Class)el.className=rule.Class;
  applySemanticState(el,rule,dataSet,repeatedItem);
  if(repeatedItem)el.dataset.planeItemId=repeatedItem.Id;
  const panelEffects=["SimplePanel","ActivePanel","AggregateActivePanel"].includes(node.type);const pt=panelEffects?(rule.PanelTransparency??0):0;
  el.style.setProperty("--plane-structural-opacity",structuralPercent(combinedPanelTransparency(renderSet,pt)));el.style.setProperty("--plane-panel-surface-opacity",String(1-pt));applyBoxRule(el,rule,renderSet,panelEffects);applyPanelLayout(el,rule);
  const parallax=rule.Parallax??renderSet.Parallax??0;if(parallax!==0)parallaxNodes.push({element:el,parallax});
  const orientation=rule.Direction??"Vertical";const shadow=panelEffects?(rule.Shadow??0):0;
  if(rule.Text!==undefined)el.append(document.createTextNode(rule.Text));
  for(const item of node.layout??[])el.append(renderLayoutItem(item,orientation,dataSet,renderSet,parallaxNodes,shadow,interaction,cancellers,resources,repeatedItem,repeatLists));
  for(const child of node.children??[]){
    if(child.Repeat){el.append(renderRepeat(child,dataSet,renderSet,parallaxNodes,interaction,cancellers,resources,repeatLists));
    }else el.append(renderPanel(child,dataSet,renderSet,parallaxNodes,interaction,cancellers,resources,repeatLists,repeatedItem));
  }
  if(node.type==="SimplePanel"&&node.OffPress)bindSemanticAction(el,node,interaction,repeatedItem);
  if(node.type==="ActivePanel"||node.type==="AggregateActivePanel")bindActivePanel(el,node,interaction,cancellers,repeatedItem);
  return el;
}
// Update the authored subtree without replacing a keyed control or its focus.
function patchElementSource(el,dataSet,renderSet,resources,item=null){
  if(el.__planeFlow){patchFlowContent(el,el.__planeFlow,dataSet,renderSet,resources,item);return}
  if(el.__planeInput){patchInputElement(el,el.__planeInput,dataSet,item);return}
  const body=el.querySelector(':scope > [data-plane-container-content]');if(!body)return;
  const visual=el.__planeVisual??{},node={type:'Container',dataSlot:el.dataset.planeDataSlot,Order:el.dataset.planeOrder??'Positive',Visual:visual};
  let owner=el.parentElement;while(owner&&owner.dataset.planeType==='Group')owner=owner.parentElement;
  const shadow=owner?.__planeVisual?.Shadow??0,sources=sourcesFromData(node,dataSet,item),signature=JSON.stringify(sources);
  if(el.__planeSourceSignature===signature&&el.__planeSourceResources===resources&&el.__planeSourceRender===renderSet)return;
  el.__planeSourceSignature=signature;el.__planeSourceResources=resources;el.__planeSourceRender=renderSet;
  releaseDeferredPictures(body);body.replaceChildren(...sources.map(source=>renderSource(source,renderSet,visual,shadow,resources)));applyTextLayout(el,body,visual);
}
function patchRepeatedSubtree(el,dataSet,renderSet,resources,item){
  el.__planeCancelPress?.();
  if(el.__planeVisual)applySemanticState(el,el.__planeVisual,dataSet,item);
  if(el.__planeInput||el.__planeFlow||el.dataset.planeDataSlot!==undefined)patchElementSource(el,dataSet,renderSet,resources,item);
  for(const child of el.children)patchRepeatedSubtree(child,dataSet,renderSet,resources,item);
}
function reconcileRepeatedNodes(list,nodes){
  const expected=new Set(nodes),doc=list.ownerDocument,focused=doc?.activeElement;
  const selection=focused&&typeof focused.selectionStart==='number'?{start:focused.selectionStart,end:focused.selectionEnd,direction:focused.selectionDirection}:null;
  for(const child of [...list.children])if(!expected.has(child))child.remove();
  for(let index=0;index<nodes.length;index++){
    const node=nodes[index],current=list.children[index]??null;if(current===node)continue;
    if(list.moveBefore&&node.parentElement===list&&list.isConnected)list.moveBefore(node,current);
    else list.insertBefore(node,current);
  }
  // Older browsers lack state-preserving moveBefore. Restore only retained,
  // still-available controls; removed/disabled controls must not regain focus.
  if(focused?.isConnected&&doc.activeElement!==focused&&list.contains(focused)&&!focused.disabled&&!focused.closest('[inert]')){
    focused.focus({preventScroll:true});if(selection)focused.setSelectionRange?.(selection.start,selection.end,selection.direction);
  }
}
function renderRepeatedItems(record,dataSet,parallaxNodes,cancellers,repeatLists){
  const semantic=record.node.Repeat.startsWith('$.');
  const items=(semantic?semanticValue(record.node.Repeat,dataSet[MODEL]):dataSet[record.node.Repeat]?.Items)??[];
  if(!Array.isArray(items)||items.length>5000)throw Error('Repeat requires an array of at most 5000 records');
  const ids=new Set();for(const item of items){const id=semantic?item.id:item.Id;if(typeof id!=='string'||!id||ids.has(id))throw Error('Repeat requires unique string IDs');ids.add(id)}
  const context=record.paths.map(path=>semanticValue(path,dataSet[MODEL])),signature=JSON.stringify([items,context]);
  if(record.signature===signature&&record.lastResources===record.resources&&record.lastRender===record.renderSet)return;
  const template={...record.node,Repeat:undefined};
  if(record.patchable===undefined){const nested=value=>value&&typeof value==='object'&&(Boolean(value.Repeat)||Object.values(value).some(nested));record.patchable=!nested(template)}
  const next=new Map();
  for(const value of items){
    const item=semantic?{...value,Id:value.id}:value,id=item.Id,signature=JSON.stringify([item,context]),old=record.rows.get(id);
    if(old?.signature===signature&&old.resources===record.resources&&old.renderSet===record.renderSet){next.set(id,old);continue}
    if(old&&record.patchable){
      patchRepeatedSubtree(old.element,dataSet,record.renderSet,record.resources,item);
      old.signature=signature;old.resources=record.resources;old.renderSet=record.renderSet;next.set(id,old);continue;
    }
    const row={signature,cancellers:[],parallax:[],resources:record.resources,renderSet:record.renderSet};
    row.element=renderPanel(template,dataSet,record.renderSet,row.parallax,record.interaction,row.cancellers,record.resources,[],item);next.set(id,row);
  }
  for(const [id,row]of record.rows)if(next.get(id)!==row){for(const cancel of row.cancellers)cancel();releaseDeferredPictures(row.element);for(const entry of row.parallax){const index=record.parallaxNodes.indexOf(entry);if(index>=0)record.parallaxNodes.splice(index,1)}}
  for(const [id,row]of next)if(record.rows.get(id)!==row)record.parallaxNodes.push(...row.parallax);
  reconcileRepeatedNodes(record.list,[...next.values()].map(row=>row.element));record.rows=next;record.signature=signature;record.lastResources=record.resources;record.lastRender=record.renderSet;
}

function bindParallax(root,nodes){
  activeParallax.get(root)?.cancel();
  if(nodes.length===0){activeParallax.delete(root);return}
  const controller=new AbortController();let frame=0;let point=null;
  const cancel=()=>{controller.abort();if(frame)cancelAnimationFrame(frame)};
  activeParallax.set(root,{cancel});
  function apply(){
    frame=0;if(!point)return;const rect=root.getBoundingClientRect();if(!rect.width||!rect.height)return;
    const nx=((point.x-rect.left)/rect.width)*2-1,ny=((point.y-rect.top)/rect.height)*2-1;
    for(const item of nodes)item.element.style.translate=(nx*item.parallax)+"px "+(ny*item.parallax)+"px";
  }
  root.addEventListener("pointermove",e=>{point={x:e.clientX,y:e.clientY};if(!frame)frame=requestAnimationFrame(apply)},{signal:controller.signal});
  root.addEventListener("pointerleave",()=>{point=null;if(frame)cancelAnimationFrame(frame);frame=0;for(const item of nodes)item.element.style.translate=""},{signal:controller.signal});
}
function stopTilt(root){
  activeTilt.get(root)?.cancel();activeTilt.delete(root);
  root.style?.removeProperty?.('--pcode-tilt-x');root.style?.removeProperty?.('--pcode-tilt-y');
}
export function disableTiltParallax(root){stopTilt(root)}
export function requestTiltParallax(root){
  const scene=tiltScenes.get(root),doc=root.ownerDocument??globalThis.document;
  if(!scene)return Promise.reject(new Error('Tilt parallax is not configured'));
  if(!doc||doc.visibilityState==='hidden'||globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
    return Promise.reject(new Error('Motion is unavailable in this view'));
  const Sensor=globalThis.DeviceOrientationEvent;
  if(!Sensor)return Promise.reject(new Error('Device orientation is unavailable'));
  // This call must happen synchronously during the user's press on iOS.
  let permission;
  try{permission=typeof Sensor.requestPermission==='function'?Sensor.requestPermission():Promise.resolve('granted')}
  catch(error){return Promise.reject(error)}
  return Promise.resolve(permission).then(status=>{
    if(status!=='granted')throw new Error('Device orientation permission denied');
    stopTilt(root);
    const controller=new AbortController(),signal=controller.signal;
    let baseline=null,frame=0,targetX=0,targetY=0,x=0,y=0;
    const reset=()=>{root.style.removeProperty('--pcode-tilt-x');root.style.removeProperty('--pcode-tilt-y')};
    const cancel=()=>{controller.abort();if(frame)cancelAnimationFrame(frame);reset()};
    function paint(){
      frame=0;
      x+=(targetX-x)*scene.Smoothing;y+=(targetY-y)*scene.Smoothing;
      root.style.setProperty('--pcode-tilt-x',x.toFixed(2)+'px');root.style.setProperty('--pcode-tilt-y',y.toFixed(2)+'px');
      if(Math.abs(targetX-x)>.05||Math.abs(targetY-y)>.05)frame=requestAnimationFrame(paint);
    }
    globalThis.addEventListener('deviceorientation',event=>{
      if(doc.visibilityState==='hidden'||!Number.isFinite(event.beta)||!Number.isFinite(event.gamma))return;
      if(!baseline){baseline={beta:event.beta,gamma:event.gamma};return}
      const clamp=value=>Math.max(-1,Math.min(1,value/15));
      targetX=clamp(event.gamma-baseline.gamma)*scene.MaxOffset;
      targetY=clamp(event.beta-baseline.beta)*scene.MaxOffset;
      if(!frame)frame=requestAnimationFrame(paint);
    },{signal});
    doc.addEventListener('visibilitychange',()=>{if(doc.visibilityState==='hidden')stopTilt(root)},{signal});
    const reduced=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');
    reduced?.addEventListener?.('change',()=>{if(reduced.matches)stopTilt(root)},{signal});
    activeTilt.set(root,{cancel});
  });
}
export function cancelPlaneCodeInteraction(root){cancelControlFeedback(root);activeInteraction.get(root)?.cancel()}
export function consumePlaneCodeBack(root){return consumeNumericBack(root)}
export function disposePlaneCode(root){
  disposeSceneEffects(root);
  disposeNumericEditor(root);disposeDecimalPreviews(root);
  disposeControlFeedback(root);
  disposeRouteScenes(root);
  disposeModalScenes(root);
  cancelPlaneCodeInteraction(root);activeInteraction.delete(root);activeRepeatLists.delete(root);activeParallax.get(root)?.cancel();activeParallax.delete(root);stopTilt(root);tiltScenes.delete(root);activeResourceStyles.get(root)?.remove?.();activeResourceStyles.delete(root);activeResources.delete(root);activeSkinStyles.get(root)?.remove();activeSkinStyles.delete(root);releaseDeferredPictures(root);root.replaceChildren();
}
export function renderPlaneCode(root,objectPlan,dataSet,renderSet,interaction=null,resourceSet=null,skinStyleSheet=null){
  disposeSceneEffects(root);
  disposeNumericEditor(root);disposeDecimalPreviews(root);
  disposeControlFeedback(root);
  disposeRouteScenes(root);
  cancelPlaneCodeInteraction(root);
  disposeModalScenes(root);
  if(!renderSet.TiltParallax)stopTilt(root);
  tiltScenes.set(root,renderSet.TiltParallax??null);
  prepareSkinStyle(root,skinStyleSheet);
  root.style.setProperty("--panel-spacing",px(renderSet.PanelSpacing));root.style.setProperty("--background-color",renderSet.BackgroundColor);root.style.setProperty("--panel-color",renderSet.PanelColor);root.style.setProperty("--border-color",renderSet.BorderColor);root.style.setProperty("--text-color",renderSet.TextColor);
  const resources=prepareResources(root,resourceSet);const parallaxNodes=[],cancellers=[],repeatLists=[];const roots=Array.isArray(objectPlan)?objectPlan:[objectPlan];
  const modals=[],routes=[];
  const panels=roots.map(node=>{
    const panel=renderPanel(node,dataSet,renderSet,parallaxNodes,interaction,cancellers,resources,repeatLists);
    if(node.Visual?.Route)routes.push({panel,node,route:node.Visual.Route});
    if(!node.Visual?.Modal)return panel;
    const scene=createModalScene(panel,node,interaction);modals.push(scene);return scene.wrapper;
  });
  releaseDeferredPictures(root);
  root.replaceChildren(...panels);
  installNumericEditor(root,roots,interaction,dataSet);installDecimalPreviews(root,roots);
  installControlFeedback(root,roots,interaction);
  installRouteScenes(root,routes,interaction);updateRouteScenes(root,dataSet);
  installModalScenes(root,modals);updateModalScenes(root,dataSet);
  installSceneEffects(root,roots,interaction);
  activeInteraction.set(root,{cancel(){for(const cancel of cancellers)cancel()}});
  activeRepeatLists.set(root,repeatLists);
  bindParallax(root,parallaxNodes);
}
export function patchSetData(root,nextData,renderSet,resourceSet=null,{semanticOnly=false}={}){
  beforeSceneUpdate(root);
  const exiting=prepareModalUpdate(root,nextData),frozen=el=>exiting&&el.closest?.('[data-plane-exiting]');
  const resources=prepareResources(root,resourceSet);
  for(const el of root.querySelectorAll('[data-plane-semantic-state]'))if(!frozen(el)&&!el.closest?.('[data-plane-repeat]')){applySemanticState(el,el.__planeVisual??{},nextData);if(semanticOnly&&el.__planeInput&&(el.__planeVisual.EnabledSource||el.__planeVisual.ReadOnlySource||el.__planeVisual.ErrorSource))patchInputState(el,el.__planeInput,nextData)}
  for(const el of root.querySelectorAll(semanticOnly?'[data-plane-semantic-source],[data-plane-decimal]':'[data-plane-data-slot]')){
    if(frozen(el)||el.closest?.('[data-plane-repeat]'))continue;
    if(semanticOnly&&!/^[$@]\./.test(el.__planeVisual?.Source??'')){if(el.__planeVisual?.DecimalInput)patchDecimalInput(el,el.__planeInput,nextData);continue;}
    patchElementSource(el,nextData,renderSet,resources);
  }
  for(const record of activeRepeatLists.get(root)??[]){if(frozen(record.list))continue;record.resources=resources;record.renderSet=renderSet;renderRepeatedItems(record,nextData,[],[],[])}
  updateRouteScenes(root,nextData);updateModalScenes(root,nextData);updateNumericEditor(root,nextData);updateDecimalPreviews(root);updateSceneEffects(root,nextData);
}
