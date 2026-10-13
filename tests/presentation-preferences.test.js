import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createPresentationPreferences} from '../host/presentation-preferences.js';

test('Picot owns the validation and projection of saved presentation preferences',()=>{
 const values=new Map([['user:7:visualStyle','Functional'],['user:7:rowHeight','52'],['user:7:font','bad']]);
 const get=userId=>key=>values.get('user:'+userId+':'+key);
 const presentation=createPresentationPreferences({styles:['OldStyle','Functional']});
 const current=presentation.read(get(7));
 assert.equal(current.visualStyle,'Functional');
 assert.equal(current.rowHeight,52);
 assert.equal(current.font,'system');
 assert.equal(presentation.read(get(8)).visualStyle,null);
 assert.equal(presentation.plan({visualStyle:'retired'},current).error,'Неверные настройки');
 assert.equal(presentation.plan({rowPadding:21},current).error,'Неверный внутренний отступ');
 assert.deepEqual(presentation.plan({theme:'dark',accent:'#af52de'},current).writes,{visualStyle:'Functional',haptics:'1',theme:'dark',accent:'#AF52DE',accentIntensity:'28',rowHeight:'52',rowPadding:'12',font:'system'});
 assert.deepEqual(presentation.initial,{theme:'dark',accent:'#636366',accentIntensity:'25',font:'system'});
});
