import {marked} from 'marked';
import {Modal,Notice,normalizePath} from './compat.js';
import {propertyDocument} from './property-data.js';

// Build link lists only on request; unchanged files reuse their extracted targets.
async function targetsFor(app,file){
 app.noteLinkCache||=new Map();const signature=file.stat.mtime+':'+file.stat.size,cached=app.noteLinkCache.get(file.path);if(cached?.signature===signature)return cached.targets;
 const raw=await app.vault.cachedRead(file);let body;try{body=propertyDocument(raw).body}catch{body=raw.replace(/^\uFEFF?---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/,'')}
 const targets=new Set();marked.walkTokens(marked.lexer(body),token=>{if(token.type==='wikilink')targets.add(token.target.split('|')[0]);else if(token.type==='link'&&!/^(?:[a-z][a-z\d+.-]*:|#)/i.test(token.href))targets.add(token.href)});
 const result=[...targets];if(app.vault.getFileByPath(file.path)===file&&signature===file.stat.mtime+':'+file.stat.size)app.noteLinkCache.set(file.path,{signature,targets:result});return result;
}
function indexedResolver(app,files){
 const paths=new Map(files.map(file=>[file.path,file])),names=new Map(),memo=new Map();
 for(const file of files)for(const key of [file.path,file.name,file.basename])if(!names.has(key.toLocaleLowerCase()))names.set(key.toLocaleLowerCase(),file);
 return(target,source)=>{
  const dir=source.split('/').slice(0,-1).join('/'),key=dir+'\0'+target;if(memo.has(key))return memo.get(key);
  let clean;try{clean=decodeURIComponent(target).split('|')[0].split('#')[0]}catch{return null}if(!clean)return null;
  for(let path of [clean,clean+'.md',normalizePath(dir+'/'+clean),normalizePath(dir+'/'+clean+'.md')]){const seen=new Set();while(!paths.has(path)&&app.plugin.noteRenames?.[path]&&!seen.has(path)){seen.add(path);path=app.plugin.noteRenames[path]}if(paths.has(path)){memo.set(key,paths.get(path));return paths.get(path)}}
  const file=names.get(clean.toLocaleLowerCase())||null;memo.set(key,file);return file;
 };
}
export class NoteConnections extends Modal{
 constructor(app,file){super(app);this.file=file}
 async onOpen(){
  this.alive=true;this.modalEl.addClass('atlas-connections-modal');this.setTitle('Conexões · '+this.file.basename);
  this.contentEl.createEl('p',{cls:'ia-muted',text:'Veja as notas conectadas por links e abra em outra aba ou ao lado.'});
  const tools=this.contentEl.createDiv({cls:'atlas-connections-tools'});this.search=tools.createEl('input',{attr:{type:'search',placeholder:'Filtrar conexões…','aria-label':'Filtrar conexões'}});this.search.oninput=()=>this.renderConnections();const refresh=tools.createEl('button',{text:'Atualizar'});refresh.onclick=()=>this.loadConnections();
  this.status=this.contentEl.createDiv({cls:'ia-muted',attr:{role:'status'}});this.list=this.contentEl.createDiv({cls:'atlas-connections-list'});await this.loadConnections();
 }
 async loadConnections(){
  const token=this.token=(this.token||0)+1;this.status.textContent='Buscando conexões…';this.incoming=[];this.outgoing=[];const files=this.app.getMainNotes(),resolve=indexedResolver(this.app,files);let next=0,failed=0,done=0;const incoming=[],outgoing=new Map();
  const existing=new Set(files.map(file=>file.path));for(const path of this.app.noteLinkCache?.keys()||[])if(!existing.has(path))this.app.noteLinkCache.delete(path);
  await Promise.all(Array.from({length:Math.min(4,files.length)},async()=>{while(next<files.length&&this.alive&&token===this.token){const file=files[next++];try{const targets=await targetsFor(this.app,file);for(const target of targets){const linked=resolve(target,file.path);if(!linked)continue;if(file===this.file&&linked!==this.file)outgoing.set(linked.path,linked);if(file!==this.file&&linked===this.file){incoming.push(file);break}}}catch{failed++}if(++done%32===0)await new Promise(resolve=>setTimeout(resolve,0))}}));
  if(!this.alive||token!==this.token)return;this.incoming=incoming.sort((a,b)=>a.basename.localeCompare(b.basename));this.outgoing=[...outgoing.values()].sort((a,b)=>a.basename.localeCompare(b.basename));this.status.textContent=`${this.incoming.length} apontam para esta nota · ${this.outgoing.length} vinculadas nesta nota${failed?' · '+failed+' arquivos não puderam ser lidos':''}`;this.renderConnections();
 }
 renderConnections(){
  if(!this.list)return;this.list.empty();const query=this.search.value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase();
  for(const [label,files]of [['Links para esta nota',this.incoming||[]],['Links nesta nota',this.outgoing||[]]]){const section=this.list.createEl('section');section.createEl('h3',{text:label});const filtered=files.filter(file=>(file.basename+' '+file.path).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase().includes(query));if(!filtered.length)section.createEl('p',{cls:'ia-muted',text:query?'Nenhuma conexão corresponde à busca.':'Nenhuma conexão por enquanto.'});for(const file of filtered.slice(0,100)){const row=section.createDiv({cls:'atlas-connection-row'}),open=row.createEl('button',{cls:'atlas-connection-link'});open.createEl('strong',{text:file.basename});const folder=this.app.displayNoteFolder(file);if(folder)open.createEl('small',{text:folder});open.onclick=async event=>{this.close();await this.app.workspace.getLeaf('tab').openFile(file).catch(error=>new Notice(error.message))};const side=row.createEl('button',{text:'Abrir ao lado'});side.onclick=async()=>{this.close();await this.app.workspace.getLeaf('split').openFile(file).catch(error=>new Notice(error.message))}}if(filtered.length>100)section.createEl('p',{cls:'ia-muted',text:'Mostrando 100 conexões. Digite para encontrar uma nota específica.'})}
 }
 onClose(){this.alive=false;this.token++}
}
