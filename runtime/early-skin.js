/** Apply saved presentation selectors before the application's first mount. */
export function applyEarlySkin({document:doc,storage,matchMedia,styleKey,appearanceKey,defaultSkin,styleAttribute='data-picot-skin',themeAttribute='data-theme'}){
 if(!/^[A-Z][A-Za-z0-9]*$/.test(defaultSkin)||![styleAttribute,themeAttribute].every(value=>/^data-[a-z][a-z0-9-]*$/.test(value)))throw Error('Invalid early skin configuration');
 let skin=defaultSkin;
 try{const saved=storage?.getItem(styleKey);if(/^[A-Z][A-Za-z0-9]*$/.test(saved??''))skin=saved}catch{}
 doc.documentElement.setAttribute(styleAttribute,skin);
 let preference=null;
 try{preference=JSON.parse(storage?.getItem(appearanceKey)||'null')}catch{}
 const theme=['dark','light'].includes(preference?.theme)?preference.theme:matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
 doc.documentElement.setAttribute(themeAttribute,theme);
 return {skin,theme};
}

if(typeof document!=='undefined'){
 const script=document.querySelector('script[data-picot-boot]');
 if(script)applyEarlySkin({document,storage:globalThis.localStorage,matchMedia:globalThis.matchMedia,styleKey:script.dataset.styleStorageKey,appearanceKey:script.dataset.appearanceStorageKey,defaultSkin:script.dataset.defaultSkin,styleAttribute:script.dataset.styleAttribute,themeAttribute:script.dataset.themeAttribute});
}
