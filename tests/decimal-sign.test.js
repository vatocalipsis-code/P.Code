import test from 'node:test';
import assert from 'node:assert/strict';
import {decimalParts} from '../runtime/semantic-model.js';
import {validateFormat,validatePLang} from '../runtime/validator.js';
test('SPL decimal sign preserves exact magnitude and requires explicit capability',()=>{
 const value={units:'-999999999999000',scale:3,precision:2};
 assert.equal(decimalParts(value).whole,'−999 999 999 999');
 assert.equal(decimalParts(value,{NegativeSign:'-'}).whole,'-999 999 999 999');
 assert.equal(decimalParts(value,{NegativeSign:'-',Absolute:true}).whole,'999 999 999 999');
 const format={Kind:'Decimal',NegativeSign:'-'};validateFormat(format);
 assert.throws(()=>validateFormat({...format,Kind:'Text'}),/NegativeSign/);
 assert.throws(()=>validateFormat({...format,NegativeSign:'<b>'}),/NegativeSign/);
 const lang=[{Login:'Page',SimplePanels:[],ActivePanels:[],Layout:[{Login:'Value',Properties:{Source:'$.amount',Format:{Kind:'Composite',Parts:{number:{Source:'@.number',Format:format}}}}}]}];
 const caps=['pcode.semantic-model.v1','pcode.composite-format.v1'];
 assert.throws(()=>validatePLang(lang,{},caps),/decimal-sign/);
 assert.equal(validatePLang(lang,{},[...caps,'pcode.decimal-sign.v1']),true);
});
