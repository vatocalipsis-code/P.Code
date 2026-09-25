/**
 * P.Code 2.10.0 browser/PWA integration through Public Runtime API v1.
 * Navigation and refresh remain client-integration behavior.
 */
import {setLang} from "./release/set-lang.js?v=2.10.0";
import {setData} from "./release/set-data.js?v=2.10.0";
import {setRender} from "./release/set-render.js?v=2.10.0";
import {PlaneCodeEngine} from "./runtime/public-runtime.js?v=2.10.0";

if("serviceWorker" in navigator)navigator.serviceWorker.register("./sw.js?v=2.10.0",{updateViaCache:"none"}).then(registration=>registration.update()).catch(()=>{});

const root=document.querySelector("#plane-code-root");
const connectionResult=PlaneCodeEngine.connect({
  GenerationId:"pcode.layout-group.v1",
  SerializationVersion:1,
  RequiredCapabilities:[],
  OptionalCapabilities:[]
});
if(connectionResult.Acceptance.Status!=="Accepted")throw new Error(JSON.stringify(connectionResult.Acceptance.Failure));

const connection=connectionResult.Connection;
const prepared=await connection.prepare({SetLang:setLang,SetData:setData,SetRender:setRender});
if(prepared.Outcome!=="Completed")throw new Error(JSON.stringify(prepared.Failure));
const runtime=prepared.Runtime;
const mounted=await runtime.mount(root);
if(mounted.Outcome!=="Completed")throw new Error(JSON.stringify(mounted.Failure));
const enabled=await runtime.enableInteraction();
if(enabled.Outcome!=="Completed")throw new Error(JSON.stringify(enabled.Failure));

window.PlaneCodeRuntime=runtime;
window.PlaneCodeSetData=nextData=>runtime.applySetData({...setData,Data:nextData});

const surfaces=[...root.querySelectorAll(':scope > [data-plane-type="BasePanel"]')];
let current=0,startX=0,startY=0,dragX=0,dragY=0,pointerId=null,gesture=null;
const refreshThreshold=72;
const refreshIndicator=document.createElement("div");
refreshIndicator.dataset.planeRefresh="";
refreshIndicator.textContent="↓";
root.append(refreshIndicator);

function positionSurfaces(offset=0,animate=false){
  surfaces.forEach((surface,index)=>{
    surface.style.transition=animate?"transform 220ms ease-out":"none";
    surface.style.transform="translateX("+((index-current)*100)+"%) translateX("+offset+"px)";
  });
}
function setRefreshPull(distance=0){
  const pull=Math.min(Math.max(distance,0)*0.45,54);
  refreshIndicator.style.transform="translate(-50%, "+pull+"px)";
  refreshIndicator.style.opacity=String(Math.min(distance/48,1));
  refreshIndicator.textContent=distance>=refreshThreshold?"↻":"↓";
}
root.addEventListener("pointerdown",event=>{
  pointerId=event.pointerId;startX=event.clientX;startY=event.clientY;dragX=0;dragY=0;gesture=null;positionSurfaces(0,false);
});
root.addEventListener("pointermove",event=>{
  if(event.pointerId!==pointerId)return;
  dragX=event.clientX-startX;dragY=event.clientY-startY;
  if(!gesture&&(Math.abs(dragX)>8||Math.abs(dragY)>8)){
    const atTop=window.scrollY<=0&&document.documentElement.scrollTop<=0;
    if(atTop&&dragY>0&&Math.abs(dragY)>Math.abs(dragX))gesture="refresh";
    else if(Math.abs(dragX)>Math.abs(dragY))gesture="horizontal";
    else gesture="vertical";
  }
  if(gesture==="refresh"){event.preventDefault();setRefreshPull(dragY);return}
  if(gesture!=="horizontal")return;
  if(current===0&&dragX>0||current===surfaces.length-1&&dragX<0)dragX*=0.25;
  positionSurfaces(dragX,false);
});
root.addEventListener("pointerup",event=>{
  if(event.pointerId!==pointerId)return;
  if(gesture==="refresh"){
    const reload=dragY>=refreshThreshold;setRefreshPull(0);pointerId=null;gesture=null;
    if(reload)location.replace(location.pathname+"?refresh="+Date.now());
    return;
  }
  if(gesture==="horizontal"){
    if(dragX<=-40&&current<surfaces.length-1)current+=1;
    else if(dragX>=40&&current>0)current-=1;
  }
  positionSurfaces(0,true);pointerId=null;gesture=null;
});
root.addEventListener("pointercancel",()=>{pointerId=null;gesture=null;setRefreshPull(0);positionSurfaces(0,true)});

let touchStartX=0,touchStartY=0,touchPull=0,touchRefresh=false;
root.addEventListener("touchstart",event=>{
  if(event.touches.length!==1)return;const touch=event.touches[0];touchStartX=touch.clientX;touchStartY=touch.clientY;touchPull=0;touchRefresh=window.scrollY<=0&&document.documentElement.scrollTop<=0;
},{passive:true});
root.addEventListener("touchmove",event=>{
  if(!touchRefresh||event.touches.length!==1)return;const touch=event.touches[0];const dx=touch.clientX-touchStartX,dy=touch.clientY-touchStartY;
  if(dy<=0||Math.abs(dx)>=Math.abs(dy)){if(Math.abs(dx)>Math.abs(dy))touchRefresh=false;return}
  event.preventDefault();touchPull=dy;setRefreshPull(touchPull);
},{passive:false});
root.addEventListener("touchend",()=>{
  if(!touchRefresh)return;const reload=touchPull>=refreshThreshold;touchRefresh=false;touchPull=0;setRefreshPull(0);if(reload)location.replace(location.pathname+"?refresh="+Date.now());
},{passive:true});
root.addEventListener("touchcancel",()=>{touchRefresh=false;touchPull=0;setRefreshPull(0)},{passive:true});
positionSurfaces();
