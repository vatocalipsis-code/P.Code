import {test} from 'node:test';
import assert from 'node:assert/strict';
import {resolvePresentationAsset} from '../host/presentation-assets.js';

test('Picot resolves package icons and fonts without a host visual route list',()=>{
 const root='/tmp/visual-package';
 assert.equal(resolvePresentationAsset('/assets/icons/bell.png',root),root+'/assets/icons/bell.png');
 assert.equal(resolvePresentationAsset('/assets/fonts/Inter.ttf',root),root+'/assets/fonts/Inter.ttf');
 assert.equal(resolvePresentationAsset('/assets/fonts/Inter-OFL.txt',root),root+'/assets/fonts/Inter-OFL.txt');
 for(const path of ['/assets/icons/../secret.png','/assets/icons/a.webp','/assets/fonts/a.js','/assets/fonts/%2e%2e/x.ttf','/assets/app/eye-192.png'])
  assert.equal(resolvePresentationAsset(path,root),null,path);
});
