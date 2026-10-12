import test from 'node:test';
import assert from 'node:assert/strict';
import {validatePLang} from '../runtime/validator.js';
import {syncLiveVariable} from '../runtime/semantic-controls.js';
import {parseSPL,serializeSPL} from '../editor/spl.js';

const scene=variable=>[{Login:'Root',Layout:[{Type:'EditableInput',Login:'Size',Properties:{InputType:'Range',Source:'$.preferences.size',Min:0,Max:100,Step:1,LiveVariable:variable}}],SimplePanels:[]}];

test('range live variable is negotiated and constrained to safe numeric CSS values',()=>{
 const variable={Name:'--display-size',Unit:'px',Scale:1};
 const project={SetLang:{Name:'range',Version:1,Data:scene(variable)},SetData:{Name:'data',Version:1,Data:{}},SetRender:{Name:'render',Version:1,Data:{}}};
 assert.deepEqual(parseSPL(serializeSPL(project)).SetLang.Data[0].Layout[0].Properties.LiveVariable,variable);
 assert.throws(()=>validatePLang(scene(variable),{},['pcode.editable-input.v1','pcode.semantic-controls.v1','pcode.semantic-model.v1']),/range-live-variable/);
 assert.equal(validatePLang(scene(variable),{},['pcode.editable-input.v1','pcode.semantic-controls.v1','pcode.semantic-model.v1','pcode.range-live-variable.v1']),true);
 for(const bad of [{Name:'color'}, {Name:'--x',Unit:'url('}, {Name:'--x',Scale:2}, {Name:'--x',Scale:Infinity}])assert.throws(()=>validatePLang(scene(bad),{},['pcode.editable-input.v1','pcode.semantic-controls.v1','pcode.semantic-model.v1','pcode.range-live-variable.v1']),/LiveVariable/);
 const values=new Map(),original=globalThis.document;
 try{
  globalThis.document={documentElement:{style:{setProperty:(name,value)=>values.set(name,value)}}};
  const output={textContent:''};
  syncLiveVariable({value:'40',parentElement:{querySelector:()=>output}},{LiveVariable:{Name:'--display-size',Unit:'px',OutputUnit:' pt'}});
  syncLiveVariable({value:'28'},{LiveVariable:{Name:'--display-alpha',Scale:0.01}});
  syncLiveVariable({value:'invalid'},{LiveVariable:{Name:'--display-size',Unit:'px'}});
  assert.deepEqual(Object.fromEntries(values),{'--display-size':'40px','--display-alpha':'0.28'});
  assert.equal(output.textContent,'40 pt');
 }finally{globalThis.document=original}
});
