import {openNativePicker} from './control-action.js';
/** Native controls implement SPL-authored behavior and emit semantic values. */
import {formatValue} from './value-format.js';
import {patchDecimalInput} from './numeric-editor.js';
import {MODEL,semanticValue} from './semantic-model.js';

export function createInputElement(config){
  const type=config.InputType??'Text';
  const el=document.createElement(type==='Choice'?'select':type==='Multiline'?'textarea':'input');
  if(type!=='Choice'&&type!=='Multiline')el.type={Secret:'password',Number:'text',Date:'date',Range:'range',Checkbox:'checkbox',Text:'text'}[type];
  if(type==='Number')el.inputMode=config.InputMode??'decimal';else if(config.InputMode)el.inputMode=config.InputMode;
  for(const key of ['Min','Max','Step'])if(config[key]!==undefined)el[key.toLowerCase()]=String(config[key]);
  if(type==='Multiline'&&config.Rows!==undefined)el.rows=config.Rows;
  if(config.Autocomplete)el.autocomplete=config.Autocomplete;
  if(config.MaxLength!==undefined)el.maxLength=config.MaxLength;
  if(config.SecretGroup)el.dataset.planeSecretGroup=config.SecretGroup;
  if(config.OpenPickerOnClick)el.addEventListener('click',()=>openNativePicker(el));
  el.placeholder=config.Placeholder??'';return el;
}
export function patchInputElement(el,node,dataSet,item=null){
  const rule=node.Visual??{},config=node.Input??{};
  const semantic=/^[$@]\./.test(rule.Source??'');
  const data=dataSet[node.dataSlot]??{};
  const value=semantic?semanticValue(rule.Source,dataSet[MODEL],item):data.InputValue;
  if(config.InputType==='Choice'){
    const choices=semanticValue(rule.ChoicesSource,dataSet[MODEL],item)??[];
    if(!Array.isArray(choices)||choices.length>5000)throw Error('ChoicesSource must resolve to an array');
    const signature=JSON.stringify(choices);
    if(el.__planeChoices!==signature){
      const option=(value,text)=>{const node=document.createElement('option');node.value=value;node.textContent=text;return node};
      const ids=new Set();
      const options=choices.map(choice=>{
        const id=String(semanticValue('@.'+(config.ChoiceValue??'id'),null,choice)??'');
        if(!id||ids.has(id))throw Error('Choice records require unique non-empty IDs');ids.add(id);
        const text=rule.Format?formatValue(choice,rule.Format,dataSet[MODEL]).map(segment=>{if(segment.kind!=='Text')throw Error('Native choices require text formatting');return segment.value}).join(''):String(semanticValue('@.'+(config.ChoiceLabel??'name'),null,choice)??'');
        const unavailable=config.ChoiceAvailableField&&semanticValue('@.'+config.ChoiceAvailableField,null,choice)===false;
        return option(id,text+(unavailable?config.UnavailableSuffix??'':''));
      });
      el.replaceChildren(...(config.EmptyChoice===false?[]:[option('',choices.length?config.Placeholder??'':config.EmptyPlaceholder??config.Placeholder??'')]),...options);
      el.__planeChoices=signature;
    }
  }
  const next=value==null?'':String(value);
  if(config.InputType==='Checkbox')el.checked=value===true||value==='true';else if(el.value!==next)el.value=next;
  patchInputState(el,node,dataSet,item);
}
export function patchInputState(el,node,dataSet,item=null){
  const rule=node.Visual??{},config=node.Input??{},data=dataSet[node.dataSlot]??{};
  if(rule.PlaceholderSource)el.placeholder=formatValue(semanticValue(rule.PlaceholderSource,dataSet[MODEL],item),rule.PlaceholderFormat,dataSet[MODEL]).map(p=>p.value).join('');
  el.readOnly=config.ReadOnly===true||(rule.ReadOnlySource?semanticValue(rule.ReadOnlySource,dataSet[MODEL],item)===true:false);
  el.disabled=config.Disabled===true||(rule.EnabledSource?semanticValue(rule.EnabledSource,dataSet[MODEL],item)!==true:false)||
    el.readOnly&&['Choice','Range','Checkbox'].includes(config.InputType);
  patchDecimalInput(el,node,dataSet,item);
  if(el.__planeDecimal?.readOnly??el.readOnly)el.setAttribute('aria-readonly','true');else el.removeAttribute('aria-readonly');
  const error=rule.ErrorSource?semanticValue(rule.ErrorSource,dataSet[MODEL],item):null;
  const validation=error?{Status:'Invalid',Message:String(error)}:data.ValidationState??{Status:'None'};
  el.dataset.planeValidation=validation.Status??'None';
  if(validation.Status==='Invalid')el.setAttribute('aria-invalid','true');else el.removeAttribute('aria-invalid');
  if(typeof validation.Message==='string'&&validation.Message)el.setAttribute('title',validation.Message);else el.removeAttribute('title');
}
export function inputValue(el,config){return config.InputType==='Checkbox'?String(Boolean(el.checked)):el.value}
