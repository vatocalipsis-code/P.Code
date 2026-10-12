/** SPL-authored decimal entry. No product names, monetary rules or persistence. */
import {MODEL,semanticValue} from './semantic-model.js';
const editors=new WeakMap();
const className=value=>typeof value==='string'&&/^[-_a-zA-Z][-_a-zA-Z0-9]*$/.test(value);
const path=value=>typeof value==='string'&&/^[$@]\.[\w.]+$/.test(value);
const precision=value=>Number.isInteger(value)&&value>=0&&value<=24;
export function validateDecimalInput(value,label){
 if(!label.startsWith('EditableInput ')||!value||typeof value!=='object'||Array.isArray(value))throw Error('DecimalInput requires an EditableInput');
 if(Object.keys(value).some(key=>!['Precision','PrecisionSource','ReadOnlySource'].includes(key)))throw Error('Unknown DecimalInput property');
 if(!precision(value.Precision))throw Error('DecimalInput Precision must be 0..24');
 for(const key of ['PrecisionSource','ReadOnlySource'])if(value[key]!==undefined&&!path(value[key]))throw Error('Invalid DecimalInput '+key);
}
export function validateNumericEditor(value,label){
 if(!label.startsWith('BasePanel ')||!value||typeof value!=='object'||Array.isArray(value))throw Error('NumericEditor requires a BasePanel');
 const classes=['OverlayClass','PanelClass','NavigationClass','BackClass','HelpClass','ValueClass','NumberClass','FractionClass','ButtonBodyClass','FixedHelpClass'];
 const texts=['Label','BackText','BackTitle','BackLabel','HelpText','HelpLabel','EraseText','EraseLabel','SubmitText','DecimalText','OutputSeparator','Help','LineCountProperty'];
 const sources=['EnabledSource','NavigationSource','HapticSource'];
 if(Object.keys(value).some(key=>![...classes,...texts,...sources,'MaxDigits','DragDistance','HapticDuration'].includes(key)))throw Error('Unknown NumericEditor property');
 for(const key of classes)if(!className(value[key]))throw Error('Invalid NumericEditor '+key);
 for(const key of texts)if(typeof value[key]!=='string'||!value[key])throw Error('NumericEditor requires '+key);
 if(!/^--[-a-zA-Z0-9]+$/.test(value.LineCountProperty))throw Error('Invalid NumericEditor LineCountProperty');
 for(const key of sources)if(!path(value[key]))throw Error('Invalid NumericEditor '+key);
 if(!Number.isInteger(value.MaxDigits)||value.MaxDigits<1||value.MaxDigits>100)throw Error('Invalid NumericEditor MaxDigits');
 for(const key of ['DragDistance','HapticDuration'])if(!Number.isFinite(value[key])||value[key]<0||value[key]>1000)throw Error('Invalid NumericEditor '+key);
}
export function decimalKey(buffer,key,scale,maxDigits){
 if(key==='erase')return buffer.slice(0,-1)||'0';
 if(key===',')return scale>0&&!buffer.includes(',')?buffer+',':buffer;
 if(!/^\d$/.test(key)||buffer.replace(',','').length>=maxDigits||buffer.includes(',')&&buffer.split(',')[1].length>=scale)return buffer;
 return buffer==='0'?key:buffer+key;
}
export function patchDecimalInput(el,node,data,item=null){
 const config=node.Visual?.DecimalInput;if(!config)return;
 const scale=config.PrecisionSource?semanticValue(config.PrecisionSource,data[MODEL],item):config.Precision;
 const readOnly=node.Input?.ReadOnly===true||semanticValue(node.Visual?.ReadOnlySource,data[MODEL],item)===true||semanticValue(config.ReadOnlySource,data[MODEL],item)===true;
 el.__planeDecimal={precision:scale??config.Precision,readOnly};
 el.readOnly=true;el.inputMode='none';el.setAttribute('aria-haspopup','dialog');
 if(readOnly)el.setAttribute('aria-readonly','true');else el.removeAttribute('aria-readonly');
}
export function numericEditorOpen(root){return Boolean(editors.get(root)?.isOpen())}
export function consumeNumericBack(root){const editor=editors.get(root);if(!editor?.isOpen())return false;editor.close();return true}
export function updateNumericEditor(root,data){editors.get(root)?.update(data)}
export function disposeNumericEditor(root){editors.get(root)?.dispose();editors.delete(root)}
export function installNumericEditor(root,nodes,interaction,data){
 disposeNumericEditor(root);
 const node=nodes.find(node=>node.Visual?.NumericEditor);if(!node)return;
 const rule=node.Visual.NumericEditor,doc=root.ownerDocument,view=doc.defaultView,abort=new AbortController(),signal=abort.signal;
 let model=data[MODEL],overlay=null,panel=null,field=null,buffer='0',press=null,outside=false,scale=0,navigation=semanticValue(rule.NavigationSource,model);
 const enabled=()=>interaction?.isEnabled()&&semanticValue(rule.EnabledSource,model)===true&&!root.closest('[inert]');
 const usable=input=>root.contains(input)&&!input.disabled&&input.__planeDecimal&&!input.__planeDecimal.readOnly&&precision(input.__planeDecimal.precision);
 const eligible=input=>usable(input)&&!input.closest('[inert]');
 function close(){overlay?.remove();overlay=null;panel=null;field=null;press=null;outside=false}
 function show(input){
  if(!enabled()||!eligible(input))return;close();field=input;scale=input.__planeDecimal.precision;buffer='0';input.blur();
  const element=(tag,css,text)=>{const el=doc.createElement(tag);if(css)el.className=css;if(text!==undefined)el.textContent=text;return el};
  const button=(css,text)=>{const el=element('button',css);el.append(element('span',rule.ButtonBodyClass,text));el.type='button';return el};
  overlay=element('div',rule.OverlayClass);overlay.dataset.planeTransient='numeric';
  panel=element('section',rule.PanelClass);panel.setAttribute('role','dialog');panel.setAttribute('aria-label',rule.Label);
  const back=button(rule.BackClass,rule.BackText);back.title=rule.BackTitle;back.setAttribute('aria-label',rule.BackLabel);back.onclick=close;
  const nav=element('div',rule.NavigationClass),help=button(rule.HelpClass,rule.HelpText);help.setAttribute('aria-label',rule.HelpLabel);help.classList.add(rule.FixedHelpClass);help.style.setProperty(rule.LineCountProperty,'1');help.onclick=()=>{if(enabled())interaction.emit('OffPress',node.Login,rule.Help)};nav.append(back,help);panel.append(nav);
  const output=element('output',rule.ValueClass);output.setAttribute('aria-live','polite');panel.append(output);
  const paint=()=>{const value=element('span',rule.NumberClass),[whole,fraction]=buffer.split(',');value.append(doc.createTextNode(whole));if(fraction!==undefined)value.append(element('span',rule.FractionClass,rule.OutputSeparator+fraction));output.replaceChildren(value)};paint();
  for(const [key,label]of [['erase',rule.EraseText],...Array.from({length:9},(_,i)=>[String(i+1),String(i+1)]),['0','0'],[',',rule.DecimalText],['enter',rule.SubmitText]]){
   const control=button('',label);control.dataset.key=key;if(key==='erase')control.setAttribute('aria-label',rule.EraseLabel);
   control.onclick=()=>{
    if(!enabled()||!eligible(field)){close();return}
    if(semanticValue(rule.HapticSource,model)===true&&!view.matchMedia('(prefers-reduced-motion: reduce)').matches){try{view.navigator.vibrate?.(rule.HapticDuration)}catch{}}
    if(key==='enter'){const target=field,value=buffer.replace(',','.').replace(/\.$/,'');close();target.value=value;target.dispatchEvent(new view.Event('input',{bubbles:true}));return}
    buffer=decimalKey(buffer,key,scale,rule.MaxDigits);paint();
   };panel.append(control);
  }
  overlay.append(panel);root.append(overlay);
 }
 const suppress=event=>{event.preventDefault();event.stopImmediatePropagation()};
 doc.addEventListener('pointerdown',event=>{
  if(!enabled())return;if(event.isPrimary===false){press=null;return}
  if(overlay&&!panel.contains(event.target)){outside=true;suppress(event);return}
  const input=event.target.closest('input[data-plane-decimal]');if(input&&eligible(input)){press={input,x:event.clientX,y:event.clientY};event.preventDefault()}
 },{signal,capture:true});
 doc.addEventListener('pointermove',event=>{if(press&&Math.hypot(event.clientX-press.x,event.clientY-press.y)>rule.DragDistance)press=null},{signal,capture:true});
 doc.addEventListener('pointerup',event=>{
  if(!enabled()){outside=false;press=null;return}if(outside){suppress(event);close();return}
  const p=press;press=null;if(p){suppress(event);show(p.input)}
 },{signal,capture:true});
 doc.addEventListener('pointercancel',()=>{outside=false;press=null},{signal,capture:true});
 doc.addEventListener('touchstart',event=>{if(event.touches.length>1)press=null},{signal,capture:true,passive:true});
 doc.addEventListener('keydown',event=>{
  if(!enabled())return;
  if(event.key==='Escape'&&overlay){suppress(event);close()}
  else if(event.key==='Enter'&&!overlay&&event.target.matches('input[data-plane-decimal]')){suppress(event);show(event.target)}
  else if(event.key==='Tab'&&overlay){const buttons=[...panel.querySelectorAll('button')],at=buttons.indexOf(doc.activeElement);if(at===-1||event.shiftKey&&at===0||!event.shiftKey&&at===buttons.length-1){suppress(event);buttons[event.shiftKey?buttons.length-1:0].focus()}}
 },{signal,capture:true});
 editors.set(root,{close,isOpen:()=>Boolean(overlay),update(data){
  model=data[MODEL];const next=semanticValue(rule.NavigationSource,model);
  if(next!==navigation||semanticValue(rule.EnabledSource,model)!==true||field&&(!field.isConnected||!usable(field)||field.__planeDecimal.precision!==scale))close();navigation=next;
 },dispose(){close();abort.abort()}});
}
