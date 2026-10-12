/** Domain-neutral state. Only SPL interprets paths and display formats. */
export const MODEL=Symbol('P.Code semantic model');
export function withModel(data,model){return Object.keys(model).length?Object.assign({},data,{[MODEL]:model}):data}
export function semanticValue(path,model,item){
  if(typeof path!=='string'||!/^[$@]\./.test(path))return undefined;
  let value=path[0]==='$'?model:item;
  for(const part of path.slice(2).split('.')){
    if(!part||['__proto__','prototype','constructor'].includes(part)||value===null||typeof value!=='object'||!Object.hasOwn(value,part))return undefined;
    value=value[part];
  }
  return value;
}
export function validateSemanticModel(model){
  let remaining=100000;
  const walk=(value,depth)=>{
    if(--remaining<0||depth>32)throw Error('Semantic model exceeds size limit');
    if(value===null||typeof value==='string'||typeof value==='boolean')return;
    if(typeof value==='number'&&Number.isFinite(value))return;
    if(!value||typeof value!=='object'||(!Array.isArray(value)&&Object.getPrototypeOf(value)!==Object.prototype&&Object.getPrototypeOf(value)!==null))throw Error('Semantic model must contain JSON values');
    for(const [key,child]of Object.entries(value)){
      if(['__proto__','prototype','constructor'].includes(key))throw Error('Unsafe semantic model key');
      walk(child,depth+1);
    }
  };
  if(!model||typeof model!=='object'||Array.isArray(model))throw Error('Semantic model must be an object');
  walk(model,0);return true;
}
export function decimalParts(value,format={}){
  if(!value||!/^[-+]?\d+$/.test(String(value.units))||!Number.isInteger(value.scale)||value.scale<0||value.scale>12)throw Error('Invalid decimal quantity');
  const number=BigInt(value.units),absolute=number<0n?-number:number;
  const precision=value.precision??value.scale;
  if(!Number.isInteger(precision)||precision<0||precision>12)throw Error('Invalid decimal precision');
  const raw=absolute.toString().padStart(value.scale+1,'0');
  const whole=(value.scale?raw.slice(0,-value.scale):raw).replace(/\B(?=(\d{3})+(?!\d))/g,format.GroupSeparator??' ');
  const fraction=(value.scale?raw.slice(-value.scale):'').padEnd(precision,'0').slice(0,precision);
  return {whole:(number<0n&&format.Absolute!==true?'−':'')+whole,fraction:precision?(format.DecimalSeparator??'.')+fraction:'',unit:format.ShowUnit&&value.unit?' '+value.unit:''};
}
