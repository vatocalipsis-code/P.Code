import {test} from 'node:test';
import assert from 'node:assert/strict';
import {deliverFile,createPCodeHost} from '../host/browser-host.js';
const file={text:'\uFEFFExact 12345678901234567890.01\r\n',filename:'данные.txt',mediaType:'text/plain;charset=utf-8'};
function browser(failure){
 const calls=[],links=[];let cleanup,blob;
 const env={Blob,URL:{createObjectURL(value){blob=value;calls.push('url');return 'blob:file'},revokeObjectURL(url){calls.push(['revoke',url])}},setTimeout(fn,ms){assert.equal(ms,60000);cleanup=fn},document:{body:{append(link){links.push(link);if(failure==='append')throw Error('append')}},createElement(tag){assert.equal(tag,'a');return {click(){calls.push('click');if(failure==='click')throw Error('click')},remove(){calls.push('remove');links.length=0}}}}};
 return {env,calls,links,get blob(){return blob},cleanup:()=>cleanup()};
}
test('host exposes a synchronous download that preserves UTF-8 bytes and releases resources',async()=>{
 const host=createPCodeHost({engine:{connect(){}},parse(){}});assert.equal(host.deliverFile,deliverFile);
 const b=browser();assert.deepEqual(deliverFile(file,b.env),{status:'requested'});
 assert.equal(b.blob.type,file.mediaType);assert.deepEqual(new Uint8Array(await b.blob.arrayBuffer()),new TextEncoder().encode(file.text));
 assert.deepEqual(b.calls,['url','click','remove']);assert.equal(b.links.length,0);
 b.cleanup();assert.deepEqual(b.calls.at(-1),['revoke','blob:file']);
});
test('malformed export descriptors cannot allocate resources or navigate to arbitrary URLs',()=>{
 for(const patch of [{text:null},{filename:'../secret'},{filename:'a/b'},{filename:'a\\b'},{filename:'\u0000x'},{filename:''},{filename:'..'},{mediaType:'text/plain\r\nX-Test: yes'},{mediaType:null}]){
  const b=browser();assert.throws(()=>deliverFile({...file,...patch},b.env),TypeError);assert.deepEqual(b.calls,[]);
 }
 assert.throws(()=>deliverFile(file,{}),/unavailable/);
});
test('failed browser attachment or activation leaves neither link nor live object URL',()=>{
 for(const failure of ['append','click']){
  const b=browser(failure);assert.throws(()=>deliverFile(file,b.env),new RegExp(failure));assert.equal(b.links.length,0);assert.deepEqual(b.calls.at(-1),['revoke','blob:file']);
 }
 const b=browser();b.env.setTimeout=()=>{throw Error('timer')};assert.throws(()=>deliverFile(file,b.env),/timer/);assert.equal(b.links.length,0);assert.deepEqual(b.calls.at(-1),['revoke','blob:file']);
});
