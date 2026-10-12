import test from 'node:test';import assert from 'node:assert/strict';
import {validateControlAction} from '../runtime/control-action.js';
test('skin control actions accept fixed scene-local targets and semantic conditions only',()=>{
 validateControlAction({Kind:'OpenPicker',Target:'Date field',WhenSource:'$.dateAllowed'});
 for(const bad of [null,[],{Kind:'Evaluate',Target:'field'},{Kind:'OpenPicker',Target:''},{Kind:'OpenPicker',Target:'Date',WhenSource:'javascript:x'},{Kind:'OpenPicker',Target:'Date',Script:'x'}])assert.throws(()=>validateControlAction(bad));
});

import {parseSPL,serializeSPL} from '../editor/spl.js';
import {validatePLang} from '../runtime/validator.js';
test('control action negotiates its capability and survives SPL serialization',()=>{
 const data=[{Login:'Scene',Layout:[{Type:'EditableInput',Login:'Date',Properties:{InputType:'Date'}}],SimplePanels:[{Login:'Actions',Layout:[],ActivePanels:[{Login:'Open',Properties:{ControlAction:{Kind:'OpenPicker',Target:'Date'}},Layout:[]}]}]}];
 assert.throws(()=>validatePLang(data,{},['pcode.editable-input.v1']),/control-action/);validatePLang(data,{},['pcode.control-action.v1','pcode.editable-input.v1']);
 const envelope={SetLang:{Name:'test',Version:1,Requires:['pcode.control-action.v1'],Data:data},SetData:{Name:'data',Version:1,Data:{}},SetRender:{Name:'render',Version:1,Data:{}}};
 assert.deepEqual(parseSPL(serializeSPL(envelope)).SetLang.Data,data);
});

test('control target cannot resolve outside its scene or to a decorative element',()=>{
 const data=[{Login:'Scene',Layout:[],SimplePanels:[{Login:'Actions',Layout:[],ActivePanels:[{Login:'Open',Properties:{ControlAction:{Kind:'OpenPicker',Target:'Elsewhere'}},Layout:[]}]}]}];
 assert.throws(()=>validatePLang(data,{},['pcode.control-action.v1']),/same BasePanel/);
});

test('native picker click requires a date input and negotiated capability',()=>{
 const data=[{Login:'Scene',Layout:[{Type:'EditableInput',Login:'Date',Properties:{InputType:'Date',OpenPickerOnClick:true}}],SimplePanels:[]}];
 const caps=['pcode.control-action.v1','pcode.editable-input.v1'];
 validatePLang(data,{},caps);
 assert.throws(()=>validatePLang(data,{},['pcode.editable-input.v1']),/control-action/);
 data[0].Layout[0].Properties.InputType='Text';
 assert.throws(()=>validatePLang(data,{},caps),/Date input/);
});
