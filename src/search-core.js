import MiniSearch from 'minisearch';
import {propertyDocument,publicProperties} from './property-data.js';
import {splitNoteContent} from './note-content.js';

export const fold=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase();
export const plain=value=>String(value??'').replace(/<!--[^]*?-->/g,' ').replace(/!?\[\[([^\]\n]+)\]\]/g,(_,v)=>v.includes('|')?v.split('|').slice(1).join('|'):v.split('/').pop().replace(/\.md$/i,'')).replace(/!?\[([^\]]*)\]\([^)]*\)/g,'$1').replace(/<\/?[a-z][^>]*>/gi,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/[#*_`~]/g,'').replace(/\s+/g,' ').trim();
const strings=value=>Array.isArray(value)?value.flatMap(strings):value&&typeof value==='object'?Object.values(value).flatMap(strings):value==null?[]:[String(value)];
export function searchDocument(meta,raw=''){
 let text='',headings='',aliases='',tags='';
 if(meta.kind==='board'){
  const board=JSON.parse(raw||'{}');text=plain([board.summary||'',...(board.nodes||[]).filter(n=>!n.deleted).flatMap(n=>[n.title,n.body])].join('\n'));headings=(board.nodes||[]).filter(n=>!n.deleted).map(n=>n.title||'').join(' ');
 }else if(meta.kind==='note'){
  let body=raw,props={};try{({body,props}=propertyDocument(raw))}catch{body=raw.replace(/^\uFEFF?---\r?\n[^]*?\r?\n---(?:\r?\n|$)/,'')}
  const parts=splitNoteContent(body),extra=props['atlas-internal-page']||{},study=parts.managed.filter(block=>block.includes('image-atlas-flashcards:start')).join('\n');
  headings=[...parts.text.matchAll(/^#{1,6}\s+(.+)$/gm)].map(m=>plain(m[1])).join(' ');aliases=strings(props.aliases||props.alias).join(' ');tags=strings(props.tags||props.etiquetas).join(' ');
  const properties=strings(publicProperties(props)).join(' '),cases=(extra.cases||[]).flatMap(c=>[c.title,c.body]),quizzes=(extra.quizzes||[]).flatMap(q=>[q.title,q.question,...q.choices||[],q.explanation]);
  text=plain([parts.text,study,properties,...cases,...quizzes,...(extra.resources||[]).map(r=>r.title)].join('\n'));
 }
 return{...meta,id:meta.path,text,headings,aliases,tags};
}
export function parseSearchQuery(query){
 const terms=[],phrases=[],exclude=[],paths=[],tags=[],types=[];const pattern=/(-?)(?:(path|tag|type):)?("[^"]*(?:"|$)|\S+)/gi;let match;
 while((match=pattern.exec(query))){const [,negative,field,raw]=match,quoted=raw.startsWith('"'),value=fold(quoted?raw.slice(1,raw.endsWith('"')?-1:undefined):raw);if(!value)continue;if(field){({path:paths,tag:tags,type:types}[field.toLowerCase()]).push(value.replace(/^\./,''));continue}if(/^\.[a-z0-9]+$/i.test(value)){types.push(value.slice(1));continue}if(negative){exclude.push(value);continue}terms.push(value);if(quoted)phrases.push(value)}
 return{terms,phrases,exclude,paths,tags,types};
}
const words=text=>fold(text).match(/[\p{L}\p{N}]+/gu)||[];
export class SearchIndex{
 constructor(){this.docs=new Map();this.readyCount=0;this.textCache=new Map();this.cacheChars=0;this.revision=0;this.engine=new MiniSearch({fields:['title','aliases','headings','text'],idField:'path',tokenize:words,processTerm:term=>term,searchOptions:{boost:{title:12,aliases:8,headings:4,text:1},combineWith:'AND',prefix:true,fuzzy:term=>term.length>=5?.2:false}})}
 forgetText(path){const cached=this.textCache.get(path);if(cached){this.cacheChars-=cached.length;this.textCache.delete(path)}}
 normalized(doc){let text=this.textCache.get(doc.path);if(text!==undefined){this.textCache.delete(doc.path);this.textCache.set(doc.path,text);return text}text=fold(doc.text);if(text.length<=8_000_000){this.textCache.set(doc.path,text);this.cacheChars+=text.length;while(this.cacheChars>8_000_000)this.forgetText(this.textCache.keys().next().value)}return text}
 put(doc){this.revision++;this.forgetText(doc.path);if(this.docs.has(doc.path)){if(!this.docs.get(doc.path).pending)this.readyCount--;this.engine.discard(doc.path)}this.docs.set(doc.path,doc);if(!doc.pending)this.readyCount++;this.engine.add(doc)}
 remove(path){if(this.docs.has(path)){this.revision++;this.forgetText(path);if(!this.docs.get(path).pending)this.readyCount--;this.engine.discard(path);this.docs.delete(path)}}
 *iterateSearch(query,limit=60){
  const parsed=parseSearchQuery(query),options=parsed.terms.join(' ');let results=options?this.engine.search(options):[...this.docs.values()].sort((a,b)=>b.mtime-a.mtime).map(doc=>({id:doc.path,score:0,terms:[]}));
  const found=[];let total=0;for(const result of results){yield;const doc=this.docs.get(result.id);if(!doc)continue;if(parsed.paths.some(p=>!fold(doc.path).includes(p))||parsed.tags.some(p=>!words(doc.tags).includes(p))||parsed.types.length&&!parsed.types.includes(doc.ext))continue;const all=parsed.phrases.length||parsed.exclude.length?fold(doc.title+' '+doc.aliases)+' '+this.normalized(doc):'';if(parsed.phrases.some(p=>!all.includes(p))||parsed.exclude.some(p=>all.includes(p)))continue;total++;if(found.length>=limit)continue;
   const terms=(Object.keys(result.match||{}).length?Object.keys(result.match):parsed.terms.flatMap(words)).slice(0,16),body=doc.text,normalized=this.normalized(doc);let at=-1;for(const term of terms){const index=normalized.indexOf(term);if(index>=0&&(at<0||index<at))at=index}const start=Math.max(0,at-65),excerpt=(start?'…':'')+body.slice(start,start+250)+(body.length>start+250?'…':'');found.push({path:doc.path,title:doc.title,kind:doc.kind,ext:doc.ext,score:result.score,excerpt,terms,pending:!!doc.pending});
  }
  return{total,items:found};
 }
 search(query,limit=60){const iterator=this.iterateSearch(query,limit);let step;do{step=iterator.next()}while(!step.done);return step.value}
 async searchAsync(query,limit=60,cancelled=()=>false){const iterator=this.iterateSearch(query,limit);let start=performance.now(),step;while(!(step=iterator.next()).done){if(cancelled())return{cancelled:true};if(performance.now()-start>4){await new Promise(resolve=>setTimeout(resolve,0));if(cancelled())return{cancelled:true};start=performance.now()}}return cancelled()?{cancelled:true}:step.value}
}
