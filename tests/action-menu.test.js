import test from 'node:test';import assert from 'node:assert/strict';
import {validatePLang} from '../runtime/validator.js';import {serializeSPL,parseSPL} from '../editor/spl.js';
const menu={Trigger:'Context',Class:'record-menu',EnabledSource:'@.allowed',HoldDelay:550,MoveTolerance:8,Items:{edit:{Text:'Edit',OffPress:'record.edit'},cancel:{Text:'Cancel'}}};
const lang=rule=>[{Login:'Scene',Layout:[],SimplePanels:[{Login:'Records',Layout:[],ActivePanels:[{Login:'Record',Properties:{ActionMenu:rule,OffPress:'record.open'},Layout:[]}]}]}];
const caps=['pcode.action-menu.v1','pcode.semantic-model.v1'];
test('authored menus round-trip and negotiate their runtime capability',()=>{
 const source={SetLang:{Name:'Menu contract',Version:1,Requires:caps,Data:lang(menu)},SetData:{Name:'Data',Version:1,Data:{}},SetRender:{Name:'Render',Version:1,Data:{}}};
 assert.deepEqual(parseSPL(serializeSPL(source)),source);
 assert.throws(()=>validatePLang(lang(menu),{},[]),/action-menu/);
 assert.throws(()=>validatePLang(lang(menu),{},['pcode.action-menu.v1']),/semantic-model/);
 validatePLang(lang(menu),{},caps);
});
test('menus reject executable paths, external pictures, unknown fields and ambiguous activation',()=>{
 for(const value of [{...menu,EnabledSource:'javascript:bad'},{...menu,Items:{edit:{Text:'Edit',Picture:'https://other/icon.png'}}},{...menu,Items:{edit:{Source:'$.name',Text:'Edit'}}},{...menu,OnClick:'execute()'},{...menu,Items:{}},{...menu,HoldDelay:-1}])assert.throws(()=>validatePLang(lang(value),{},caps),/ActionMenu/);
 assert.throws(()=>validatePLang(lang({...menu,Trigger:'Press'}),{},caps),/owns anchor activation/);
});
