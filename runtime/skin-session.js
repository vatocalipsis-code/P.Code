import {parseSPL} from '../editor/spl.js';
import {createPCodeHost} from '../host/browser-host.js';
import {PlaneCodeEngine} from './public-runtime.js';
import {applyAppearance} from './appearance.js';
import {applyVisualStyle,bindVisualStyleSwitch,VISUAL_STYLES} from './skin-manager.js';

/** Owns one mounted SPL and its Picot renderer connection. */
export function createSkinSession({root,contract,validateContract,actionRegistry,onEvent,onEventError,bind,surface,
 appearance,selectedStyle,expectedName,switchStyle,metricPrefix='picot-skin',measure=()=>{},
 createHost=createPCodeHost,engine=PlaneCodeEngine,parse=parseSPL,applyStyle=applyVisualStyle,projectAppearance=applyAppearance}){
 const host=createHost({engine,parse});
 if(switchStyle)bindVisualStyleSwitch(style=>switchStyle({visualStyle:style}));
 let skin=null,runtime=null,connection=null,currentText=null,currentLabel=null,stableContract=null;
 const resultOk=result=>{if(result.Outcome!=='Completed')throw new Error(JSON.stringify(result.Failure));return result};
 const syncAppearance=()=>{
  const current=appearance();
  return projectAppearance({preferences:current.preferences,visualStyle:currentLabel??selectedStyle(),root,
   authenticated:current.authenticated,persist:current.persist});
 };
 const dispose=async()=>{if(connection){await connection.close().catch(()=>{});connection=null;runtime=null;skin=null}};
 async function prepare(text,{enforceStable=true,parsed=null}={}){
  syncAppearance();
  const source=parsed??parseSPL(text);
  if(source.SetLang.ThemeContract!=='SelfContained')throw new Error('SPL должен содержать собственное оформление');
  const template=structuredClone(source),registry=actionRegistry();
  const nextContract=stableContract&&enforceStable?validateContract(template.SetLang,template.SetData,stableContract):contract(template.SetLang,template.SetData);
  const next=await host.prepare(template);
  return {...next,skin:template,registry,contract:nextContract};
 }
 const eventSink=registry=>event=>{
  try{Promise.resolve(onEvent(event,registry)).catch(onEventError)}catch(error){onEventError(error)}
 };
 async function activate(prepared){
  skin=prepared.skin;connection=prepared.connection;runtime=prepared.runtime;
  resultOk(await runtime.setEventSink(eventSink(prepared.registry)));
  const startRender=performance.now();resultOk(await runtime.mount(root));measure(metricPrefix+'-render',startRender);
  const startInteraction=performance.now();resultOk(await runtime.enableInteraction());measure(metricPrefix+'-interaction',startInteraction);
  const startBind=performance.now();await bind();measure(metricPrefix+'-bind',startBind);
  const startSurface=performance.now();await surface();measure(metricPrefix+'-surface',startSurface);
 }
 async function install(prepared,text,label,{stable=false}={}){
  return host.updatePresentation(root,async()=>{
   const previousText=currentText,previousLabel=currentLabel;
   try{
    const startStyle=performance.now();currentText=text;currentLabel=label;
    applyStyle(label,root);syncAppearance();measure(metricPrefix+'-pre-dispose',startStyle);
    const startDispose=performance.now();await dispose();measure(metricPrefix+'-dispose',startDispose);
    await activate(prepared);
    if(stable)stableContract=prepared.contract;
   }catch(error){
    await dispose();currentText=previousText;currentLabel=previousLabel;
    if(previousLabel)applyStyle(previousLabel,root);
    if(previousText){
     const cached=await host.getCached(previousLabel);
     const rollback=await prepare(previousText,{enforceStable:false,parsed:cached?.text===previousText?cached.parsed:null});
     await activate(rollback);
    }
    throw error;
   }
  });
 }
 async function mountText(text,label,{stable=false,enforceStable=true}={}){
  const startPrepare=performance.now(),cached=await host.getCached(label);
  const prepared=await prepare(text,{enforceStable,parsed:cached?.text===text?cached.parsed:null});
  measure(metricPrefix+'-prepare',startPrepare);
  const startInstall=performance.now();await install(prepared,text,label,{stable});measure(metricPrefix+'-install',startInstall);
  return prepared.contract;
 }
 async function load(style){
  const entry=VISUAL_STYLES[style];if(!entry)throw new Error('Неизвестный стиль '+style);
  const started=performance.now();
  const source=await host.load({key:style,path:'/skins/'+encodeURIComponent(entry.splFile)+'.SPL',expectedName:expectedName(style)});
  measure(metricPrefix+'-source',started);return source;
 }
 async function mount(style){
  const started=performance.now(),{text}=await load(style);
  const activeContract=await mountText(text,style,{stable:true,enforceStable:Boolean(stableContract)});
  measure(metricPrefix+'-total',started);return activeContract;
 }
 return Object.freeze({load,mount,mountText,syncAppearance,dispose,
  applyModel:model=>runtime?.applyModel(model),consumeBack:()=>runtime?.consumeBack(),deliverFile:host.deliverFile,
  get active(){return Boolean(runtime&&skin)},get text(){return currentText},get label(){return currentLabel}});
}
