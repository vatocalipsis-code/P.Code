// Runtime mechanism fixture, not an application skin.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
const directory=resolve('.'),server=createServer(async(req,res)=>{
 try{
  if(req.url==='/'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><style>.modal{position:fixed;inset:0;background:white}.modal[hidden]{display:none}.first{z-index:10}.second{z-index:100}section{padding:20px}</style><div id="root"><button id="launch">Launch</button><div id="preserved" inert>Preserved</div></div>');return}
  const file=resolve(directory,'.'+new URL(req.url,'http://local').pathname);if(!file.startsWith(directory+'/runtime/')||extname(file)!=='.js')throw Error('unknown');res.setHeader('Content-Type','text/javascript');res.end(await readFile(file));
 }catch{res.statusCode=404;res.end()}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const engine=process.env.UI_BROWSER??'chromium',browser=await(await import(process.env.PLAYWRIGHT_MODULE))[engine].launch({headless:true});
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port);
 await page.evaluate(async()=>{
  const modal=await import('/runtime/modal-scene.js'),{MODEL}=await import('/runtime/semantic-model.js');window.state={first:false,second:false};window.events=[];const root=document.getElementById('root');window.set=value=>{Object.assign(state,value);modal.updateModalScenes(root,{[MODEL]:state})};
  const interaction={isEnabled:()=>true,emit:(_event,_login,command)=>{events.push(command);set({[command]:false})}};
  const records=['first','second'].map(name=>{const panel=document.createElement('section');panel.innerHTML='<button id="'+name+'-start">Start</button><button id="'+name+'-end">End</button>';const record=modal.createModalScene(panel,{Login:name,Visual:{ModalClass:'modal '+name,VisibleSource:'$.'+name,Dismiss:name}},interaction);root.append(record.wrapper);return record});
  modal.installModalScenes(root,records);window.dispose=()=>modal.disposeModalScenes(root);set({});document.getElementById('launch').focus();
 });
 const update=async value=>{await page.evaluate(v=>set(v),value);await page.waitForTimeout(20)};
 await update({second:true});assert.equal(await page.locator('#second-start').evaluate(n=>n===document.activeElement),true);
 await update({first:true});assert.equal(await page.locator('#first-start').evaluate(n=>n===document.activeElement),true,'Most recently opened scene owns focus even when declared earlier');
 assert.equal(await page.locator('[data-plane-modal="first"]').evaluate(n=>n.inert),false);assert.equal(await page.locator('[data-plane-modal="second"]').evaluate(n=>n.inert),true);
 await page.locator('#first-end').focus();await page.keyboard.press('Tab');assert.equal(await page.locator('#first-start').evaluate(n=>n===document.activeElement),true);
 await page.locator('#first-start').click(); // Also proves the earlier scene is not covered by the later one.
 await page.keyboard.press('Escape');assert.deepEqual(await page.evaluate(()=>events),['first']);assert.equal(await page.locator('#second-start').evaluate(n=>n===document.activeElement),true);
 // If a disabled submit loses focus, document-level Escape must still dismiss the top scene.
 await update({first:true});await page.locator('#first-start').evaluate(n=>{n.disabled=true;n.blur()});await page.keyboard.press('Escape');assert.deepEqual(await page.evaluate(()=>events),['first','first']);
 await update({first:true});await update({first:false,second:false});assert.equal(await page.locator('#launch').evaluate(n=>n===document.activeElement),true,'Closing the whole stack restores the original opener');assert.equal(await page.locator('#preserved').evaluate(n=>n.inert),true);
 await update({second:true});await page.evaluate(()=>{const extra=document.createElement('button');extra.id='added';document.getElementById('root').append(extra)});await update({});assert.equal(await page.locator('#added').evaluate(n=>n.inert),true);await update({second:false});assert.equal(await page.locator('#added').evaluate(n=>n.inert),false);
 await update({first:true,second:true});await page.evaluate(()=>dispose());assert.equal(await page.locator('#launch').evaluate(n=>n.inert),false);assert.equal(await page.locator('#preserved').evaluate(n=>n.inert),true);assert.deepEqual(errors,[]);
 console.log(JSON.stringify({status:'PASS',browser:engine,activationOrder:true,stacking:true,tabTrap:true,bodyEscape:true,restoreFocus:true,dynamicBackground:true,disposal:true}));
}finally{await browser.close();await new Promise(r=>server.close(r))}
