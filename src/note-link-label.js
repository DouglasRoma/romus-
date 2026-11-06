/** Presentation only: keep the complete destination in the link itself. */
export function noteLinkLabel(target,alias){
 if(alias)return alias;
 const text=String(target),hash=text.indexOf('#'),path=hash<0?text:text.slice(0,hash),fragment=hash<0?'':text.slice(hash);
 return path.replace(/\\/g,'/').split('/').pop().replace(/\.md$/i,'')+fragment;
}
