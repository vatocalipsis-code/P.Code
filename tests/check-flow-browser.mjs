import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
const directory=resolve('.'),server=createServer(async(req,res)=>{
 try{
  if(req.url==='/'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><link rel="stylesheet" href="/runtime/renderer.css"><div id="plane-code-root"></div>');return}
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
  const caps=['pcode.flow-layout.v1','pcode.semantic-model.v1','pcode.semantic-repeat.v1','pcode.panel-composition.v1','pcode.editable-input.v1','pcode.panel-action.v1'];
  const connection=PlaneCodeEngine.connect({GenerationId:'pcode.layout-group.v1',SerializationVersion:1,RequiredCapabilities:caps,OptionalCapabilities:[]}).Connection;
  const result=await connection.prepare({SetLang:{Name:'Flow test',Version:1,Requires:caps,Data:[{Login:'Scene',Layout:[flow('Section',{Tag:'section',Class:'section',Role:'button',OffPress:'parent'},[
   flow('Notice',{Tag:'p',Source:'$.notice',Linkify:true}),flow('Action',{Tag:'button',Source:'$.buttonText',OffPress:'activate',EnabledSource:'$.allowed'}),
   {Type:'EditableInput',Login:'Input',Properties:{Source:'$.draft',OnInput:'edit',AriaLabel:'Draft',EnabledSource:'$.allowed'}},
   flow('Record',{Tag:'article',Repeat:'$.records'},[flow('Name',{Tag:'strong',Source:'@.name'}),flow('Choose',{Tag:'button',Text:'Choose',OffPress:'choose',EnabledSource:'@.allowed'})])
  ])],SimplePanels:[]}]},SetData:{Name:'Flow data',Version:1,Data:{}},SetRender:{Name:'Flow render',Version:1,Data:{Transparency:0,TextTransparency:0,PictureTransparency:0}}});
  if(result.Outcome!=='Completed')throw Error(JSON.stringify(result));
  window.flowRuntime=result.Runtime;window.flowEvents=[];window.flowModel={notice:'<b>literal</b>',buttonText:'Activate',allowed:true,draft:'initial',records:[{id:'x',name:'Alpha',allowed:true},{id:'y',name:'Beta',allowed:false}]};
  await flowRuntime.setEventSink(e=>flowEvents.push(e));await flowRuntime.applyModel(flowModel);
  const mounted=await flowRuntime.mount(document.getElementById('plane-code-root'));if(mounted.Outcome!=='Completed')throw Error(JSON.stringify(mounted));await flowRuntime.enableInteraction();
 });
 const node=login=>page.locator('[data-plane-login="'+login+'"]');
 assert.equal(await node('Section').evaluate(n=>n.tagName),'SECTION');assert.equal(await node('Notice').innerText(),'<b>literal</b>');assert.equal(await node('Notice').locator('b').count(),0);
 await node('Action').click();await node('Action').focus();await page.keyboard.press('Enter');
 await node('Choose').first().click();assert.equal(await node('Choose').last().isDisabled(),true);
 await node('Input').fill('edited');
 assert.deepEqual(await page.evaluate(()=>flowEvents.filter(e=>e.OpaqueValue==='activate').length),2);
 assert.equal(await page.evaluate(()=>flowEvents.find(e=>e.OpaqueValue==='choose').ItemId),'x');
 assert.equal(await page.evaluate(()=>flowEvents.findLast(e=>e.OpaqueValue==='edit').Value),'edited');
 await page.evaluate(async()=>{window.savedRow=document.querySelector('[data-plane-login="Record"]');await flowRuntime.applyModel({...flowModel,notice:'updated',buttonText:'Changed',allowed:false,records:[...flowModel.records].reverse()})});
 assert.equal(await page.getByRole('textbox',{name:'Draft',exact:true}).isDisabled(),true);assert.equal(await node('Input').getAttribute('inert'),null);
 assert.equal(await node('Notice').innerText(),'updated');assert.equal(await node('Action').innerText(),'Changed');assert.equal(await node('Action').isDisabled(),true);assert.deepEqual(await node('Name').allTextContents(),['Beta','Alpha']);
 assert.equal(await page.evaluate(()=>savedRow===document.querySelectorAll('[data-plane-login="Record"]')[1]),true);
 await node('Section').focus();await page.keyboard.press('Enter');await page.keyboard.press(' ');
 assert.equal(await page.evaluate(()=>flowEvents.filter(e=>e.OpaqueValue==='parent').length),2,'nested button commands do not bubble to the panel');
 await page.evaluate(async()=>{await flowRuntime.applyModel({...flowModel,notice:'https://example.com/test'})});
 await node('Notice').locator('a').evaluate(a=>{a.addEventListener('click',e=>e.preventDefault());a.click()});
 assert.equal(await page.evaluate(()=>flowEvents.filter(e=>e.OpaqueValue==='parent').length),2,'links keep their own navigation');
 await node('Notice').click();assert.equal(await page.evaluate(()=>flowEvents.filter(e=>e.OpaqueValue==='parent').length),3);
 assert.deepEqual(errors,[]);console.log(JSON.stringify({status:'PASS',browser:engine,nativeStructure:true,textOnly:true,modelUpdates:true,stableRepeatIdentity:true,pointerKeyboardCommands:true}));
}finally{await browser.close();await new Promise(r=>server.close(r))}
