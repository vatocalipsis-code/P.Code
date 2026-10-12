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
