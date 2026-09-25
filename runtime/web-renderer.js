/** Browser renderer for compiled PlaneCode Object Plans. */
const activeParallax=new WeakMap();
const px=v=>`${v}px`;
const opacityFromTransparency=v=>String(1-v);
const structuralPercent=t=>`${(1-t)*100}%`;
const combinedPanelTransparency=(r,p=0)=>1-((1-r.Transparency)*(1-p));
const structuralColor=(c,r,p=0)=>`color-mix(in srgb, ${c} ${structuralPercent(combinedPanelTransparency(r,p))}, transparent)`;
function contentShadowFilter(d){if(!(d>0))return'';return `drop-shadow(${d/7}px ${d}px ${d*10/7}px rgba(0, 12, 22, .62))`}
function alignmentValue(v){return {Start:'flex-start',Center:'center',End:'flex-end',Stretch:'stretch'}[v]}
function distributionValue(v){return {Start:'flex-start',Center:'center',End:'flex-end',Between:'space-between',Around:'space-around',Evenly:'space-evenly'}[v]}
function hValue(v){return {Left:'flex-start',Center:'center',Right:'flex-end'}[v]}
function vValue(v){return {Top:'flex-start',Center:'center',Bottom:'flex-end'}[v]}

function applyBoxRule(el,rule={},renderSet,panelEffects=false){
  const pt=panelEffects?(rule.PanelTransparency??0):0;
  if(rule.Background!==undefined){el.style.setProperty('--plane-background',rule.Background);el.dataset.planeBackground='present'}else el.dataset.planeBackground='absent';
  if(rule.BorderColor!==undefined) el.style.borderColor=structuralColor(rule.BorderColor,renderSet,pt);
  if(rule.BorderWidth!==undefined) el.style.borderWidth=px(rule.BorderWidth);
  for(const side of ['Left','Right','Top','Bottom']){if(rule[`Border${side}Color`]!==undefined) el.style[`border${side}Color`]=structuralColor(rule[`Border${side}Color`],renderSet,pt);if(rule[`Border${side}Width`]!==undefined) el.style[`border${side}Width`]=px(rule[`Border${side}Width`])}
  if(rule.Width!==undefined) el.style.width=px(rule.Width);if(rule.Height!==undefined) el.style.height=px(rule.Height);if(rule.Padding!==undefined) el.style.padding=px(rule.Padding);
}
function applyPanelLayout(el,rule={}){if(rule.Gap!==undefined) el.style.gap=px(rule.Gap);if(rule.Alignment!==undefined) el.style.alignItems=alignmentValue(rule.Alignment);if(rule.Distribution!==undefined) el.style.justifyContent=distributionValue(rule.Distribution);if(rule.Direction!==undefined) el.style.flexDirection=rule.Direction==='Horizontal'?'row':'column'}
function applyFill(el,rule,parentOrientation){
  const mainFill=parentOrientation==='Horizontal'?rule.FillHorizontal===true:rule.FillVertical===true;
  const crossFill=parentOrientation==='Horizontal'?rule.FillVertical===true:rule.FillHorizontal===true;
  el.style.flex=mainFill?'1 1 0':'0 0 auto';
  if(crossFill) el.style.alignSelf='stretch';
  el.style.minWidth='0';el.style.minHeight='0';
}
function applyContainerContentLayout(content,rule={}){
  const direction=rule.Direction??'Horizontal';content.style.flexDirection=direction==='Horizontal'?'row':'column';
  const h=hValue(rule.HorizontalAlignment??'Center');const v=vValue(rule.VerticalAlignment??'Center');
  if(direction==='Horizontal'){content.style.justifyContent=h;content.style.alignItems=v}else{content.style.justifyContent=v;content.style.alignItems=h}
  if(rule.Gap!==undefined) content.style.gap=px(rule.Gap);
}
function renderSource(source,renderSet,rule,shadow=0){
  if(source.kind==='Text'){const e=document.createElement('span');e.dataset.planeSource='Text';e.textContent=source.value;e.style.opacity=opacityFromTransparency(renderSet.TextTransparency);if(rule?.TextColor!==undefined)e.style.color=rule.TextColor;if(rule?.FontSize!==undefined)e.style.fontSize=px(rule.FontSize);if(rule?.FontWeight!==undefined)e.style.fontWeight=String(rule.FontWeight);if(shadow>0)e.style.filter=contentShadowFilter(shadow);return e}
  if(source.kind==='Picture'){
    if(rule?.PictureTint!==undefined){const p=document.createElement('span');p.dataset.planeSource='Picture';p.dataset.planePictureTint='present';p.style.opacity=opacityFromTransparency(renderSet.PictureTransparency);if(shadow>0)p.style.filter=contentShadowFilter(shadow);const s=document.createElement('img');s.src=source.value;s.alt='';s.setAttribute('aria-hidden','true');s.dataset.planePictureSizer='';const t=document.createElement('span');t.dataset.planePictureTintLayer='';t.style.backgroundColor=rule.PictureTint;t.style.maskImage=`url("${source.value}")`;t.style.webkitMaskImage=`url("${source.value}")`;p.append(s,t);return p}
    const i=document.createElement('img');i.dataset.planeSource='Picture';i.src=source.value;i.alt='';i.style.opacity=opacityFromTransparency(renderSet.PictureTransparency);if(shadow>0)i.style.filter=contentShadowFilter(shadow);return i
  }
  throw new Error(`WebRenderer: unsupported source kind "${source.kind}"`)
}
function sourcesFromData(node,dataSet){const item=dataSet[node.dataSlot]??{};const text=typeof item.SourceText==='string'&&item.SourceText.length?{kind:'Text',value:item.SourceText}:null;const picture=typeof item.SourcePicture==='string'&&item.SourcePicture.length?{kind:'Picture',value:item.SourcePicture}:null;if(text&&picture)return node.Order==='Negative'?[text,picture]:[picture,text];return text?[text]:picture?[picture]:[]}

function renderLayoutItem(node,parentOrientation,dataSet,renderSet,parallaxNodes,ownerShadow){
  if(node.type==='Group'){
    const rule=node.Layout??{};const el=document.createElement('div');el.dataset.planeType='Group';el.dataset.planeGroup='';el.style.display='flex';el.style.flexDirection=rule.Orientation==='Horizontal'?'row':'column';if(rule.Gap!==undefined)el.style.gap=px(rule.Gap);if(rule.Width!==undefined)el.style.width=px(rule.Width);if(rule.Height!==undefined)el.style.height=px(rule.Height);applyFill(el,rule,parentOrientation);for(const child of node.children??[])el.append(renderLayoutItem(child,rule.Orientation,dataSet,renderSet,parallaxNodes,ownerShadow));return el
  }
  return renderContainer(node,parentOrientation,dataSet,renderSet,parallaxNodes,ownerShadow)
}
function renderContainer(node,parentOrientation,dataSet,renderSet,parallaxNodes,ownerShadow){
  const rule=node.Visual??{};const el=document.createElement('div');el.dataset.planeType='Container';el.dataset.planeLogin=node.Login;el.dataset.planeDataSlot=node.dataSlot;el.dataset.planeOrder=node.Order;el.__planeVisual=rule;el.style.setProperty('--plane-structural-opacity',structuralPercent(combinedPanelTransparency(renderSet,0)));el.style.setProperty('--plane-panel-surface-opacity','1');applyBoxRule(el,rule,renderSet,false);applyFill(el,rule,parentOrientation);
  const parallax=rule.Parallax??renderSet.Parallax??0;if(parallax!==0)parallaxNodes.push({element:el,parallax});
  const content=document.createElement('div');content.dataset.planeContainerContent='';applyContainerContentLayout(content,rule);for(const source of sourcesFromData(node,dataSet))content.append(renderSource(source,renderSet,rule,ownerShadow));
  if(rule.FillHorizontal===true||rule.Width!==undefined){el.style.overflow='hidden';content.style.minWidth='0';content.style.overflow='hidden';for(const text of content.querySelectorAll('[data-plane-source="Text"]')){text.style.minWidth='0';text.style.maxWidth='100%';text.style.overflow='hidden';text.style.textOverflow='ellipsis';text.style.whiteSpace='nowrap'}}
  el.append(content);return el
}
function renderPanel(node,dataSet,renderSet,parallaxNodes){
  const el=document.createElement('div');el.dataset.planeType=node.type;el.dataset.planeLogin=node.Login;const rule=node.Visual??{};el.__planeVisual=rule;const panelEffects=['SimplePanel','ActivePanel','AggregateActivePanel'].includes(node.type);const pt=panelEffects?(rule.PanelTransparency??0):0;el.style.setProperty('--plane-structural-opacity',structuralPercent(combinedPanelTransparency(renderSet,pt)));el.style.setProperty('--plane-panel-surface-opacity',String(1-pt));applyBoxRule(el,rule,renderSet,panelEffects);applyPanelLayout(el,rule);const parallax=rule.Parallax??renderSet.Parallax??0;if(parallax!==0)parallaxNodes.push({element:el,parallax});
  const orientation=rule.Direction??'Vertical';const shadow=panelEffects?(rule.Shadow??0):0;for(const item of node.layout??[])el.append(renderLayoutItem(item,orientation,dataSet,renderSet,parallaxNodes,shadow));for(const child of node.children??[])el.append(renderPanel(child,dataSet,renderSet,parallaxNodes));
  if(node.type==='ActivePanel'||node.type==='AggregateActivePanel'){el.dataset.planeActive='';const release=()=>el.removeAttribute('data-plane-pressed');el.addEventListener('pointerdown',e=>{if(e.button!==undefined&&e.button!==0)return;el.setAttribute('data-plane-pressed','');el.setPointerCapture?.(e.pointerId)});el.addEventListener('pointerup',release);el.addEventListener('pointercancel',release);el.addEventListener('lostpointercapture',release)}return el
}

function bindParallax(root,nodes){activeParallax.get(root)?.cancel();if(nodes.length===0){activeParallax.delete(root);return}const controller=new AbortController();let frame=0;let point=null;const cancel=()=>{controller.abort();if(frame)cancelAnimationFrame(frame)};activeParallax.set(root,{cancel});function apply(){frame=0;if(!point)return;const rect=root.getBoundingClientRect();if(!rect.width||!rect.height)return;const nx=((point.x-rect.left)/rect.width)*2-1,ny=((point.y-rect.top)/rect.height)*2-1;for(const {element,parallax} of nodes)element.style.translate=`${nx*parallax}px ${ny*parallax}px`}root.addEventListener('pointermove',e=>{point={x:e.clientX,y:e.clientY};if(!frame)frame=requestAnimationFrame(apply)},{signal:controller.signal});root.addEventListener('pointerleave',()=>{point=null;if(frame)cancelAnimationFrame(frame);frame=0;for(const {element} of nodes)element.style.translate=''},{signal:controller.signal})}
export function renderPlaneCode(root,objectPlan,dataSet,renderSet){root.style.setProperty('--panel-spacing',`${renderSet.PanelSpacing}px`);root.style.setProperty('--background-color',renderSet.BackgroundColor);root.style.setProperty('--panel-color',renderSet.PanelColor);root.style.setProperty('--border-color',renderSet.BorderColor);root.style.setProperty('--text-color',renderSet.TextColor);const parallaxNodes=[];const roots=Array.isArray(objectPlan)?objectPlan:[objectPlan];root.replaceChildren(...roots.map(n=>renderPanel(n,dataSet,renderSet,parallaxNodes)));bindParallax(root,parallaxNodes)}
export function patchSetData(root,nextData,renderSet){for(const el of root.querySelectorAll('[data-plane-data-slot]')){const content=el.querySelector(':scope > [data-plane-container-content]');if(!content)continue;const node={type:'Container',dataSlot:el.dataset.planeDataSlot,Order:el.dataset.planeOrder??'Positive'};const visual=el.__planeVisual??{};let owner=el.parentElement;while(owner&&owner.dataset.planeType==='Group')owner=owner.parentElement;const shadow=owner?.__planeVisual?.Shadow??0;content.replaceChildren(...sourcesFromData(node,nextData).map(s=>renderSource(s,renderSet,visual,shadow)))}}
