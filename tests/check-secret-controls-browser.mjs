import assert from 'node:assert/strict';import {createServer} from 'node:http';import {readFile} from 'node:fs/promises';import {resolve,extname} from 'node:path';
const directory=resolve('.'),server=createServer(async(req,res)=>{try{if(req.url==='/'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><link rel="stylesheet" href="/runtime/renderer.css"><div id="root" style="--meter:#123456"></div>');return}const path=resolve(directory,'.'+new URL(req.url,'http://local').pathname);if(!path.startsWith(directory+'/')||!['.js','.css'].includes(extname(path)))throw Error('unknown');res.setHeader('Content-Type',path.endsWith('.js')?'text/javascript':'text/css');res.end(await readFile(path))}catch{res.statusCode=404;res.end()}});await new Promise(r=>server.listen(0,'127.0.0.1',r));const engine=process.env.UI_BROWSER??'chromium',browser=await(await import(process.env.PLAYWRIGHT_MODULE))[engine].launch({headless:true});
try{
 const page=await browser.newPage();await page.goto('http://127.0.0.1:'+server.address().port);
 await page.evaluate(async()=>{
  const {PlaneCodeEngine}=await import('/runtime/public-runtime.js');const caps=['pcode.control-action.v1','pcode.secret-controls.v1','pcode.semantic-model.v1','pcode.editable-input.v1','pcode.flow-layout.v1'];
  const {Connection}=PlaneCodeEngine.connect({GenerationId:'pcode.layout-group.v1',SerializationVersion:1,RequiredCapabilities:caps,OptionalCapabilities:[]});
  const input=login=>({Type:'EditableInput',Login:login,Properties:{InputType:'Secret',SecretGroup:'credentials',SecretResetSource:'$.authenticated',Source:'$.password'}});
  const button=(login,kind,more={})=>({Type:'Flow',Login:login,Properties:{Tag:'button',Text:login,ControlAction:{Kind:kind,Target:'Password',HiddenLabel:'Show',RevealedLabel:'Hide',...more},...(more.Continue?{OffPress:'generate'}:{})}});
  const p=await Connection.prepare({SetLang:{Name:'Secrets',Version:1,Requires:caps,Data:[{Login:'Scene',Layout:[input('Password'),input('Confirmation'),button('Toggle','ToggleSecret'),button('Generate','RevealSecret',{Continue:true})],SimplePanels:[]}]},SetData:{Name:'Data',Version:1,Data:{}},SetRender:{Name:'Render',Version:1,Data:{Transparency:0,TextTransparency:0,PictureTransparency:0}}});
  if(p.Outcome!=='Completed')throw Error(JSON.stringify(p));window.runtime=p.Runtime;window.events=[];window.model={authenticated:false,password:'Secret42'};
  await runtime.setEventSink(e=>events.push(e));await runtime.applyModel(model);await runtime.mount(document.querySelector('#root'));await runtime.enableInteraction();
 });
 const input=page.locator('[data-plane-login="Password"]'),toggle=page.locator('[data-plane-login="Toggle"]');
 assert.equal(await input.getAttribute('type'),'password');await toggle.click();assert.equal(await input.getAttribute('type'),'text');assert.equal(await toggle.getAttribute('aria-label'),'Hide');
 assert.equal(await page.locator('[data-plane-login="Confirmation"]').getAttribute('type'),'text');assert.equal(await input.inputValue(),'Secret42');
 await toggle.press('Enter');assert.equal(await input.getAttribute('type'),'password');assert.equal(await page.evaluate(()=>events.length),0);
 await page.locator('[data-plane-login="Generate"]').click();assert.equal(await input.getAttribute('type'),'text');assert.equal(await page.evaluate(()=>events.at(-1).OpaqueValue),'generate');
 await page.evaluate(async()=>{model.password='Other42';await runtime.applyModel(model)});assert.equal(await input.getAttribute('type'),'text');
 await page.evaluate(async()=>{model.authenticated=true;await runtime.applyModel(model)});assert.equal(await input.getAttribute('type'),'password');assert.equal(await input.inputValue(),'Other42');
 await page.evaluate(()=>runtime.dispose());console.log(JSON.stringify({status:'PASS',engine,group:true,keyboard:true,pointer:true,semanticContinuation:true,contextReset:true,valuePreserved:true}));
}finally{await browser.close();await new Promise(r=>server.close(r))}
