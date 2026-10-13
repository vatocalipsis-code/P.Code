import {test} from 'node:test';
import assert from 'node:assert/strict';
import {VISUAL_STYLES,loadVisualStyleCatalog,readVisualStyle,resolveVisualStyle,visualStyleChoices,applyVisualStyle,commitVisualStyle} from '../runtime/skin-manager.js';

test('skin manager accepts the installed catalog and keeps visual state in Picot',async()=>{
 const fetchBefore=globalThis.fetch;
 const previous={...VISUAL_STYLES};
 try{
  globalThis.fetch=async()=>({ok:true,json:async()=>[
   {key:'OldStyle',label:'Old Style'},{key:'Functional',label:'Functional'}
  ]});
  const first=loadVisualStyleCatalog();
  assert.equal(loadVisualStyleCatalog(),first,'Early boot and app reuse one catalog request');
  await first;
  assert.equal(loadVisualStyleCatalog(),first,'Completed catalog is reused');
  assert.deepEqual(Object.keys(VISUAL_STYLES),['OldStyle','Functional']);
  assert.equal(readVisualStyle({getItem:()=>null}),'OldStyle');
  assert.equal(resolveVisualStyle('Functional'),'Functional');
  assert.equal(resolveVisualStyle('unknown'),'OldStyle');
  assert.equal(resolveVisualStyle('Functional',{onboarding:true}),'OldStyle');
  assert.deepEqual(visualStyleChoices('Functional',{enabled:false}),{available:[
   {id:'OldStyle',label:'Old Style',selected:false},{id:'Functional',label:'Functional',selected:true}
  ],enabled:false});
  const attributes=new Map(),doc={getAttribute:name=>attributes.get(name),setAttribute:(name,value)=>attributes.set(name,value)};
  const root={dataset:{}};
  const saved=[];
  assert.equal(commitVisualStyle('Functional',{storage:{setItem:(key,value)=>saved.push([key,value])},root,doc}),'Functional');
  assert.equal(attributes.get('data-picot-skin'),'Functional');
  assert.equal(root.dataset.splSkin,'Functional');
  assert.equal(root.dataset.uiBase,'Standard');
  assert.deepEqual(saved,[['picot.visualStyle','Functional']]);
  assert.equal(readVisualStyle({getItem:()=> 'Functional'}),'Functional');
  assert.throws(()=>commitVisualStyle('missing',{root,doc}),RangeError);
 }finally{
  globalThis.fetch=fetchBefore;
  for(const key of Object.keys(VISUAL_STYLES))delete VISUAL_STYLES[key];
  Object.assign(VISUAL_STYLES,previous);
 }
});

test('skin manager rejects malformed catalogs without replacing the current one',async()=>{
 const fetchBefore=globalThis.fetch;
 const previous={...VISUAL_STYLES};
 try{
  VISUAL_STYLES.OldStyle={label:'Old Style',splFile:'OldStyle'};
  globalThis.fetch=async()=>({ok:true,json:async()=>[
   {key:'Functional',label:'Functional'},{key:'Functional',label:'Duplicate'}
  ]});
  await assert.rejects(()=>loadVisualStyleCatalog({reload:true}),/повреждён/);
  assert.ok(Object.hasOwn(VISUAL_STYLES,'OldStyle'));
 }finally{
  globalThis.fetch=fetchBefore;
  for(const key of Object.keys(VISUAL_STYLES))delete VISUAL_STYLES[key];
  Object.assign(VISUAL_STYLES,previous);
 }
});

test('catalog order controls the default and failed requests can be retried',async()=>{
 const fetchBefore=globalThis.fetch,previous={...VISUAL_STYLES};let requests=0;
 try{
  globalThis.fetch=async()=>{requests++;if(requests===1)throw Error('offline');return {ok:true,json:async()=>[{key:'Functional',label:'Functional'},{key:'OldStyle',label:'Old Style'}]}};
  await assert.rejects(loadVisualStyleCatalog({reload:true}),/offline/);
  await loadVisualStyleCatalog();
  assert.equal(requests,2);
  assert.equal(readVisualStyle({getItem:()=>null}),'Functional');
  assert.equal(resolveVisualStyle('OldStyle',{onboarding:true}),'Functional');
  assert.equal(readVisualStyle({getItem:()=> 'OldStyle'}),'OldStyle');
 }finally{
  globalThis.fetch=fetchBefore;
  for(const key of Object.keys(VISUAL_STYLES))delete VISUAL_STYLES[key];
  Object.assign(VISUAL_STYLES,previous);
 }
});
