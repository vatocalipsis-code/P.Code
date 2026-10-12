// Decorative vectors are authored by the skin; no markup or executable attributes.
const ns='http://www.w3.org/2000/svg';
const common={Fill:'fill',Stroke:'stroke',StrokeWidth:'stroke-width',LineCap:'stroke-linecap',LineJoin:'stroke-linejoin'};
const shapes={Path:{D:'d'},Circle:{CX:'cx',CY:'cy',R:'r'}};
export function validateVector(vector){
 const fail=()=>{throw Error('Invalid Vector declaration')};
 if(!vector||typeof vector!=='object'||Array.isArray(vector)||Object.keys(vector).some(k=>!['ViewBox','Elements',...Object.keys(common)].includes(k)))fail();
 if(typeof vector.ViewBox!=='string'||!/^[-+\d.eE\s]+$/.test(vector.ViewBox))fail();
 const box=vector.ViewBox.trim().split(/\s+/).map(Number);if(box.length!==4||box.some(v=>!Number.isFinite(v))||box[2]<=0||box[3]<=0)fail();
 if(!vector.Elements||typeof vector.Elements!=='object'||Array.isArray(vector.Elements)||Object.keys(vector.Elements).length>64)fail();
 const values=object=>{for(const [key,value]of Object.entries(object)){
   if(['Fill','Stroke'].includes(key)&&!(typeof value==='string'&&/^(?:none|currentColor|#[0-9a-fA-F]{3,8}|var\(--[-a-zA-Z0-9]+\))$/.test(value)))fail();
   if(['StrokeWidth','CX','CY','R'].includes(key)&&!(typeof value==='number'&&Number.isFinite(value)&&(!['R','StrokeWidth'].includes(key)||value>=0)))fail();
   if(key==='LineCap'&&!['butt','round','square'].includes(value))fail();
   if(key==='LineJoin'&&!['miter','round','bevel'].includes(value))fail();
 }};values(vector);
 for(const part of Object.values(vector.Elements)){
   if(!part||typeof part!=='object'||!Object.hasOwn(shapes,part.Shape)||Object.keys(part).some(k=>!['Shape',...Object.keys(common),...Object.keys(shapes[part.Shape])].includes(k)))fail();
   values(part);
   if(part.Shape==='Path'&&!(typeof part.D==='string'&&part.D.length<16384&&/^[MmZzLlHhVvCcSsQqTtAaEe\d\s.,+\-]+$/.test(part.D)))fail();
   if(part.Shape==='Circle'&&['CX','CY','R'].some(k=>part[k]===undefined))fail();
 }
}
export function renderVector(vector,doc=document){
 const svg=doc.createElementNS(ns,'svg');svg.setAttribute('viewBox',vector.ViewBox);svg.setAttribute('aria-hidden','true');
 const apply=(node,source,fields)=>{for(const [key,attribute]of Object.entries(fields))if(source[key]!==undefined)node.setAttribute(attribute,String(source[key]))};
 const group=doc.createElementNS(ns,'g');apply(group,vector,common);
 for(const part of Object.values(vector.Elements)){const node=doc.createElementNS(ns,part.Shape.toLowerCase());apply(node,part,{...common,...shapes[part.Shape]});group.append(node)}
 svg.append(group);return svg;
}
