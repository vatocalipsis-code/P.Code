import test from 'node:test';
import assert from 'node:assert/strict';
import {formatValue} from '../runtime/value-format.js';
import {validateFormat,validatePLang} from '../runtime/validator.js';
import {parseSPL,serializeSPL} from '../editor/spl.js';
const decimal={Kind:'Decimal',GroupSeparator:' ',Absolute:true};
test('composite formatting preserves exact decimal parts beyond Number precision',()=>{
 const format={Kind:'Composite',Parts:{a:{Source:'@.amount',Format:decimal},sep:{Text:' / '},b:{Source:'@.ratio',Format:{...decimal,TrimFraction:true}},suffix:{Text:'%'}}};
 const value={amount:{units:'9007199254740993123',scale:3,precision:2},ratio:{units:'550',scale:2}};
 assert.equal(validateFormat(format),undefined);
 const [rendered]=formatValue(value,format);
 assert.equal(rendered.kind,'Formatted');assert.deepEqual(rendered.value[0].parts,{whole:'9 007 199 254 740 993',fraction:'.12',unit:''});
 assert.equal(rendered.value[2].parts.fraction,'.5');assert.equal(value.amount.units,'9007199254740993123');
});
test('SPL text maps and conditional parts compose text without application formatting',()=>{
 const format={Kind:'Composite',Parts:{date:{Source:'@.date',Format:{Kind:'DateTime',Locale:'ru-RU',Options:{timeZone:'UTC',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}}},name:{Source:'@.name',Format:{Kind:'Text',Prefix:' · ',Fallback:'Unknown'}},state:{Source:'@.status',Format:{Kind:'Text',Map:{ready:'✓'},Fallback:'?'},When:'$.mode',Equals:'full'},comment:{Text:' appended',Unless:'@.muted'}}};
 assert.deepEqual(formatValue({date:'2026-10-12T09:00:00Z',status:'ready',muted:true},format,{mode:'full'}),[{kind:'Text',value:'12.10, 09:00 · Unknown✓'}]);
 assert.equal(formatValue('invalid',{Kind:'DateTime',Locale:'ru-RU'}).length,0);
 assert.deepEqual(formatValue('unmapped',{Kind:'Text',Map:{ready:'✓'}}),[]);
});
test('composite declarations round-trip and cannot bypass capability or validation',()=>{
 const format={Kind:'Composite',Parts:{literal:{Text:'Count: '},value:{Source:'@.count',Format:{Kind:'Text'}}}};
 const project={SetLang:{Name:'test',Version:1,Data:[{Login:'Root',Layout:[{Login:'Value',Properties:{Source:'$.record',Format:format}}],SimplePanels:[]}]},SetData:{Name:'data',Version:1,Data:{}},SetRender:{Name:'render',Version:1,Data:{}}};
 assert.deepEqual(parseSPL(serializeSPL(project)).SetLang.Data[0].Layout[0].Properties.Format,format);
 assert.throws(()=>validatePLang(project.SetLang.Data,{},['pcode.semantic-model.v1']),/composite-format/);
 assert.equal(validatePLang(project.SetLang.Data,{},['pcode.semantic-model.v1','pcode.composite-format.v1']),true);
 assert.throws(()=>validateFormat({...format,Parts:{x:{Source:'rawHTML',Format:{Kind:'Text'}}}}),/semantic path/);
 assert.throws(()=>validateFormat({...format,Parts:{x:{Text:'a',Source:'@.count'}}}),/literal/);
 assert.throws(()=>validateFormat({Kind:'Text',Map:{a:{html:'bad'}}}),/map/);
 assert.throws(()=>validateFormat({Kind:'Picture',Map:{x:'https://external.invalid/image.png'}}),/local images/);
});
