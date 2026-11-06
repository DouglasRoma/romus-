import {ItemView,Modal,Notice,setIcon} from './compat.js';
import {fileLabel} from './file-presentation.js';
export function installNewTab(app,{createNote}){
 class NewTab extends ItemView{
  getViewType(){return'romus-new-tab'}getDisplayText(){return'Nova aba'}
  onOpen(){
   this.contentEl.addClass('romus-new-tab-page');const page=this.contentEl.createDiv({cls:'romus-new-tab-content'});page.createSpan({cls:'romus-page-kicker',text:'SEU ESPAÇO DE CONHECIMENTO'});page.createEl('h1',{text:'O que vamos abrir?'});
   const search=page.createDiv({cls:'romus-tab-search'});setIcon(search.createSpan(),'search');this.input=search.createEl('input',{attr:{type:'search',placeholder:'Buscar uma nota ou whiteboard…','aria-label':'Buscar para abrir nesta aba'}});
   const actions=page.createDiv({cls:'romus-new-tab-actions'});app.uiButton(actions,'Nova nota','file-plus',()=>createNote(this.leaf));app.uiButton(actions,'Novo whiteboard','panels-top-left',()=>this.createBoard());
   const filters=page.createDiv({cls:'romus-page-tabs',attr:{role:'tablist','aria-label':'Tipo de conteúdo'}});this.filters=[];this.mode='all';for(const [id,label]of [['all','Tudo'],['md','Notas'],['imageboard','Whiteboards']]){const button=filters.createEl('button',{text:label,attr:{role:'tab','aria-selected':String(id==='all')}});button.onclick=()=>{this.mode=id;this.filters.forEach(([key,b])=>b.setAttribute('aria-selected',String(key===id)));this.render()};this.filters.push([id,button])}
   this.results=page.createDiv({cls:'romus-tab-results'});this.input.oninput=()=>this.render();this.input.onkeydown=event=>{const buttons=[...this.results.querySelectorAll('button')];if(event.key==='Enter'&&buttons.length){event.preventDefault();buttons[Math.max(0,this.index||0)].click()}else if(['ArrowUp','ArrowDown'].includes(event.key)&&buttons.length){event.preventDefault();this.index=((this.index??-1)+(event.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length;buttons.forEach((b,i)=>b.classList.toggle('is-highlighted',i===this.index));buttons[this.index].scrollIntoView({block:'nearest'})}};this.render();requestAnimationFrame(()=>this.input.focus({preventScroll:true}));
   this.registerEvent(app.vault.on('delete',()=>this.render()));this.registerEvent(app.vault.on('rename',()=>this.render()));
  }
  render(){const fold=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase(),query=fold(this.input.value);this.results.empty();this.index=-1;
   const files=app.vault.getFiles().filter(f=>(f.extension==='imageboard'||app.noteCatalog.isMainNote(f))&&(this.mode==='all'||f.extension===this.mode)&&fold(fileLabel(f)).includes(query)).sort((a,b)=>b.stat.mtime-a.stat.mtime).slice(0,60);
   if(!files.length)this.results.createEl('p',{cls:'ia-muted',text:'Nenhum resultado. Crie uma nota ou um whiteboard para começar.'});
   for(const file of files){const row=this.results.createEl('button',{cls:'romus-tab-result',attr:{'aria-label':'Abrir '+fileLabel(file)}});setIcon(row.createSpan(),file.extension==='md'?'file-text':'panels-top-left');row.createSpan({text:fileLabel(file)});row.createEl('small',{text:file.extension==='md'?'Nota':'Whiteboard'});row.onclick=()=>this.leaf.openFile(file,{reusePane:true}).catch(e=>new Notice(e.message))}
  }
  createBoard(){const modal=new Modal(app);modal.setTitle('Novo whiteboard');const input=modal.contentEl.createEl('input',{value:'Novo whiteboard',attr:{'aria-label':'Nome do whiteboard'}});const button=app.uiButton(modal.contentEl,'Criar whiteboard','plus',async()=>{const title=input.value.trim();if(!title)return;button.disabled=true;try{const file=await app.plugin.createBoardFile(title);await this.leaf.openFile(file,{reusePane:true});modal.close()}finally{button.disabled=false}});button.classList.add('mod-cta');input.onkeydown=e=>{if(e.key==='Enter')button.click()};modal.open();input.focus();input.select()}
 }
 app.factories.set('romus-new-tab',leaf=>new NewTab(leaf));app.openNewTab=async anchor=>{try{if(anchor&&app.workspace.leaves.includes(anchor))await app.workspace.revealLeaf(anchor);return await app.workspace.getLeaf('tab').setViewState({type:'romus-new-tab'})}catch(e){new Notice(e.message)}};
 app.commands.push({id:'romus-new-tab',name:'Nova aba: abrir nota ou whiteboard',callback:()=>app.openNewTab()});
}
