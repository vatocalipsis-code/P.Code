/** SPL-only display formatting. No product entities, actions, or stored-value mutation. */
import {semanticValue,textTemplate,decimalParts} from './semantic-model.js';
const dates=new Map();
function dateFormatter(format){
 const key=JSON.stringify([format.Locale,format.Options]);
 if(!dates.has(key)){if(dates.size>=64)dates.delete(dates.keys().next().value);dates.set(key,new Intl.DateTimeFormat(format.Locale,format.Options))}
 return dates.get(key);
}
function decimalProjection(value,format,model){
 const number=BigInt(value.units),sign=number<0n?-1n:1n,absolute=number<0n?-number:number;
 if(!Number.isInteger(value.scale)||value.scale<0||value.scale>24)throw Error('Invalid decimal scale');
 const inverse=format.ReciprocalSource&&semanticValue(format.ReciprocalSource,model)===true;
 if(inverse&&absolute===0n)return null;
 const precision=format.Precision,unit=10n**BigInt(value.scale),factor=10n**BigInt(precision);
 const numerator=(inverse?unit:absolute)*factor,denominator=inverse?absolute:unit;
 let units=numerator/denominator;
 if(format.Rounding==='HalfTowardZero'&&numerator%denominator*2n>denominator)units++;
 return {...value,units:String(units*sign),scale:precision,precision};
}
export function formatValue(value,format={Kind:'Text'},model={}){
 if(format.Kind==='Composite'){
  const segments=[];
  for(const part of Object.values(format.Parts)){
   if(part.When){const condition=semanticValue(part.When,model,value);if(Object.hasOwn(part,'Equals')?condition!==part.Equals:condition!==true)continue}
   if(part.Unless&&semanticValue(part.Unless,model,value)===true)continue;
   if(Object.hasOwn(part,'Text'))segments.push({kind:'Text',value:part.Text});
   else segments.push(...formatValue(semanticValue(part.Source,model,value),part.Format,model));
  }
  const flat=[];
  for(const segment of segments.flatMap(segment=>segment.kind==='Formatted'?segment.value:[segment])){
   if(segment.kind==='Text'&&flat.at(-1)?.kind==='Text')flat.at(-1).value+=segment.value;else flat.push({...segment});
  }
  return flat.every(segment=>segment.kind==='Text')?[{kind:'Text',value:flat.map(segment=>segment.value).join('')}]:[{kind:'Formatted',value:flat}];
 }
 if(format.Kind==='Picture'){
  const url=Object.hasOwn(format.Map??{},value)?format.Map[value]:format.Fallback;return url?[{kind:'Picture',value:url}]:[];
 }
 if(format.Kind==='Text'&&format.Map)value=Object.hasOwn(format.Map,value)?format.Map[value]:format.Fallback??'';
 else if(value===null||value===undefined||value==='')value=format.Fallback??'';
 if(value==='')return [];
 if(format.Kind==='Decimal'){
  if(typeof value==='string'){
   const match=value.match(/^([+-]?)(\d+)(?:[.,](\d*))?$/);if(!match)throw Error('Invalid decimal text');
   value={units:match[1]+match[2]+(match[3]??''),scale:match[3]?.length??0};
  }
  if(format.Precision!==undefined){value=decimalProjection(value,format,model);if(value===null)return format.Fallback?[{kind:'Text',value:format.Fallback}]:[]}
  let parts=decimalParts(value,format);
  if(format.TrimFraction)parts={...parts,fraction:parts.fraction.replace(/0+$/,'').replace(/[.,]$/,'')};
  if(format.Output==='Text')return [{kind:'Text',value:parts.whole+parts.fraction+parts.unit}];
  return [{kind:'Decimal',value,parts,...(format.UnitPlacement?{unitPlacement:format.UnitPlacement}:{})}];
 }
 let text;
 if(format.Kind==='DateTime'){
  const date=new Date(value);if(Number.isNaN(date.valueOf()))return [];
  text=dateFormatter(format).format(date);
  if(format.DateTimeSeparator!==undefined)text=text.replace(',',format.DateTimeSeparator);
 }else if(format.Template)text=textTemplate(value,format.Template);
 else if(format.ListSeparator!==undefined){
  if(!Array.isArray(value)||value.some(item=>!['string','number','boolean'].includes(typeof item)))throw Error('List text Source must resolve to scalar entries');
  text=value.join(format.ListSeparator);
 }else{
  if(!['string','number','boolean'].includes(typeof value))throw Error('Text Source must resolve to a scalar');
  text=String(value);
 }
 if(format.SliceStart!==undefined)text=text.slice(format.SliceStart);
 return [{kind:'Text',value:(format.Prefix??'')+text+(format.Suffix??'')}];
}
