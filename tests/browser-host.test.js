import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createPCodeHost} from '../host/browser-host.js';

test('host caches an SPL, verifies identity, and prepares it without product knowledge',async()=>{
  let downloads=0,connections=0;
  const engine={connect(selection){
    assert.deepEqual(selection.RequiredCapabilities,['pcode.editable-input.v1']);connections++;
    return {Acceptance:{Status:'Accepted'},Connection:{prepare:async input=>({Outcome:'Completed',Runtime:{input}}),close:async()=>{}}};
  }};
  const host=createPCodeHost({engine,parse:text=>({SetLang:{Name:text,Requires:['pcode.editable-input.v1']},SetData:{},SetRender:{}}),fetchText:async()=>{downloads++;return 'another-app'}});
  const first=await host.load({key:'main',path:'/main.SPL',expectedName:'another-app'});
  assert.equal((await host.load({key:'main',path:'/main.SPL',expectedName:'another-app'})).text,first.text);
  assert.equal(downloads,1);
  const prepared=await host.prepare(first.parsed);
  assert.equal(prepared.runtime.input.SetLang.Name,'another-app');
  assert.equal(connections,1);
});

test('failed identity does not poison later loads',async()=>{
  const host=createPCodeHost({engine:{connect(){}},parse:text=>({SetLang:{Name:text}}),fetchText:async()=>"correct"});
  await assert.rejects(host.load({key:'main',path:'/main.SPL',expectedName:'wrong'}),/identity/);
  assert.equal((await host.load({key:'main',path:'/main.SPL',expectedName:'correct'})).parsed.SetLang.Name,'correct');
});

test('a cached style key cannot silently switch its source',async()=>{
  const host=createPCodeHost({engine:{connect(){}},parse:text=>({SetLang:{Name:text}}),fetchText:async()=>"skin"});
  await host.load({key:'main',path:'/skins/main.SPL',expectedName:'skin'});
  await assert.rejects(host.load({key:'main',path:'/skins/other.SPL',expectedName:'skin'}),/different source/);
  await assert.rejects(host.load({key:'remote',path:'https://example.test/skin.SPL'}),/local/);
});
