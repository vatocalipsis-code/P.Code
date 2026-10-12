import {validateControlAction,validateControlTargets} from './control-action.js';
import {validateActionMenu} from './action-menu.js';
import {validateSceneEffects} from './scene-effects.js';
import {validateVector} from './vector.js';
/** P.Code contract validators. */
import {validateNumericEditor,validateDecimalInput} from './numeric-editor.js';
function isTransparency(v){return typeof v==="number"&&Number.isFinite(v)&&v>=0&&v<=1}
function isFiniteNumber(v){return typeof v==="number"&&Number.isFinite(v)}
function isNonNegativeNumber(v){return isFiniteNumber(v)&&v>=0}
function isNonEmptyString(v){return typeof v==="string"&&v.length>0}
function fail(message){throw new Error("Validator: "+message)}
const ALIGNMENTS=new Set(["Start","Center","End","Stretch"]);
const DISTRIBUTIONS=new Set(["Start","Center","End","Between","Around","Evenly"]);
const DIRECTIONS=new Set(["Horizontal","Vertical"]);
const ORDERS=new Set(["Positive","Negative"]);
const H_ALIGN=new Set(["Left","Center","Right"]);
const V_ALIGN=new Set(["Top","Center","Bottom"]);
const INPUT_TYPES=new Set(["Text","Secret","Number","Date","Choice","Multiline","Range","Checkbox"]);
const INPUT_MODES=new Set(["text","decimal","numeric","email","tel","url","search"]);
const VALIDATION_STATES=new Set(["None","Valid","Invalid"]);
const EDITABLE_INPUT_CAPABILITY="pcode.editable-input.v1";
const STRING_RULES=["Background","BorderColor","BorderLeftColor","BorderRightColor","BorderTopColor","BorderBottomColor","TextColor","PictureTint"];
const NON_NEGATIVE_RULES=["BorderWidth","BorderLeftWidth","BorderRightWidth","BorderTopWidth","BorderBottomWidth","Width","MinWidth","MinHeight","Padding","Gap","FontSize"];
const TEXT_OVERFLOWS=new Set(["Ellipsis","Wrap","Clip"]);
// A misspelled or newer visual property must not silently produce a partial skin.
// New renderer features extend this vocabulary and its renderer together.
const VISUAL_RULES=new Set([
  ...STRING_RULES,...NON_NEGATIVE_RULES,
  "Height","TextOverflow","FontWeight","Alignment","Distribution","Direction",
  "Parallax","PanelTransparency","Shadow","OnPress","OffPress",
  "FillHorizontal","FillVertical","Order","HorizontalAlignment","VerticalAlignment",
  "Font","SecretGroup","SecretResetSource","PlaceholderSource","PlaceholderFormat","OpenPickerOnClick","InputType","InputMode","Placeholder","AriaLabel","Source",
  "OnInput","OnChange","OnSubmit","OnFocus","OnBlur","ReadOnly","Disabled","Required","Visible",
  "CornerRadius","Repeat","RepeatIds","Class","Format","StateSource","VisibleSource","ExpandedSource","PressedSource","LabelSource","TitleSource","LabelTemplate",
  "EmptyChoice","ChoicesSource","EnabledSource","ReadOnlySource","ErrorSource","ChoiceValue","ChoiceLabel","ChoiceAvailableField","UnavailableSuffix","EmptyPlaceholder","Min","Max","Step","MaxLength","Autocomplete",
  "Text","Role","AriaLevel","Sequence","Vector","ControlAction","Modal","ModalEnter","ModalExit","ActionMenu","ModalClass","Dismiss","NativeButton","Route","Feedback","NumericEditor","DecimalInput","SceneEffects","Linkify","Rows"
]);
const RENDER_RULES=new Set([
  "PanelSpacing","BackgroundColor","PanelColor","BorderColor","TextColor",
  "Transparency","TextTransparency","PictureTransparency","Parallax","TiltParallax"
]);


function decodeBase64(value,label){
  if(!isNonEmptyString(value)||!/^[A-Za-z0-9+/]*={0,2}$/.test(value)||value.length%4!==0)fail(label+" must be base64");
  try{
    const binary=globalThis.atob(value);
    return Uint8Array.from(binary,ch=>ch.charCodeAt(0));
  }catch{fail(label+" must be base64")}
}
function hasPrefix(bytes,prefix){return prefix.every((value,index)=>bytes[index]===value)}
export function validateResources(resources){
  if(resources===undefined||resources===null)return true;
  if(!resources||typeof resources!=="object"||Array.isArray(resources))fail("Resources must be an object");
  if(resources.Version!==1)fail("Resources.Version must be 1");
  const fonts=resources.Fonts??[],pictures=resources.Pictures??[];
  if(!Array.isArray(fonts)||fonts.length>2)fail("Resources.Fonts must contain 0..2 items");
  if(!Array.isArray(pictures))fail("Resources.Pictures must be an array");
  const validate=(items,kind,mime,magic)=>{
    const names=new Set();
    for(const item of items){
      if(!item||typeof item!=="object"||Array.isArray(item))fail("Resources."+kind+" item must be an object");
      if(!isNonEmptyString(item.Name))fail("Resources."+kind+" resource Name required");
      if(names.has(item.Name))fail("duplicate Resources."+kind+" name "+item.Name);
      names.add(item.Name);
      if(item.Mime!==mime)fail("Resources."+kind+" "+item.Name+" Mime must be "+mime);
      const bytes=decodeBase64(item.Data,"Resources."+kind+" "+item.Name+".Data");
      if(!hasPrefix(bytes,magic))fail("Resources."+kind+" "+item.Name+" payload does not match "+mime);
    }
    return names;
  };
  const fontNames=validate(fonts,"Fonts","font/woff2",[0x77,0x4f,0x46,0x32]);
  const pictureNames=validate(pictures,"Pictures","image/png",[0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);
  return {fontNames,pictureNames};
}

function validateEventToken(value,label){
  if(value===undefined||value===null)return;
  if(!isNonEmptyString(value))fail(label+" must be null or a non-empty opaque string");
  if(value==="NOT_YET_SPECIFIED")fail(label+" must not use NOT_YET_SPECIFIED");
}
function usesUnitPlacement(format,depth=0){if(depth>8)fail('Format exceeds nesting limit');return Boolean(format?.UnitPlacement)||Object.values(format?.Parts??{}).some(part=>usesUnitPlacement(part?.Format,depth+1))}
function usesDecimalProjection(format,depth=0){if(depth>8)fail('Format exceeds nesting limit');return format?.Precision!==undefined||format?.Output!==undefined||Object.values(format?.Parts??{}).some(part=>usesDecimalProjection(part?.Format,depth+1))}
function usesNegativeSign(format,depth=0){if(depth>8)fail('Format exceeds nesting limit');return format?.NegativeSign!==undefined||Object.values(format?.Parts??{}).some(part=>usesNegativeSign(part?.Format,depth+1))}
export function validateFormat(f,label='Format',depth=0){
 if(depth>8||!f||typeof f!=='object'||Array.isArray(f)||!['Text','Picture','Decimal','DateTime','Composite'].includes(f.Kind))fail('Invalid Format for '+label);
 if(Object.keys(f).some(key=>!['Kind','Map','Fallback','Absolute','ShowUnit','GroupSeparator','DecimalSeparator','Locale','Options','DateTimeSeparator','Template','ListSeparator','Prefix','Suffix','Parts','TrimFraction','UnitPlacement','NegativeSign','Precision','Rounding','ReciprocalSource','Output'].includes(key)))fail('Unknown Format property for '+label);
 if(f.Kind==='Composite'){
  if(!f.Parts||typeof f.Parts!=='object'||Array.isArray(f.Parts)||Object.keys(f.Parts).length>64)fail('Composite Format requires up to 64 named parts');
  for(const part of Object.values(f.Parts)){
   if(!part||typeof part!=='object'||Array.isArray(part)||Object.keys(part).some(key=>!['Text','Source','Format','When','Unless','Equals'].includes(key)))fail('Invalid Composite part');
   const path=value=>typeof value==='string'&&/^[$@]\.[a-zA-Z0-9_.-]+$/.test(value);
   for(const key of ['When','Unless'])if(part[key]!==undefined&&!path(part[key]))fail('Invalid Composite condition');
   if(Object.hasOwn(part,'Equals')&&(!part.When||!['string','boolean','number'].includes(typeof part.Equals)))fail('Invalid Composite equality');
   if(Object.hasOwn(part,'Text')){if(typeof part.Text!=='string'||part.Source!==undefined||part.Format!==undefined)fail('Invalid Composite literal')}
   else {if(!path(part.Source))fail('Composite source must be a semantic path');validateFormat(part.Format,label,depth+1)}
  }
 }else if(f.Parts!==undefined)fail('Parts require Composite Format');
 if(f.Map!==undefined){
  if(!['Text','Picture'].includes(f.Kind)||!f.Map||typeof f.Map!=='object'||Array.isArray(f.Map)||Object.values(f.Map).some(value=>typeof value!=='string'))fail('Invalid Format map');
 }
 if(f.Kind==='Picture'){
  if(!f.Map)fail('Picture Format requires a map');
  for(const url of Object.values(f.Map))if(!isCanonicalImageFile(url))fail('Picture Format must use local images');
  if(f.Fallback!==undefined&&!isCanonicalImageFile(f.Fallback))fail('Picture fallback must use a local image');
 }
 if(f.Output!==undefined&&(f.Kind!=='Decimal'||f.Output!=='Text'))fail('Output requires Decimal and Text');
 if(f.Precision!==undefined&&(f.Kind!=='Decimal'||!Number.isInteger(f.Precision)||f.Precision<0||f.Precision>12))fail('Precision requires Decimal and an integer 0..12');
 if(f.Rounding!==undefined&&(f.Precision===undefined||!['Truncate','HalfTowardZero'].includes(f.Rounding)))fail('Rounding requires Precision and a supported rounding rule');
 if(f.Precision!==undefined&&f.Rounding===undefined)fail('Precision requires explicit Rounding');
 if(f.ReciprocalSource!==undefined&&(f.Precision===undefined||typeof f.ReciprocalSource!=='string'||!/^\$\.[a-zA-Z0-9_.-]+$/.test(f.ReciprocalSource)))fail('ReciprocalSource requires Precision and a global semantic path');
 if(f.NegativeSign!==undefined&&(f.Kind!=='Decimal'||!['-','−'].includes(f.NegativeSign)))fail('NegativeSign requires Decimal and a supported minus sign');
 if(f.UnitPlacement!==undefined&&(f.Kind!=='Decimal'||!['Inside','Outside'].includes(f.UnitPlacement)))fail('UnitPlacement requires Decimal and Inside or Outside');
 for(const key of ['Absolute','ShowUnit','TrimFraction'])if(f[key]!==undefined&&typeof f[key]!=='boolean')fail(key+' must be boolean');
 for(const key of ['Fallback','GroupSeparator','DecimalSeparator','Locale','DateTimeSeparator','Template','ListSeparator','Prefix','Suffix'])if(f[key]!==undefined&&typeof f[key]!=='string')fail(key+' must be string');
 if(f.Options!==undefined&&(!f.Options||typeof f.Options!=='object'||Array.isArray(f.Options)))fail('DateTime Options must be an object');
}
function validateVisualRule(rule,label,allowPanelEffects=false,allowEvents=false){
  if(!rule||typeof rule!=="object"||Array.isArray(rule))fail("Properties for "+label+" must be an object");
  for(const key of Object.keys(rule))if(!VISUAL_RULES.has(key))fail("unsupported property "+key+" for "+label);
  for(const p of STRING_RULES)if(rule[p]!==undefined&&!isNonEmptyString(rule[p]))fail(p+" for "+label+" must be a non-empty string");
  for(const p of NON_NEGATIVE_RULES)if(rule[p]!==undefined&&!isNonNegativeNumber(rule[p]))fail(p+" for "+label+" must be non-negative");
  if(rule.Height!==undefined&&rule.Height!=="Auto"&&!isNonNegativeNumber(rule.Height))fail("Height for "+label+" must be Auto or non-negative");
  if(rule.TextOverflow!==undefined&&!TEXT_OVERFLOWS.has(rule.TextOverflow))fail("invalid TextOverflow for "+label);
  if(rule.TextOverflow!==undefined&&!label.startsWith("Container "))fail("TextOverflow is only allowed for Container");
  if(rule.FontWeight!==undefined&&(!Number.isInteger(rule.FontWeight)||rule.FontWeight<1||rule.FontWeight>1000))fail("FontWeight for "+label+" must be 1..1000");
  if(rule.Alignment!==undefined&&!ALIGNMENTS.has(rule.Alignment))fail("invalid Alignment for "+label);
  if(rule.Distribution!==undefined&&!DISTRIBUTIONS.has(rule.Distribution))fail("invalid Distribution for "+label);
  if(rule.Direction!==undefined&&!DIRECTIONS.has(rule.Direction))fail("invalid Direction for "+label);
  if(rule.Parallax!==undefined&&!isFiniteNumber(rule.Parallax))fail("invalid Parallax for "+label);
  if(rule.CornerRadius!==undefined&&!isNonNegativeNumber(rule.CornerRadius))fail("CornerRadius for "+label+" must be non-negative");
  if(rule.Repeat!==undefined&&(! /^(ActivePanel|SimplePanel|Flow) /.test(label)||!isNonEmptyString(rule.Repeat)))fail("Repeat for "+label+" requires a panel and a collection Login");
  if(rule.RepeatIds!==undefined){
    if(!rule.Repeat||!Array.isArray(rule.RepeatIds)||rule.RepeatIds.length>5000||rule.RepeatIds.some(id=>!isNonEmptyString(id))||new Set(rule.RepeatIds).size!==rule.RepeatIds.length)fail('RepeatIds requires a Repeat and unique string IDs');
  }
  if(rule.Class!==undefined&&(typeof rule.Class!=="string"||!/^[-_a-zA-Z][-_a-zA-Z0-9]*(?:\s+[-_a-zA-Z][-_a-zA-Z0-9]*)*$/.test(rule.Class)))fail("Class for "+label+" must be local CSS class names");
  if(rule.ActionMenu!==undefined){
    if(!label.startsWith('ActivePanel ')||rule.NativeButton===true)fail('ActionMenu requires a non-native ActivePanel anchor');
    if(rule.ActionMenu.Trigger==='Press'&&(rule.OffPress||rule.OnPress))fail('Press ActionMenu owns anchor activation');
    validateActionMenu(rule.ActionMenu,{picture:isCanonicalImageFile,format:validateFormat,event:validateEventToken});
  }
  if(rule.NumericEditor!==undefined)validateNumericEditor(rule.NumericEditor,label);
  if(rule.DecimalInput!==undefined)validateDecimalInput(rule.DecimalInput,label);
  if(rule.Feedback!==undefined){
    const f=rule.Feedback;
    if(!label.startsWith('BasePanel ')||!f||typeof f!=='object'||Array.isArray(f))fail('Feedback requires a BasePanel');
    if(Object.keys(f).some(key=>!['Scope','Target','KeyboardExclude','PressedClass','HaloClass','MinWidth','MinHeight','ReleaseDelay','HaloTimeout'].includes(key)))fail('Unknown Feedback property');
    if(!['Root','Document'].includes(f.Scope))fail('Invalid Feedback scope');
    for(const key of ['Target','KeyboardExclude'])if(!isNonEmptyString(f[key]))fail('Feedback requires selectors');
    for(const key of ['PressedClass','HaloClass'])if(typeof f[key]!=='string'||!/^[-_a-zA-Z][-_a-zA-Z0-9]*$/.test(f[key]))fail('Invalid Feedback class');
    for(const key of ['MinWidth','MinHeight'])if(!isNonNegativeNumber(f[key]))fail('Invalid Feedback geometry');
    for(const key of ['ReleaseDelay','HaloTimeout'])if(!isNonNegativeNumber(f[key])||f[key]>10000)fail('Invalid Feedback duration');
  }
  if(rule.Route!==undefined){
    const r=rule.Route;
    if(!label.startsWith('BasePanel ')||rule.Modal||!r||typeof r!=='object'||Array.isArray(r))fail('Route requires a non-modal BasePanel');
    const keys=['Id','Source','Mode','EnabledSource','DismissEnabledSource','Fallback','PanelClass','ContextClass','GroupClass','RootClass','LayerClass','ActiveClass','ExitClass','Label','LabelSelector','Speed','Acceleration','Enter','Exit','Dismiss','Outside','Escape','Exclude','Gestures'];
    if(Object.keys(r).some(key=>!keys.includes(key)))fail('Unknown Route property');
    if(!isNonEmptyString(r.Id)||!['Stack','Replace'].includes(r.Mode)||!/^\$\.[a-zA-Z0-9_.-]+$/.test(r.Source??''))fail('Invalid Route identity, source or mode');
    for(const key of ['EnabledSource','DismissEnabledSource'])if(r[key]!==undefined&&!/^\$\.[a-zA-Z0-9_.-]+$/.test(r[key]))fail('Invalid Route '+key);
    for(const key of keys.filter(key=>key.endsWith('Class')))if(r[key]!==undefined&&(typeof r[key]!=='string'||!/^[-_a-zA-Z][-_a-zA-Z0-9]*(?:\s+[-_a-zA-Z][-_a-zA-Z0-9]*)*$/.test(r[key])))fail('Invalid Route class');
    for(const key of ['Fallback','Label','LabelSelector','Exclude'])if(r[key]!==undefined&&!isNonEmptyString(r[key]))fail('Invalid Route '+key);
    for(const key of ['Enter','Exit','Escape'])if(r[key]!==undefined&&typeof r[key]!=='boolean')fail('Invalid Route '+key);
    if(r.Speed!==undefined&&(!isFiniteNumber(r.Speed)||r.Speed<=0))fail('Invalid Route speed');
    if(r.Acceleration!==undefined&&(!isNonNegativeNumber(r.Acceleration)||!r.Speed||r.Acceleration*r.Speed>2))fail('Invalid Route acceleration');
    if(r.Outside!==undefined&&!['Dismiss','Consume'].includes(r.Outside))fail('Invalid Route outside action');
    validateEventToken(r.Dismiss,label+'.Route.Dismiss');
    if((r.Outside||r.Escape)&&!r.Dismiss)fail('Route dismissal requires a command');
    if(r.Gestures!==undefined){
      const g=r.Gestures,fields=['Back','Menu','Refresh','RefreshEnabledSource','LoadingSource','BackRegion','MenuRegion','PullRegion','Target','Exclude','ScrollBoundary','RootBack','PreventZoom','IntentDistance','AxisRatio','NoticeDistance','SwipeDistance','PullDistance','IndicatorClass','SpinnerClass','FadingClass','FadeDuration','Label'];
      if(!g||typeof g!=='object'||Array.isArray(g)||Object.keys(g).some(key=>!fields.includes(key)))fail('Invalid Route gestures');
      for(const key of ['Back','Menu','Refresh'])validateEventToken(g[key],'Route gesture '+key);
      for(const key of ['RefreshEnabledSource','LoadingSource'])if(!/^\$\.[a-zA-Z0-9_.-]+$/.test(g[key]??''))fail('Invalid Route gesture source');
      for(const key of ['BackRegion','MenuRegion','PullRegion'])if(!Array.isArray(g[key])||g[key].length!==2||g[key].some(value=>!isFiniteNumber(value)||value<0||value>1)||g[key][0]>g[key][1])fail('Invalid Route gesture region');
      for(const key of ['IntentDistance','AxisRatio','NoticeDistance','SwipeDistance','PullDistance'])if(!isFiniteNumber(g[key])||g[key]<=0)fail('Invalid Route gesture threshold');
      for(const key of ['RootBack','PreventZoom'])if(g[key]!==undefined&&typeof g[key]!=='boolean')fail('Invalid Route gesture flag');
      if(g.FadeDuration!==undefined&&!isNonNegativeNumber(g.FadeDuration))fail('Invalid Route gesture duration');
      for(const key of ['Target','Exclude','ScrollBoundary','IndicatorClass','SpinnerClass','FadingClass','Label'])if(g[key]!==undefined&&!isNonEmptyString(g[key]))fail('Invalid Route gesture string');
    }
  }
  if(rule.SceneEffects!==undefined){if(!label.startsWith('BasePanel '))fail('SceneEffects require BasePanel');validateSceneEffects(rule.SceneEffects)}
  if(rule.Linkify!==undefined&&(!label.startsWith('Flow ')||typeof rule.Linkify!=='boolean'))fail('Linkify requires Flow');
  if(rule.Rows!==undefined&&(!label.startsWith('EditableInput ')||!Number.isInteger(rule.Rows)||rule.Rows<1||rule.Rows>100))fail('Invalid input Rows');
  for(const key of ['ModalEnter','ModalExit'])if(rule[key]!==undefined){
    const r=rule[key];if(rule.Modal!==true||!r||typeof r!=='object'||Array.isArray(r))fail('Invalid '+key);
    if(r.Effect==='Fade'&&key==='ModalExit'){if(Object.keys(r).some(k=>!['Effect','Duration'].includes(k))||!Number.isFinite(r.Duration)||r.Duration<0||r.Duration>1000)fail('Invalid '+key)}
    else if(r.Effect==='Slide'){if(Object.keys(r).some(k=>!['Effect','Speed','Acceleration'].includes(k))||!Number.isFinite(r.Speed)||r.Speed<1||r.Speed>100||!Number.isFinite(r.Acceleration)||r.Acceleration<0||r.Acceleration>1||r.Speed*r.Acceleration>2)fail('Invalid '+key)}
    else fail('Invalid '+key);
  }
  if(rule.Modal!==undefined){
    if(!label.startsWith('BasePanel ')||rule.Modal!==true||!rule.VisibleSource)fail('Modal requires a BasePanel and VisibleSource');
    if(rule.ModalClass!==undefined&&(typeof rule.ModalClass!=='string'||!/^[-_a-zA-Z][-_a-zA-Z0-9]*(?:\s+[-_a-zA-Z][-_a-zA-Z0-9]*)*$/.test(rule.ModalClass)))fail('Invalid ModalClass');
    validateEventToken(rule.Dismiss,label+'.Dismiss');
  }else if(rule.ModalClass!==undefined||rule.Dismiss!==undefined)fail('ModalClass and Dismiss require Modal');
  if(rule.PlaceholderSource!==undefined&&(!label.startsWith('EditableInput ')||typeof rule.PlaceholderSource!=='string'||!/^\$\.[a-zA-Z0-9_.-]+$/.test(rule.PlaceholderSource)||rule.PlaceholderFormat?.Kind!=='Text'))fail('Invalid placeholder source');
  if(rule.PlaceholderFormat!==undefined){if(!rule.PlaceholderSource)fail('PlaceholderFormat requires source');validateFormat(rule.PlaceholderFormat)}
  if(rule.SecretResetSource!==undefined&&(!rule.SecretGroup||typeof rule.SecretResetSource!=='string'||!/^\$\.[a-zA-Z0-9_.-]+$/.test(rule.SecretResetSource)))fail('Invalid SecretResetSource');
  if(rule.SecretGroup!==undefined&&(!label.startsWith('EditableInput ')||typeof rule.SecretGroup!=='string'||!/^[-a-zA-Z0-9_]{1,64}$/.test(rule.SecretGroup)))fail('Invalid SecretGroup');
  if(rule.OpenPickerOnClick!==undefined&&(!label.startsWith('EditableInput ')||typeof rule.OpenPickerOnClick!=='boolean'))fail('OpenPickerOnClick requires a Date input and boolean');
  if(rule.ControlAction!==undefined){if(!/^(?:ActivePanel|SimplePanel|Flow) /.test(label))fail('ControlAction requires an interactive panel');validateControlAction(rule.ControlAction)}
  if(rule.Text!==undefined&&((!rule.NativeButton&&!label.startsWith('Flow '))||typeof rule.Text!=='string'))fail('Text requires a NativeButton');
  if(rule.NativeButton!==undefined&&(rule.NativeButton!==true||!label.startsWith('ActivePanel ')))fail('NativeButton requires an ActivePanel');
  if(rule.Source!==undefined&&(!/^(?:Container|EditableInput|Flow) /.test(label)||!isNonEmptyString(rule.Source)))fail("Source for "+label+" requires a Container or EditableInput and a field name");
  for(const key of ['StateSource','VisibleSource','ExpandedSource','PressedSource','LabelSource','TitleSource','ChoicesSource','EnabledSource','ReadOnlySource','ErrorSource'])if(rule[key]!==undefined&&(typeof rule[key]!=='string'||!/^[$@]\.[a-zA-Z0-9_.-]+$/.test(rule[key])))fail(key+' must be a semantic path');
  if(rule.LabelTemplate!==undefined&&(!rule.LabelSource||typeof rule.LabelTemplate!=='string'))fail('LabelTemplate requires LabelSource and text');
  if(rule.Role!==undefined&&!['status','alert','log','heading','group','region','list','listitem','img','presentation','button'].includes(rule.Role))fail('Invalid semantic Role');
  if(rule.AriaLevel!==undefined&&(rule.Role!=='heading'||!Number.isInteger(rule.AriaLevel)||rule.AriaLevel<1||rule.AriaLevel>6))fail('AriaLevel requires a heading level 1..6');
  if(rule.Sequence!==undefined){
    const q=rule.Sequence;
    if(!q||typeof q!=='object'||Array.isArray(q)||Object.keys(q).some(k=>!['Source','Key','Part'].includes(k))||!/^\$\.[a-zA-Z0-9_.-]+$/.test(q.Source??'')||!isNonEmptyString(q.Key)||!Number.isInteger(q.Part??0)||(q.Part??0)<0||(q.Part??0)>99)fail('Invalid Sequence declaration');
  }
  if(rule.Vector!==undefined){if(! /^(Container|Flow) /.test(label)||rule.Source!==undefined||rule.Format!==undefined)fail("Vector requires a static Container");validateVector(rule.Vector)}
  if(rule.Format!==undefined)validateFormat(rule.Format,label);
  if(rule.PanelTransparency!==undefined){
    if(!allowPanelEffects)fail("PanelTransparency is not allowed for "+label);
    if(!isTransparency(rule.PanelTransparency))fail("PanelTransparency for "+label+" must be 0..1");
  }
  if(rule.Shadow!==undefined){
    if(!allowPanelEffects)fail("Shadow is not allowed for "+label);
    if(!isNonNegativeNumber(rule.Shadow))fail("Shadow for "+label+" must be non-negative");
  }
  if(!allowEvents&&(rule.OnPress!==undefined||rule.OffPress!==undefined))fail("events are not allowed for "+label);
  if(allowEvents){
    validateEventToken(rule.OnPress,label+".OnPress");
    validateEventToken(rule.OffPress,label+".OffPress");
  }
}

export function validateSetEnvelope(value,label){
  if(!value||typeof value!=="object"||Array.isArray(value))fail(label+" must be a Set envelope");
  if(!isNonEmptyString(value.Name))fail(label+".Name must be a non-empty string");
  if(!Number.isInteger(value.Version)||value.Version<1)fail(label+".Version must be a positive integer");
  if(value.Data===undefined)fail(label+".Data is required");
  if(label==="SetLang"&&value.ThemeContract!==undefined&&!new Set(["SelfContained","HostMapped"]).has(value.ThemeContract))
    fail("SetLang.ThemeContract must be SelfContained or HostMapped");
  if(label==="SetLang"&&value.StyleSheet!==undefined){
    if(typeof value.StyleSheet!=="string"||!value.StyleSheet.trim())fail("SetLang.StyleSheet must be non-empty CSS text");
    if(value.StyleSheet.length>2_000_000)fail("SetLang.StyleSheet is too large");
    if(/@import\b|<\/style\b|url\s*\(\s*['"]?\s*(?:https?:|\/\/|javascript:)/i.test(value.StyleSheet))
      fail("SetLang.StyleSheet cannot import CSS, load remote URLs, or contain a style closing tag");
  }
  return value.Data;
}

export function isCanonicalPngFile(value){
  if(!isNonEmptyString(value)||!value.toLowerCase().endsWith(".png"))return false;
  if(/^[a-z][a-z0-9+.-]*:/i.test(value)||value.startsWith("//")||value.includes("\\")||value.includes("\0"))return false;
  return !value.split("/").includes("..");
}
export function isCanonicalImageFile(value){
  return (isCanonicalPngFile(value)||typeof value==="string"&&/\.webp$/i.test(value)&&isCanonicalPngFile(value.slice(0,-5)+".png"));
}

function collectEditableLogins(pLang){
  const result=new Set();
  const visit=value=>{
    if(Array.isArray(value)){for(const item of value)visit(item);return}
    if(!value||typeof value!=="object")return;
    if(value.Type==="EditableInput"&&isNonEmptyString(value.Login))result.add(value.Login);
    for(const [key,item] of Object.entries(value))if(key!=="Properties")visit(item);
  };
  visit(pLang);return result;
}
function collectRepeatLogins(pLang){
  const result=new Set();
  const visit=value=>{
    if(Array.isArray(value)){for(const item of value)visit(item);return}
    if(!value||typeof value!=="object")return;
    if(value.Properties?.Repeat)result.add(value.Properties.Repeat);
    for(const [key,item] of Object.entries(value))if(key!=="Properties")visit(item);
    visit(value.Properties?.AggregateActivePanels);
  };
  visit(pLang);return result;
}
function validateValidationState(value,label){
  if(!value||typeof value!=="object"||Array.isArray(value))fail("ValidationState for "+label+" must be an object");
  if(!VALIDATION_STATES.has(value.Status))fail("ValidationState.Status for "+label+" must be None, Valid, or Invalid");
  if(value.Message!==undefined&&typeof value.Message!=="string")fail("ValidationState.Message for "+label+" must be a string");
}
export function validateSetData(data,pLang,capabilities=[],resources=null){
  if(!data||typeof data!=="object"||Array.isArray(data))fail("SetData.Data must be an object");
  const resourceIndex=validateResources(resources);
  validatePLang(pLang,data,capabilities,resources);
  const editable=collectEditableLogins(pLang);
  const repeats=collectRepeatLogins(pLang);
  for(const [login,item] of Object.entries(data)){
    if(!item||typeof item!=="object"||Array.isArray(item))fail("SetData entry for "+login+" must be an object");
    if(repeats.has(login)){
      if(!Array.isArray(item.Items)||item.Items.length>5000)fail("Items for "+login+" must be an array of at most 5000 records");
      const ids=new Set();
      for(const row of item.Items){
        if(!row||typeof row!=="object"||Array.isArray(row)||typeof row.Id!=="string"||!row.Id||ids.has(row.Id)||!row.Fields||typeof row.Fields!=="object"||Array.isArray(row.Fields))fail("invalid or duplicate repeated item in "+login);
        ids.add(row.Id);
        for(const [field,value] of Object.entries(row.Fields)){
          if(!field||!value||typeof value!=="object"||Array.isArray(value)||Object.keys(value).some(key=>!["SourceText","SourcePicture"].includes(key)))fail("invalid repeated field in "+login);
          if(value.SourceText!==undefined&&typeof value.SourceText!=="string")fail("SourceText for "+login+"."+field+" must be string");
          if(value.SourcePicture!==undefined&&!isCanonicalImageFile(value.SourcePicture))fail("SourcePicture for "+login+"."+field+" must be local image");
        }
      }
      continue;
    }
    if(editable.has(login)){
      if(item.SourceText!==undefined||item.SourcePicture!==undefined)fail("editable input data for "+login+" must use InputValue");
      if(item.InputValue!==undefined&&typeof item.InputValue!=="string")fail("InputValue for "+login+" must be a string");
      if(item.ValidationState!==undefined)validateValidationState(item.ValidationState,login);
    }else{
      if(item.InputValue!==undefined||item.ValidationState!==undefined)fail("input state for "+login+" requires EditableInput");
      if(item.SourceText!==undefined&&typeof item.SourceText!=="string")fail("SourceText for "+login+" must be a string");
      if(item.SourcePicture!==undefined){
        if(typeof item.SourcePicture!=="string")fail("SourcePicture for "+login+" must be a string");
        if(item.SourcePicture.startsWith("res:")){
          const name=item.SourcePicture.slice(4);
          if(!name||resourceIndex===true||!resourceIndex.pictureNames.has(name))fail("SourcePicture for "+login+" references missing picture resource "+name);
        }else if(!isCanonicalImageFile(item.SourcePicture))fail("SourcePicture for "+login+" must reference a local PNG/WebP file or res:<name>");
      }
    }
  }
  return true;
}

export function validatePLang(pLang,setData={},capabilities=[],resources=null){
  if((pLang??[]).filter(panel=>panel.Properties?.NumericEditor).length>1)fail('Only one NumericEditor per runtime is allowed');
  if((pLang??[]).filter(panel=>panel.Properties?.Feedback).length>1)fail('Only one Feedback scene per runtime is allowed');
  const routeIds=new Set();
  for(const panel of pLang??[]){const route=panel.Properties?.Route;if(route){const key=route.Source+'\0'+route.Id;if(routeIds.has(key))fail('Duplicate Route identity');routeIds.add(key)}}
  if(!Array.isArray(pLang))fail("SetLang.Data must be BasePanel[]");
  const capabilitySet=new Set(capabilities);
  const checkVisualCapabilities=node=>{
    if(Array.isArray(node)){node.forEach(checkVisualCapabilities);return}
    if(!node||typeof node!=="object")return;
    if((node.Properties?.Role||node.Properties?.Sequence||node.SimplePanels?.length&&!pLang.includes(node)||node.Properties?.Repeat&&node.ActivePanels)&&!capabilitySet.has('pcode.panel-composition.v1'))fail('Panel composition requires pcode.panel-composition.v1');
    if(node.Type!=='Flow'&&node.Properties?.Text!==undefined&&!capabilitySet.has('pcode.native-button-text.v1'))fail('Native button text requires pcode.native-button-text.v1');
    if(node.Properties?.SceneEffects?.AudioCapture&&!capabilitySet.has('pcode.structured-events.v1'))fail('AudioCapture requires pcode.structured-events.v1');
    if((node.Properties?.SceneEffects?.AudioCapture||node.Type==='Flow'&&node.Properties?.Tag==='canvas')&&!capabilitySet.has('pcode.audio-capture.v1'))fail('AudioCapture requires pcode.audio-capture.v1');
    if(node.Properties?.SceneEffects?.SteppedButtons&&!capabilitySet.has('pcode.stepped-buttons.v1'))fail('SteppedButtons requires pcode.stepped-buttons.v1');
    if(node.Properties?.SceneEffects?.SteppedFields&&!capabilitySet.has('pcode.stepped-fields.v1'))fail('SteppedFields requires pcode.stepped-fields.v1');
    if(node.Type==='Group'&&['Class','StateSource','EnabledSource'].some(key=>node.Properties?.[key]!==undefined)&&!capabilitySet.has('pcode.group-presentation.v1'))fail('Group presentation requires pcode.group-presentation.v1');
    if(node.Type==='Group'&&node.Properties?.VisibleSource&&!capabilitySet.has('pcode.group-state.v1'))fail('Group visibility requires pcode.group-state.v1');
    if(node.Properties?.SceneEffects?.Confirm&&!capabilitySet.has('pcode.native-confirm.v1'))fail('Confirm requires pcode.native-confirm.v1');
    if(node.Properties?.InputType==='Choice'&&node.Properties?.Format&&!node.Properties.Format.Template&&!capabilitySet.has('pcode.choice-format.v1'))fail('Choice formatting requires pcode.choice-format.v1');
    if(node.Properties?.SceneEffects&&!capabilitySet.has('pcode.scene-effects.v1'))fail('SceneEffects requires pcode.scene-effects.v1');
    if(node.Type==='Flow'&&!capabilitySet.has('pcode.flow-layout.v1'))fail('Flow requires pcode.flow-layout.v1');
    if(node.Properties?.Vector&&!capabilitySet.has('pcode.vector.v1'))fail('Vector requires pcode.vector.v1');
    if(node.Properties?.CornerRadius!==undefined&&!capabilitySet.has("pcode.corner-radius.v1"))
      fail("CornerRadius requires negotiated pcode.corner-radius.v1");
    if(node.Properties?.Parallax&&!capabilitySet.has("pcode.parallax.v1"))
      fail("Parallax requires negotiated pcode.parallax.v1");
    if(node.Properties?.Repeat&&!capabilitySet.has("pcode.semantic-repeat.v1"))
      fail("Repeat requires negotiated pcode.semantic-repeat.v1");
    if(Object.entries(node.Properties??{}).some(([key,value])=>['Format','StateSource','VisibleSource','ExpandedSource','PressedSource','LabelSource','TitleSource','ChoicesSource','EnabledSource','ReadOnlySource','ErrorSource'].includes(key)||['Source','Repeat'].includes(key)&&/^[$@]\./.test(value))&&!capabilitySet.has('pcode.semantic-model.v1'))fail('Semantic sources require negotiated pcode.semantic-model.v1');
    if((node.Properties?.NumericEditor||node.Properties?.DecimalInput)&&!capabilitySet.has('pcode.numeric-editor.v1'))fail('NumericEditor requires pcode.numeric-editor.v1');
    if((node.Properties?.NumericEditor||node.Properties?.DecimalInput)&&!capabilitySet.has('pcode.semantic-model.v1'))fail('NumericEditor requires pcode.semantic-model.v1');
    if(node.Properties?.DecimalInput&&!(pLang??[]).some(panel=>panel.Properties?.NumericEditor))fail('DecimalInput requires a NumericEditor declaration');
    if(node.Properties?.RepeatIds&&!capabilitySet.has('pcode.repeat-subset.v1'))fail('RepeatIds requires pcode.repeat-subset.v1');
    if(node.Properties?.PlaceholderSource&&!capabilitySet.has('pcode.secret-controls.v1'))fail('PlaceholderSource requires pcode.secret-controls.v1');
    if((node.Properties?.SecretResetSource||node.Properties?.PlaceholderSource)&&!capabilitySet.has('pcode.semantic-model.v1'))fail('SecretResetSource requires pcode.semantic-model.v1');
    if(node.Properties?.ControlAction?.WhenSource&&!capabilitySet.has('pcode.semantic-model.v1'))fail('ControlAction condition requires pcode.semantic-model.v1');
    if((node.Properties?.SecretGroup||['ToggleSecret','RevealSecret'].includes(node.Properties?.ControlAction?.Kind))&&!capabilitySet.has('pcode.secret-controls.v1'))fail('SecretGroup requires pcode.secret-controls.v1');
    if((node.Properties?.ControlAction||node.Properties?.OpenPickerOnClick!==undefined)&&!capabilitySet.has('pcode.control-action.v1'))fail('ControlAction requires pcode.control-action.v1');
    if(node.Properties?.ActionMenu&&!capabilitySet.has('pcode.action-menu.v1'))fail('ActionMenu requires pcode.action-menu.v1');
    if(node.Properties?.ActionMenu&&!capabilitySet.has('pcode.semantic-model.v1')&&(node.Properties.ActionMenu.EnabledSource||Object.values(node.Properties.ActionMenu.Items??{}).some(item=>item.Source||item.EnabledSource||item.VisibleSource)))fail('ActionMenu sources require pcode.semantic-model.v1');
    if(node.Properties?.TitleSource&&!capabilitySet.has('pcode.semantic-title.v1'))fail('Semantic titles require pcode.semantic-title.v1');
    if((node.Properties?.PressedSource||node.Properties?.LabelSource)&&!capabilitySet.has('pcode.semantic-accessibility.v1'))fail('Semantic accessibility requires pcode.semantic-accessibility.v1');
    if(usesNegativeSign(node.Properties?.Format)&&!capabilitySet.has('pcode.decimal-sign.v1'))fail('NegativeSign requires pcode.decimal-sign.v1');
    if(usesUnitPlacement(node.Properties?.Format)&&!capabilitySet.has('pcode.decimal-unit-layout.v1'))fail('UnitPlacement requires pcode.decimal-unit-layout.v1');
    if(node.Properties?.DecimalInput?.Preview&&!capabilitySet.has('pcode.decimal-preview.v1'))fail('DecimalInput Preview requires pcode.decimal-preview.v1');
    if(node.Properties?.Feedback&&!capabilitySet.has('pcode.control-feedback.v1'))fail('Feedback requires pcode.control-feedback.v1');
    if(usesDecimalProjection(node.Properties?.Format)&&!capabilitySet.has('pcode.decimal-projection.v1'))fail('Decimal projection requires pcode.decimal-projection.v1');
    if((node.Properties?.ModalEnter||node.Properties?.ModalExit?.Effect==='Slide')&&!capabilitySet.has('pcode.modal-slide.v1'))fail('Modal slide requires pcode.modal-slide.v1');
    if(node.Properties?.ModalExit&&!capabilitySet.has('pcode.modal-transition.v1'))fail('ModalExit requires pcode.modal-transition.v1');
    if(node.Properties?.Modal&&!capabilitySet.has('pcode.semantic-controls.v1'))fail('Modal requires pcode.semantic-controls.v1');
    if((node.Properties?.Format?.Kind==='Composite'||node.Properties?.Format?.Kind==='Text'&&node.Properties.Format.Map||node.Properties?.Format?.TrimFraction)&&!capabilitySet.has('pcode.composite-format.v1'))fail('Extended Format requires pcode.composite-format.v1');
    if(node.Properties?.Route&&!capabilitySet.has('pcode.semantic-routes.v1'))fail('Route requires pcode.semantic-routes.v1');
    if(node.Properties?.Route&&!capabilitySet.has('pcode.semantic-model.v1'))fail('Route requires pcode.semantic-model.v1');
    if(node.Properties?.NativeButton&&!capabilitySet.has('pcode.semantic-controls.v1'))fail('NativeButton requires pcode.semantic-controls.v1');
    for(const [key,value] of Object.entries(node))if(key!=="Properties")checkVisualCapabilities(value);
    checkVisualCapabilities(node.Properties?.AggregateActivePanels);
  };
  checkVisualCapabilities(pLang);
  const resourceIndex=validateResources(resources);
  const logins=new Set(),repeats=collectRepeatLogins(pLang);
  const add=(login,label)=>{if(!isNonEmptyString(login))fail(label+".Login required");if(logins.has(login))fail("duplicate Login "+login);logins.add(login)};
  const checkFill=(p,label)=>{for(const key of ["FillHorizontal","FillVertical"])if(p[key]!==undefined&&typeof p[key]!=="boolean")fail(key+" for "+label+" must be boolean")};
  const checkContainer=c=>{add(c.Login,"Container");const p=c.Properties??{};validateVisualRule(p,"Container "+c.Login,false);if(p.Font!==undefined){if(!isNonEmptyString(p.Font))fail("Font for Container "+c.Login+" must be a resource name");if(resourceIndex===true||!resourceIndex.fontNames.has(p.Font))fail("Font for Container "+c.Login+" references missing font resource "+p.Font)}checkFill(p,"Container "+c.Login);if(p.Order!==undefined&&!ORDERS.has(p.Order))fail("invalid Order for Container "+c.Login);if(p.HorizontalAlignment!==undefined&&!H_ALIGN.has(p.HorizontalAlignment))fail("invalid HorizontalAlignment for Container "+c.Login);if(p.VerticalAlignment!==undefined&&!V_ALIGN.has(p.VerticalAlignment))fail("invalid VerticalAlignment for Container "+c.Login);if(p.Flip!==undefined||p.Orientation!==undefined)fail("Container "+c.Login+" uses obsolete Flip/Orientation layout properties")};
  const checkInput=input=>{
    if(!capabilitySet.has(EDITABLE_INPUT_CAPABILITY))fail("EditableInput requires negotiated "+EDITABLE_INPUT_CAPABILITY);
    add(input.Login,"EditableInput");const p={...(input.Properties??{})};
    for(const key of ["InputType","Placeholder","Disabled","Required","AriaLabel","InputMode","OnFocus","OnBlur","OnInput","OnChange","OnSubmit"])delete p[key];
    validateVisualRule(p,"EditableInput "+input.Login,false);checkFill(p,"EditableInput "+input.Login);
    const source=input.Properties??{};
    if(source.SecretGroup!==undefined&&source.InputType!=='Secret')fail('SecretGroup requires Secret input');
    if(source.OpenPickerOnClick!==undefined&&source.InputType!=='Date')fail('OpenPickerOnClick requires a Date input');
    if(source.DecimalInput&&!['Number','Text'].includes(source.InputType??'Text'))fail('DecimalInput requires text or number input');
    if(source.InputType!==undefined&&!INPUT_TYPES.has(source.InputType))fail("invalid InputType for EditableInput "+input.Login);
    if(['Choice','Multiline','Range','Checkbox'].includes(source.InputType)&&!capabilitySet.has('pcode.semantic-controls.v1'))fail('Input type requires pcode.semantic-controls.v1');
    if(source.EmptyChoice!==undefined){if(typeof source.EmptyChoice!=='boolean'||source.InputType!=='Choice')fail('EmptyChoice requires a Choice boolean');if(!capabilitySet.has('pcode.choice-empty.v1'))fail('EmptyChoice requires pcode.choice-empty.v1')}
    for(const key of ["Placeholder","AriaLabel","ChoiceValue","ChoiceLabel","ChoiceAvailableField","UnavailableSuffix","EmptyPlaceholder","Autocomplete"])if(source[key]!==undefined&&typeof source[key]!=="string")fail(key+" for EditableInput "+input.Login+" must be a string");
    if(source.MaxLength!==undefined&&(!Number.isInteger(source.MaxLength)||source.MaxLength<0))fail('MaxLength must be a non-negative integer');
    for(const key of ["Disabled","Required","ReadOnly"])if(source[key]!==undefined&&typeof source[key]!=="boolean")fail(key+" for EditableInput "+input.Login+" must be boolean");
    for(const key of ['Min','Max','Step'])if(source[key]!==undefined&&!isFiniteNumber(source[key]))fail(key+' must be finite');
    if(source.Step!==undefined&&source.Step<=0)fail('Step must be positive');
    if(source.Min!==undefined&&source.Max!==undefined&&source.Min>source.Max)fail('Min must not exceed Max');
    if(source.InputType==='Choice'&&!source.ChoicesSource)fail('Choice requires ChoicesSource');
    if(source.InputMode!==undefined&&!INPUT_MODES.has(source.InputMode))fail("invalid InputMode for EditableInput "+input.Login);
    for(const key of ["OnFocus","OnBlur","OnInput","OnChange","OnSubmit"])validateEventToken(source[key],"EditableInput "+input.Login+"."+key);
  };
  const checkFlow=(node,depth)=>{
    if(depth>32)fail('Flow nesting exceeds 32');
    add(node.Login,'Flow');const p={...(node.Properties??{})},tag=p.Tag;
    if(!['div','section','article','p','span','strong','small','time','label','button','h1','h2','h3','canvas'].includes(tag))fail('Invalid Flow Tag');
    const allowed=new Set(['ControlAction','Tag','Class','Text','Source','Format','Repeat','RepeatIds','StateSource','VisibleSource','ExpandedSource','EnabledSource','PressedSource','LabelSource','TitleSource','LabelTemplate','AriaLabel','Role','AriaLevel','OffPress','Sequence','Linkify','Vector']);
    for(const key of Object.keys(p))if(!allowed.has(key))fail('Unsupported Flow property '+key);
    if(p.Source!==undefined&&!/^[$@]\.[a-zA-Z0-9_.-]+$/.test(p.Source))fail('Flow Source must be semantic');
    if(p.Repeat!==undefined&&!/^\$\.[a-zA-Z0-9_.-]+$/.test(p.Repeat))fail('Flow Repeat must be semantic');
    if((p.OffPress||p.ControlAction)&&tag!=='button'&&(p.Role!=='button'||!capabilitySet.has('pcode.panel-action.v1')))fail('Flow actions require a native button or a negotiated button role');
    if([p.Text,p.Source,p.Vector].filter(value=>value!==undefined).length>1||(p.Text!==undefined||p.Source!==undefined||p.Vector!==undefined)&&node.Layout?.length)fail('Flow content must have one owner');
    delete p.Tag;validateVisualRule(p,'Flow '+node.Login,false,tag==='button'||p.Role==='button');
    checkLayout(node.Layout??[],node.Login,depth);
  };
  const checkLayout=(items,label,depth=0)=>{if(depth>32)fail('Layout nesting exceeds 32');if(!Array.isArray(items))fail(label+'.Layout must be an array');for(const item of items){if(['SimplePanel','ActivePanel'].includes(item?.Type)){if(!capabilitySet.has('pcode.layout-panels.v1'))fail('Panels in Layout require pcode.layout-panels.v1');if(item.Type==='SimplePanel')checkSimple(item,depth+1);else checkActive(item,false,depth+1)}else if(item?.Type==='Flow')checkFlow(item,depth+1);else if(item?.Type==='Group')checkGroup(item,depth+1);else if(item?.Type==='EditableInput')checkInput(item);else if(item?.Type==='Container'||item?.Login!==undefined)checkContainer(item);else fail(label+'.Layout accepts only Group, Container, EditableInput or Flow')}};
  const checkGroup=(g,depth=0)=>{const p=g.Properties??{};const allowed=new Set(["Orientation","Width","MinWidth","Height","MinHeight","FillHorizontal","FillVertical","Gap","VisibleSource","Class","StateSource","EnabledSource"]);for(const k of Object.keys(p))if(!allowed.has(k))fail("Group property "+k+" is not allowed");for(const k of ["Width","MinWidth","MinHeight","Gap"])if(p[k]!==undefined&&!isNonNegativeNumber(p[k]))fail("Group."+k+" must be non-negative");if(p.Height!==undefined&&p.Height!=="Auto"&&!isNonNegativeNumber(p.Height))fail("Group.Height must be Auto or non-negative");checkFill(p,"Group");if(!DIRECTIONS.has(p.Orientation))fail("Group.Properties.Orientation must be Horizontal or Vertical");if(g.Login!==undefined)fail("Group must not have Login");for(const key of ["VisibleSource","StateSource","EnabledSource"])if(p[key]!==undefined&&(typeof p[key]!=="string"||!/^[$@]\.[a-zA-Z0-9_.-]+$/.test(p[key])))fail("Group."+key+" must be a semantic path");if(p.Class!==undefined)validateVisualRule({Class:p.Class},"Group");checkLayout(g.Layout??[],"Group",depth)};
  const panelLayout=(node,label,depth=0)=>{if(node.Layout!==undefined&&node.Containers!==undefined)fail(label+" cannot define both Layout and legacy Containers");if(node.Layout!==undefined)checkLayout(node.Layout,label,depth);else{if(!Array.isArray(node.Containers))fail(label+".Layout or legacy Containers required");node.Containers.forEach(checkContainer)}};
  const checkActive=(a,aggregate=false,depth=0)=>{if(depth>32)fail("Panel nesting exceeds 32");if(a.Properties?.Text!==undefined&&(a.Layout?.length||a.Containers?.length))fail('NativeButton Text cannot have a child layout');add(a.Login,aggregate?"AggregateActivePanel":"ActivePanel");validateVisualRule(a.Properties??{},(aggregate?"AggregateActivePanel ":"ActivePanel ")+a.Login,true,true);panelLayout(a,a.Login,depth)};
  const checkSimple=(sp,depth=0)=>{if(depth>32)fail("Panel nesting exceeds 32");add(sp.Login,"SimplePanel");const p={...(sp.Properties??{})};const ag=p.AggregateActivePanels??[];delete p.AggregateActivePanels;if(p.OffPress&&!capabilitySet.has("pcode.panel-action.v1"))fail("Panel action requires pcode.panel-action.v1");if(p.OnPress!==undefined)fail("SimplePanel only supports OffPress");validateVisualRule(p,"SimplePanel "+sp.Login,true,Boolean(p.OffPress));if(!Array.isArray(ag)||ag.length>1)fail(sp.Login+".Properties.AggregateActivePanels must contain 0..1 item");ag.forEach(x=>checkActive(x,true,depth+1));panelLayout(sp,sp.Login,depth);if(!Array.isArray(sp.ActivePanels))fail(sp.Login+".ActivePanels required");sp.ActivePanels.forEach(x=>checkActive(x,false,depth+1));if(sp.SimplePanels!==undefined){if(!Array.isArray(sp.SimplePanels))fail("SimplePanels must be an array");sp.SimplePanels.forEach(x=>checkSimple(x,depth+1))}};
  for(const bp of pLang){validateControlTargets(bp);add(bp.Login,"BasePanel");validateVisualRule(bp.Properties??{},"BasePanel "+bp.Login,false);panelLayout(bp,bp.Login);if(!Array.isArray(bp.SimplePanels))fail(bp.Login+".SimplePanels required");bp.SimplePanels.forEach(x=>checkSimple(x))}
  for(const login of Object.keys(setData))if(!logins.has(login)&&!repeats.has(login))fail("SetData references unknown Login "+login);
  return true;
}

export function validateSetRender(renderSet={}){
  if(!renderSet||typeof renderSet!=="object"||Array.isArray(renderSet))fail("SetRender.Data must be an object");
  for(const key of Object.keys(renderSet))if(!RENDER_RULES.has(key))fail("unsupported SetRender property "+key);
  for(const forbidden of ["Elements","Types","Global"])if(renderSet[forbidden]!==undefined)fail("SetRender."+forbidden+" is forbidden; object visuals belong to SetLang");
  for(const p of ["Transparency","TextTransparency","PictureTransparency"])if(!isTransparency(renderSet[p]))fail("SetRender."+p+" must be 0..1");
  if(renderSet.PanelSpacing!==undefined&&!isNonNegativeNumber(renderSet.PanelSpacing))fail("SetRender.PanelSpacing must be non-negative");
  if(renderSet.Parallax!==undefined&&!isFiniteNumber(renderSet.Parallax))fail("SetRender.Parallax must be finite");
  if(renderSet.TiltParallax!==undefined){
    const tilt=renderSet.TiltParallax;
    if(!tilt||typeof tilt!=="object"||Array.isArray(tilt)||Object.keys(tilt).some(key=>!["MaxOffset","Smoothing"].includes(key)))fail("SetRender.TiltParallax has unsupported properties");
    if(!isFiniteNumber(tilt.MaxOffset)||tilt.MaxOffset<0||tilt.MaxOffset>12)fail("SetRender.TiltParallax.MaxOffset must be 0..12");
    if(!isFiniteNumber(tilt.Smoothing)||tilt.Smoothing<=0||tilt.Smoothing>1)fail("SetRender.TiltParallax.Smoothing must be >0..1");
  }
  return true;
}
