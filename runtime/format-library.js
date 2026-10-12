import {validateFormat} from './validator.js';
// Resolve skin-local declarations once, before validation/compilation. The model
// cannot select a format, inject a declaration, or address another skin's library.
export function resolveFormatLibrary(setLang,capabilities=[]){
 const library=setLang.Formats;
 const hasLibrary=library!==undefined;
 if(!hasLibrary)return setLang;
 if(hasLibrary&&(!setLang.Requires?.includes('pcode.format-library.v1')||!capabilities.includes('pcode.format-library.v1')))throw Error('Formats require negotiated pcode.format-library.v1');
 if(hasLibrary&&(!library||typeof library!=='object'||Array.isArray(library)||Object.keys(library).length>256))throw Error('Invalid Formats library');
 const formats=new Map();
 function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value)}return value}
 for(const [name,format]of Object.entries(library??{})){
   if(!/^[A-Za-z][A-Za-z0-9_.-]*$/.test(name))throw Error('Invalid format name');
   validateFormat(format,name);formats.set(name,freeze(structuredClone(format)));
 }
 function node(value){
   if(Array.isArray(value))return value.map(node);
   if(!value||typeof value!=='object')return value;
   const result={...value};
   if(value.Properties){
     const p=value.Properties;let properties=p;
     if(Object.hasOwn(p,'FormatRef')){
       if(typeof p.FormatRef!=='string'||!formats.has(p.FormatRef))throw Error('Unknown FormatRef: '+p.FormatRef);
       if(p.Format!==undefined)throw Error('Format and FormatRef are mutually exclusive');
       const {FormatRef,...rest}=p;properties={...rest,Format:formats.get(FormatRef)};
     }
     if(properties.AggregateActivePanels)properties={...properties,AggregateActivePanels:node(properties.AggregateActivePanels)};
     result.Properties=properties;
   }
   for(const key of ['Layout','Containers','SimplePanels','ActivePanels'])if(value[key])result[key]=node(value[key]);
   return result;
 }
 const {Formats,...envelope}=setLang;
 return {...envelope,Data:node(setLang.Data)};
}
