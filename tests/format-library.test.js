import test from'node:test';import assert from'node:assert/strict';import{resolveFormatLibrary}from'../runtime/format-library.js';import{parseSPL,serializeSPL}from'../editor/spl.js';import{PlaneCodeEngine}from'../runtime/public-runtime.js';
const capability='pcode.format-library.v1';
function project(){return {SetLang:{Name:'test',Version:1,Requires:[capability,'pcode.semantic-model.v1'],Formats:{Icon:{Kind:'Picture',Map:{key:'./image.png'},Fallback:'./fallback.png'}},Data:[{Login:'Root',Layout:[{Login:'First',Properties:{Source:'$.icon',FormatRef:'Icon'}},{Login:'Second',Properties:{Source:'$.icon',FormatRef:'Icon'}}],SimplePanels:[]}]},SetData:{Name:'data',Version:1,Data:{}},SetRender:{Name:'render',Version:1,Data:{Transparency:0,TextTransparency:0,PictureTransparency:0}}}}
test('skin-local formats round trip and share immutable definitions without changing authored trees',()=>{const p=project();assert.deepEqual(parseSPL(serializeSPL(p)),p);const expanded=resolveFormatLibrary(p.SetLang,[capability]);const [a,b]=expanded.Data[0].Layout;assert.equal(a.Properties.Format,b.Properties.Format);assert.ok(Object.isFrozen(a.Properties.Format.Map));assert.equal(p.SetLang.Data[0].Layout[0].Properties.FormatRef,'Icon');assert.equal(expanded.Formats,undefined);const next=project();next.SetLang.Formats.Icon.Fallback='./other.png';assert.equal(resolveFormatLibrary(next.SetLang,[capability]).Data[0].Layout[0].Properties.Format.Fallback,'./other.png')});
test('format references reject missing names, overrides, nested references and undeclared capabilities',()=>{
 assert.throws(()=>resolveFormatLibrary(project().SetLang,[]),/negotiated/);
 const unknown=project();unknown.SetLang.Data[0].Layout[0].Properties.FormatRef='Missing';assert.throws(()=>resolveFormatLibrary(unknown.SetLang,[capability]),/Unknown/);
 const override=project();override.SetLang.Data[0].Layout[0].Properties.Format={Kind:'Text'};assert.throws(()=>resolveFormatLibrary(override.SetLang,[capability]),/exclusive/);
 const nested=project();nested.SetLang.Formats.Icon={Kind:'Picture',FormatRef:'Icon'};assert.throws(()=>resolveFormatLibrary(nested.SetLang,[capability]),/Unknown Format/);
});
test('public runtime retains resolved schema across data updates and never falls back to another skin',async()=>{
 const p=project(),d=PlaneCodeEngine.getDescriptor(),connected=PlaneCodeEngine.connect({GenerationId:d.GenerationId,SerializationVersion:1,RequiredCapabilities:p.SetLang.Requires,OptionalCapabilities:[]});
 const prepared=await connected.Connection.prepare(p);assert.equal(prepared.Outcome,'Completed',JSON.stringify(prepared));
 assert.equal((await prepared.Runtime.applySetData(p.SetData)).Outcome,'Completed');await connected.Connection.close();
});
