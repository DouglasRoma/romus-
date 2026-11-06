import {MediaStore} from './media-store.js';
import {renderBoardTree} from './board-tree.js';
import {installSidebar} from './sidebar.js';
import {installBoardOrganization} from './board-organization.js';
import {installBoardDrag} from './board-drag.js';
import {installRecentNotes} from './recent-notes.js';
import {fileLabel,noteFolder} from './file-presentation.js';
import {summaryText} from './note-content.js';
import {installImages} from './image-viewer.js';
import {installWorkspacePanes} from './workspace-panes.js';
import {installFlashcardSearch} from './flashcard-search.js';
import {installOmniSearch} from './omni-search.js';
import {installStudyWorkspace} from './study-workspace.js';
import {installHoverNoteEditor} from './hover-note-editor.js';
import {installReviewInteractions} from './review-interactions.js';
import {installNewTab} from './new-tab.js';
import {installRomusUI} from './romus-ui.js';
import {installNavigation} from './navigation.js';
import {installMediaUI} from './media-ui.js';
import {installNoteCatalog} from './note-catalog.js';
import {installFolderDrag} from './folder-drag.js';
import {installFileActions} from './file-actions.js';
import {SettingsModal} from './settings.js';
import {NoteEditor} from './note-editor.js';
import {PropertiesModal} from './properties.js';
import {NotesLibrary} from './notes-library.js';
import {installBoardAppearance} from './appearance.js';
import {installDOM,Events,Component,TextFileView,Modal,SuggestModal,Menu,Notice,MarkdownRenderer,setIcon,normalizePath,rewriteFrontmatter,modalsOpen} from './compat.js';
import ImageAtlasPlugin from './engine.cjs';
installDOM();document.documentElement.dataset.theme=localStorage.getItem('atlas:theme')||'dark';
const native=window.atlasNative;
const fileObject=({path,stat})=>{const name=path.split('/').pop(),extension=name.includes('.')?name.split('.').pop().toLowerCase():'';return{path,name,extension,basename:extension?name.slice(0,-extension.length-1):name,stat}};
class Vault extends Events{
 constructor(){super();this.files=new Map();this.folders=new Set();this.locks=new Map();this.adapter={exists:async path=>!!this.getAbstractFileByPath(path),read:path=>native.call('read',path),write:(path,text)=>this.write(path,text),list:async path=>{const prefix=normalizePath(path)+'/';return{files:[...this.files.keys()].filter(p=>p.startsWith(prefix)&&!p.slice(prefix.length).includes('/')),folders:[...this.folders].filter(p=>p.startsWith(prefix)&&!p.slice(prefix.length).includes('/'))}}}}
 async init(){await this.refreshCatalog();return this}
 async refreshCatalog(){let data;try{data=await native.call('catalog')}catch{data={files:await native.call('list'),folders:[]}}const present=new Set(data.files.map(value=>value.path));for(const path of this.files.keys())if(!present.has(path))this.files.delete(path);this.folders=new Set(data.folders);for(const value of data.files)this.upsert(value);await window.atlasApp?.noteCatalog?.refresh()}
 async trash(file,metadata){const entry=await native.call('trash',file.path,metadata);for(const path of [file.path,...(entry?.attachments||[]).map(item=>item.path)]){const removed=this.files.get(path);this.files.delete(path);this.files.delete(path+'.atlas-backup');if(removed)this.trigger('delete',removed)}return entry}
 upsert(value){const old=this.files.get(value.path),f=old?Object.assign(old,fileObject(value)):fileObject(value);this.files.set(f.path,f);const parts=f.path.split('/');parts.pop();while(parts.length){this.folders.add(parts.join('/'));parts.pop()}return f}
 getFiles(){return[...this.files.values()].filter(f=>!f.name.endsWith('.atlas-backup'))}getMarkdownFiles(){return this.getFiles().filter(f=>f.extension==='md')}getFileByPath(path){return this.files.get(normalizePath(path||''))||null}
 getAbstractFileByPath(path){path=normalizePath(path);return this.getFileByPath(path)||(this.folders.has(path)?{path,children:this.getFiles().filter(f=>f.path.startsWith(path+'/'))}:null)}
 read(file){return native.call('read',file.path)}cachedRead(file){return this.read(file)}
 getResourcePath(file){return'atlas-data://library/'+file.path.split('/').map(encodeURIComponent).join('/')}
 async createFolder(path){await native.call('mkdir',path);this.folders.add(path);this.trigger('folder-create',{path})}
 async write(path,text,binary=false,create=false){const saved=await native.call('write',path,text,binary,create);const file=this.upsert(saved?.stat?saved:{path,stat:{ctime:this.files.get(path)?.stat.ctime||Date.now(),mtime:Date.now(),size:binary?text.length*.75:new TextEncoder().encode(text).length}});if(!binary){if(file.extension==='md'&&/^atlas-internal-(?:media-id|note-kind):/m.test(text))window.atlasApp?.mediaOwnedPaths?.add(file.path);window.atlasApp?.noteCatalog?.observeWrite(file,text);}this.trigger(create?'create':'modify',file);return file}
 create(path,text){return this.write(path,text,false,true)}modify(file,text){return this.write(file.path,text)}createBinary(path,buffer){let s='';for(const value of new Uint8Array(buffer))s+=String.fromCharCode(value);return this.write(path,btoa(s),true,true)}
 async process(file,fn){const operation=(this.locks.get(file.path)||Promise.resolve()).catch(()=>{}).then(async()=>{const before=await this.read(file),after=fn(before);if(typeof after!=='string')throw Error('O conteúdo da nota precisa ser texto.');if(after!==before)await this.modify(file,after)});this.locks.set(file.path,operation);try{await operation}finally{if(this.locks.get(file.path)===operation)this.locks.delete(file.path)}}
 async rename(file,path){const old=file.path;await native.call('rename',old,path);this.files.delete(old);Object.assign(file,fileObject({path,stat:{...file.stat,mtime:Date.now()}}));this.files.set(path,file);const parts=path.split('/');parts.pop();while(parts.length){this.folders.add(parts.join('/'));parts.pop()}this.trigger('rename',file,old)}
}
const app={vault:await new Vault().init(),factories:new Map(),extensions:new Map(),commands:[]};
window.atlasApp=app;app.mediaOwnedPaths=new Set();
app.mediaError=error=>new Notice(error.message);
app.propertyTypes=await native.call('property-types:read');app.info=await native.call('info');
try{app.propertyStyles=JSON.parse(await native.call('read','.atlas-property-styles.json'))}catch{app.propertyStyles={}}
try{app.preferences=JSON.parse(localStorage.getItem('atlas:preferences')||'{}')}catch{app.preferences={}}
app.preferences={noteMode:'formatted',notesFolder:'Notas',sidebarOpen:false,...app.preferences};
app.setTheme=theme=>{document.documentElement.dataset.theme=theme;localStorage.setItem('atlas:theme',theme);native.call('window:theme',theme).catch(error=>console.warn('Barra da janela:',error.message))};
app.setTheme(document.documentElement.dataset.theme);
app.toggleSidebar=value=>{const open=typeof value==='boolean'?value:document.body.classList.contains('atlas-sidebar-hidden');document.body.classList.toggle('atlas-sidebar-hidden',!open);app.preferences.sidebarOpen=open;localStorage.setItem('atlas:preferences',JSON.stringify(app.preferences));document.querySelector('.atlas-sidebar-toggle')?.setAttribute('aria-expanded',String(open))};
const sidebarToggle=document.querySelector('main').createEl('button',{cls:'atlas-sidebar-toggle',attr:{'aria-label':'Mostrar ou ocultar barra lateral',title:'Mostrar / ocultar barra lateral · Ctrl+\\'}});setIcon(sidebarToggle,'panel-left');sidebarToggle.onclick=()=>app.toggleSidebar();app.toggleSidebar(app.preferences.sidebarOpen);
app.displayFileLabel=fileLabel;app.displayNoteFolder=file=>app.media?.byNote(file)?'Biblioteca de mídia':noteFolder(app,file);app.uiButton=button;app.renderFiles=renderFiles;app.flushAll=flush;installFileActions(app);app.renameNote=renameNote;app.createNote=newNote;app.editNoteFlashcards=()=>runCommand('edit-note-flashcards');installNoteCatalog(app);installRecentNotes(app);installFolderDrag(app);installBoardOrganization(app);installBoardDrag(app);
app.metadataCache={getFirstLinkpathDest(link,source=''){
 const clean=decodeURIComponent(String(link)).replace(/^!?(?:\[\[)?/,'').replace(/\]\]$/,'').split('|')[0].split('#')[0];
 const dir=source.split('/').slice(0,-1).join('/');
 for(let path of [clean,clean+'.md',normalizePath(dir+'/'+clean),normalizePath(dir+'/'+clean+'.md')]){const seen=new Set();while(!app.vault.getFileByPath(path)&&app.plugin?.noteRenames?.[path]&&!seen.has(path)){seen.add(path);path=app.plugin.noteRenames[path]}const file=app.vault.getFileByPath(path);if(file)return file}
 return app.vault.getFiles().find(f=>f.path.toLowerCase()===clean.toLowerCase()||f.basename.toLowerCase()===clean.toLowerCase()||f.name.toLowerCase()===clean.toLowerCase())||null;
},fileToLinktext:(file)=>file.path.replace(/\.md$/i,'')};
app.fileManager={generateMarkdownLink:(file,source,subpath='',alias='')=>`[[${file.path.replace(/\.md$/i,'')}${subpath}${alias?'|'+alias:''}]]`,renameFile:(file,path)=>app.vault.rename(file,path),processFrontMatter:(file,fn)=>app.vault.process(file,text=>rewriteFrontmatter(text,fn))};
class Leaf{
 constructor(split=false){this.id=crypto.randomUUID();document.querySelector('.welcome')?.remove();this.app=app;this.containerEl=document.getElementById('workspaces').createDiv({cls:'workspace-leaf'});this.containerEl.addEventListener('pointerdown',()=>{if(this.view&&app.workspace.activeLeaf!==this)app.workspace.revealLeaf(this)},true);this.split=split;if(split&&app.workspace.activeLeaf){this.splitPartner=app.workspace.activeLeaf;this.splitPartner.splitPartner=this}this.tab=document.getElementById('tabs').createDiv({cls:'tab'});document.getElementById('romus-new-tab')?.before(this.tab);this.label=this.tab.createEl('button',{text:'Nova aba'});this.label.onclick=()=>app.workspace.revealLeaf(this);const close=this.tab.createEl('button',{text:'×',attr:{'aria-label':'Fechar aba'}});close.onclick=()=>this.close().catch(e=>new Notice(e.message));app.workspace.leaves.push(this);app.panes?.attach(this,split)}
 async setViewState(spec){await this.disposeView();const factory=app.factories.get(spec.type);if(!factory)throw Error('Tela não disponível: '+spec.type);this.view=factory(this);Component.prototype.load.call(this.view);await this.view.onOpen?.();await this.view.setState?.(spec.state||{},{});this.label.textContent=this.view.getDisplayText();await app.workspace.revealLeaf(this)}
 async openFile(file,options={}){if(options.reusePane&&this.view?.file?.path===file.path)return app.workspace.revealLeaf(this);const media=app.media?.byNote(file);if(media){await this.setViewState({type:'atlas-media-player',state:{id:media.id,summary:true}});return}if(file.extension==='pdf'&&app.mediaUI){const item=app.media.get(file.path,file.basename,true);await this.setViewState({type:'atlas-media-player',state:{id:item.id}});return}const existing=!options.reusePane&&app.workspace.leaves.find(leaf=>leaf!==this&&leaf.view?.file?.path===file.path&&(file.extension==='imageboard'||!this.split));if(existing){if(!this.view)await this.close();await app.workspace.revealLeaf(existing);return}await this.disposeView();this.file=file;const factory=app.factories.get(app.extensions.get(file.extension));this.view=factory?factory(this):new NoteEditor(this);this.view.file=file;Component.prototype.load.call(this.view);await this.view.onOpen?.();if(factory)this.view.setViewData(await app.vault.read(file),true);else if(file.extension==='md')await this.view.readFile(file);else{this.view.contentEl.empty();const img=this.view.contentEl.createEl('img',{cls:'resource-preview'});img.src=app.vault.getResourcePath(file)}this.label.textContent=file.basename;await app.workspace.revealLeaf(this);renderFiles()}
 async disposeView(){app.navigation?.capture(this);if(this.view){await this.view.onClose?.();this.view.unload();this.view=null}this.containerEl.empty()}
 async close(){if(this.splitPartner){this.splitPartner.splitPartner=null;this.splitPartner=null}await this.disposeView();this.containerEl.remove();this.tab.remove();app.workspace.leaves.splice(app.workspace.leaves.indexOf(this),1);const next=app.panes?.remove(this);if(app.workspace.activeLeaf===this){app.workspace.activeLeaf=null;const last=next||app.workspace.leaves.at(-1);if(!app.workspace.closingAll){if(last)await app.workspace.revealLeaf(last);else showWelcome()}}}
}
app.workspace=Object.assign(new Events(),{leaves:[],activeLeaf:null,getActiveFile(){return this.activeLeaf?.view?.file||this.activeLeaf?.view?.boardFile||null},getLeavesOfType(type){return this.leaves.filter(leaf=>leaf.view?.getViewType()===type).sort((a,b)=>Number(b===this.activeLeaf)-Number(a===this.activeLeaf))},getLeaf(mode){return mode==='tab'||mode==='split'||mode===true||!this.activeLeaf?new Leaf(mode==='split'):this.activeLeaf},async revealLeaf(leaf){const partner=leaf.splitPartner&&this.leaves.includes(leaf.splitPartner)?leaf.splitPartner:null;for(const other of this.leaves){other.containerEl.hidden=other!==leaf&&other!==partner;other.tab.classList.toggle('active',other===leaf)}this.activeLeaf=leaf;app.recentNotes.touch(leaf.view?.file);renderFiles();document.getElementById('workspaces').classList.toggle('is-split',!!partner);this.trigger('active-leaf-change',leaf)},async openLinkText(text,source,newLeaf){const file=app.metadataCache.getFirstLinkpathDest(text,source);if(!file){new Notice('Nota não encontrada: '+text);return}await this.getLeaf(newLeaf==='split'?'split':newLeaf?'tab':false).openFile(file)},onLayoutReady(fn){queueMicrotask(fn)}});
installWorkspacePanes(app);installNavigation(app);installHoverNoteEditor(app);
let hoverPreview,hoverComponent,hoverToken=0;
function closeHover({preserve=false}={}){hoverToken++;const component=hoverComponent;if(!preserve)hoverPreview?.remove();hoverPreview=null;hoverComponent=null;if(preserve)return()=>component?.unload();component?.unload()}
app.closeHoverPreview=closeHover;
app.workspace.on('hover-link',async({event,targetEl,linktext,sourcePath})=>{
 if(!event.ctrlKey&&!event.metaKey)return;const file=app.metadataCache.getFirstLinkpathDest(linktext,sourcePath);if(file?.extension!=='md')return;
 app.retainPreviewAncestors(targetEl);if(app.findNotePreview(targetEl,file))return;
 closeHover();const preview=hoverPreview=document.body.createDiv({cls:'ia-review-note-preview'});const width=Math.min(440,innerWidth-24);Object.assign(preview.style,{left:Math.max(12,Math.min(event.clientX+14,innerWidth-width-12))+'px',top:Math.max(12,Math.min(event.clientY+14,innerHeight-360))+'px',width:width+'px',maxHeight:'340px'});preview.createDiv({cls:'ia-review-note-preview-title',text:file.basename});const body=preview.createDiv({cls:'ia-review-note-preview-body',text:'Carregando…'});app.wireEditableNotePreview(preview,file,options=>hoverPreview===preview?closeHover(options):undefined,targetEl);app.placeNotePreview(preview,targetEl);const component=hoverComponent=new Component();
 try{const raw=await app.vault.read(file);if(!preview.isConnected||preview.dataset.editing)return;const text=summaryText(raw.replace(/^\uFEFF?---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/,''));await MarkdownRenderer.render(app,text.slice(0,24000),body,file.path,component)}catch(error){if(preview.isConnected&&!preview.dataset.editing)body.textContent=error.message}
});
let hoveredNoteLink;
document.addEventListener('pointerover',event=>{const link=event.target.closest('a.internal-link');hoveredNoteLink=link?{link,x:event.clientX,y:event.clientY}:null;if(link&&!link.closest('.ia-fsrs-view'))app.workspace.trigger('hover-link',{event,targetEl:link,linktext:link.dataset.href,sourcePath:link.closest('[data-preview-note-path]')?.dataset.previewNotePath||app.workspace.getActiveFile()?.path||''})});
window.addEventListener('keydown',event=>{if(!['Control','Meta'].includes(event.key)||event.repeat||!hoveredNoteLink?.link.isConnected||hoveredNoteLink.link.closest('.ia-fsrs-view'))return;const {link,x,y}=hoveredNoteLink;app.workspace.trigger('hover-link',{event:new MouseEvent('mouseover',{ctrlKey:event.ctrlKey,metaKey:event.metaKey,clientX:x,clientY:y}),targetEl:link,linktext:link.dataset.href,sourcePath:link.closest('[data-preview-note-path]')?.dataset.previewNotePath||app.workspace.getActiveFile()?.path||''})});
window.addEventListener('keyup',event=>{if(['Control','Meta'].includes(event.key))closeHover()});window.addEventListener('blur',closeHover);
function button(host,label,icon,action){const el=host.createEl('button',{attr:{type:'button',title:label}});const glyph=el.createSpan();setIcon(glyph,icon);el.createSpan({text:label});el.onclick=()=>Promise.resolve().then(action).catch(e=>{console.error(e);new Notice(e.message)});return el}
function runCommand(id){const command=app.commands.find(c=>c.id===id);if(!command)return;if(command.checkCallback){if(command.checkCallback(true))command.checkCallback(false);else new Notice('Abra uma nota para usar esta ação.')}else return command.callback()}
class Picker extends SuggestModal{constructor(title,items,choose){super(app);this.items=items;this.choose=choose;this.setPlaceholder(title)}getSuggestions(query){const q=query.toLocaleLowerCase();return this.items.filter(item=>(item.title+' '+(item.search||'')).toLocaleLowerCase().includes(q)).slice(0,100)}renderSuggestion(item,el){el.textContent=item.title;if(item.folder)el.createEl('small',{text:item.folder})}onChooseSuggestion(item){this.choose(item)}}
function commandPalette(){new Picker('O que deseja fazer?',app.commands.filter(c=>!c.checkCallback||c.checkCallback(true)).map(c=>({title:c.name,id:c.id})),c=>runCommand(c.id)).open()}
app.openCommandPalette=commandPalette;
function filePalette(){return app.openOmniSearch?.()}
function promptText(title,initial,save){const modal=new Modal(app);modal.setTitle(title);const input=modal.contentEl.createEl('input',{attr:{'aria-label':title},value:initial});button(modal.contentEl,'Salvar','check',async()=>{if(!input.value.trim())return;await save(input.value.trim());modal.close()});input.onkeydown=event=>{if(event.key==='Enter')modal.contentEl.querySelector('button').click()};modal.open();input.focus();input.select()}
function renameNote(file){if(!file)return;const media=app.media?.byNote(file);if(media){app.mediaUI.rename(media);return}promptText('Renomear nota',file.basename,async name=>{const folder=file.path.split('/').slice(0,-1).join('/');await app.fileManager.renameFile(file,normalizePath(folder+'/'+name.replace(/[\\/:*?"<>|]/g,' ')+'.md'));renderFiles()})}
function newNote(folder=app.preferences.notesFolder||'Notas',target){promptText('Criar nota','Nova nota',async name=>{const file=await app.vault.create((folder?folder+'/':'')+name.replace(/[\\/:*?"<>|]/g,' ')+'.md','# '+name+'\n\n');await (target&&app.workspace.leaves.includes(target)?target:app.workspace.getLeaf('tab')).openFile(file,{reusePane:!!target})})}
function renderFiles(){
 if(document.body.classList.contains('atlas-dragging-note')||document.body.classList.contains('atlas-dragging-board')){app.sidebarNeedsRender=true;return}
 const host=document.getElementById('files'),scroll=host.scrollTop,query=document.getElementById('file-search').value.toLocaleLowerCase();
 const open=new Map([...host.querySelectorAll('details')].map(el=>[el.dataset.treeKey??el.dataset.folder??el.dataset.kind,el.open]));host.empty();
 const active=app.workspace.getActiveFile()?.path,all=app.vault.getFiles().filter(f=>f.extension==='imageboard'||app.noteCatalog.isMainNote(f));
 for(const [kind,label]of [['imageboard','Quadros'],['md','Notas recentes']]){
  const files=kind==='md'?app.recentNotes.files().filter(file=>file.basename.toLocaleLowerCase().includes(query)):all.filter(file=>file.extension===kind).sort((a,b)=>a.path.localeCompare(b.path));if(!files.length&&kind!=='md')continue;
  const section=host.createEl('details',{cls:'atlas-file-section'});section.dataset.kind=kind;section.open=!!query||(open.get(kind)??true);const summary=section.createEl('summary');summary.createSpan({text:label});if(kind==='imageboard'){summary.dataset.boardRootDrop='true';summary.title='Solte um subwhiteboard aqui para movê-lo para os quadros principais'}const group=section.createDiv({cls:'atlas-file-group'});
  const createRow=(file,target,parent='')=>{
   const el=target.createEl('button',{cls:'library-file',attr:{title:fileLabel(file),'aria-current':String(file.path===active?'page':'false')}});el.dataset.path=file.path;if(kind==='imageboard')app.bindBoardDrag(el,file,parent);const icon=el.createSpan();setIcon(icon,file.extension==='imageboard'?'panels-top-left':'file-text');el.createSpan({text:file.basename});el.onclick=()=>app.workspace.getLeaf('tab').openFile(file).catch(e=>new Notice(e.message));
   el.oncontextmenu=event=>{event.preventDefault();if(file.extension==='md'){app.showNoteMenu(file,event);return}const menu=new Menu();menu.addItem(i=>i.setTitle('Abrir whiteboard').onClick(()=>app.workspace.getLeaf('tab').openFile(file)));menu.addItem(i=>i.setTitle('Mover whiteboard…').onClick(()=>app.pickBoardParent(file,parent)));menu.addSeparator();menu.addItem(i=>i.setTitle('Excluir quadro').onClick(()=>app.deleteFile(file)));menu.showAtMouseEvent(event)};
  };
  if(kind==='imageboard')renderBoardTree(app,group,files,{query,open,active,createRow});
  else{for(const file of files)createRow(file,group);if(!files.length)group.createDiv({cls:'atlas-recents-empty',text:query?'Nenhuma nota recente encontrada.':'As notas que você abrir aparecerão aqui.'});const more=group.createEl('button',{cls:'atlas-recents-library',text:'Ver todas as notas',attr:{type:'button'}});more.onclick=openNotesLibrary}
 }
 host.scrollTop=scroll;const overview=document.querySelector('.atlas-library-overview');if(overview)overview.textContent=`${all.filter(f=>f.extension==='md').length} notas · ${all.filter(f=>f.extension==='imageboard').length} quadros`;
 for(const el of document.querySelectorAll('#primary-actions [data-sidebar-view]'))el.setAttribute('aria-current',app.workspace.activeLeaf?.view?.getViewType()===el.dataset.sidebarView?'page':'false');
}
function showWelcome(){const host=document.getElementById('workspaces');if(app.workspace.leaves.length)return;app.navigation?.visit(null);host.querySelector('.welcome')?.remove();const welcome=host.createDiv({cls:'welcome'});const symbol=welcome.createDiv({cls:'welcome-symbol'});symbol.createEl('img',{cls:'romus-logo-on-dark',attr:{src:'assets/brand/romus-horizontal.svg',alt:'ROMUS'}});symbol.createEl('img',{cls:'romus-logo-on-light',attr:{src:'assets/brand/romus-horizontal-dark.svg',alt:'ROMUS'}});welcome.createEl('h1',{text:'Conhecimento que ganha conexões.'});welcome.createEl('p',{text:'Organize ideias em mapas visuais, conecte suas notas e transforme o que aprendeu em memória.'});const actions=welcome.createDiv({cls:'welcome-actions'});button(actions,'Criar meu primeiro whiteboard','plus',()=>plugin.newBoard());button(actions,'Importar biblioteca do Obsidian','folder-open',importLibrary);button(actions,'Explorar exemplo','sparkles',()=>createDemo());welcome.createEl('small',{text:'Seus arquivos ficam neste computador. Sem conta, sem envio automático para a nuvem.'})}
async function flush(){for(const editor of app.embeddedEditors||[])await editor.save();for(const leaf of app.workspace.leaves){leaf.view?.flushCameraFrame?.();await leaf.view?.save?.()}await Promise.all([...(plugin.visualWrites?.values()||[]),...(plugin.indexWrites?.values()||[])]);await plugin.noteRenameWrite;await plugin.reviewStore?.flush();await Promise.all([...app.vault.locks.values()]);await app.media?.flush()}
async function importLibrary(){await flush();if(await native.call('import'))location.reload()}
installSidebar(app,{newBoard:()=>plugin.newBoard(),newNote,notes:openNotesLibrary,media:openMediaLibrary,reviews:()=>runCommand('review-today-fsrs'),maps:()=>runCommand('search-whiteboards'),search:filePalette,commands:commandPalette,settings:()=>new SettingsModal(app).open(),trash:()=>app.openTrash(),import:importLibrary,export:async()=>{await flush();const target=await native.call('export');if(target)new Notice('Cópia exportada para '+target)},theme:()=>app.setTheme(document.documentElement.dataset.theme==='light'?'dark':'light')});
const plugin=new ImageAtlasPlugin(app);window.atlasPlugin=plugin;app.plugin=plugin;await plugin.load();installReviewInteractions(app);installRomusUI(app);installNewTab(app,{createNote:leaf=>newNote(app.preferences.notesFolder||'Notas',leaf)});await app.noteCatalog.refresh();installBoardAppearance(app);installStudyWorkspace(app);installFlashcardSearch(app);app.factories.set('atlas-notes-library',leaf=>new NotesLibrary(leaf));app.media=await new MediaStore(app).init();installMediaUI(app);installOmniSearch(app);app.refreshMediaBoards=mediaId=>{for(const leaf of app.workspace.getLeavesOfType('image-atlas-board'))if(!mediaId||leaf.view.board.nodes.some(node=>node.mediaId===mediaId))leaf.view.render()};app.vault.on('rename',(file,old)=>{for(const item of app.media.items.values()){if(item.notePath===old){app.media.noteOwners.delete(old);item.notePath=file.path;app.media.own(item);app.mediaOwnedPaths.delete(old);app.mediaOwnedPaths.add(file.path);app.media.touch()}if(item.local&&item.source===old){app.media.byKey.delete(item.key);item.source=file.path;item.key='pdf:'+file.path;app.media.byKey.set(item.key,item);app.media.touch()}for(const ref of item.refs)if(ref.boardPath===old){ref.boardPath=file.path;app.media.touch()}}});
installImages(app);app.openMediaLibrary=openMediaLibrary;app.closeAllNotes=async()=>{await flush();const notes=app.workspace.leaves.filter(leaf=>['markdown','atlas-media-player'].includes(leaf.view?.getViewType()));for(const leaf of notes)await leaf.close();new Notice(notes.length?notes.length+' notas fechadas.':'Nenhuma nota aberta.')};app.commands.push({id:'close-all-notes',name:'Fechar todas as notas',callback:()=>app.closeAllNotes()});
app.closeAllTabs=()=>{
 if(app.closingTabs)return app.closingTabs;
 app.closingTabs=(async()=>{
  await flush();
  if(app.boardSummaryModal&&!await app.boardSummaryModal.close())return;
  const tabs=[...app.workspace.leaves];app.workspace.closingAll=true;
  try{for(const leaf of tabs.reverse())await leaf.close()}
  finally{app.workspace.closingAll=false;if(!app.workspace.activeLeaf){const last=app.workspace.leaves.at(-1);if(last)await app.workspace.revealLeaf(last);else{document.getElementById('workspaces').classList.remove('is-split');showWelcome()}}}
  rememberWorkspace();new Notice(tabs.length?tabs.length+' abas fechadas.':'Nenhuma aba aberta.');
 })().finally(()=>{app.closingTabs=null});return app.closingTabs;
};
app.commands.push({id:'close-all-tabs',name:'Fechar todas as abas',callback:()=>app.closeAllTabs()});
app.vault.on('create',renderFiles);app.vault.on('delete',renderFiles);app.vault.on('folder-create',renderFiles);app.vault.on('rename',renderFiles);document.getElementById('file-search').oninput=renderFiles;
document.addEventListener('keydown',event=>{if(event.defaultPrevented||!(event.ctrlKey||event.metaKey))return;if(event.shiftKey&&!event.altKey&&event.key.toLowerCase()==='f'&&(!modalsOpen()||app.boardSummaryModal||app.plugin.activeReviewPopup?.containerEl.isConnected)){event.preventDefault();app.openFlashcardSearch();return}if(modalsOpen()){if(event.key.toLowerCase()==='p'&&app.boardSummaryModal){event.preventDefault();commandPalette()}else if(event.key.toLowerCase()==='o'&&app.boardSummaryModal&&!event.shiftKey){event.preventDefault();filePalette()}return;}const key=event.key.toLowerCase();if(key==='\\'){event.preventDefault();app.toggleSidebar()}else if(key==='p'){event.preventDefault();commandPalette()}else if(key==='o'){event.preventDefault();if(event.shiftKey)runCommand('search-whiteboards');else filePalette()}else if(key==='s'){event.preventDefault();flush().then(()=>new Notice('Alterações salvas.')).catch(e=>new Notice(e.message))}});
window.addEventListener('unhandledrejection',event=>{console.error(event.reason);new Notice(event.reason?.message||String(event.reason))});
native.onClosing(async()=>{try{await flush();rememberWorkspace();plugin.unload();native.readyToClose()}catch(error){new Notice('O aplicativo permaneceu aberto para proteger alterações pendentes: '+error.message)}});
renderFiles();app.restoringWorkspace=true;try{await restoreWorkspace()}finally{app.restoringWorkspace=false}app.recentNotes.touch(app.workspace.getActiveFile());app.navigation.visit(app.workspace.activeLeaf);renderFiles();showWelcome();

async function createDemo(){
 const path='Image Atlas/Boas-vindas.imageboard';let file=app.vault.getFileByPath(path);
 if(!file){
  const notePath='Image Atlas/Exemplo/Estudo conectado.md';if(!app.vault.getFileByPath(notePath))await app.vault.create(notePath,'# Estudo conectado\n\nUma nota reúne seu resumo e seus flashcards. Ela pode aparecer em vários quadros com o mesmo histórico.\n\nComo estudar apenas as notas de um quadro? == Use **Estudar todos os flashcards** e escolha um tema.\nComo preservar uma cópia da biblioteca? == Use **Exportar cópia** na barra lateral.\n');
  const node=(id,title,x,y,parentId='',body='')=>({id,type:'mind',title,body,x,y,w:260,h:150,mapId:'atlas-intro',parentId,color:'#a78bfa',flashcards:[]});
  const board={version:1,title:'Boas-vindas ao ROMUS',indexPath:'',camera:{x:55,y:80,z:.8},edges:[],nodes:[node('atlas-intro','Conhecimento conectado',20,160,'','Seu espaço de estudo visual.'),node('ideas','Mapeie suas ideias',410,35,'atlas-intro','Tab cria um filho. Renomeie, mova e recolha os ramos.'),node('review','Estude com o FSRS',410,300,'atlas-intro','Cada nota tem seu próprio histórico. O quadro reúne os temas para revisar.'),{id:'summary',type:'note',title:'Estudo conectado',path:notePath,x:810,y:100,w:360,h:280}]};
  file=await app.vault.create(path,JSON.stringify(board,null,2));
 }
 await app.workspace.getLeaf('tab').openFile(file);
}

async function openMediaLibrary(){const current=app.workspace.getLeavesOfType('atlas-media-library')[0];if(current)return app.workspace.revealLeaf(current);await app.workspace.getLeaf('tab').setViewState({type:'atlas-media-library',state:{}})}

async function openNotesLibrary(){
 const current=app.workspace.getLeavesOfType('atlas-notes-library')[0];if(current)return app.workspace.revealLeaf(current);
 await app.workspace.getLeaf('tab').setViewState({type:'atlas-notes-library',state:{},active:true});
}

function rememberWorkspace(){
 app.navigation?.capture();
 const tabs=app.workspace.leaves.map(leaf=>({path:leaf.view?.file?.path,type:leaf.view?.getViewType(),state:leaf.view?.getState?.(),review:leaf.view?.sessionSnapshot?.(),partner:app.workspace.leaves.indexOf(leaf.splitPartner),cursor:leaf.view?.input?.selectionStart,end:leaf.view?.input?.selectionEnd,scroll:leaf.view?.input?.scrollTop,focused:leaf.view?.input===document.activeElement}));
 localStorage.setItem('atlas:workspace:'+app.info.library,JSON.stringify({tabs,layout:app.panes.serialize(),active:app.workspace.leaves.indexOf(app.workspace.activeLeaf)}));
}
async function restoreWorkspace(){
 let saved;try{saved=JSON.parse(localStorage.getItem('atlas:workspace:'+app.info.library)||'null')}catch{return}
 if(!saved?.tabs?.length)return;const restored=[];
 for(const entry of saved.tabs){
  try{
   let leaf;
   if(entry.type==='atlas-board-summary'||entry.type==='atlas-flashcard-editor'){leaf=app.workspace.getLeaf('tab');await leaf.setViewState({type:entry.type,state:entry.state||{}})}
   else if(entry.path){const file=app.vault.getFileByPath(entry.path);if(!file)continue;leaf=app.workspace.getLeaf('tab');await leaf.openFile(file);if(entry.state?.mode&&leaf.view.setEditorMode)await leaf.view.setEditorMode(entry.state.mode);if(entry.state?.showStudy&&leaf.view.toggleStudyContent)await leaf.view.toggleStudyContent()}
   else if(entry.type==='atlas-notes-library'){leaf=app.workspace.getLeaf('tab');await leaf.setViewState({type:entry.type,state:entry.state||{}})}
   else if(['atlas-media-library','atlas-media-player'].includes(entry.type)){leaf=app.workspace.getLeaf('tab');await leaf.setViewState({type:entry.type,state:entry.state||{}})}
   else if(entry.type==='image-atlas-flashcards'){leaf=await plugin.openReviewTab(entry.state,entry.review)}
   if(!leaf)continue;
   if(leaf.view.input&&typeof entry.cursor==='number'){leaf.view.input.setSelectionRange(entry.cursor,entry.end??entry.cursor);leaf.view.input.scrollTop=entry.scroll||0}
   restored.push({leaf,entry});
  }catch(error){new Notice('Não foi possível reabrir uma aba: '+error.message)}
 }
 if(saved.layout)app.panes.restore(saved.layout,saved.tabs.map(entry=>restored.find(item=>item.entry===entry)?.leaf));
 for(const {leaf,entry}of restored){const partner=restored.find(item=>item.entry===saved.tabs[entry.partner]);if(partner)leaf.splitPartner=partner.leaf}
 const current=restored[Math.min(saved.active,restored.length-1)];if(current){await app.workspace.revealLeaf(current.leaf);if(current.entry.focused&&current.leaf.view.input){current.leaf.view.input.focus({preventScroll:true});current.leaf.view.input.dispatchEvent(new Event('click'))}}
}
let updatePending,updateTimer,lastTyping=0;
window.addEventListener('input',()=>{lastTyping=Date.now()},true);
async function applyDevelopmentUpdate(){
 clearTimeout(updateTimer);if(!updatePending)return;
 if(modalsOpen())return;
 if(document.body.classList.contains('atlas-dragging-note')||document.body.classList.contains('atlas-dragging-board')){updateTimer=setTimeout(applyDevelopmentUpdate,350);return}
 if(Date.now()-lastTyping<1000){updateTimer=setTimeout(applyDevelopmentUpdate,1000);return}
 try{await flush();rememberWorkspace();const kind=updatePending;updatePending=null;if(kind==='backend')native.restartDevelopment();else location.reload()}
 catch(error){new Notice('Atualização aguardando salvar: '+error.message)}
}
native.onUpdate?.((_,kind)=>{if(kind==='styles'){for(const link of document.querySelectorAll('link[rel=stylesheet]')){const url=new URL(link.href);url.searchParams.set('v',Date.now());link.href=url.href}return}updatePending=kind==='backend'?'backend':updatePending||'renderer';if(modalsOpen())new Notice('Atualização pronta. Será aplicada quando você fechar esta janela de edição.');else updateTimer=setTimeout(applyDevelopmentUpdate,350)});
window.addEventListener('atlas:modal-closed',()=>{if(updatePending)updateTimer=setTimeout(applyDevelopmentUpdate,350)});
