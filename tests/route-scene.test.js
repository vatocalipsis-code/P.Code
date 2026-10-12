import test from 'node:test';
import assert from 'node:assert/strict';
import {routeFrame,slideFrames} from '../runtime/route-scene.js';
import {gestureRegion} from '../runtime/route-gestures.js';
import {validatePLang} from '../runtime/validator.js';
import {parseSPL,serializeSPL} from '../editor/spl.js';

const route=(id,mode='Replace')=>({route:{Id:id,Source:'$.location',Mode:mode,EnabledSource:'$.allowed'}});
test('route presentation belongs to the authored declaration, not the application state',()=>{
  const model={allowed:true,location:{id:'details',history:['start','list','start','details']}};
  const flat=routeFrame([route('start'),route('details')],model);
  assert.equal(flat.layered,false);assert.deepEqual(flat.history,[]);
  const layered=routeFrame([route('start'),route('details','Stack')],model);
  assert.equal(layered.layered,true);assert.deepEqual(layered.history,['start','list']);
  assert.deepEqual(model.location.history,['start','list','start','details']);
  assert.equal(routeFrame([route('details','Stack')],{...model,allowed:false}).layered,false);
  assert.equal(routeFrame([route('start')],model).selected,undefined);
});
test('route transitions preserve the authored acceleration and end position',()=>{
  const closing=slideFrames(390,4.68,.12,true),opening=slideFrames(390,4.68,.12);
  assert.equal(closing.frames[0].transform,'translate3d(0px,0,0)');
  assert.equal(closing.frames.at(-1).transform,'translate3d(390px,0,0)');
  assert.equal(opening.frames.at(-1).transform,'translate3d(0px,0,0)');
  assert.ok(Math.abs(closing.duration-273.6752136752137)<1e-8);
  assert.ok(slideFrames(390,4,0).frames.every(frame=>!frame.transform.includes('NaN')));
});
test('gesture regions are authored ranges with inclusive edges',()=>{
 const rule={BackRegion:[.05,.65],MenuRegion:[.35,.95],PullRegion:[.05,.25]};
 assert.equal(gestureRegion(5,5,100,100,rule).backAllowed,true);
 assert.equal(gestureRegion(65,25,100,100,rule).backAllowed,true);
 assert.equal(gestureRegion(66,26,100,100,rule).backAllowed,false);
 assert.equal(gestureRegion(35,5,100,100,rule).menuAllowed,true);
 assert.equal(gestureRegion(95,25,100,100,rule).menuAllowed,true);
 assert.equal(gestureRegion(96,26,100,100,rule).menuAllowed,false);
 assert.equal(gestureRegion(50,26,100,100,rule).pullAllowed,false);
});
test('route declarations require an explicit capability and reject invalid contracts',()=>{
  const rule={Id:'start',Source:'$.location',Mode:'Replace'},panel={Login:'Main',Properties:{Route:rule},Layout:[],SimplePanels:[]};
  assert.throws(()=>validatePLang([panel]),/Route requires/);
  assert.equal(validatePLang([panel],{},['pcode.semantic-model.v1','pcode.semantic-routes.v1']),true);
  for(const invalid of [{...rule,Mode:'Unknown'},{...rule,Speed:-1},{...rule,Escape:true},{...rule,Source:'location'},{...rule,PanelClass:'a[]'}])
    assert.throws(()=>validatePLang([{...panel,Properties:{Route:invalid}}],{},['pcode.semantic-routes.v1']),/Route/);
});
test('SPL roundtrip retains route composition and opaque dismissal',()=>{
  const text='SetLang { Name = "route-test" Version = 1 Data { BasePanel "Main" { Properties { Route { Id = "start" Source = "$.location" Mode = "Stack" Dismiss = "go.back" Escape = true } } SimplePanels [] } } } SetData { Name = "data" Version = 1 Data {} } SetRender { Name = "render" Version = 1 Data {} }';
  const parsed=parseSPL(text),again=parseSPL(serializeSPL(parsed));
  assert.deepEqual(again.SetLang.Data[0].Properties.Route,parsed.SetLang.Data[0].Properties.Route);
});
