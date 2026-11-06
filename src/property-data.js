import {parseDocument} from 'yaml';
export const PROPERTY_TYPES=[['text','Texto'],['select','Seleção'],['multi-select','Seleção múltipla'],['status','Status'],['list','Lista'],['number','Número'],['checkbox','Caixa de seleção'],['date','Data'],['datetime','Data e hora'],['tags','Tags'],['structured','Estrutura YAML']];
export const reserved=key=>/^image-atlas-|^atlas-internal-|^__|^(constructor|prototype)$/i.test(key);
export const publicProperties=props=>Object.fromEntries(Object.entries(props).filter(([key])=>!reserved(key)));
export function propertyDocument(text){
  const match=/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text);
  const document=parseDocument(match?match[1]:'{}');
  if(document.errors.length)throw Error('As propriedades YAML desta nota têm um erro. Corrija o cabeçalho antes de editar as propriedades.');
  const props=document.toJS()||{};
  if(typeof props!=='object'||Array.isArray(props))throw Error('O cabeçalho de propriedades deve conter nomes e valores.');
  return{document,props,body:match?text.slice(match[0].length):text,eol:text.includes('\r\n')?'\r\n':'\n',bom:text.startsWith('\uFEFF')?'\uFEFF':''};
}
export function inferType(key,value,known={}){
  if(known[key])return known[key]==='multitext'?'list':known[key];
  if(key==='tags')return'tags';if(typeof value==='boolean')return'checkbox';if(typeof value==='number')return'number';
  if(Array.isArray(value))return value.every(item=>typeof item==='string')?'list':'structured';
  if(value&&typeof value==='object')return'structured';
  if(typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value))return'date';
  if(typeof value==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value))return'datetime';return'text';
}
export function patchProperties(text,original,values){
  const current=propertyDocument(text),before=publicProperties(original),next=publicProperties(values);
  let changed=false;
  for(const key of new Set([...Object.keys(before),...Object.keys(next)])){
    if(JSON.stringify(before[key])===JSON.stringify(next[key]))continue;
    changed=true;
    if(JSON.stringify(current.props[key])!==JSON.stringify(before[key]))throw Error(`A propriedade “${key}” mudou em outra tela. Feche e reabra as propriedades para conferir.`);
    if(Object.hasOwn(next,key))current.document.set(key,next[key]);else current.document.delete(key);
  }
  if(!changed)return text;
  const yaml=current.document.toString({lineWidth:0}).trimEnd().replace(/\n/g,current.eol);
  return current.bom+'---'+current.eol+yaml+current.eol+'---'+current.eol+current.body;
}
export function valueMatches(value,operator,query){
  const present=value!==undefined&&value!==null&&value!=='';
  if(operator==='exists')return present;if(operator==='missing')return!present;
  const fold=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase();
  const values=Array.isArray(value)?value:[value];
  if(operator==='equals')return values.some(v=>fold(v)===fold(query));
  if(operator==='not')return!values.some(v=>fold(v)===fold(query));
  if(operator==='greater'||operator==='less'){
    const a=typeof value==='number'?value:/^\d{4}-\d{2}-\d{2}/.test(String(value))?new Date(value).getTime():Number(value);
    const b=/^\d{4}-\d{2}-\d{2}/.test(query)?new Date(query).getTime():Number(query);
    return Number.isFinite(a)&&Number.isFinite(b)&&(operator==='greater'?a>b:a<b);
  }
  return values.some(v=>fold(v).includes(fold(query)));
}

