import test from 'node:test';
import assert from 'node:assert/strict';
import {validatePLang} from '../runtime/validator.js';
import {parseSPL,serializeSPL} from '../editor/spl.js';
const rule={Scope:'Document',Target:'button',KeyboardExclude:'input,textarea',PressedClass:'pressed',HaloClass:'halo',MinWidth:72,MinHeight:40,ReleaseDelay:150,HaloTimeout:450};
test('feedback is an SPL capability with one owner and validated lifetimes',()=>{
 const data=[{Login:'Root',Properties:{Feedback:rule},Layout:[],SimplePanels:[]}];
 assert.throws(()=>validatePLang(data,{},[]),/control-feedback/);
 assert.equal(validatePLang(data,{},['pcode.control-feedback.v1']),true);
 assert.throws(()=>validatePLang([...data,{...data[0],Login:'Other'}],{},['pcode.control-feedback.v1']),/one Feedback/);
 assert.throws(()=>validatePLang([{...data[0],Properties:{Feedback:{...rule,ReleaseDelay:-1}}}],{},['pcode.control-feedback.v1']),/duration/);
 const project={SetLang:{Name:'test',Version:1,Data:data},SetData:{Name:'data',Version:1,Data:{}},SetRender:{Name:'render',Version:1,Data:{}}};
 assert.deepEqual(parseSPL(serializeSPL(project)).SetLang.Data[0].Properties.Feedback,rule);
});
