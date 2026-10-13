import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildWebManifest} from '../host/web-manifest.js';

test('Picot composes install presentation from an application identity',()=>{
 const manifest=buildWebManifest({name:'Example',brandIconBase:'/assets/app/eye'});
 assert.equal(manifest.name,'Example');
 assert.equal(manifest.short_name,'Example');
 assert.deepEqual(manifest.icons.map(icon=>icon.sizes),['192x192','512x512']);
 assert.deepEqual(manifest.icons.map(icon=>icon.src),['/assets/app/eye-192.png','/assets/app/eye-512.png']);
 assert.equal(manifest.background_color,'#F2F2F7');
 assert.throws(()=>buildWebManifest({name:'',brandIconBase:'/assets/app/eye'}),TypeError);
 assert.throws(()=>buildWebManifest({name:'Example',brandIconBase:'/../escape'}),TypeError);
});
