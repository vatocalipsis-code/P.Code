/** Server-side presentation policy. The product only stores scoped key/value records. */
export function createPresentationPreferences({styles=[]}={}){
 const allowedStyles=new Set(styles);
 const themes=new Set(['system','light','dark']);
 const fonts=new Set(['system','inter','roboto','manrope','comfortaa']);
 const metric=(value,fallback,min,max)=>{const number=Number(value);return Number.isInteger(number)&&number>=min&&number<=max?number:fallback};
 const accent=value=>typeof value==='string'&&/^#[0-9a-f]{6}$/i.test(value);
 const read=get=>{
  const style=get('visualStyle'),theme=get('theme'),color=get('accent'),font=get('font'),haptics=get('haptics');
  return {rowHeight:metric(get('rowHeight'),44,36,64),rowPadding:metric(get('rowPadding'),12,4,20),
   accentIntensity:Math.max(0,Math.min(100,Number(get('accentIntensity')??28)||0)),
   visualStyle:allowedStyles.has(style)?style:null,haptics:haptics===undefined?true:haptics==='1',
   theme:themes.has(theme)?theme:'light',accent:accent(color)?color.toUpperCase():'#007AFF',font:fonts.has(font)?font:'system'};
 };
 const plan=(patch,current)=>{
  const visualStyle=patch.visualStyle??current.visualStyle,haptics=patch.haptics??current.haptics,
   theme=patch.theme??current.theme,color=patch.accent??current.accent,font=patch.font??current.font,
   intensity=patch.accentIntensity??current.accentIntensity,height=patch.rowHeight??current.rowHeight,padding=patch.rowPadding??current.rowPadding;
  if(!Number.isInteger(intensity)||intensity<0||intensity>100)return {error:'Неверная интенсивность акцента'};
  if(!Number.isInteger(height)||height<36||height>64)return {error:'Неверная высота строки'};
  if(!Number.isInteger(padding)||padding<4||padding>20)return {error:'Неверный внутренний отступ'};
  if((visualStyle!==null&&!allowedStyles.has(visualStyle))||typeof haptics!=='boolean'||!themes.has(theme)||!accent(color)||!fonts.has(font))return {error:'Неверные настройки'};
  return {writes:{...(visualStyle?{visualStyle}:{}),haptics:haptics?'1':'0',theme,accent:color.toUpperCase(),accentIntensity:String(intensity),rowHeight:String(height),rowPadding:String(padding),font}};
 };
 return {read,plan,initial:{theme:'dark',accent:'#636366',accentIntensity:'25',font:'system'}};
}
