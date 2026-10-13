/** Picot presentation lifecycle for the initial mounted SPL screen. */
const boot=typeof document==='undefined'?null:document.querySelector('script[data-picot-boot]');
const config={
 app:boot?.dataset.appSelector??'[data-picot-app]',
 root:boot?.dataset.rootSelector??'[data-picot-root]',
 loader:boot?.dataset.loaderSelector??'[data-picot-loader]',
 stylesheet:boot?.dataset.rendererStylesheetSelector??'[data-picot-renderer-style]'
};
const select=(selector,doc=globalThis.document)=>doc?.querySelector(selector);

export const presentationVisible=(doc=globalThis.document)=>doc?.visibilityState!=='hidden';

export async function waitForRendererStyle(doc=globalThis.document){
 const stylesheet=select(config.stylesheet,doc);
 if(!stylesheet)throw new Error('P.Code renderer stylesheet missing');
 if(!stylesheet.sheet)await new Promise((resolve,reject)=>{
  const timeout=setTimeout(()=>finish(new Error('P.Code renderer stylesheet timed out')),30000);
  const loaded=()=>finish();
  const failed=()=>finish(new Error('P.Code renderer stylesheet unavailable'));
  const finish=error=>{
   clearTimeout(timeout);
   stylesheet.removeEventListener('load',loaded);
   stylesheet.removeEventListener('error',failed);
   if(error)reject(error);else resolve();
  };
  stylesheet.addEventListener('load',loaded,{once:true});
  stylesheet.addEventListener('error',failed,{once:true});
 });
 stylesheet.media='all';
}

export async function revealStartupScreen({firstRegistration=false}={}){
 const doc=globalThis.document,loader=select(config.loader,doc);
 if(!loader||loader.hidden)return;
 const root=select(config.root,doc),app=select(config.app,doc);
 const ready=root?.querySelector(':scope > [data-plane-type="BasePanel"][aria-hidden="false"]');
 if(!ready||!app)throw new Error('Startup screen is not ready');
 if(!firstRegistration){
  const firstHtml=performance.getEntriesByType('navigation')[0]?.responseEnd??performance.now();
  const remaining=2500-(performance.now()-firstHtml);
  if(remaining>0)await new Promise(resolve=>setTimeout(resolve,remaining));
 }
 doc.body.style.setProperty('background','var(--uc-startup-background)','important');
 app.classList.add('uc-startup-appear');
 app.style.visibility='visible';
 loader.hidden=true;
 loader.setAttribute('aria-busy','false');
 const fadeDuration=getComputedStyle(app).animationDuration;
 const fadeMs=Number.parseFloat(fadeDuration)*(fadeDuration.endsWith('ms')?1:1000);
 const timeout=setTimeout(clearFade,fadeMs+300);
 function clearFade(event){
  if(event&&event.target!==app)return;
  clearTimeout(timeout);
  app.removeEventListener('animationend',clearFade);
  app.classList.remove('uc-startup-appear');
  doc.body.style.removeProperty('background');
 }
 app.addEventListener('animationend',clearFade);
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)clearFade();
}

export function failStartupScreen(doc=globalThis.document){
 const root=select(config.root,doc),loader=select(config.loader,doc);
 root?.replaceChildren();
 root?.style.removeProperty('visibility');
 loader?.setAttribute('hidden','');
}
