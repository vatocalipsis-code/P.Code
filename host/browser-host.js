// Product-neutral browser adapter for loading an SPL and preparing P.Code.
// The application owns names, data bindings, actions, and navigation.
export function createPCodeHost({engine,parse,fetchText=async path=>{
  const response=await fetch(path);
  if(!response.ok)throw new Error('SPL download failed: '+response.status);
  return response.text();
}}){
  if(!engine?.connect||typeof parse!=='function'||typeof fetchText!=='function')throw new TypeError('P.Code host dependencies required');
  const sources=new Map();
  async function load({key,path,expectedName}){
    if(!key||!path)throw new TypeError('SPL key and path required');
    if(typeof path!=='string'||!path.startsWith('/')||path.startsWith('//')||path.split('/').includes('..'))throw new TypeError('SPL path must be local');
    const cached=sources.get(key);
    if(cached){
      if(cached.path!==path||cached.expectedName!==expectedName)throw new Error('SPL key reused for a different source: '+key);
      return cached.pending;
    }
    const pending=(async()=>{
      const text=await fetchText(path);
      const parsed=parse(text);
      if(expectedName&&parsed?.SetLang?.Name!==expectedName)throw new Error('SPL identity mismatch: '+key);
      return {text,parsed};
    })().catch(error=>{sources.delete(key);throw error});
    sources.set(key,{path,expectedName,pending});
    return pending;
  }
  async function prepare(skin){
    const descriptor=engine.getDescriptor?.();
    const connected=engine.connect({
      GenerationId:descriptor?.GenerationId??'pcode.layout-group.v1',SerializationVersion:descriptor?.SupportedSerializationVersions?.at(-1)??1,
      RequiredCapabilities:skin.SetLang.Requires??[],OptionalCapabilities:[]
    });
    if(connected.Acceptance.Status!=='Accepted')throw new Error(JSON.stringify(connected.Acceptance.Failure));
    const connection=connected.Connection;
    try{
      const result=await connection.prepare({
        SetLang:skin.SetLang,SetData:skin.SetData,SetRender:skin.SetRender,
        ...(skin.Resources?{Resources:skin.Resources}:{})
      });
      if(result.Outcome!=='Completed')throw new Error(JSON.stringify(result.Failure));
      return {connection,runtime:result.Runtime};
    }catch(error){await connection.close().catch(()=>{});throw error}
  }
  return Object.freeze({load,prepare,getCached:key=>sources.get(key)?.pending});
}
