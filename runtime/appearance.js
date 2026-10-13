export const FONT_CHOICES=Object.freeze([
 ['system','Системный'],
 ['inter','Inter · в стиле iPhone'],
 ['roboto','Nunito'],
 ['manrope','Manrope'],
 ['comfortaa','Comfortaa']
]);
export const ACCENT_COLORS=Object.freeze([
 ['blue','#007AFF','Синий'],['indigo','#5856D6','Индиго'],['purple','#AF52DE','Фиолетовый'],
 ['pink','#FF2D55','Розовый'],['orange','#FF9500','Оранжевый'],['green','#34C759','Зелёный'],
 ['teal','#00A8A8','Бирюзовый'],['graphite','#636366','Графитовый']
]);
const rgb=color=>color.slice(1).match(/../g).map(v=>parseInt(v,16));
const hex=values=>'#'+values.map(v=>Math.round(v).toString(16).padStart(2,'0')).join('').toUpperCase();
const luminance=color=>rgb(color).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
// Visual projection only: stored accent identifiers stay unchanged.
export function pastelAccent(color){return hex(rgb(color).map(v=>v*.70+255*.30))}
export function contrast(a,b){const l=[luminance(a),luminance(b)].sort((x,y)=>y-x);return(l[0]+.05)/(l[1]+.05)}
export function readableAccent(color,background){
 const source=rgb(color),target=luminance(background)>.4?0:255;
 for(let i=0;i<=100;i++){const result=hex(source.map(v=>v+(target-v)*i/100));if(contrast(result,background)>=4.5)return result}
 return target?'#FFFFFF':'#000000';
}
export function effectiveDark(preferences,systemDark){return preferences?.theme==='dark'||(preferences?.theme!=='light'&&systemDark)}
// Grade ratios from accepted df2bfcb: light .14/.40, dark .12/.32.
// The current intensity remains the primary alpha; no stored preference changes.
export function controlAccentTokens(preferences,systemDark){
 const dark=effectiveDark(preferences,systemDark);
 const accent=/^#[0-9a-f]{6}$/i.test(preferences?.accent??'')?preferences.accent:'#007AFF';
 const intensity=Math.max(0,Math.min(100,Number(preferences?.accentIntensity??28)))/100;
 const channels=rgb(accent).join(',');
 return {main:'rgba('+channels+','+intensity+')',secondary:'rgba('+channels+','+(intensity*(dark?.12/.32:.14/.40))+')'};
}
export function appearanceTokens(preferences,systemDark,palette){
 const dark=effectiveDark(preferences,systemDark),{Background:background,Panel:panel,Tint:tint}=palette[dark?'Dark':'Light'],
 accent=/^#[0-9a-f]{6}$/i.test(preferences?.accent??'')?preferences.accent:'#007AFF',ink=readableAccent(accent,dark?panel:background);
 return {dark,background,panel,accent:ink,surface:pastelAccent(accent),tint};
}

import {VISUAL_STYLES,applyVisualStyle,commitVisualStyle} from './skin-manager.js';

const appearanceKey=()=>globalThis.document?.querySelector('script[data-picot-boot]')?.dataset.appearanceStorageKey??'picot.appearance';
export const REGISTRATION_APPEARANCE=Object.freeze({theme:'dark',accent:'#636366',accentIntensity:25,font:'system'});
export const systemDark=()=>Boolean(globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches);

export function appearanceSettingsModel(preferences,{enabled=true}={}){
 return {theme:preferences?.theme??'system',font:preferences?.font??'system',accent:String(preferences?.accent??'#007AFF').toUpperCase(),
  haptics:Boolean(preferences?.haptics),enabled,rowHeight:preferences?.rowHeight??44,rowPadding:preferences?.rowPadding??12,
  accentIntensity:preferences?.accentIntensity??28};
}

const appearanceSnapshot=preferences=>JSON.stringify([preferences?.theme,preferences?.accent,preferences?.font,preferences?.accentIntensity,preferences?.rowHeight,preferences?.rowPadding]);
export const appearanceChanged=(before,after)=>appearanceSnapshot(before)!==appearanceSnapshot(after);
export const followsSystemAppearance=preferences=>!preferences?.theme||preferences.theme==='system';
export function appearanceActionHandlers({change,readPreferences,prefix='appearance',hapticsCommand='haptics.toggle'}){
 const actions={};
 for(const theme of ['system','light','dark'])actions[prefix+'.theme.'+theme]=()=>change({theme});
 for(const [key,accent] of ACCENT_COLORS)actions[prefix+'.accent.'+key]=()=>change({accent});
 for(const [key] of FONT_CHOICES)actions[prefix+'.font.'+key]=()=>change({font:key});
 actions[prefix+'.visualStyle.select']=event=>Object.hasOwn(VISUAL_STYLES,event.ItemId)?change({visualStyle:event.ItemId}):undefined;
 for(const [key,min,max] of [['rowHeight',36,64],['rowPadding',4,20],['accentIntensity',0,100]])actions[prefix+'.'+key+'.change']=event=>{
  const value=Number(event.Value);
  return Number.isInteger(value)&&value>=min&&value<=max?change({[key]:value}):undefined;
 };
 actions[hapticsCommand]=()=>change({haptics:!readPreferences().haptics});
 return actions;
}

/** Keep persistence, SPL installation and rollback one presentation transaction. */
export async function applyAppearancePreferenceChange(patch,{readPreferences,setPreferences,currentStyle,save,mountStyle,remountCurrent,commitStyle=commitVisualStyle}){
 const previousPreferences=readPreferences(),previousStyle=currentStyle();
 const result=await save(patch);
 setPreferences(result.preferences);
 try{
  if(patch.visualStyle){await mountStyle(patch.visualStyle);commitStyle(patch.visualStyle)}
  else await remountCurrent();
 }catch(error){
  if(patch.visualStyle){
   setPreferences(previousPreferences);
   commitStyle(previousStyle);
   const restored=await save({visualStyle:previousStyle});
   setPreferences(restored.preferences);
  }
  throw error;
 }
 return result.preferences;
}

/** Project saved appearance values onto browser presentation owned by Picot. */
export function applyAppearance({preferences,visualStyle,palette,root,authenticated=false,persist=false,document:doc=globalThis.document,storage}={}){
 const metrics=preferences??{},tokens=palette?appearanceTokens(metrics,systemDark(),palette):{dark:effectiveDark(metrics,systemDark())};
 const html=doc.documentElement,theme=tokens.dark?'dark':'light';
 const setToken=(name,value)=>{if(html.style.getPropertyValue(name)!==value)html.style.setProperty(name,value)};
 setToken('--uc-row-height',(metrics.rowHeight??44)+'px');
 setToken('--uc-row-padding',(metrics.rowPadding??12)+'px');
 if(html.dataset.theme!==theme)html.dataset.theme=theme;
 applyVisualStyle(visualStyle,root,html);
 if(persist)try{(storage??globalThis.localStorage)?.setItem(appearanceKey(),JSON.stringify(metrics))}catch{}
 const font=FONT_CHOICES.some(([key])=>key===metrics.font)?metrics.font:'system';
 if(html.dataset.ucFont!==font)html.dataset.ucFont=font;
 const rawAccent=metrics.accent;
 const accent=/^#[0-9a-f]{6}$/i.test(rawAccent??'')?rawAccent:'#007AFF';
 setToken('--uc-user-accent',accent);
 setToken('--uc-user-accent-pastel',pastelAccent(accent));
 setToken('--uc-user-accent-rgb',accent.slice(1).match(/../g).map(channel=>parseInt(channel,16)).join(','));
 const accentLevel=Number(metrics.accentIntensity??28);
 const boundedAccent=Number.isFinite(accentLevel)?Math.max(0,Math.min(100,accentLevel)):28;
 setToken('--uc-user-accent-alpha',String(boundedAccent/100));
 if(palette)setToken('--uc-user-accent-ink',tokens.accent);
 const themeColor=doc.querySelector('meta[name="theme-color"]');
 if(palette&&themeColor&&themeColor.content!==tokens.background)themeColor.content=tokens.background;
 const viewport=doc.querySelector('meta[name="viewport"]');
 const viewportContent='width=device-width,initial-scale=1,viewport-fit=cover'+(authenticated?',maximum-scale=1,user-scalable=no':'');
 if(viewport&&viewport.content!==viewportContent)viewport.content=viewportContent;
 return tokens;
}

export function watchSystemAppearance(shouldApply,onChange){
 const query=globalThis.matchMedia?.('(prefers-color-scheme: dark)');
 if(!query)return()=>{};
 const handler=()=>{if(shouldApply())void onChange()};
 query.addEventListener('change',handler);
 return()=>query.removeEventListener('change',handler);
}
