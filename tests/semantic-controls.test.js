import test from 'node:test';
import assert from 'node:assert/strict';
import {createInputElement,patchInputElement,patchInputState,inputValue} from '../runtime/semantic-controls.js';
import {withModel} from '../runtime/semantic-model.js';
import {validatePLang} from '../runtime/validator.js';

class Element{
 constructor(tag){this.tagName=tag;this.children=[];this.dataset={};this.attrs={};this.value=''}
 replaceChildren(...children){this.children=children}
 setAttribute(key,value){this.attrs[key]=value}
 removeAttribute(key){delete this.attrs[key]}
}
test('semantic choices preserve native options until records change and reject ambiguous identifiers',()=>{
 globalThis.document={createElement:tag=>new Element(tag)};
 try{
  const node={Input:{InputType:'Choice',Placeholder:'Choose',EmptyPlaceholder:'Empty',ChoiceAvailableField:'available',UnavailableSuffix:' (unavailable)'},Visual:{Source:'$.selection',ChoicesSource:'$.items',EnabledSource:'$.enabled',Format:{Kind:'Text',Template:'{name} · {code}'}}};
  const el=createInputElement(node.Input),model={selection:'2',enabled:true,items:[{id:'1',name:'Alpha',code:'A',available:true},{id:'2',name:'Beta',code:'B',available:false}]};
  patchInputElement(el,node,withModel({},model));assert.equal(el.value,'2');assert.equal(el.disabled,false);
  assert.deepEqual(el.children.map(n=>n.textContent),['Choose','Alpha · A','Beta · B (unavailable)']);
  const first=el.children[1];patchInputElement(el,node,withModel({},{...model,enabled:false}));assert.equal(el.children[1],first);assert.equal(el.disabled,true);
  assert.throws(()=>patchInputElement(el,node,withModel({},{...model,items:[{id:'1'},{id:'1'}]})),/unique/);
  assert.equal(el.children[1],first,'invalid choices never partially replace options');
  patchInputElement(el,node,withModel({},{selection:'',items:[]}));assert.equal(el.children[0].textContent,'Empty');
 }finally{delete globalThis.document}
});
test('native controls apply typed state, limits, validation and read-only behavior',()=>{
 globalThis.document={createElement:tag=>new Element(tag)};
 try{
  const secret=createInputElement({InputType:'Secret',MaxLength:512,Autocomplete:'new-password'});assert.equal(secret.type,'password');assert.equal(secret.maxLength,512);
  const check=createInputElement({InputType:'Checkbox'}),node={Input:{InputType:'Checkbox'},Visual:{Source:'$.value',ReadOnlySource:'$.locked',ErrorSource:'$.error'}};
  patchInputElement(check,node,withModel({},{value:true,locked:true,error:'Required'}));assert.equal(check.checked,true);assert.equal(inputValue(check,node.Input),'true');assert.equal(check.readOnly,true);assert.equal(check.attrs['aria-invalid'],'true');
  assert.equal(check.disabled,true,'controls without native readOnly cannot be changed');
  patchInputElement(check,node,withModel({},{value:false,locked:false,error:''}));assert.equal(inputValue(check,node.Input),'false');assert.equal(check.attrs['aria-invalid'],undefined);
  const range=createInputElement({InputType:'Range',Min:1,Max:8,Step:0.5});assert.equal(range.type,'range');assert.equal(range.step,'0.5');
  assert.equal(createInputElement({InputType:'Multiline'}).tagName,'textarea');
 }finally{delete globalThis.document}
});
test('native controls and modal declarations require their negotiated capability',()=>{
 const lang=[{Login:'Dialog',Properties:{Modal:true,VisibleSource:'$.open',Dismiss:'dismiss'},Layout:[{Type:'EditableInput',Login:'Choice',Properties:{InputType:'Choice',Source:'$.value',ChoicesSource:'$.items'}}],SimplePanels:[]}];
 const caps=['pcode.editable-input.v1','pcode.semantic-model.v1'];
 assert.throws(()=>validatePLang(lang,{},caps),/semantic-controls/);
 assert.equal(validatePLang(lang,{},[...caps,'pcode.semantic-controls.v1']),true);
 const invalid=structuredClone(lang);invalid[0].Layout[0].Properties.MaxLength=-1;
 assert.throws(()=>validatePLang(invalid,{},[...caps,'pcode.semantic-controls.v1']),/MaxLength/);
});

test('model-only updates refresh native availability without overwriting draft input values',()=>{
 globalThis.document={createElement:tag=>new Element(tag)};
 try{
  const el=createInputElement({InputType:'Text'}),node={dataSlot:'Field',Input:{InputType:'Text'},Visual:{EnabledSource:'$.editable',ReadOnlySource:'$.locked',ErrorSource:'$.error'}};
  patchInputElement(el,node,withModel({Field:{InputValue:'saved'}},{editable:false}));assert.equal(el.disabled,true);
  el.value='unsaved';patchInputState(el,node,withModel({Field:{InputValue:'saved'}},{editable:true,locked:false,error:'Invalid'}));
  assert.equal(el.disabled,false);assert.equal(el.value,'unsaved');assert.equal(el.attrs['aria-invalid'],'true');
  patchInputState(el,node,withModel({},{editable:true,locked:true}));assert.equal(el.readOnly,true);assert.equal(el.value,'unsaved');assert.equal(el.attrs['aria-invalid'],undefined);
 }finally{delete globalThis.document}
});

test('SPL can exclude the empty choice without changing existing choice defaults',()=>{
 globalThis.document={createElement:tag=>new Element(tag)};
 try{const node={Input:{InputType:'Choice',EmptyChoice:false},Visual:{Source:'$.selection',ChoicesSource:'$.items'}},el=createInputElement(node.Input);patchInputElement(el,node,withModel({},{selection:'a',items:[{id:'a',name:'A'},{id:'b',name:'B'}]}));assert.deepEqual(el.children.map(n=>n.value),['a','b']);assert.equal(el.value,'a')}finally{delete globalThis.document}
 const Data=[{Login:'Page',Layout:[{Type:'EditableInput',Login:'Choice',Properties:{InputType:'Choice',EmptyChoice:false,ChoicesSource:'$.items'}}],SimplePanels:[]}],caps=['pcode.editable-input.v1','pcode.semantic-controls.v1','pcode.semantic-model.v1'];
 assert.throws(()=>validatePLang(Data,{},caps),/choice-empty/);assert.equal(validatePLang(Data,{},[...caps,'pcode.choice-empty.v1']),true);
});
