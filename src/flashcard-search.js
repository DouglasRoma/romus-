import {Modal,Notice} from './compat.js';

const fold=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase();
/** Search is a read-only, lazy index. Keystrokes never parse files or touch FSRS. */
export function installFlashcardSearch(app){
 const plugin=app.plugin,cache=new Map();let current;
 async function index(){
  const boards=app.vault.getFiles().filter(f=>f.extension==='imageboard'),notes=new Map((app.getLinkableNotes?.()||app.getMainNotes()).map(f=>[f.path,{file:f,title:app.media?.byNote(f)?.title||f.basename}]));
  const results=[],errors=[];let cursor=0;
  await Promise.all(Array.from({length:Math.min(3,boards.length)},async()=>{while(cursor<boards.length){const file=boards[cursor++];try{
   const signature=file.stat.mtime+':'+file.stat.size;let saved=cache.get(file.path);
   if(saved?.signature!==signature){const live=app.workspace.getLeavesOfType('image-atlas-board').find(leaf=>leaf.view.file?.path===file.path)?.view,board=live?.board||JSON.parse(await app.vault.read(file));const data={title:board.title||file.basename,summaryNote:board.summaryNote};saved={signature,data};cache.set(file.path,saved)}
   const {data}=saved;if(data.summaryNote){const note=app.vault.getFileByPath(data.summaryNote);if(note)notes.set(note.path,{file:note,title:'Resumo · '+data.title})}
   
  }catch{errors.push(file.basename)}}}));
  const files=[...notes.values()];cursor=0;
  await Promise.all(Array.from({length:Math.min(3,files.length)},async()=>{while(cursor<files.length){const {file,title}=files[cursor++];try{
   const signature=file.stat.mtime+':'+file.stat.size;let saved=cache.get(file.path);
   if(saved?.signature!==signature){saved={signature,cards:await plugin.readNoteFlashcards(file)};cache.set(file.path,saved)}
   if(saved.cards.length)results.push({title,count:saved.cards.length,key:fold(title),spec:{notePath:file.path}});
  }catch{errors.push(title)}}}));
  const existing=new Set(app.vault.getFiles().map(f=>f.path));for(const key of cache.keys())if(!existing.has(key))cache.delete(key);
  while(cache.size>1500)cache.delete(cache.keys().next().value);
  results.sort((a,b)=>a.title.localeCompare(b.title));return{results,errors};
 }
 // Retire the isolated-card sessions created by 0.2.9; keep their FSRS records.
 const openReviewTab=plugin.openReviewTab.bind(plugin);
 plugin.openReviewTab=(spec,snapshot,placement)=>{if(spec.searchCard){spec={...spec};delete spec.searchCard;delete spec.transferId;snapshot=null}return openReviewTab(spec,snapshot,placement)};
 class Search extends Modal{
  constructor(){super(app);this.origin=app.workspace.activeLeaf;this.popup=plugin.activeReviewPopup?.containerEl.isConnected?plugin.activeReviewPopup:null;this.summary=app.boardSummaryModal;this.items=[];this.selected=0;this.limit=40;this.setTitle('Buscar notas com flashcards');this.modalEl.classList.add('atlas-flashcard-search')}
  async onOpen(){
   this.input=this.contentEl.createEl('input',{type:'search',attr:{placeholder:'Digite o nome da nota…','aria-label':'Buscar notas com flashcards','aria-controls':'atlas-flashcard-results','aria-autocomplete':'list',role:'combobox','aria-expanded':'true'}});
   this.status=this.contentEl.createDiv({cls:'atlas-flashcard-search-status',text:'Carregando notas…',attr:{role:'status','aria-live':'polite'}});this.list=this.contentEl.createDiv({cls:'atlas-flashcard-results',attr:{id:'atlas-flashcard-results',role:'listbox','aria-label':'Notas com flashcards'}});
   this.footer=this.contentEl.createDiv({cls:'atlas-flashcard-search-footer',text:'↑ ↓ escolher · Enter estudar nota neste painel · Ctrl+Enter nova aba · Alt+Enter ao lado'});
   this.input.oninput=()=>{this.limit=40;this.selected=0;this.filter()};this.input.onkeydown=e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();if(this.filtered?.length){this.selected=Math.max(0,Math.min(this.filtered.length-1,this.selected+(e.key==='ArrowDown'?1:-1)));if(this.selected>=this.limit){this.limit+=40;this.render()}this.highlight()}}else if(e.key==='Enter'){e.preventDefault();this.choose(this.filtered?.[this.selected],e.ctrlKey||e.metaKey?'tab':e.altKey?'split':'current')}};this.input.focus();
   try{await app.flushAll();const data=await index();if(!this.containerEl.isConnected)return;this.items=data.results;this.failures=data.errors.length;this.ready=true;this.filter()}catch(error){if(this.containerEl.isConnected)this.status.textContent='Não foi possível carregar as notas: '+error.message}
  }
  filter(){if(!this.ready)return;const tokens=fold(this.input.value).split(/\s+/).filter(Boolean);this.filtered=this.items.filter(item=>tokens.every(t=>item.key.includes(t)));this.selected=Math.min(this.selected,Math.max(0,this.filtered.length-1));this.render()}
  render(){this.list.empty();this.status.textContent=`${this.filtered.length} notas encontradas · ${this.items.reduce((total,item)=>total+item.count,0)} flashcards`+(this.failures?' · '+this.failures+' fontes não puderam ser lidas':'');this.filtered.slice(0,this.limit).forEach((item,i)=>{const button=this.list.createEl('button',{cls:'atlas-flashcard-result',attr:{type:'button',role:'option',id:'atlas-search-card-'+i,'aria-selected':String(i===this.selected)}});button.createEl('strong',{text:item.title});button.createEl('small',{text:item.count+' '+(item.count===1?'flashcard':'flashcards')});button.onclick=e=>this.choose(item,e.ctrlKey||e.metaKey?'tab':e.altKey?'split':'current')});if(!this.filtered.length)this.list.createEl('p',{cls:'ia-muted',text:this.items.length?'Nenhuma nota encontrada. Tente outro nome.':'Nenhuma nota com flashcards encontrada.'});if(this.filtered.length>this.limit){const more=this.list.createEl('button',{cls:'atlas-search-more',text:'Mostrar mais resultados'});more.onclick=()=>{this.limit+=40;this.render()}}this.highlight(false)}
  highlight(scroll=true){this.list.querySelectorAll('[role=option]').forEach((el,i)=>el.setAttribute('aria-selected',String(i===this.selected)));const selected=this.list.querySelector('[aria-selected=true]');if(selected){this.input.setAttribute('aria-activedescendant',selected.id);if(scroll)selected.scrollIntoView({block:'nearest'})}else this.input.removeAttribute('aria-activedescendant')}
  async choose(item,placement){if(!item||this.opening)return;this.opening=true;this.status.textContent='Abrindo flashcards da nota…';try{
   await app.flushAll();if(placement==='current'&&this.popup?.containerEl.isConnected){this.popup.controller.mode='due';this.popup.closeLinkedStudy();this.close();await this.popup.changeDeck(item.spec);return}let origin=app.workspace.leaves.includes(this.origin)?this.origin:null;
   if(this.summary?.containerEl.isConnected&&!this.summary.docked)origin=await app.openSummaryBeside(this.summary);
   if(origin)await app.workspace.revealLeaf(origin);
   const leaf=placement==='current'&&origin?origin:app.workspace.getLeaf(placement==='split'?'split':'tab');
   this.close();if(this.popup?.containerEl.isConnected)this.popup.close();await leaf.setViewState({type:'image-atlas-flashcards',state:item.spec});
  }catch(error){this.opening=false;this.status.textContent=error.message;new Notice(error.message)}}
  onClose(){this.input?.setAttribute('aria-expanded','false');if(current===this)current=null}
 }
 app.openFlashcardSearch=()=>{if(current?.containerEl.isConnected){current.input.focus();return current}current=new Search();return current.open()};
 app.commands.push({id:'search-flashcards',name:'Buscar notas com flashcards · Ctrl+Shift+F',callback:()=>app.openFlashcardSearch()});
}
