import assert from 'node:assert/strict';import {createServer} from 'node:http';import {readFile} from 'node:fs/promises';import {resolve,extname} from 'node:path';
const directory=resolve('.'),server=createServer(async(req,res)=>{try{if(req.url==='/'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><link rel="stylesheet" href="/runtime/renderer.css"><div id="root" style="--meter:#123456"></div>');return}const path=resolve(directory,'.'+new URL(req.url,'http://local').pathname);if(!path.startsWith(directory+'/')||!['.js','.css'].includes(extname(path)))throw Error('unknown');res.setHeader('Content-Type',path.endsWith('.js')?'text/javascript':'text/css');res.end(await readFile(path))}catch{res.statusCode=404;res.end()}});await new Promise(r=>server.listen(0,'127.0.0.1',r));const engine=process.env.UI_BROWSER??'chromium',browser=await(await import(process.env.PLAYWRIGHT_MODULE))[engine].launch({headless:true});
try{
 const page=await browser.newPage();await page.goto('http://127.0.0.1:'+server.address().port);
 await page.evaluate(async()=>{
  const {PlaneCodeEngine}=await import('/runtime/public-runtime.js');
  const caps=['pcode.control-action.v1','pcode.semantic-model.v1','pcode.semantic-controls.v1','pcode.editable-input.v1','pcode.flow-layout.v1'];
  const {Connection}=PlaneCodeEngine.connect({GenerationId:'pcode.layout-group.v1',SerializationVersion:1,RequiredCapabilities:caps,OptionalCapabilities:[]});
  const action={Kind:'OpenPicker',Target:'Date',WhenSource:'$.picker'};
  const p=await Connection.prepare({SetLang:{Name:'Control actions',Version:1,Requires:caps,Data:[{Login:'Scene',Layout:[{Type:'EditableInput',Login:'Date',Properties:{InputType:'Date',OpenPickerOnClick:true,Source:'$.day',EnabledSource:'$.allowed'}},{Type:'Flow',Login:'Native',Properties:{Tag:'button',Text:'Native',ControlAction:action,OffPress:'choose'}}],SimplePanels:[{Login:'Buttons',Layout:[],ActivePanels:[{Login:'Panel',Properties:{ControlAction:action,OffPress:'choose',Height:44,Width:100},Layout:[{Login:'Caption'}]}]}]}]},SetData:{Name:'Data',Version:1,Data:{Caption:{SourceText:'Panel'}}},SetRender:{Name:'Render',Version:1,Data:{Transparency:0,TextTransparency:0,PictureTransparency:0}}});
  if(p.Outcome!=='Completed')throw Error(JSON.stringify(p));window.runtime=p.Runtime;window.events=[];window.opened=0;window.model={picker:true,allowed:true,day:'2026-10-12'};
  await runtime.setEventSink(e=>events.push(e));await runtime.applyModel(model);await runtime.mount(document.querySelector('#root'));await runtime.enableInteraction();document.querySelector('input').showPicker=()=>opened++;
 });
 for(const login of ['Native','Panel']){
  const button=page.locator('[data-plane-login="'+login+'"]');await button.click();
  assert.equal(await page.locator('input').evaluate(n=>document.activeElement===n),true);
  await button.focus();await page.keyboard.press('Enter');
 }
 assert.equal(await page.evaluate(()=>opened),4);await page.locator('input').click();assert.equal(await page.evaluate(()=>opened),5);assert.equal(await page.evaluate(()=>events.length),0);
 await page.evaluate(async()=>{model.picker=false;await runtime.applyModel(model)});await page.locator('button').click();assert.equal(await page.evaluate(()=>events.at(-1).OpaqueValue),'choose');
 await page.evaluate(async()=>{model.picker=true;model.allowed=false;await runtime.applyModel(model)});await page.locator('button').click();assert.equal(await page.evaluate(()=>opened),5);assert.equal(await page.evaluate(()=>events.length),1);
 await page.evaluate(()=>runtime.dispose());console.log(JSON.stringify({status:'PASS',engine,pointer:true,keyboard:true,semanticFallback:true,disabled:true}));
}finally{await browser.close();await new Promise(r=>server.close(r))}
