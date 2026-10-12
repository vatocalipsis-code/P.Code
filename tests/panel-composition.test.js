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
