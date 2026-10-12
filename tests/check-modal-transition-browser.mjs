import assert from 'node:assert/strict';import {createServer} from 'node:http';import {readFile} from 'node:fs/promises';import {resolve,extname} from 'node:path';
const directory=resolve('.'),server=createServer(async(req,res)=>{try{if(req.url==='/'||req.url==='/?slide=1'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><link rel="stylesheet" href="/runtime/renderer.css"><div id="root" style="--meter:#123456"></div>');return}const path=resolve(directory,'.'+new URL(req.url,'http://local').pathname);if(!path.startsWith(directory+'/')||!['.js','.css'].includes(extname(path)))throw Error('unknown');res.setHeader('Content-Type',path.endsWith('.js')?'text/javascript':'text/css');res.end(await readFile(path))}catch{res.statusCode=404;res.end()}});await new Promise(r=>server.listen(0,'127.0.0.1',r));const engine=process.env.UI_BROWSER??'chromium',browser=await(await import(process.env.PLAYWRIGHT_MODULE))[engine].launch({headless:true});
try{
 const page=await browser.newPage();await page.goto('http://127.0.0.1:'+server.address().port+(process.env.UI_MODAL_SLIDE?'/?slide=1':''));
 await page.evaluate(async()=>{
  const {PlaneCodeEngine}=await import('/runtime/public-runtime.js'),caps=['pcode.semantic-controls.v1','pcode.semantic-model.v1','pcode.flow-layout.v1','pcode.modal-transition.v1','pcode.modal-slide.v1'];
  const c=PlaneCodeEngine.connect({GenerationId:'pcode.layout-group.v1',SerializationVersion:1,RequiredCapabilities:caps,OptionalCapabilities:[]}).Connection;
  const prepared=await c.prepare({SetLang:{Name:'Modal lifecycle contract',Version:1,Requires:caps,Data:[{Login:'Scene',Properties:{Modal:true,VisibleSource:'$.open',...(new URLSearchParams(location.search).has('slide')?{ModalEnter:{Effect:'Slide',Speed:10,Acceleration:0},ModalExit:{Effect:'Slide',Speed:10,Acceleration:0}}:{ModalExit:{Effect:'Fade',Duration:140}})},Layout:[{Type:'Flow',Login:'Value',Properties:{Tag:'span',Source:'$.text',Format:{Kind:'Text'}}}],SimplePanels:[]}]},SetData:{Name:'data',Version:1,Data:{}},SetRender:{Name:'render',Version:1,Data:{Transparency:0,TextTransparency:0,PictureTransparency:0}}});
  if(prepared.Outcome!=='Completed')throw Error(JSON.stringify(prepared));window.runtime=prepared.Runtime;await runtime.applyModel({open:true,text:'previous'});await runtime.mount(document.getElementById('root'));await runtime.enableInteraction();
 });
 const result=await page.evaluate(async()=>{
  const wrapper=document.querySelector('[data-plane-modal]'),value=document.querySelector('[data-plane-login="Value"]');
  await runtime.applyModel({open:false,text:'cleared'});
  const closing={text:value.textContent,hidden:wrapper.hidden,inert:wrapper.inert,exiting:wrapper.hasAttribute('data-plane-exiting')};
  await runtime.applyModel({open:true,text:'reopened'});
  await new Promise(r=>setTimeout(r,200));
  const reopened={text:value.textContent,hidden:wrapper.hidden,inert:wrapper.inert,exiting:wrapper.hasAttribute('data-plane-exiting')};
  await runtime.applyModel({open:false,text:'cleared'});await runtime.applyModel({open:false,text:'updated while closing'});
  const frozen=value.textContent;await new Promise(r=>setTimeout(r,200));const closed=wrapper.hidden;
  await runtime.applyModel({open:true,text:'last'});await runtime.applyModel({open:false,text:''});await runtime.dispose();await new Promise(r=>setTimeout(r,200));
  return {closing,reopened,frozen,closed,disposed:!wrapper.isConnected};
 });
 assert.deepEqual(result,{closing:{text:'previous',hidden:false,inert:true,exiting:true},reopened:{text:'reopened',hidden:false,inert:false,exiting:false},frozen:'reopened',closed:true,disposed:true});
 console.log(JSON.stringify({status:'PASS',engine,...result}));
}finally{await browser.close();await new Promise(r=>server.close(r))}
