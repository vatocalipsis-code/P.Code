import test from "node:test";
import assert from "node:assert/strict";
import {createPlaneCodeEngine} from "../runtime/public-runtime-core.js";
import {compileSetLang} from "../runtime/setlang-compiler.js";
import {validatePLang,validateSetData,validateSetEnvelope,validateSetRender,isCanonicalPngFile} from "../runtime/validator.js";

const setLang={Name:"test-lang",Version:1,Data:[{
  Login:"Base",Properties:{Direction:"Vertical"},Layout:[],SimplePanels:[{
    Login:"Surface",Properties:{Direction:"Vertical",AggregateActivePanels:[]},Layout:[],ActivePanels:[{
      Login:"Action",Properties:{Direction:"Vertical",OnPress:"cash.open.press",OffPress:"cash.open.release"},
      Layout:[{Login:"Icon",Properties:{Width:24,Height:24}}]
    }]
  }]
}]};
const setData={Name:"test-data",Version:1,Data:{Icon:{SourcePicture:"./assets/icon.png"}}};
const setRender={Name:"test-render",Version:1,Data:{PanelSpacing:8,BackgroundColor:"#000",PanelColor:"#111",BorderColor:"#222",TextColor:"#fff",Transparency:0,TextTransparency:0,PictureTransparency:0,Parallax:0}};

function harness(options={}){
  let compileCount=0;
  const sessions=[],calls={patch:0,dispose:0,cancel:0,render:0};
  const renderer={
    mount(target,plan,data,render,interaction){if(options.failMount)throw new Error("mount boom");sessions.push({target,plan,data,render,interaction});calls.render++},
    patchData(target,data){calls.patch++;sessions.find(x=>x.target===target).data=data},
    rerender(target,plan,data,render,interaction){calls.render++;sessions.push({target,plan,data,render,interaction})},
    cancelInteraction(){calls.cancel++},
    dispose(){calls.dispose++}
  };
  const engine=createPlaneCodeEngine({
    descriptor:{ComponentVersion:"2.10.0",GenerationId:"pcode.layout-group.v1",SupportedSerializationVersions:[1],Capabilities:[]},
    compile(value){compileCount++;return compileSetLang(value)},
    validateEnvelope:validateSetEnvelope,validatePlan:validatePLang,validateData:validateSetData,validateRender:validateSetRender,renderer
  });
  return {engine,sessions,calls,get compileCount(){return compileCount}};
}
function connect(engine){
  return engine.connect({GenerationId:"pcode.layout-group.v1",SerializationVersion:1,RequiredCapabilities:[],OptionalCapabilities:[]});
}

test("descriptor and negotiation are exact",()=>{
  const {engine}=harness();
  assert.deepEqual(engine.getDescriptor(),{ComponentVersion:"2.10.0",GenerationId:"pcode.layout-group.v1",SupportedSerializationVersions:[1],Capabilities:[]});
  assert.equal(connect(engine).Acceptance.Status,"Accepted");
  assert.equal(engine.connect({GenerationId:"other",SerializationVersion:1,RequiredCapabilities:[],OptionalCapabilities:[]}).Acceptance.Status,"Incompatible");
  assert.equal(engine.connect({GenerationId:"pcode.layout-group.v1",SerializationVersion:2,RequiredCapabilities:[],OptionalCapabilities:[]}).Acceptance.Status,"Incompatible");
  assert.equal(engine.connect({GenerationId:"pcode.layout-group.v1",SerializationVersion:1,RequiredCapabilities:["x"],OptionalCapabilities:[]}).Acceptance.Status,"Incompatible");
});

test("prepare rejects invalid event placeholders",async()=>{
  const {engine}=harness();
  const invalid=structuredClone(setLang);
  invalid.Data[0].SimplePanels[0].ActivePanels[0].Properties.OnPress="NOT_YET_SPECIFIED";
  const result=await connect(engine).Connection.prepare({SetLang:invalid,SetData:setData,SetRender:setRender});
  assert.equal(result.Outcome,"Rejected");
  assert.equal(result.Failure.Class,"setlang");
});

test("lifecycle, events, hot data and idempotent cleanup",async()=>{
  const h=harness();const connection=connect(h.engine).Connection;
  const prepared=await connection.prepare({SetLang:setLang,SetData:setData,SetRender:setRender});
  assert.equal(prepared.Outcome,"Completed");assert.equal(h.compileCount,1);
  const runtime=prepared.Runtime,target={},events=[];
  assert.equal((await runtime.setEventSink(event=>events.push(event))).Outcome,"Completed");
  assert.equal((await runtime.mount(target)).Outcome,"Completed");
  assert.equal((await runtime.enableInteraction()).Outcome,"Completed");
  h.sessions[0].interaction.emit("OnPress","Action","cash.open.press");
  assert.equal(events.length,1);assert.match(events[0].EventId,/^[A-Za-z0-9][A-Za-z0-9._:~-]{7,127}$/);
  assert.deepEqual({...events[0],EventId:"id"},{EventId:"id",EventType:"OnPress",ObjectLogin:"Action",OpaqueValue:"cash.open.press"});
  const next={...setData,Version:2,Data:{Icon:{SourcePicture:"./assets/next.png"}}};
  assert.equal((await runtime.applySetData(next)).Outcome,"Completed");assert.equal(h.calls.patch,1);assert.equal(h.compileCount,1);
  assert.equal((await runtime.disableInteraction()).Outcome,"Completed");assert.equal(h.calls.cancel,1);
  h.sessions[0].interaction.emit("OffPress","Action","cash.open.release");assert.equal(events.length,1);
  assert.equal((await runtime.dispose()).Outcome,"Completed");assert.equal((await runtime.dispose()).Outcome,"Completed");
  assert.equal((await connection.close()).Outcome,"Completed");assert.equal((await connection.close()).Outcome,"Completed");
});

test("an event sink is required when the plan contains event tokens",async()=>{
  const h=harness();const prepared=await connect(h.engine).Connection.prepare({SetLang:setLang,SetData:setData,SetRender:setRender});
  await prepared.Runtime.mount({});
  const result=await prepared.Runtime.enableInteraction();
  assert.equal(result.Outcome,"Rejected");assert.equal(result.Failure.Code,"event-sink-required");
});

test("render targets and runtimes are isolated",async()=>{
  const h=harness();const connection=connect(h.engine).Connection;
  const a=(await connection.prepare({SetLang:setLang,SetData:setData,SetRender:setRender})).Runtime;
  const b=(await connection.prepare({SetLang:setLang,SetData:setData,SetRender:setRender})).Runtime;
  const target={};
  assert.equal((await a.mount(target)).Outcome,"Completed");
  assert.equal((await b.mount(target)).Outcome,"Rejected");
  assert.equal((await b.mount({})).Outcome,"Completed");
});

test("renderer failure is fail-stop",async()=>{
  const h=harness({failMount:true});const runtime=(await connect(h.engine).Connection.prepare({SetLang:setLang,SetData:setData,SetRender:setRender})).Runtime;
  assert.equal((await runtime.mount({})).Outcome,"Failed");
  assert.equal((await runtime.applySetData(setData)).Outcome,"Rejected");
  assert.equal((await runtime.dispose()).Outcome,"Completed");
});

test("PNG source validation rejects remote, traversal and non-PNG values",()=>{
  assert.equal(isCanonicalPngFile("./assets/icon.png"),true);
  assert.equal(isCanonicalPngFile("https://example.test/icon.png"),false);
  assert.equal(isCanonicalPngFile("../icon.png"),false);
  assert.equal(isCanonicalPngFile("./assets/icon.jpg"),false);
});
