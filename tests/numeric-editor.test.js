import test from 'node:test';
import assert from 'node:assert/strict';
import {decimalKey,patchDecimalInput,validateDecimalInput,validateNumericEditor} from '../runtime/numeric-editor.js';
import {withModel} from '../runtime/semantic-model.js';
import {validatePLang} from '../runtime/validator.js';
test('decimal editing preserves exact digits, limits fractional precision and never coerces to Number',()=>{
 let value='0';for(const key of '12345678901234567890123456789')value=decimalKey(value,key,2,24);
 assert.equal(value,'123456789012345678901234');
 value='0';for(const key of '0012,345')value=decimalKey(value,key,2,24);assert.equal(value,'12,34');
 assert.equal(decimalKey('12',',',0,24),'12');assert.equal(decimalKey('1','erase',2,24),'0');
 assert.equal(decimalKey('12,',',',2,24),'12,');assert.equal(decimalKey('12','x',2,24),'12');
});
test('SPL decimal fields negotiate a capability and validate precision and semantic paths',()=>{
 const plan=[{Login:'Form',Properties:{},Layout:[{Type:'EditableInput',Login:'Quantity',Properties:{InputType:'Number',DecimalInput:{Precision:3,PrecisionSource:'$.precision'}}}],SimplePanels:[]}];
 assert.throws(()=>validatePLang(plan,{},['pcode.editable-input.v1']),/numeric-editor/);
 assert.throws(()=>validatePLang(plan,{},['pcode.editable-input.v1','pcode.numeric-editor.v1','pcode.semantic-model.v1']),/declaration/);
 assert.throws(()=>validateDecimalInput({Precision:25},'EditableInput Value'),/Precision/);
 assert.throws(()=>validateDecimalInput({Precision:2,PrecisionSource:'document.value'},'EditableInput Value'),/PrecisionSource/);
 assert.throws(()=>validateDecimalInput({Precision:2},'Container Value'),/EditableInput/);
 assert.throws(()=>validateNumericEditor({OverlayClass:'x y'},'BasePanel Page'),/OverlayClass/);
});
test('custom input read-only state is independent of native keyboard suppression',()=>{
 const attrs={},el={setAttribute:(key,value)=>attrs[key]=value,removeAttribute:key=>delete attrs[key]};
 const node={Input:{},Visual:{DecimalInput:{Precision:2,PrecisionSource:'$.precision',ReadOnlySource:'$.calculated'}}};
 patchDecimalInput(el,node,withModel({},{precision:0,calculated:false}));
 assert.equal(el.readOnly,true);assert.equal(el.inputMode,'none');assert.equal(el.__planeDecimal.precision,0);assert.equal(el.__planeDecimal.readOnly,false);assert.equal(attrs['aria-readonly'],undefined);
 patchDecimalInput(el,node,withModel({},{precision:3,calculated:true}));
 assert.equal(el.__planeDecimal.readOnly,true);assert.equal(attrs['aria-readonly'],'true');
});

test('decimal preview rounds only its representation with exact half toward zero',async()=>{
 const {decimalPreviewParts}=await import('../runtime/numeric-editor.js');
 const rule={GroupSeparator:'\u00a0',DecimalSeparator:'.'};
 const text=(value,precision)=>{const parts=decimalPreviewParts(value,precision,rule);return parts&&parts.whole+parts.fraction};
 assert.equal(text('12',2),'12.00');assert.equal(text('12.3455',3),'12.345');assert.equal(text('12.34551',3),'12.346');
 assert.equal(text('0.5',0),'0');assert.equal(text('0.51',0),'1');assert.equal(text('-1.005',2),'-1.00');assert.equal(text('-0.00001',2),'0.00');
 assert.equal(text('999999999999999999999.99',2),'999\u00a0999\u00a0999\u00a0999\u00a0999\u00a0999\u00a0999.99');
 assert.equal(text('12,5',4),'12.5000');assert.equal(text('12.',0),'12');assert.equal(text('',2),null);assert.equal(text('NaN',2),null);assert.equal(text('1',25),null);
});
test('decimal preview styles and rounding are explicit SPL parameters',()=>{
 const preview={Class:'preview',HostClass:'host',ProjectedClass:'projected',NumberClass:'number',FractionClass:'fraction',GroupSeparator:' ',DecimalSeparator:'.',Rounding:'HalfTowardZero'};
 validateDecimalInput({Precision:2,Preview:preview},'EditableInput Value');
 for(const patch of [{Class:'two classes'},{Rounding:'financial-rule'},{GroupSeparator:{}},{Unknown:1}])assert.throws(()=>validateDecimalInput({Precision:2,Preview:{...preview,...patch}},'EditableInput Value'),/Preview/);
});
test('preview declaration round-trips and cannot be used without its capability',async()=>{
 const {parseSPL,serializeSPL}=await import('../editor/spl.js');
 const preview={Class:'preview',HostClass:'host',ProjectedClass:'projected',NumberClass:'number',FractionClass:'fraction',GroupSeparator:'\u00a0',DecimalSeparator:'.',Rounding:'HalfTowardZero'};
 const rule={Precision:2,Preview:preview};
 const plan=[{Login:'Form',Properties:{NumericEditor:{}},Layout:[{Type:'EditableInput',Login:'Quantity',Properties:{InputType:'Number',DecimalInput:rule}}],SimplePanels:[]}];
 assert.throws(()=>validatePLang(plan,{},['pcode.editable-input.v1','pcode.numeric-editor.v1','pcode.semantic-model.v1']),/Preview requires pcode.decimal-preview/);
 const project={SetLang:{Name:'component',Version:1,Data:plan},SetData:{Name:'data',Version:1,Data:{}},SetRender:{Name:'render',Version:1,Data:{}}};
 assert.deepEqual(parseSPL(serializeSPL(project)).SetLang.Data[0].Layout[0].Properties.DecimalInput,rule);
});
