import {loadVisualStyleCatalog} from './skin-manager.js';
/** Apply saved presentation selectors before the application's first mount. */
export function applyEarlySkin({document:doc,storage,matchMedia,styleKey,appearanceKey,catalog,styleAttribute='data-picot-skin',themeAttribute='data-theme'}){
 const names=Object.keys(catalog??{}),defaultSkin=names[0];
 if(!names.length||!names.every(name=>/^[A-Z][A-Za-z0-9]*$/.test(name))||![styleAttribute,themeAttribute].every(value=>/^data-[a-z][a-z0-9-]*$/.test(value)))throw Error('Invalid early skin configuration');
 let skin=defaultSkin;
 try{const saved=storage?.getItem(styleKey);if(Object.hasOwn(catalog,saved))skin=saved}catch{}
 doc.documentElement.setAttribute(styleAttribute,skin);
 let preference=null;
 try{preference=JSON.parse(storage?.getItem(appearanceKey)||'null')}catch{}
 const theme=['dark','light'].includes(preference?.theme)?preference.theme:matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
 doc.documentElement.setAttribute(themeAttribute,theme);
 return {skin,theme};
}

if(typeof document!=='undefined'){
 const script=document.querySelector('script[data-picot-boot]');
 if(script)loadVisualStyleCatalog().then(catalog=>applyEarlySkin({document,storage:globalThis.localStorage,matchMedia:globalThis.matchMedia,styleKey:script.dataset.styleStorageKey,appearanceKey:script.dataset.appearanceStorageKey,catalog,styleAttribute:script.dataset.styleAttribute,themeAttribute:script.dataset.themeAttribute})).catch(()=>{}); // Application startup reports catalog failure; no skin fallback.
}
