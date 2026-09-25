/** PlaneCode contract validators. */
function isTransparency(v){return typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=1}
function isFiniteNumber(v){return typeof v==='number'&&Number.isFinite(v)}
function isNonNegativeNumber(v){return isFiniteNumber(v)&&v>=0}
function isNonEmptyString(v){return typeof v==='string'&&v.length>0}
const ALIGNMENTS=new Set(['Start','Center','End','Stretch']);
const DISTRIBUTIONS=new Set(['Start','Center','End','Between','Around','Evenly']);
const DIRECTIONS=new Set(['Horizontal','Vertical']);
const ORDERS=new Set(['Positive','Negative']);
const H_ALIGN=new Set(['Left','Center','Right']);
const V_ALIGN=new Set(['Top','Center','Bottom']);
const STRING_RULES=['Background','BorderColor','BorderLeftColor','BorderRightColor','BorderTopColor','BorderBottomColor','TextColor','PictureTint'];
const NON_NEGATIVE_RULES=['BorderWidth','BorderLeftWidth','BorderRightWidth','BorderTopWidth','BorderBottomWidth','Width','Height','Padding','Gap','FontSize'];

function validateVisualRule(rule,label,allowPanelEffects=false){
  if(!rule||typeof rule!=='object'||Array.isArray(rule)) throw new Error(`Validator: Properties for ${label} must be an object`);
  for(const p of STRING_RULES) if(rule[p]!==undefined&&!isNonEmptyString(rule[p])) throw new Error(`Validator: ${p} for ${label} must be a non-empty string`);
  for(const p of NON_NEGATIVE_RULES) if(rule[p]!==undefined&&!isNonNegativeNumber(rule[p])) throw new Error(`Validator: ${p} for ${label} must be non-negative`);
  if(rule.FontWeight!==undefined&&(!Number.isInteger(rule.FontWeight)||rule.FontWeight<1||rule.FontWeight>1000)) throw new Error(`Validator: FontWeight for ${label} must be 1..1000`);
  if(rule.Alignment!==undefined&&!ALIGNMENTS.has(rule.Alignment)) throw new Error(`Validator: invalid Alignment for ${label}`);
  if(rule.Distribution!==undefined&&!DISTRIBUTIONS.has(rule.Distribution)) throw new Error(`Validator: invalid Distribution for ${label}`);
  if(rule.Direction!==undefined&&!DIRECTIONS.has(rule.Direction)) throw new Error(`Validator: invalid Direction for ${label}`);
  if(rule.Parallax!==undefined&&!isFiniteNumber(rule.Parallax)) throw new Error(`Validator: invalid Parallax for ${label}`);
  if(rule.PanelTransparency!==undefined){if(!allowPanelEffects) throw new Error(`Validator: PanelTransparency is not allowed for ${label}`);if(!isTransparency(rule.PanelTransparency)) throw new Error(`Validator: PanelTransparency for ${label} must be 0..1`)}
  if(rule.Shadow!==undefined){if(!allowPanelEffects) throw new Error(`Validator: Shadow is not allowed for ${label}`);if(!isNonNegativeNumber(rule.Shadow)) throw new Error(`Validator: Shadow for ${label} must be non-negative`)}
}

export function validatePLang(pLang,setData={}){
  if(!Array.isArray(pLang)) throw new Error('Validator: SetLang.Data must be BasePanel[]');
  const logins=new Set();
  const add=(login,label)=>{if(!isNonEmptyString(login)) throw new Error(`Validator: ${label}.Login required`);if(logins.has(login)) throw new Error(`Validator: duplicate Login "${login}"`);logins.add(login)};
  const checkFill=(p,label)=>{for(const key of ['FillHorizontal','FillVertical']) if(p[key]!==undefined&&typeof p[key]!=='boolean') throw new Error(`Validator: ${key} for ${label} must be boolean`)};
  const checkContainer=c=>{add(c.Login,'Container');const p=c.Properties??{};validateVisualRule(p,`Container "${c.Login}"`,false);checkFill(p,`Container "${c.Login}"`);if(p.Order!==undefined&&!ORDERS.has(p.Order)) throw new Error(`Validator: invalid Order for Container "${c.Login}"`);if(p.HorizontalAlignment!==undefined&&!H_ALIGN.has(p.HorizontalAlignment)) throw new Error(`Validator: invalid HorizontalAlignment for Container "${c.Login}"`);if(p.VerticalAlignment!==undefined&&!V_ALIGN.has(p.VerticalAlignment)) throw new Error(`Validator: invalid VerticalAlignment for Container "${c.Login}"`);if(p.Flip!==undefined||p.Orientation!==undefined) throw new Error(`Validator: Container "${c.Login}" uses obsolete Flip/Orientation layout properties`)};
  const checkLayout=(items,label)=>{if(!Array.isArray(items)) throw new Error(`Validator: ${label}.Layout must be an array`);for(const item of items){if(item?.Type==='Group') checkGroup(item);else if(item?.Type==='Container'||item?.Login!==undefined) checkContainer(item);else throw new Error(`Validator: ${label}.Layout accepts only Group or Container`)}};
  const checkGroup=g=>{const p=g.Properties??{};const allowed=new Set(['Orientation','Width','Height','FillHorizontal','FillVertical','Gap']);for(const k of Object.keys(p)) if(!allowed.has(k)) throw new Error(`Validator: Group property ${k} is not allowed`);for(const k of ['Width','Height','Gap']) if(p[k]!==undefined&&!isNonNegativeNumber(p[k])) throw new Error(`Validator: Group.${k} must be non-negative`);checkFill(p,'Group');if(!DIRECTIONS.has(p.Orientation)) throw new Error('Validator: Group.Properties.Orientation must be Horizontal or Vertical');if(g.Login!==undefined) throw new Error('Validator: Group must not have Login');checkLayout(g.Layout??[],'Group')};
  const panelLayout=(node,label)=>{if(node.Layout!==undefined&&node.Containers!==undefined) throw new Error(`Validator: ${label} cannot define both Layout and legacy Containers`);if(node.Layout!==undefined) checkLayout(node.Layout,label);else{if(!Array.isArray(node.Containers)) throw new Error(`Validator: ${label}.Layout or legacy Containers required`);node.Containers.forEach(checkContainer)}};
  const checkActive=(a,aggregate=false)=>{add(a.Login,aggregate?'AggregateActivePanel':'ActivePanel');validateVisualRule(a.Properties??{},`${aggregate?'AggregateActivePanel':'ActivePanel'} "${a.Login}"`,true);panelLayout(a,a.Login)};
  const checkSimple=sp=>{add(sp.Login,'SimplePanel');const p={...(sp.Properties??{})};const ag=p.AggregateActivePanels??[];delete p.AggregateActivePanels;validateVisualRule(p,`SimplePanel "${sp.Login}"`,true);if(!Array.isArray(ag)||ag.length>1) throw new Error(`Validator: ${sp.Login}.Properties.AggregateActivePanels must contain 0..1 item`);ag.forEach(x=>checkActive(x,true));panelLayout(sp,sp.Login);if(!Array.isArray(sp.ActivePanels)) throw new Error(`Validator: ${sp.Login}.ActivePanels required`);sp.ActivePanels.forEach(x=>checkActive(x,false))};
  for(const bp of pLang){add(bp.Login,'BasePanel');validateVisualRule(bp.Properties??{},`BasePanel "${bp.Login}"`,false);panelLayout(bp,bp.Login);if(!Array.isArray(bp.SimplePanels)) throw new Error(`Validator: ${bp.Login}.SimplePanels required`);bp.SimplePanels.forEach(checkSimple)}
  for(const login of Object.keys(setData)) if(!logins.has(login)) throw new Error(`Validator: SetData references unknown Login "${login}"`);
  return true;
}

export function validateSetRender(renderSet={}){
  for(const forbidden of ['Elements','Types','Global']) if(renderSet[forbidden]!==undefined) throw new Error(`Validator: SetRender.${forbidden} is forbidden; object visuals belong to SetLang`);
  for(const p of ['Transparency','TextTransparency','PictureTransparency']) if(!isTransparency(renderSet[p])) throw new Error(`Validator: SetRender.${p} must be 0..1`);
  if(renderSet.Parallax!==undefined&&!isFiniteNumber(renderSet.Parallax)) throw new Error('Validator: SetRender.Parallax must be finite');
  return true;
}
