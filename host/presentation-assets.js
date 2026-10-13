import {join} from 'node:path';

/** Resolve only presentation-package assets; the caller serves the bytes. */
export function resolvePresentationAsset(pathname,packageRoot){
 if(typeof pathname!=='string'||typeof packageRoot!=='string'||!packageRoot)return null;
 const match=/^\/assets\/(icons|fonts)\/([A-Za-z0-9][A-Za-z0-9._-]*)$/.exec(pathname);
 if(!match||match[2].includes('..'))return null;
 const [,kind,name]=match;
 if(kind==='icons'&&!name.endsWith('.png'))return null;
 if(kind==='fonts'&&!/\.(?:ttf|txt)$/.test(name))return null;
 return join(packageRoot,'assets',kind,name);
}
