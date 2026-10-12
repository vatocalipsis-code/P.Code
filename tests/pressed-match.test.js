import test from 'node:test';
import assert from 'node:assert/strict';
import {validatePLang} from '../runtime/validator.js';
import {compileSetLang} from '../runtime/setlang-compiler.js';
import {parseSPL,serializeSPL} from '../editor/spl.js';

const scene=properties=>[{Login:'Root',Layout:[{Type:'Flow',Login:'Option',Properties:{Tag:'button',Source:'@.label',PressedSource:'$.preferences.choice',...properties},Layout:[]}],SimplePanels:[]}];
test('selected class and literal pressed matching require explicit SPL negotiation',()=>{
 const properties={PressedEquals:'blue',SelectedClass:'selected'};
 assert.throws(()=>validatePLang(scene(properties),{},['pcode.flow-layout.v1','pcode.semantic-model.v1','pcode.semantic-accessibility.v1']),/pressed-match/);
 assert.equal(validatePLang(scene(properties),{},['pcode.flow-layout.v1','pcode.semantic-model.v1','pcode.semantic-accessibility.v1','pcode.pressed-match.v1']),true);
 assert.throws(()=>validatePLang(scene({PressedEquals:'blue',SelectedClass:'two classes'}),{},['pcode.flow-layout.v1','pcode.semantic-model.v1','pcode.semantic-accessibility.v1','pcode.pressed-match.v1']),/SelectedClass/);
 assert.deepEqual(compileSetLang(scene(properties))[0].layout[0].Visual.PressedEquals,'blue');
 const project={SetLang:{Name:'pressed',Version:1,Data:scene(properties)},SetData:{Name:'data',Version:1,Data:{}},SetRender:{Name:'render',Version:1,Data:{}}};
 assert.deepEqual(parseSPL(serializeSPL(project)).SetLang.Data[0].Layout[0].Properties.SelectedClass,'selected');
});
