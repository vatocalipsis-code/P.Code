import test from 'node:test';import assert from 'node:assert/strict';
import {validatePLang} from '../runtime/validator.js';import {parseSPL,serializeSPL} from '../editor/spl.js';
const motion={Effect:'Slide',Speed:4.68,Acceleration:.12},caps=['pcode.modal-slide.v1','pcode.modal-transition.v1','pcode.semantic-controls.v1','pcode.semantic-model.v1'];
const lang=properties=>[{Login:'Scene',Properties:{Modal:true,VisibleSource:'$.open',...properties},Layout:[],SimplePanels:[]}];
test('modal slides negotiate bounded shared motion without business knowledge',()=>{
 const data=lang({ModalEnter:motion,ModalExit:motion});validatePLang(data,{},caps);
 const s={SetLang:{Name:'Motion contract',Version:1,Requires:caps,Data:data},SetData:{Name:'data',Version:1,Data:{}},SetRender:{Name:'render',Version:1,Data:{}}};assert.deepEqual(parseSPL(serializeSPL(s)),s);
 assert.throws(()=>validatePLang(data,{},caps.slice(1)),/modal-slide/);
 for(const rule of [{...motion,Speed:0},{...motion,Speed:100,Acceleration:1},{...motion,Acceleration:-1},{...motion,Function:'execute'},{Effect:'Fade',Duration:50}])assert.throws(()=>validatePLang(lang({ModalEnter:rule}),{},caps),/ModalEnter/);
});
