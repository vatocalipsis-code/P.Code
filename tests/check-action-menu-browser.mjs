import assert from 'node:assert/strict';import {createServer} from 'node:http';import {readFile} from 'node:fs/promises';import {resolve,extname} from 'node:path';
const directory=resolve('.'),server=createServer(async(req,res)=>{try{if(req.url==='/'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><link rel="stylesheet" href="/runtime/renderer.css"><div id="root" style="--meter:#123456"></div>');return}const path=resolve(directory,'.'+new URL(req.url,'http://local').pathname);if(!path.startsWith(directory+'/')||!['.js','.css'].includes(extname(path)))throw Error('unknown');res.setHeader('Content-Type',path.endsWith('.js')?'text/javascript':'text/css');res.end(await readFile(path))}catch{res.statusCode=404;res.end()}});await new Promise(r=>server.listen(0,'127.0.0.1',r));const engine=process.env.UI_BROWSER??'chromium',browser=await(await import(process.env.PLAYWRIGHT_MODULE))[engine].launch({headless:true});
try{
 const page=await browser.newPage();await page.goto('http://127.0.0.1:'+server.address().port);
 await page.evaluate(async()=>{
  const {PlaneCodeEngine}=await import('/runtime/public-runtime.js');
  const caps=['pcode.action-menu.v1','pcode.semantic-model.v1','pcode.semantic-repeat.v1','pcode.flow-layout.v1'];
  const trigger=(Login,menu,extra={})=>({Login,Properties:{Width:160,Height:50,ActionMenu:menu,...extra},Layout:[{Type:'Flow',Login:Login+' Text',Properties:{Tag:'span',Text:Login}}]});
  const press={Trigger:'Press',Class:'menu',AnchorClass:'anchor',Items:{run:{Source:'$.label',Format:{Kind:'Text'},EnabledSource:'$.allowed',OffPress:'run'},cancel:{Text:'Cancel'}}};
  const context={Trigger:'Context',Class:'menu',EnabledSource:'@.allowed',HoldDelay:100,MoveTolerance:8,Items:{edit:{Text:'Edit',OffPress:'record.edit'}}};
  const source={SetLang:{Name:'Menu interaction contract',Version:1,Requires:caps,StyleSheet:'.anchor{position:relative}.menu{position:absolute;z-index:10;background:white;left:180px;top:20px;padding:8px}.menu button{display:block;min-height:40px} [data-plane-login="Scene"]{position:relative}',Data:[{Login:'Scene',Layout:[],SimplePanels:[{Login:'Group',Layout:[],ActivePanels:[trigger('Actions',press),trigger('Context',context,{Repeat:'$.items',OffPress:'record.open'})]}]}]},SetData:{Name:'Data',Version:1,Data:{}},SetRender:{Name:'Render',Version:1,Data:{Transparency:0,TextTransparency:0,PictureTransparency:0}}};
  source.SetLang.Requires.push('pcode.skin-stylesheet.v1');
  // Capabilities are negotiated before preparing the immutable representation.
  const accepted=PlaneCodeEngine.connect({GenerationId:'pcode.layout-group.v1',SerializationVersion:1,RequiredCapabilities:source.SetLang.Requires,OptionalCapabilities:[]}).Connection;
  const prepared=await accepted.prepare(source);if(prepared.Outcome!=='Completed')throw Error(JSON.stringify(prepared));window.runtime=prepared.Runtime;
  window.model={allowed:true,label:'Run',items:[{id:'one',allowed:true}]};window.events=[];await runtime.setEventSink(event=>events.push(event));await runtime.applyModel(model);await runtime.mount(document.getElementById('root'));await runtime.enableInteraction();
  const outside=document.createElement('button');outside.id='outside';outside.textContent='Outside';outside.style.cssText='position:fixed;right:0;bottom:0';window.outsideClicks=0;outside.onclick=()=>outsideClicks++;document.body.append(outside);
 });
 const anchor=page.locator('[data-plane-login="Actions"]'),context=page.locator('[data-plane-active][data-plane-item-id="one"]'),menu=page.locator('[role="menu"]');
 await anchor.click();await menu.waitFor();await menu.getByText('Run',{exact:true}).click();assert.equal(await menu.count(),0);assert.equal(await page.evaluate(()=>events.at(-1).OpaqueValue),'run');
 await anchor.click();await page.locator('#outside').click();assert.equal(await menu.count(),0);assert.equal(await page.evaluate(()=>outsideClicks),0,'Outside dismissal cannot activate background controls');
 await anchor.focus();await page.keyboard.press('Enter');await menu.waitFor();await page.keyboard.press('Escape');assert.equal(await menu.count(),0);assert.equal(await anchor.evaluate(n=>n===document.activeElement),true);
 await anchor.click();await menu.getByText('Run',{exact:true}).focus();
 await page.evaluate(async()=>{window.originalMenuButton=document.querySelector('[data-plane-menu-item="run"]');model.label='Updated';model.allowed=false;await runtime.applyModel(model)});
 assert.equal(await menu.getByText('Updated',{exact:true}).isDisabled(),true);
 assert.equal(await page.evaluate(()=>originalMenuButton===document.querySelector('[data-plane-menu-item="run"]')),true,'Semantic updates preserve menu item identity');
 await page.evaluate(async()=>{model.allowed=true;await runtime.applyModel(model)});
 assert.equal(await menu.getByText('Updated',{exact:true}).isDisabled(),false);
 assert.equal(await page.evaluate(()=>runtime.consumeBack()),true);assert.equal(await menu.count(),0);
 await context.click();assert.equal(await page.evaluate(()=>events.at(-1).OpaqueValue),'record.open');
 const box=await context.boundingBox();await page.mouse.move(box.x+20,box.y+20);await page.mouse.down();await page.waitForTimeout(160);await page.mouse.up();await menu.waitFor();
 await menu.getByText('Edit',{exact:true}).click();assert.equal(await page.evaluate(()=>events.at(-1).OpaqueValue),'record.edit');assert.equal(await page.evaluate(()=>events.at(-1).ItemId),'one');
 await context.click({button:'right'});await menu.waitFor();await page.evaluate(async()=>{model.items[0].allowed=false;await runtime.applyModel(model)});assert.equal(await menu.count(),0,'Revoked menu availability closes the active menu');
 await page.evaluate(async()=>{model.items[0].allowed=true;await runtime.applyModel(model)});
 await page.mouse.move(box.x+20,box.y+20);await page.mouse.down();await page.mouse.move(box.x+60,box.y+20);await page.waitForTimeout(160);await page.mouse.up();assert.equal(await menu.count(),0,'Movement cancels the hold');
 await page.mouse.move(box.x+20,box.y+20);await page.mouse.down();await page.evaluate(async()=>{model.items=[];await runtime.applyModel(model)});await page.waitForTimeout(160);await page.mouse.up();assert.equal(await menu.count(),0,'Removing a record cancels its hold timer');
 await runtimeDispose();
 async function runtimeDispose(){await page.evaluate(()=>runtime.dispose());assert.equal(await menu.count(),0)}
 console.log(JSON.stringify({status:'PASS',engine,press:true,keyboard:true,back:true,outside:true,context:true,hold:true,semanticId:true,permissions:true,movement:true,removal:true,disposal:true}));
}finally{await browser.close();await new Promise(r=>server.close(r))}
