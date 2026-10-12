import test from 'node:test';
import assert from 'node:assert/strict';
import {validatePLang} from '../runtime/validator.js';
import {compileSetLang} from '../runtime/setlang-compiler.js';
import {parseSPL,serializeSPL} from '../editor/spl.js';

const scene=inputType=>[{Login:'Root',Layout:[{Type:'EditableInput',Login:'Haptics',Properties:{InputType:inputType,Source:'$.preferences.haptics',NativeSwitch:true,OnChange:'setting.haptics'}}],SimplePanels:[]}];
test('SPL negotiates a native checkbox switch and keeps its behavior in Picot',()=>{
 const lang=scene('Checkbox'),capabilities=['pcode.editable-input.v1','pcode.semantic-controls.v1','pcode.semantic-model.v1'];
 assert.throws(()=>validatePLang(lang,{},capabilities),/native-switch/);
 assert.equal(validatePLang(lang,{},[...capabilities,'pcode.native-switch.v1']),true);
 assert.throws(()=>validatePLang(scene('Range'),{},[...capabilities,'pcode.native-switch.v1']),/NativeSwitch/);
 const plan=compileSetLang(lang);assert.equal(plan[0].layout[0].Input.NativeSwitch,true);
 assert.equal(plan[0].layout[0].Visual.NativeSwitch,undefined);
 const project={SetLang:{Name:'switch',Version:1,Data:lang},SetData:{Name:'data',Version:1,Data:{}},SetRender:{Name:'render',Version:1,Data:{}}};
 assert.equal(parseSPL(serializeSPL(project)).SetLang.Data[0].Layout[0].Properties.NativeSwitch,true);
});
