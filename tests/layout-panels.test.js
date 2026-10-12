import test from 'node:test';
import assert from 'node:assert/strict';
import {parseSPL,serializeSPL} from '../editor/spl.js';
import {compileSetLang} from '../runtime/setlang-compiler.js';
import {validatePLang} from '../runtime/validator.js';
const caps=['pcode.flow-layout.v1','pcode.layout-panels.v1'];
const active={Type:'ActivePanel',Login:'Action',Properties:{OffPress:'perform'},Layout:[{Login:'Caption',Properties:{}}]};
const simple={Type:'SimplePanel',Login:'Section',Properties:{},Layout:[],ActivePanels:[{Login:'Nested',Properties:{OffPress:'nested'},Layout:[]}]};
const data=[{Login:'Page',Layout:[simple,{Type:'Flow',Login:'Frame',Properties:{Tag:'section'},Layout:[active]}],SimplePanels:[]}];
test('panels retain their kind and order inside mixed layout through SPL round trip',()=>{
 const source={SetLang:{Name:'Structure',Version:1,Requires:caps,Data:data},SetData:{Name:'Data',Version:1,Data:{}},SetRender:{Name:'Render',Version:1,Data:{}}};
 const parsed=parseSPL(serializeSPL(source));assert.deepEqual(parsed.SetLang.Data,data);assert.equal(validatePLang(parsed.SetLang.Data,{},caps),true);
 const plan=compileSetLang(parsed.SetLang.Data);assert.equal(plan[0].layout[0].type,'SimplePanel');assert.equal(plan[0].layout[1].layout[0].type,'ActivePanel');assert.equal(plan[0].layout[1].layout[0].OffPress,'perform');
});
test('mixed panel layout negotiates support and validates nested properties and commands',()=>{
 assert.throws(()=>validatePLang(data,{},['pcode.flow-layout.v1']),/layout-panels/);
 const invalid=structuredClone(data);invalid[0].Layout[1].Layout[0].Properties.OffPress={code:'execute'};assert.throws(()=>validatePLang(invalid,{},caps),/event token|opaque|OffPress/i);
 const duplicate=structuredClone(data);duplicate[0].Layout[1].Layout[0].Login='Section';assert.throws(()=>validatePLang(duplicate,{},caps),/duplicate/i);
});
test('alternating panel and Flow nesting cannot reset the depth budget',()=>{
 let child={Type:'Flow',Login:'Leaf',Properties:{Tag:'span'},Layout:[]};
 for(let n=0;n<40;n++)child=n%2?{Type:'SimplePanel',Login:'Panel '+n,Properties:{},Layout:[child],ActivePanels:[]}:{Type:'Flow',Login:'Flow '+n,Properties:{Tag:'div'},Layout:[child]};
 assert.throws(()=>validatePLang([{Login:'Page',Layout:[child],SimplePanels:[]}],{},caps),/nesting exceeds/);
});
