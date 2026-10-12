import test from 'node:test';
import assert from 'node:assert/strict';
import {validatePLang} from '../runtime/validator.js';
import {compileSetLang} from '../runtime/setlang-compiler.js';
import {parseSPL,serializeSPL} from '../editor/spl.js';
const flow=(Login,Properties,Layout=[])=>({Type:'Flow',Login,Properties,Layout});
const scene=children=>[{Login:'Page',Layout:children,SimplePanels:[]}];
const caps=['pcode.flow-layout.v1','pcode.semantic-model.v1','pcode.semantic-repeat.v1'];
test('Flow is declarative native structure with semantic sources and commands',()=>{
 const lang=scene([flow('Items',{Tag:'section',Class:'items'},[flow('Item',{Tag:'article',Repeat:'$.items'},[flow('Title',{Tag:'strong',Source:'@.name'}),flow('Choose',{Tag:'button',Text:'Choose',OffPress:'choose',EnabledSource:'@.allowed'})])])]);
 assert.equal(validatePLang(lang,{},caps),true);
 assert.throws(()=>validatePLang(lang,{},caps.slice(1)),/flow-layout/);
 const plan=compileSetLang(lang)[0].layout[0];
 assert.equal(plan.type,'Flow');assert.equal(plan.Visual.Tag,'section');assert.equal(plan.layout[0].Repeat,'$.items');assert.equal(plan.layout[0].layout[1].OffPress,'choose');assert.ok(Object.isFrozen(plan));
 const p={SetLang:{Name:'fixture',Version:1,Data:lang},SetData:{Name:'fixture-data',Version:1,Data:{}},SetRender:{Name:'fixture-render',Version:1,Data:{}}};
 assert.deepEqual(parseSPL(serializeSPL(p)).SetLang.Data,lang);
});
test('Flow cannot smuggle executable nodes, attributes, HTML or mixed content',()=>{
 for(const Tag of ['script','style','iframe','img','a','svg','object'])assert.throws(()=>validatePLang(scene([flow('Unsafe',{Tag})]),{},caps),/Flow Tag/);
 for(const extra of [{onclick:'code'},{innerHTML:'<b>x</b>'},{Style:'color:red'},{Source:'raw-slot'},{Repeat:'raw-list'},{OnPress:'do'},{OffPress:'do'}])assert.throws(()=>validatePLang(scene([flow('Unsafe',{Tag:'div',...extra})]),{},caps));
 assert.throws(()=>validatePLang(scene([flow('Mixed',{Tag:'p',Text:'one',Source:'$.two'})]),{},caps),/one owner/);
 assert.throws(()=>validatePLang(scene([flow('Mixed',{Tag:'p',Source:'$.two'},[flow('Child',{Tag:'span',Text:'child'})])]),{},caps),/one owner/);
 let nested=flow('leaf',{Tag:'span'});for(let i=0;i<34;i++)nested=flow('n'+i,{Tag:'div'},[nested]);assert.throws(()=>validatePLang(scene([nested]),{},caps),/nesting/);
});
