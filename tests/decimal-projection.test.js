import test from 'node:test';import assert from 'node:assert/strict';
import {formatValue} from '../runtime/value-format.js';import {validateFormat,validatePLang} from '../runtime/validator.js';
const format={Kind:'Decimal',Precision:4,Rounding:'HalfTowardZero',NegativeSign:'-',GroupSeparator:'\u00a0',ReciprocalSource:'$.inverse',Fallback:'—'};
const parts=(value,inverse=false)=>formatValue(value,format,{inverse})[0].parts;
test('authored decimal projection rounds exactly without rewriting input',()=>{
 const value={units:'12345678912345678912345',scale:5};const saved=structuredClone(value);
 assert.deepEqual(parts(value),{whole:'123\u00a0456\u00a0789\u00a0123\u00a0456\u00a0789',fraction:'.1234',unit:''});assert.deepEqual(value,saved);
 assert.equal(parts('1.23455').fraction,'.2345');assert.equal(parts('1.23456').fraction,'.2346');assert.equal(parts('-1.23456').whole,'-1');assert.equal(parts('9.99999').whole,'10');
 assert.deepEqual(parts('2',true),{whole:'0',fraction:'.5000',unit:''});assert.equal(parts('3',true).fraction,'.3333');
 assert.deepEqual(formatValue('0',format,{inverse:true}),[{kind:'Text',value:'—'}]);
 assert.equal(parts('0.000000000000000000000001',true).whole,'1\u00a0000\u00a0000\u00a0000\u00a0000\u00a0000\u00a0000\u00a0000\u00a0000');
});
test('decimal projection contract rejects missing rounding, wrong paths and unbounded precision',()=>{
 validateFormat(format);
 for(const bad of [{...format,Precision:13},{...format,Precision:-1},{...format,Precision:1.2},{...format,Rounding:'Nearest'},{...format,Rounding:undefined},{...format,ReciprocalSource:'@.inverse'},{...format,Kind:'Text'}])assert.throws(()=>validateFormat(bad));
 assert.throws(()=>formatValue('1.'+'0'.repeat(25),format),/scale/);
 const data=[{Login:'Screen',Layout:[{Login:'Value',Properties:{Source:'$.number',Format:{Kind:'Composite',Parts:{number:{Source:'@.number',Format:format}}}}}]}];
 assert.throws(()=>validatePLang(data,{},['pcode.semantic-model.v1','pcode.composite-format.v1','pcode.decimal-sign.v1']),/decimal-projection/);
});
