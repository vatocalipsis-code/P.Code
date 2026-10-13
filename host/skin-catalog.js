import {readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';

/** Read installed presentation assets without product-specific skin names. */
export function readSkinCatalog(directory){
 const entries=JSON.parse(readFileSync(join(directory,'catalog.json'),'utf8'));
 if(!Array.isArray(entries)||entries.length===0)throw new Error('Skin catalog is empty');
 const names=new Set(),labels=new Set();
 for(const entry of entries){
  if(!entry||typeof entry.key!=='string'||!/^[A-Z][A-Za-z0-9]*$/.test(entry.key)||
   typeof entry.label!=='string'||!entry.label.trim()||names.has(entry.key)||labels.has(entry.label))
   throw new Error('Skin catalog is invalid');
  names.add(entry.key);labels.add(entry.label);
 }
 const files=readdirSync(directory).filter(name=>name.endsWith('.SPL')).map(name=>name.slice(0,-4));
 if(files.length!==names.size||files.some(name=>!names.has(name)))throw new Error('Skin catalog does not match installed SPL files');
 return entries.map(({key,label})=>Object.freeze({key,label}));
}
