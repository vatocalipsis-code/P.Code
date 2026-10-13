import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

test('Picot boot creates the accessible loader from semantic message text',()=>{
 const source=readFileSync(new URL('../runtime/startup-boot.js',import.meta.url),'utf8');
 let loader;
 const element=tag=>({tag,dataset:{},attributes:{},children:[],setAttribute(name,value){this.attributes[name]=value},append(...children){this.children.push(...children)}});
 const document={currentScript:{dataset:{startupMessage:'Устанавливаем защищённое соединение...'}},createElement:element,body:{prepend(node){loader=node}}};
 runInNewContext(source,{document},{timeout:1000});
 assert.equal(loader.id,'startup-loader');
 assert.equal(loader.attributes.role,'status');
 assert.equal(loader.attributes['aria-busy'],'true');
 assert.equal(loader.children[0].id,'startup-loader-spinner');
 assert.equal(loader.children[1].textContent,'Устанавливаем защищённое соединение...');
 assert.doesNotMatch(source,/innerHTML|insertAdjacentHTML/);
});
