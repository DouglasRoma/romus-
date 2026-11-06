export const PALETTE=['#8b93a7','#b99070','#e5a24b','#e4c65a','#6eb08a','#60b8bb','#719ee4','#a48ade','#d18ab9','#df8383'];
export function colorChip(app,element,key,value){
 const style=app.propertyStyles?.[key],first=Array.isArray(value)?value[0]:value;
 const color=style?.options?.find(option=>option.value===String(first))?.color||style?.color||PALETTE[[...key].reduce((n,c)=>n+c.charCodeAt(0),0)%PALETTE.length];
 if(/^#[a-f0-9]{6}$/i.test(color)){element.classList.add('atlas-colored-chip');element.style.setProperty('--property-color',color)}
}
