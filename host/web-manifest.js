/** Browser install metadata for a presentation package and semantic identity. */
export function buildWebManifest({name,brandIconBase}){
 if(typeof name!=='string'||!name.trim()||typeof brandIconBase!=='string'||!
    /^\/[A-Za-z0-9/_-]+$/.test(brandIconBase))throw new TypeError('Invalid manifest identity');
 return {
  name,short_name:name,start_url:'/',display:'standalone',
  icons:[192,512].map(size=>({src:brandIconBase+'-'+size+'.png',sizes:size+'x'+size,type:'image/png',purpose:'any'})),
  background_color:'#F2F2F7',theme_color:'#F2F2F7'
 };
}
