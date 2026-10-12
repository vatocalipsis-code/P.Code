import test from 'node:test';
import assert from 'node:assert/strict';
import {validatePLang} from '../runtime/validator.js';
import {compileSetLang} from '../runtime/setlang-compiler.js';
import {parseSPL,serializeSPL} from '../editor/spl.js';
import {applySequence} from '../runtime/sequence.js';
test('nested repeated panels preserve identity and require composition capability',()=>{
 const rule={Source:'$.items',Key:'one',Part:2};
 const lang=[{Login:'Scene',Layout:[],SimplePanels:[{Login:'Section',Properties:{Sequence:rule},Layout:[],ActivePanels:[],SimplePanels:[{Login:'Record',Properties:{Repeat:'$.items'},Layout:[{Login:'Name',Properties:{Source:'@.name'}}],ActivePanels:[{Login:'Move',Properties:{NativeButton:true,OffPress:'move',EnabledSource:'@.canMove'},Layout:[]}]}]}]}];
 const caps=['pcode.semantic-repeat.v1','pcode.semantic-model.v1','pcode.semantic-controls.v1'];
 assert.throws(()=>validatePLang(lang,{},caps),/composition/);
 assert.equal(validatePLang(lang,{},[...caps,'pcode.panel-composition.v1']),true);
 const p={SetLang:{Version:1,Data:lang},SetData:{Version:1,Data:{}},SetRender:{Version:1,Data:{}}};
 assert.deepEqual(parseSPL(serializeSPL(p)).SetLang.Data,lang);
 const node=compileSetLang(lang)[0].children[0];assert.deepEqual(node.Visual.Sequence,rule);
 assert.equal(node.children[0].Repeat,'$.items');assert.equal(node.children[0].children[0].OffPress,'move');
 const accessible=structuredClone(lang);accessible[0].SimplePanels[0].Layout=[{Login:'Heading',Properties:{Role:'heading',AriaLevel:3}}];assert.equal(validatePLang(accessible,{},[...caps,'pcode.panel-composition.v1']),true);accessible[0].SimplePanels[0].Layout[0].Properties.AriaLevel=7;assert.throws(()=>validatePLang(accessible,{},[...caps,'pcode.panel-composition.v1']),/AriaLevel/);
 const invalid=structuredClone(lang);invalid[0].SimplePanels[0].Properties.Sequence.Part=100;
 assert.throws(()=>validatePLang(invalid,{},[...caps,'pcode.panel-composition.v1']),/Sequence/);
});
test('ordered records group SPL pieces without leaking visual order into the model',()=>{
 const style=new Map(),element={style:{setProperty:(k,v,p)=>style.set(k,[v,p]),removeProperty:k=>style.delete(k)}};
 const rule={Source:'$.items',Key:'alpha',Part:3};
 applySequence(element,rule,{items:[{id:'beta'},{id:'alpha'}]});assert.deepEqual(style.get('order'),['103','important']);
 applySequence(element,rule,{items:['alpha','beta']});assert.deepEqual(style.get('order'),['3','important']);
 applySequence(element,rule,{items:['beta']});assert.equal(style.has('order'),false);
 assert.throws(()=>applySequence(element,rule,{items:['alpha','alpha']}),/unique/);
});
test('native text buttons keep a single accessible label and reject duplicate content',()=>{
 const lang=[{Login:'Scene',Layout:[],SimplePanels:[{Login:'Section',Layout:[],ActivePanels:[{Login:'Run',Properties:{NativeButton:true,Text:'Run'},Layout:[]}]}]}];
 assert.equal(validatePLang(lang,{},['pcode.semantic-controls.v1','pcode.native-button-text.v1']),true);
 const plan=compileSetLang(lang);assert.equal(plan[0].children[0].children[0].Visual.Text,'Run');
 lang[0].SimplePanels[0].ActivePanels[0].Layout=[{Login:'Duplicate'}];assert.throws(()=>validatePLang(lang,{},['pcode.semantic-controls.v1','pcode.native-button-text.v1']),/child layout/);
});
test('field groups bind visibility as a unit without inventing application wrappers',()=>{
 const lang=[{Login:'Scene',Layout:[{Type:'Group',Properties:{Orientation:'Horizontal',VisibleSource:'$.applicable'},Layout:[{Login:'Caption',Properties:{Source:'$.caption'}}]}],SimplePanels:[]}];
 assert.throws(()=>validatePLang(lang,{},[]),/group-state/);
 assert.equal(validatePLang(lang,{},['pcode.semantic-model.v1','pcode.group-state.v1']),true);
 assert.equal(compileSetLang(lang)[0].layout[0].Layout.VisibleSource,'$.applicable');
});
test('group presentation has explicit capability, valid classes and semantic state paths',()=>{
 const Properties={Orientation:'Horizontal',Class:'field-row',StateSource:'$.mode',EnabledSource:'$.allowed'},lang=[{Login:'Panel',Layout:[{Type:'Group',Properties,Layout:[]}],SimplePanels:[]}],caps=['pcode.group-presentation.v1','pcode.semantic-model.v1'];
 assert.throws(()=>validatePLang(lang,{},['pcode.semantic-model.v1']),/group-presentation/);assert.equal(validatePLang(lang,{},caps),true);
 for(const patch of [{Class:'x; display:none'},{StateSource:'arbitrary'},{EnabledSource:4}])assert.throws(()=>validatePLang([{...lang[0],Layout:[{Type:'Group',Properties:{...Properties,...patch},Layout:[]}]}],{},caps));
});
