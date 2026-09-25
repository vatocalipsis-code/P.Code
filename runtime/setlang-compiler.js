/** SetLang compiler: authored typed SetLang -> immutable private Object Plan. */
function freeze(o){return Object.freeze(o)}
function authoredLayout(node){
  if(Array.isArray(node.Layout)) return node.Layout;
  return (node.Containers??[]).map(c=>({...c,Type:"Container"}));
}
function compileContainer(node){
  const p={...(node.Properties??{})};
  const Order=p.Order??"Positive"; delete p.Order;
  return freeze({type:"Container",Login:node.Login,Visual:freeze(p),Order,dataSlot:node.Login});
}
function compileEditableInput(node){
  const p={...(node.Properties??{})};
  const Input={InputType:p.InputType??"Text",Placeholder:p.Placeholder??"",Disabled:p.Disabled===true,Required:p.Required===true,AriaLabel:p.AriaLabel??node.Login,InputMode:p.InputMode??null};
  const Events={OnFocus:p.OnFocus,OnBlur:p.OnBlur,OnInput:p.OnInput,OnChange:p.OnChange,OnSubmit:p.OnSubmit};
  for(const key of [...Object.keys(Input),...Object.keys(Events)])delete p[key];
  return freeze({type:"EditableInput",Login:node.Login,Visual:freeze(p),Input:freeze(Input),Events:freeze(Events),dataSlot:node.Login});
}
function compileGroup(node){
  const p={...(node.Properties??{})};
  return freeze({type:"Group",Layout:freeze(p),children:freeze((node.Layout??[]).map(compileLayoutNode))});
}
function compileLayoutNode(node){
  if(node?.Type==="Group")return compileGroup(node);
  if(node?.Type==="EditableInput")return compileEditableInput(node);
  return compileContainer(node);
}
function compileActive(node,aggregate=false){
  const p={...(node.Properties??{})};const OnPress=p.OnPress;const OffPress=p.OffPress;delete p.OnPress;delete p.OffPress;
  const out={type:aggregate?"AggregateActivePanel":"ActivePanel",Login:node.Login,Visual:freeze(p),layout:freeze(authoredLayout(node).map(compileLayoutNode)),children:freeze([])};
  if(OnPress!==undefined) out.OnPress=OnPress;if(OffPress!==undefined) out.OffPress=OffPress;return freeze(out);
}
function compileSimple(node){
  const p={...(node.Properties??{})};const aggregates=p.AggregateActivePanels??[];delete p.AggregateActivePanels;
  const panels=[...aggregates.filter(a=>a.Properties?.Visible!=="No").map(a=>compileActive(a,true)),...(node.ActivePanels??[]).map(a=>compileActive(a,false))];
  return freeze({type:"SimplePanel",Login:node.Login,Visual:freeze(p),layout:freeze(authoredLayout(node).map(compileLayoutNode)),children:freeze(panels)});
}
function compileBase(node){
  return freeze({type:"BasePanel",Login:node.Login,Visual:freeze({...node.Properties}),layout:freeze(authoredLayout(node).map(compileLayoutNode)),children:freeze((node.SimplePanels??[]).map(compileSimple))});
}
export function compileSetLang(setLangData,capabilities=[]){
  if(setLangData.some(()=>false))void capabilities;
  return freeze(setLangData.map(compileBase));
}
