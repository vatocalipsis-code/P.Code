import {MODEL,semanticValue} from './semantic-model.js';
import {formatValue} from './value-format.js';
const activeMenus=new WeakMap();
const path=value=>typeof value==='string'&&/^[$@]\.[a-zA-Z0-9_.-]+$/.test(value);
const classes=value=>typeof value==='string'&&/^[-_a-zA-Z][-_a-zA-Z0-9]*(?:\s+[-_a-zA-Z][-_a-zA-Z0-9]*)*$/.test(value);
export function validateActionMenu(rule,{picture,format,event}){
 const fail=()=>{throw Error('Invalid ActionMenu')};
 const keys=['Trigger','Class','AnchorClass','BodyClass','ButtonClass','AriaLabel','EnabledSource','HoldDelay','MoveTolerance','WidthLabel','WidthPadding','Items'];
 if(!rule||typeof rule!=='object'||Array.isArray(rule)||Object.keys(rule).some(key=>!keys.includes(key))||!['Press','Context'].includes(rule.Trigger)||!classes(rule.Class))fail();
 for(const key of ['AnchorClass','BodyClass','ButtonClass'])if(rule[key]!==undefined&&!classes(rule[key]))fail();
 for(const key of ['AriaLabel','WidthLabel'])if(rule[key]!==undefined&&(typeof rule[key]!=='string'||!rule[key]||rule[key].length>1000))fail();
 if(rule.EnabledSource!==undefined&&!path(rule.EnabledSource))fail();
 for(const key of ['HoldDelay','MoveTolerance','WidthPadding'])if(rule[key]!==undefined&&(!Number.isFinite(rule[key])||rule[key]<0||rule[key]>10000))fail();
 if(!rule.Items||typeof rule.Items!=='object'||Array.isArray(rule.Items)||!Object.keys(rule.Items).length||Object.keys(rule.Items).length>32)fail();
 for(const [id,item]of Object.entries(rule.Items)){
  if(!/^[a-zA-Z0-9_-]+$/.test(id)||!item||typeof item!=='object'||Array.isArray(item)||Object.keys(item).some(key=>!['Text','Source','Format','Picture','OffPress','EnabledSource','VisibleSource'].includes(key)))fail();
  if((typeof item.Text==='string')===Boolean(item.Source))fail();
  if(item.Text!==undefined&&(typeof item.Text!=='string'||!item.Text||item.Text.length>1000))fail();
  for(const key of ['Source','EnabledSource','VisibleSource'])if(item[key]!==undefined&&!path(item[key]))fail();
  if(item.Format!==undefined){format(item.Format);if(item.Format.Kind!=='Text')fail()}
  if(item.Picture!==undefined&&!picture(item.Picture))fail();
  event(item.OffPress,'ActionMenu.'+id);
 }
}
/** Transient menus belong to the renderer; commands and entity IDs are opaque. */
export function bindActionMenu(element,node,interaction,dataSet,item=null){
 const rule=node.Visual.ActionMenu,doc=element.ownerDocument,win=doc.defaultView;
 let data=dataSet,entity=item,menu=null,abort=null,held=false,holdTimer=null,start=null,signature=null,previousFocus=null;
 const read=source=>semanticValue(source,data[MODEL],entity);
 const enabled=()=>interaction?.isEnabled()&&element.isConnected&&!element.hidden&&!element.closest('[inert],[aria-hidden="true"]')&&element.getAttribute('aria-disabled')!=='true'&&(!rule.EnabledSource||read(rule.EnabledSource)===true);
 const stopHold=()=>{if(holdTimer!==null)win.clearTimeout(holdTimer);holdTimer=null;start=null};
 const close=(restore=true)=>{
  stopHold();abort?.abort();abort=null;menu?.remove();menu=null;signature=null;
  if(rule.AnchorClass)for(const name of rule.AnchorClass.split(/\s+/))element.classList.remove(name);
  element.setAttribute('aria-expanded','false');if(activeMenus.get(doc)===api)activeMenus.delete(doc);
  if(restore&&previousFocus?.isConnected&&!previousFocus.closest('[inert]'))previousFocus.focus({preventScroll:true});previousFocus=null;
 };
 const rows=()=>Object.entries(rule.Items).filter(([,entry])=>!entry.VisibleSource||read(entry.VisibleSource)===true).map(([id,entry])=>({id,entry,allowed:!entry.EnabledSource||read(entry.EnabledSource)===true,text:entry.Source?formatValue(read(entry.Source),entry.Format??{Kind:'Text'},data[MODEL]).map(segment=>segment.value).join(''):entry.Text}));
 const refresh=()=>{
  if(!menu)return;if(!enabled()||!element.getClientRects().length){close(false);return}
  const next=rows(),key=JSON.stringify(next.map(row=>[row.id,row.text,row.allowed]));if(key===signature)return;signature=key;
  const current=new Map([...menu.children].map(button=>[button.dataset.planeMenuItem,button]));
  for(const row of next){
   let button=current.get(row.id);current.delete(row.id);
   if(!button){
    button=doc.createElement('button');button.type='button';button.setAttribute('role','menuitem');button.dataset.planeMenuItem=row.id;if(rule.ButtonClass)button.className=rule.ButtonClass;
    const body=rule.BodyClass?doc.createElement('span'):button;if(rule.BodyClass){body.className=rule.BodyClass;button.append(body)}
    if(row.entry.Picture){const icon=doc.createElement('img');icon.alt='';icon.src=row.entry.Picture;body.append(icon)}
    const label=doc.createTextNode(row.text);body.append(label);button.__planeMenuText=label;
    button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();if(!enabled()||button.disabled)return;const command=rule.Items[row.id];if(command.VisibleSource&&read(command.VisibleSource)!==true||command.EnabledSource&&read(command.EnabledSource)!==true)return;close();if(command.OffPress)interaction.emit('OffPress',node.Login,command.OffPress,entity?{ItemId:entity.Id}:null)});
   }
   button.disabled=!row.allowed;if(button.__planeMenuText.textContent!==row.text)button.__planeMenuText.textContent=row.text;
   if(!button.parentElement)menu.append(button);
  }
  for(const button of current.values())button.remove();
  next.forEach((row,index)=>{const button=[...menu.children].find(node=>node.dataset.planeMenuItem===row.id);if(menu.children[index]!==button)menu.insertBefore(button,menu.children[index]??null)});
  if(rule.WidthLabel){const canvas=doc.createElement('canvas'),context=canvas.getContext('2d');context.font=win.getComputedStyle(element).font;menu.style.setProperty('width',Math.ceil(context.measureText(rule.WidthLabel).width)+(rule.WidthPadding??0)+'px','important')}
 };
 const open=(focus=false)=>{
  if(!enabled())return;if(menu){close();return}activeMenus.get(doc)?.close(false);previousFocus=doc.activeElement;
  menu=doc.createElement('div');menu.className=rule.Class;menu.dataset.planeTransient='menu';menu.setAttribute('role','menu');if(rule.AriaLabel)menu.setAttribute('aria-label',rule.AriaLabel);
  if(rule.AnchorClass)for(const name of rule.AnchorClass.split(/\s+/))element.classList.add(name);
  element.append(menu);element.setAttribute('aria-expanded','true');activeMenus.set(doc,api);abort=new win.AbortController();
  for(const type of ['pointerdown','pointerup','mousedown','mouseup','touchstart','touchend','click'])menu.addEventListener(type,event=>event.stopPropagation());
  let outside=false;
  const listen=(type,fn)=>doc.addEventListener(type,fn,{capture:true,signal:abort.signal});
  listen('pointerdown',event=>{held=false;outside=!menu.contains(event.target);if(outside){event.preventDefault();event.stopImmediatePropagation()}});
  listen('pointerup',event=>{if(outside){event.preventDefault();event.stopImmediatePropagation()}});
  listen('pointercancel',()=>{outside=false});
  listen('click',event=>{if(held){held=false;event.preventDefault();event.stopImmediatePropagation();return}if(outside||!menu.contains(event.target)){event.preventDefault();event.stopImmediatePropagation();close()}});
  listen('keydown',event=>{
   if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();close();return}
   if(!['ArrowDown','ArrowUp','Home','End','Tab'].includes(event.key))return;
   if(event.key==='Tab'){close();return}
   event.preventDefault();event.stopImmediatePropagation();const choices=[...menu.querySelectorAll('button:not(:disabled)')],index=choices.indexOf(doc.activeElement);
   const target=event.key==='Home'?0:event.key==='End'?choices.length-1:(index+(event.key==='ArrowDown'?1:-1)+choices.length)%choices.length;choices[target]?.focus({preventScroll:true});
  });
  refresh();if(focus)menu?.querySelector('button:not(:disabled)')?.focus({preventScroll:true});
 };
 element.dataset.planeMenu='';element.setAttribute('aria-haspopup','menu');element.setAttribute('aria-expanded','false');
 if(rule.Trigger==='Press'){
  element.addEventListener('click',event=>{if(menu?.contains(event.target))return;event.preventDefault();event.stopPropagation();open(event.detail===0)});
  element.addEventListener('keydown',event=>{if(event.target!==element||event.repeat||!['Enter',' '].includes(event.key))return;event.preventDefault();event.stopImmediatePropagation();open(true)},{capture:true});
 }else{
  element.addEventListener('pointerdown',event=>{if(event.button!==0||!enabled()||menu?.contains(event.target))return;held=false;stopHold();start={id:event.pointerId,x:event.clientX,y:event.clientY};holdTimer=win.setTimeout(()=>{holdTimer=null;held=true;element.__planeCancelPress?.();open(true)},rule.HoldDelay??550)},{capture:true});
  element.addEventListener('pointermove',event=>{if(start&&Math.hypot(event.clientX-start.x,event.clientY-start.y)>(rule.MoveTolerance??8))stopHold()},{capture:true});
  for(const type of ['pointerup','pointercancel','pointerleave'])element.addEventListener(type,event=>{stopHold();if(held&&type==='pointerup'){event.preventDefault();event.stopImmediatePropagation()}},{capture:true});
  element.addEventListener('contextmenu',event=>{if(!enabled())return;event.preventDefault();event.stopPropagation();open(true)});
 }
 const api={element,close,update(next,nextItem=entity){data=next;entity=nextItem;refresh()},cancel(){held=false;close(false)}};return api;
}

export function consumeActionMenuBack(root){const menu=activeMenus.get(root.ownerDocument);if(!menu||!root.contains(menu.element))return false;menu.close();return true}
