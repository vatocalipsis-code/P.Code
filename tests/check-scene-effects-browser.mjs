import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
const directory=resolve('.'),server=createServer(async(req,res)=>{
 try{
  if(req.url==='/'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><link rel="stylesheet" href="/runtime/renderer.css"><style>.records{height:100px;overflow:auto}.records p{margin:0;height:20px}.handle{height:20px;width:100px;background:#888}.fixture{padding:4px}textarea{box-sizing:border-box;padding:10px 0;line-height:24px;width:200px}</style><div id="plane-code-root"></div>');return}
  const file=resolve(directory,'.'+new URL(req.url,'http://local').pathname);if(!file.startsWith(directory+'/')||!['.js','.css'].includes(extname(file)))throw Error('unknown');
  res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':'text/css');res.end(await readFile(file));
 }catch{res.statusCode=404;res.end()}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const engine=process.env.UI_BROWSER??'chromium',browser=await (await import(process.env.PLAYWRIGHT_MODULE))[engine].launch({headless:true});
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port);
 await page.evaluate(async()=>{
  const {PlaneCodeEngine}=await import('/runtime/public-runtime.js');
  const flow=(Login,Properties,Layout=[])=>({Type:'Flow',Login,Properties,Layout});
  const caps=['pcode.native-confirm.v1','pcode.scene-effects.v1','pcode.semantic-controls.v1','pcode.flow-layout.v1','pcode.semantic-model.v1','pcode.semantic-repeat.v1','pcode.editable-input.v1'];
  const connection=PlaneCodeEngine.connect({GenerationId:'pcode.layout-group.v1',SerializationVersion:1,RequiredCapabilities:caps,OptionalCapabilities:[]}).Connection;
  const result=await connection.prepare({SetLang:{Name:'Flow test',Version:1,Requires:caps,Data:[{Login:'Scene',Properties:{Modal:true,VisibleSource:'$.open',SceneEffects:{Confirm:{Source:'$.decision',Messages:{discard:'Discard changes?'},Accept:'decision.accept',Reject:'decision.reject'},AutoSize:{Target:'Input',RowHeight:44,MultilineHeight:88,MultilineClass:'multiline'},Scroll:{Target:'Records',Threshold:8,LatestSource:'$.latest'},Resize:{Handle:'Handle',Target:'Records',MinHeight:96,ViewportMargin:180},Focus:{Target:'Input',CompactTarget:'Section',CompactWidth:600},Viewport:{TopVariable:'--top',HeightVariable:'--height'}}},Layout:[flow('Section',{Tag:'section',Class:'fixture'},[
   {Type:'EditableInput',Login:'Input',Properties:{InputType:'Multiline',Rows:1,Source:'$.draft',OnInput:'edit'}},
   flow('Records',{Tag:'div',Class:'records'},[flow('Record',{Tag:'p',Repeat:'$.records',Source:'@.name'})]),flow('Handle',{Tag:'div',Class:'handle'})
  ])],SimplePanels:[]}]},SetData:{Name:'Flow data',Version:1,Data:{}},SetRender:{Name:'Flow render',Version:1,Data:{Transparency:0,TextTransparency:0,PictureTransparency:0}}});
  if(result.Outcome!=='Completed')throw Error(JSON.stringify(result));
  window.flowRuntime=result.Runtime;window.flowEvents=[];window.flowModel={open:false,draft:'',records:[]};
  await flowRuntime.setEventSink(e=>flowEvents.push(e));await flowRuntime.applyModel(flowModel);
  const mounted=await flowRuntime.mount(document.getElementById('plane-code-root'));if(mounted.Outcome!=='Completed')throw Error(JSON.stringify(mounted));await flowRuntime.enableInteraction();
 });
 const node=login=>page.locator('[data-plane-login="'+login+'"]');
 const update=value=>page.evaluate(async value=>{flowModel={...flowModel,...value};await flowRuntime.applyModel(flowModel);await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))},value);
 await page.evaluate(()=>{
  window.closedMeasurements=[];
  for(const name of ['scrollHeight','clientHeight','scrollTop']){const d=Object.getOwnPropertyDescriptor(Element.prototype,name);if(!d?.get)continue;Object.defineProperty(Element.prototype,name,{...d,get(){if(new Error().stack.includes('scene-effects.js'))closedMeasurements.push(name);return d.get.call(this)}})}
  const rect=Element.prototype.getClientRects;Element.prototype.getClientRects=function(){if(new Error().stack.includes('scene-effects.js'))closedMeasurements.push('rect');return rect.call(this)};
 });
 for(let i=0;i<3;i++)await update({draft:'closed '+i});
 assert.deepEqual(await page.evaluate(()=>closedMeasurements),[],'Closed scenes must not synchronously measure their descendants');
 await update({open:true,draft:'One',records:Array.from({length:30},(_,i)=>({id:String(i),name:'Record '+i}))});
 assert.equal(await node('Input').evaluate(n=>Math.round(n.getBoundingClientRect().height)),44);
 await update({draft:'One\nTwo'});assert.ok(await node('Input').evaluate(n=>n.getBoundingClientRect().height>=88));
 assert.ok(await node('Records').evaluate(n=>n.scrollHeight-n.clientHeight-n.scrollTop<=1));
 await node('Records').evaluate(n=>n.scrollTop=100);await update({records:Array.from({length:31},(_,i)=>({id:String(i),name:'Record '+i}))});assert.equal(await node('Records').evaluate(n=>n.scrollTop),100);
 await update({latest:'new-record'});assert.ok(await node('Records').evaluate(n=>n.scrollHeight-n.clientHeight-n.scrollTop<=1),'A changed latest record pins the end');
 const before=await node('Records').evaluate(n=>n.clientHeight),box=await node('Handle').boundingBox();await page.mouse.move(box.x+10,box.y+10);await page.mouse.down();await page.mouse.move(box.x+10,box.y+50);await page.mouse.up();assert.ok(await node('Records').evaluate(n=>n.clientHeight)>before);
 page.once('dialog',async dialog=>{assert.equal(dialog.message(),'Discard changes?');await dialog.dismiss()});
 await update({decision:'discard'});assert.equal(await page.evaluate(()=>flowEvents.at(-1).OpaqueValue),'decision.reject');assert.equal(await page.evaluate(()=>flowEvents.at(-1).Value),'discard');
 const count=await page.evaluate(()=>flowEvents.length);await update({draft:'unrelated'});assert.equal(await page.evaluate(()=>flowEvents.length),count,'Unrelated state does not repeat a decision');
 await update({decision:null});page.once('dialog',dialog=>dialog.accept());await update({decision:'discard'});assert.equal(await page.evaluate(()=>flowEvents.at(-1).OpaqueValue),'decision.accept');
 await update({open:false});await page.evaluate(()=>closedMeasurements=[]);await update({draft:'closed again'});assert.deepEqual(await page.evaluate(()=>closedMeasurements),[]);
 await page.evaluate(()=>flowRuntime.dispose());assert.equal(await node('Section').count(),0);assert.deepEqual(errors,[]);
 console.log(JSON.stringify({status:'PASS',browser:engine,closedScenesDoNotMeasure:true,autoSize:true,scrollContinuity:true,resize:true,nativeDecision:true,disposal:true}));
}finally{await browser.close();await new Promise(r=>server.close(r))}
