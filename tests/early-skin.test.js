import test from 'node:test';
import assert from 'node:assert/strict';
import {applyEarlySkin} from '../runtime/early-skin.js';

test('early skin chooses stored style and theme before runtime mount',()=>{
 const values=new Map([['style','Functional'],['appearance',JSON.stringify({theme:'dark'})]]),attributes={};
 const options={document:{documentElement:{setAttribute:(key,value)=>{attributes[key]=value}}},storage:{getItem:key=>values.get(key)},matchMedia:()=>({matches:false}),styleKey:'style',appearanceKey:'appearance',defaultSkin:'OldStyle',styleAttribute:'data-uc-style'};
 assert.deepEqual(applyEarlySkin(options),{skin:'Functional',theme:'dark'});
 assert.deepEqual(attributes,{'data-uc-style':'Functional','data-theme':'dark'});
 values.set('style','bad/skin');values.set('appearance','not json');
 assert.deepEqual(applyEarlySkin({...options,matchMedia:()=>({matches:true})}),{skin:'OldStyle',theme:'dark'});
});
