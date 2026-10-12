import test from 'node:test';
import assert from 'node:assert/strict';
import {formatValue} from '../runtime/value-format.js';
import {validateFormat,validatePLang} from '../runtime/validator.js';
import {parseSPL,serializeSPL} from '../editor/spl.js';
test('text slicing stays inside Picot, composes with prefixes and requires negotiation',()=>{
 const format={Kind:'Composite',Parts:{name:{Source:'@.name',Format:{Kind:'Text'}},sep:{Text:' · '},id:{Source:'@.credentialId',Format:{Kind:'Text',SliceStart:-8}}}};
 const record={name:'Phone',credentialId:'credential-abcdef12'};
 assert.deepEqual(formatValue(record,format),[{kind:'Text',value:'Phone · abcdef12'}]);
 const lang=[{Login:'Root',Layout:[{Login:'Record',Properties:{Source:'$.record',Format:format}}],SimplePanels:[]}];
 const project={SetLang:{Name:'test',Version:1,Data:lang},SetData:{Name:'data',Version:1,Data:{}},SetRender:{Name:'render',Version:1,Data:{}}};
 assert.deepEqual(parseSPL(serializeSPL(project)).SetLang.Data[0].Layout[0].Properties.Format,format);
 assert.throws(()=>validatePLang(lang,{},['pcode.semantic-model.v1','pcode.composite-format.v1']),/text-slice/);
 assert.equal(validatePLang(lang,{},['pcode.semantic-model.v1','pcode.composite-format.v1','pcode.text-slice.v1']),true);
 for(const bad of [{Kind:'Decimal',SliceStart:-8},{Kind:'Text',SliceStart:1.5},{Kind:'Text',SliceStart:-257}])assert.throws(()=>validateFormat(bad),/SliceStart/);
});
