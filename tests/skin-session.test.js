import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSkinSession} from '../runtime/skin-session.js';
import {VISUAL_STYLES} from '../runtime/skin-manager.js';

test('Picot owns SPL installation, semantic binding and rollback',async()=>{
 const calls=[],sources=new Map();let sink;
 const createHost=()=>({
  load:async({key})=>{const parsed={SetLang:{Name:key,ThemeContract:'SelfContained'},SetData:{}};const source={text:key,parsed};sources.set(key,source);return source},
  getCached:key=>sources.get(key),
  prepare:async skin=>({connection:{close:async()=>calls.push('close')},runtime:{
   setEventSink:async callback=>{sink=callback;return {Outcome:'Completed'}},
   mount:async()=>{calls.push('mount:'+skin.SetLang.Name);if(skin.SetLang.Name==='Broken')throw Error('install failed');return {Outcome:'Completed'}},
   enableInteraction:async()=>({Outcome:'Completed'}),applyModel:async model=>({Outcome:'Completed',model}),consumeBack:()=>false
  }}),
  updatePresentation:async(_,fn)=>fn(),deliverFile:()=>{}
 });
 VISUAL_STYLES.Demo={label:'Demo',splFile:'Demo'};VISUAL_STYLES.Broken={label:'Broken',splFile:'Broken'};
 try{
  const session=createSkinSession({root:{},contract:()=>({id:'contract'}),validateContract:()=>({id:'contract'}),actionRegistry:()=>({open:true}),
   onEvent:(event,registry)=>calls.push([event.type,registry.open]),onEventError:error=>{throw error},bind:async()=>calls.push('bind'),surface:async()=>calls.push('surface'),
   appearance:()=>({preferences:{theme:'light'},authenticated:true,persist:false}),selectedStyle:()=> 'Demo',expectedName:style=>style,
   createHost,projectAppearance:()=>{},applyStyle:style=>calls.push('style:'+style)});
  await session.mount('Demo');assert.equal(session.active,true);assert.equal(session.label,'Demo');
  sink({type:'open'});assert.deepEqual(calls.at(-1),['open',true]);
  assert.equal((await session.applyModel({records:[1]})).model.records[0],1);
  await assert.rejects(session.mount('Broken'),/install failed/);
  assert.equal(session.label,'Demo');assert.ok(calls.filter(value=>value==='mount:Demo').length>=2);
 }finally{delete VISUAL_STYLES.Demo;delete VISUAL_STYLES.Broken}
});
