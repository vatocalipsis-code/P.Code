import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {readSkinCatalog} from '../host/skin-catalog.js';

test('Picot serves exactly the manifest-declared SPL skins and their order',()=>{
 const directory=mkdtempSync(join(tmpdir(),'picot-skins-'));
 try{
  const manifest=[{key:'First',label:'First Skin'},{key:'Second',label:'Second Skin'}];
  writeFileSync(join(directory,'catalog.json'),JSON.stringify(manifest));
  writeFileSync(join(directory,'First.SPL'),'');writeFileSync(join(directory,'Second.SPL'),'');
  assert.deepEqual(readSkinCatalog(directory),manifest);
  writeFileSync(join(directory,'Third.SPL'),'');
  assert.throws(()=>readSkinCatalog(directory),/does not match/);
  rmSync(join(directory,'Third.SPL'));
  writeFileSync(join(directory,'catalog.json'),JSON.stringify([...manifest,manifest[0]]));
  assert.throws(()=>readSkinCatalog(directory),/invalid/);
 }finally{rmSync(directory,{recursive:true,force:true})}
});
