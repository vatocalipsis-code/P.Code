import test from 'node:test';import assert from 'node:assert/strict';
import {validatePLang} from '../runtime/validator.js';import {serializeSPL,parseSPL} from '../editor/spl.js';
const caps=['pcode.semantic-repeat.v1','pcode.semantic-model.v1','pcode.repeat-subset.v1'];
const lang=rule=>[{Login:'Scene',Layout:[],SimplePanels:[{Login:'Records',Layout:[],ActivePanels:[{Login:'Record',Properties:rule,Layout:[]}]}]}];
test('authored record subsets require capability and retain incoming semantic order',()=>{
 const rule={Repeat:'$.items',RepeatIds:['beta','alpha']};
 const source={SetLang:{Name:'Subset contract',Version:1,Requires:caps,Data:lang(rule)},SetData:{Name:'Data',Version:1,Data:{}},SetRender:{Name:'Render',Version:1,Data:{}}};
 assert.deepEqual(parseSPL(serializeSPL(source)),source);
 assert.throws(()=>validatePLang(lang(rule),{},caps.slice(0,2)),/repeat-subset/);
 validatePLang(lang(rule),{},caps);
 for(const value of ['alpha',[''],['alpha','alpha'],[42],Array(5001).fill('alpha')])assert.throws(()=>validatePLang(lang({...rule,RepeatIds:value}),{},caps),/RepeatIds/);
 assert.throws(()=>validatePLang(lang({RepeatIds:['alpha']}),{},caps),/RepeatIds/);
});
