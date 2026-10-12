import assert from 'node:assert/strict';import {createServer} from 'node:http';import {readFile} from 'node:fs/promises';import {resolve,extname} from 'node:path';
const directory=resolve('.'),server=createServer(async(req,res)=>{try{if(req.url==='/'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><link rel="stylesheet" href="/runtime/renderer.css"><div id="root" style="--meter:#123456"></div>');return}const path=resolve(directory,'.'+new URL(req.url,'http://local').pathname);if(!path.startsWith(directory+'/')||!['.js','.css'].includes(extname(path)))throw Error('unknown');res.setHeader('Content-Type',path.endsWith('.js')?'text/javascript':'text/css');res.end(await readFile(path))}catch{res.statusCode=404;res.end()}});await new Promise(r=>server.listen(0,'127.0.0.1',r));const engine=process.env.UI_BROWSER??'chromium',browser=await(await import(process.env.PLAYWRIGHT_MODULE))[engine].launch({headless:true});
try{
 const page=await browser.newPage();await page.goto('http://127.0.0.1:'+server.address().port);
 await page.evaluate(async()=>{
  const {PlaneCodeEngine}=await import('/runtime/public-runtime.js');
  const caps=['pcode.editable-input.v1','pcode.semantic-model.v1','pcode.semantic-repeat.v1','pcode.semantic-controls.v1','pcode.semantic-accessibility.v1','pcode.semantic-title.v1','pcode.flow-layout.v1'];
  const handshake=PlaneCodeEngine.connect({GenerationId:'pcode.layout-group.v1',SerializationVersion:1,RequiredCapabilities:caps,OptionalCapabilities:[]});if(!handshake.Connection)throw Error(JSON.stringify(handshake));const connection=handshake.Connection;
  const prepared=await connection.prepare({SetLang:{Name:'Keyed record contract',Version:1,Requires:caps,Data:[{Login:'Scene',Layout:[],SimplePanels:[{Login:'Records',Layout:[],ActivePanels:[{Login:'Record',Properties:{Repeat:'$.items',PressedSource:'@.selected',EnabledSource:'@.allowed',LabelSource:'@.name',TitleSource:'@.name',OffPress:'record.toggle'},Layout:[{Type:'Flow',Login:'Name',Properties:{Tag:'span',Source:'@.name'}},{Type:'EditableInput',Login:'Field',Properties:{InputType:'Text',Source:'@.value',OnInput:'record.edit'}}]}]}]}]},SetData:{Name:'data',Version:1,Data:{}},SetRender:{Name:'render',Version:1,Data:{Transparency:0,TextTransparency:0,PictureTransparency:0}}});
  if(prepared.Outcome!=='Completed')throw Error(JSON.stringify(prepared));window.runtime=prepared.Runtime;
  window.model={items:[{id:'one',name:'One',value:'alphabet',selected:false,allowed:true},{id:'two',name:'Two',value:'second',selected:false,allowed:true}]};
  window.events=[];await runtime.setEventSink(event=>events.push(event));await runtime.applyModel(model);await runtime.mount(document.getElementById('root'));await runtime.enableInteraction();
  window.first=document.querySelector('[data-plane-item-id="one"]');window.field=first.querySelector('input');field.focus();field.setSelectionRange(2,5);
 });
 const continuity=()=>page.evaluate(()=>({same:document.querySelector('[data-plane-item-id="one"]')===first,field:first.querySelector('input')===field,focused:document.activeElement===field,selection:[field.selectionStart,field.selectionEnd],pressed:first.getAttribute('aria-pressed'),title:first.title,name:first.querySelector('span').textContent}));
 await page.evaluate(async()=>{model.items[0].selected=true;model.items[0].name='Updated';await runtime.applyModel(model)});
 assert.deepEqual(await continuity(),{same:true,field:true,focused:true,selection:[2,5],pressed:'true',title:'Updated',name:'Updated'});
 await page.evaluate(async()=>{model.items.reverse();await runtime.applyModel(model)});
 assert.equal((await continuity()).focused,true);assert.deepEqual((await continuity()).selection,[2,5]);
 assert.deepEqual(await page.locator('[data-plane-repeat] > [data-plane-item-id]').evaluateAll(rows=>rows.map(row=>row.dataset.planeItemId)),['two','one']);
 await page.locator('[data-plane-active][data-plane-item-id="one"]').focus();await page.keyboard.press('Enter');
 assert.equal(await page.evaluate(()=>events.at(-1).ItemId),'one');
 await page.evaluate(async()=>{model.items.find(row=>row.id==='one').allowed=false;await runtime.applyModel(model)});
 await page.locator('[data-plane-active][data-plane-item-id="one"]').dispatchEvent('keydown',{key:'Enter'});
 assert.equal(await page.evaluate(()=>events.filter(event=>event.ItemId==='one'&&event.EventType==='OffPress').length),1);
 await page.evaluate(async()=>{model.items=model.items.filter(row=>row.id!=='one');await runtime.applyModel(model)});
 assert.equal(await page.evaluate(()=>first.isConnected),false);
 await page.evaluate(()=>runtime.dispose());assert.equal(await page.locator('#root').evaluate(node=>node.children.length),0);
 console.log(JSON.stringify({status:'PASS',engine,keyedIdentity:true,focus:true,selection:true,reorder:true,permissions:true,semanticId:true,disposal:true}));
}finally{await browser.close();await new Promise(r=>server.close(r))}
