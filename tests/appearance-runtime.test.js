import {test} from 'node:test';
import assert from 'node:assert/strict';
import {applyAppearance,applyAppearancePreferenceChange,appearanceSettingsModel,appearanceChanged,followsSystemAppearance,appearanceActionHandlers,watchSystemAppearance} from '../runtime/appearance.js';
import {VISUAL_STYLES} from '../runtime/skin-manager.js';

test('Picot builds the appearance settings view from saved preferences',()=>{
 assert.deepEqual(appearanceSettingsModel(null),{theme:'system',font:'system',accent:'#007AFF',haptics:false,enabled:true,rowHeight:44,rowPadding:12,accentIntensity:28});
 assert.deepEqual(appearanceSettingsModel({theme:'dark',font:'inter',accent:'#34c759',haptics:true,rowHeight:48,rowPadding:10,accentIntensity:25},{enabled:false}),
  {theme:'dark',font:'inter',accent:'#34C759',haptics:true,enabled:false,rowHeight:48,rowPadding:10,accentIntensity:25});
});

test('Picot installs a saved skin and restores the previous preference if install fails',async()=>{
 let preferences={visualStyle:'OldStyle'},fail=false;
 const calls=[];
 const adapter={readPreferences:()=>preferences,setPreferences:value=>{preferences=value},currentStyle:()=>preferences.visualStyle,
  save:async patch=>{calls.push(['save',patch.visualStyle]);return {preferences:{...preferences,...patch}}},
  mountStyle:async style=>{calls.push(['mount',style]);if(fail)throw Error('SPL unavailable')},
  remountCurrent:async()=>calls.push(['remount']),commitStyle:style=>calls.push(['commit',style])};
 await applyAppearancePreferenceChange({visualStyle:'Functional'},adapter);
 assert.equal(preferences.visualStyle,'Functional');
 assert.deepEqual(calls,[['save','Functional'],['mount','Functional'],['commit','Functional']]);
 calls.length=0;fail=true;
 await assert.rejects(applyAppearancePreferenceChange({visualStyle:'OldStyle'},adapter),/SPL unavailable/);
 assert.equal(preferences.visualStyle,'Functional');
 assert.deepEqual(calls,[['save','OldStyle'],['mount','OldStyle'],['commit','Functional'],['save','Functional']]);
 calls.length=0;
 await applyAppearancePreferenceChange({theme:'dark'},adapter);
 assert.equal(preferences.theme,'dark');
 assert.deepEqual(calls,[['save',undefined],['remount']]);
});

test('Picot owns appearance commands and validates the selection before persisting',()=>{
 const changes=[];VISUAL_STYLES.Functional={label:'Functional',splFile:'Functional'};
 try{
  const actions=appearanceActionHandlers({change:patch=>changes.push(patch),readPreferences:()=>({haptics:true}),prefix:'cash.appearance',hapticsCommand:'cash.haptics.toggle'});
  actions['cash.appearance.theme.dark']();
  actions['cash.appearance.accent.blue']();
  actions['cash.appearance.font.inter']();
  actions['cash.appearance.visualStyle.select']({ItemId:'Functional'});
  actions['cash.appearance.visualStyle.select']({ItemId:'missing'});
  actions['cash.appearance.rowHeight.change']({Value:'48'});
  actions['cash.appearance.rowHeight.change']({Value:'65'});
  actions['cash.haptics.toggle']();
  assert.deepEqual(changes,[{theme:'dark'},{accent:'#007AFF'},{font:'inter'},{visualStyle:'Functional'},{rowHeight:48},{haptics:false}]);
  assert.equal(followsSystemAppearance({theme:'system'}),true);
  assert.equal(followsSystemAppearance({theme:'dark'}),false);
  assert.equal(appearanceChanged({theme:'light',rowPadding:12},{theme:'light',rowPadding:12}),false);
  assert.equal(appearanceChanged({theme:'light'},{theme:'dark'}),true);
 }finally{delete VISUAL_STYLES.Functional}
});

test('Picot applies saved appearance and screen metadata without application DOM work',()=>{
 const before=globalThis.matchMedia;
 const values=new Map(),attributes=new Map(),saved=[];
 const html={dataset:{},style:{getPropertyValue:key=>values.get(key),setProperty:(key,value)=>values.set(key,value)},getAttribute:key=>attributes.get(key),setAttribute:(key,value)=>attributes.set(key,value)};
 const meta={content:''},viewport={content:''};
 const doc={documentElement:html,querySelector:key=>key==='meta[name="theme-color"]'?meta:viewport};
 const root={dataset:{}};
 VISUAL_STYLES.OldStyle={label:'Old Style',splFile:'OldStyle'};
 try{
  globalThis.matchMedia=()=>({matches:false});
  applyAppearance({preferences:{theme:'dark',accent:'#34C759',rowHeight:48,rowPadding:10,font:'inter'},visualStyle:'OldStyle',root,authenticated:true,persist:true,document:doc,storage:{setItem:(key,value)=>saved.push([key,value])}});
  assert.equal(html.dataset.theme,'dark');
  assert.equal(html.dataset.ucFont,'inter');
  assert.equal(values.get('--uc-row-height'),'48px');
  assert.equal(values.get('--uc-row-padding'),'10px');
  assert.equal(root.dataset.splSkin,'OldStyle');
  assert.equal(meta.content,'#111113');
  assert.match(viewport.content,/maximum-scale=1/);
  assert.equal(saved[0][0],'picot.appearance');
  assert.equal(attributes.get('data-picot-skin'),'OldStyle');
 }finally{globalThis.matchMedia=before;delete VISUAL_STYLES.OldStyle}
});

test('Picot watches system appearance only when the caller needs it',()=>{
 const before=globalThis.matchMedia;
 let listener,changes=0,allowed=false;
 try{
  globalThis.matchMedia=()=>({matches:false,addEventListener:(_,callback)=>listener=callback,removeEventListener:(_,callback)=>assert.equal(listener,callback)});
  const stop=watchSystemAppearance(()=>allowed,()=>changes++);
  listener();assert.equal(changes,0);
  allowed=true;listener();assert.equal(changes,1);
  stop();
 }finally{globalThis.matchMedia=before}
});
