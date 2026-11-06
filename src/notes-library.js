import {marked} from 'marked';
import DOMPurify from 'dompurify';
import {summaryText} from './note-content.js';
import {ItemView,Notice,setIcon} from './compat.js';
import {propertyDocument,publicProperties,PropertiesModal,valueMatches} from './properties.js';
import {colorChip} from './property-colors.js';
const fold=value=>String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase();
const snippet=(text,limit=380)=>{const element=document.createElement('div'),summary=summaryText(text).replace(/!\[\[[^\]\n]+\]\]/g,'');element.innerHTML=DOMPurify.sanitize(marked.parse(summary),{FORBID_TAGS:['img','script','style','iframe']});for(const heading of element.querySelectorAll('h1'))heading.remove();return element.textContent.replace(/\u00a0/g,' ').replace(/(?:&nbsp;|&#160;)/gi,' ').replace(/\n[ \t]*\n(?:[ \t]*\n)+/g,'\n\n').trim().slice(0,limit)};


export class NotesLibrary extends ItemView{
  getViewType(){return'atlas-notes-library'}getDisplayText(){return'Biblioteca de notas'}
  getState(){return this.search?{query:this.search.value,sort:this.sort.value,list:this.grid.classList.contains('is-list'),filters:this.filters.map(filter=>({property:filter.property.value,operator:filter.operator.value,value:filter.value.value}))}:{}}
  async setState(state={}){if(!this.search)return;this.search.value=state.query||'';this.sort.value=state.sort||'updated';this.setLayout(Boolean(state.list));for(const saved of state.filters||[]){this.addFilter();const filter=this.filters.at(-1);filter.property.value=saved.property;filter.operator.value=saved.operator;filter.value.value=saved.value;filter.value.hidden=['exists','missing'].includes(saved.operator)}this.renderCards()}
  async onOpen(){
    this.alive=true;this.filters=[];this.items=[];this.limit=60;this.contentEl.addClass('atlas-notes-library');
    const header=this.contentEl.createDiv({cls:'atlas-library-header'});const title=header.createDiv();title.createEl('h1',{text:'Biblioteca de notas'});
    const create=header.createEl('button',{text:'+ Nova nota',cls:'mod-cta'});create.onclick=()=>this.app.createNote();
    const toolbar=this.contentEl.createDiv({cls:'atlas-library-toolbar'});
    this.search=toolbar.createEl('input',{attr:{type:'search',placeholder:'Buscar nas suas notas…','aria-label':'Buscar na biblioteca de notas'}});this.search.oninput=()=>{this.limit=60;this.renderCards()};
    this.sort=toolbar.createEl('select',{attr:{'aria-label':'Ordenar notas'}});
    for(const [value,label]of [['updated','Atualizadas recentemente'],['title','Título A–Z'],['created','Primeiras criadas']])this.sort.createEl('option',{text:label,attr:{value}});
    this.sort.onchange=()=>this.renderCards();
    const filter=toolbar.createEl('button',{text:'+ Filtro por propriedade'});filter.onclick=()=>this.addFilter();
    const views=toolbar.createDiv({cls:'atlas-view-switch'});this.gridButton=views.createEl('button',{text:'Cartões',attr:{'aria-pressed':'true'}});this.listButton=views.createEl('button',{text:'Lista',attr:{'aria-pressed':'false'}});
    this.gridButton.onclick=()=>this.setLayout(false);this.listButton.onclick=()=>this.setLayout(true);
    this.filterHost=this.contentEl.createDiv({cls:'atlas-property-filters'});
    this.status=this.contentEl.createDiv({cls:'atlas-library-count',attr:{role:'status','aria-live':'polite'}});
    this.grid=this.contentEl.createDiv({cls:'atlas-notes-grid'});
    this.more=this.contentEl.createEl('button',{text:'Mostrar mais notas',cls:'atlas-load-more'});this.more.hidden=true;this.more.onclick=()=>{this.limit+=60;this.renderCards()};
    this.app.noteMetadataCache ||= new Map();
    const refresh=file=>{if(file.extension!=='md')return;this.app.noteMetadataCache.delete(file.path);clearTimeout(this.refreshTimer);this.refreshTimer=setTimeout(()=>this.loadNotes(),180)};
    this.registerEvent(this.app.vault.on('modify',refresh));this.registerEvent(this.app.vault.on('create',refresh));this.registerEvent(this.app.vault.on('delete',refresh));this.registerEvent(this.app.vault.on('rename',(file,old)=>{this.app.noteMetadataCache.delete(old);refresh(file)}));
    this.registerEvent(this.app.vault.on('note-catalog-changed',()=>{clearTimeout(this.refreshTimer);this.refreshTimer=setTimeout(()=>this.loadNotes(),100)}));
    await this.loadNotes();
  }
  setLayout(list){this.grid.classList.toggle('is-list',list);this.gridButton.setAttribute('aria-pressed',String(!list));this.listButton.setAttribute('aria-pressed',String(list))}
  async loadNotes(){
    const token=this.loadToken=(this.loadToken||0)+1,files=this.app.getMainNotes(),items=new Array(files.length);let next=0,done=0;
    this.status.textContent='Organizando suas notas…';
    await Promise.all(Array.from({length:Math.min(4,files.length)},async()=>{
      while(next<files.length&&this.alive&&token===this.loadToken){
        const i=next++,file=files[i],cached=this.app.noteMetadataCache.get(file.path);
        if(cached&&cached.mtime===file.stat.mtime&&cached.size===file.stat.size)items[i]={...cached,file};
        else{
          try{const text=await this.app.vault.read(file),data=propertyDocument(text),content=snippet(data.body,8000);items[i]={file,props:publicProperties(data.props),snippet:content.slice(0,380),key:fold(file.basename+' '+content),mtime:file.stat.mtime,size:file.stat.size};this.app.noteMetadataCache.set(file.path,items[i])}
          catch(error){items[i]={file,props:{},snippet:'Não foi possível ler as propriedades. Abra a nota para conferir.',key:fold(file.path),error:error.message}}
        }
        done++;if(done%16===0){if(this.alive&&token===this.loadToken)this.status.textContent=`Organizando ${done} de ${files.length} notas…`;await new Promise(resolve=>requestAnimationFrame(resolve))}
      }
    }));
    if(!this.alive||token!==this.loadToken)return;
    this.items=items.filter(Boolean);this.keys=[...new Set(this.items.flatMap(item=>Object.keys(item.props)))].sort((a,b)=>a.localeCompare(b));
    for(const filter of this.filters)this.updateFilterOptions(filter);
    this.renderCards();
  }
  updateFilterOptions(filter){
    const selected=filter.property.value;filter.property.empty();filter.property.createEl('option',{text:'Escolha uma propriedade',attr:{value:''}});
    filter.property.createEl('option',{text:'Pasta',attr:{value:'$folder'}});
    for(const name of this.keys||[])filter.property.createEl('option',{text:name,attr:{value:name}});
    if(selected&&!this.keys.includes(selected)&&selected!=='$folder')filter.property.createEl('option',{text:selected,attr:{value:selected}});
    filter.property.value=selected;
  }
  addFilter(){
    const filter={el:this.filterHost.createDiv({cls:'atlas-property-filter'})};
    filter.property=filter.el.createEl('select',{attr:{'aria-label':'Propriedade para filtrar'}});this.updateFilterOptions(filter);
    filter.operator=filter.el.createEl('select',{attr:{'aria-label':'Condição do filtro'}});
    for(const [value,label]of [['contains','contém'],['equals','é igual a'],['not','é diferente de'],['exists','tem valor'],['missing','está vazia'],['greater','é maior / depois de'],['less','é menor / antes de']])filter.operator.createEl('option',{text:label,attr:{value}});
    filter.value=filter.el.createEl('input',{attr:{'aria-label':'Valor do filtro',placeholder:'Valor da propriedade'}});
    const update=()=>{filter.value.hidden=['exists','missing'].includes(filter.operator.value);this.limit=60;this.renderCards()};filter.property.onchange=filter.operator.onchange=update;filter.value.oninput=update;
    const remove=filter.el.createEl('button',{text:'×',attr:{'aria-label':'Remover filtro'}});remove.onclick=()=>{this.filters.splice(this.filters.indexOf(filter),1);filter.el.remove();this.renderCards()};
    this.filters.push(filter);filter.property.focus();
  }
  renderCards(){
    if(!this.alive)return;const tokens=fold(this.search.value).trim().split(/\s+/).filter(Boolean);
    const items=this.items.filter(item=>tokens.every(token=>item.key.includes(token))&&this.filters.every(filter=>!filter.property.value||valueMatches(filter.property.value==='$folder'?(this.app.displayNoteFolder(item.file)||'Notas'):item.props[filter.property.value],filter.operator.value,filter.value.value)));
    items.sort((a,b)=>this.sort.value==='title'?a.file.basename.localeCompare(b.file.basename):this.sort.value==='created'?(a.file.stat.ctime-b.file.stat.ctime):(b.file.stat.mtime-a.file.stat.mtime));
    this.status.textContent=`${items.length} ${items.length===1?'nota':'notas'}${tokens.length||this.filters.length?' encontradas':''} · ${this.items.length} na biblioteca`;
    this.grid.empty();
    if(!items.length){const empty=this.grid.createDiv({cls:'atlas-library-empty'});empty.createEl('h2',{text:this.items.length?'Nenhuma nota corresponde aos filtros':'Sua biblioteca começa com uma ideia'});empty.createEl('p',{text:this.items.length?'Ajuste a busca ou remova um filtro.':'Crie uma nota ou importe sua biblioteca para começar.'})}
    for(const item of items.slice(0,this.limit)){
      const card=this.grid.createEl('article',{cls:'atlas-library-card'});this.app.bindNoteDrag(card,item.file);
      card.oncontextmenu=event=>{event.preventDefault();this.app.showNoteMenu(item.file,event)};
      const open=card.createEl('button',{cls:'atlas-note-card-open',attr:{'aria-label':'Abrir nota '+item.file.basename}});
      open.createEl('h2',{text:item.file.basename});open.createEl('p',{text:item.snippet||''});open.onclick=()=>this.app.workspace.getLeaf('tab').openFile(item.file).catch(error=>new Notice(error.message));
      const footer=card.createDiv({cls:'atlas-note-card-footer'}),chips=footer.createDiv({cls:'atlas-property-chips'});
      for(const [key,value]of Object.entries(item.props).slice(0,3)){for(const part of (Array.isArray(value)?value:[value]).slice(0,4)){const shown=typeof part==='object'?'{…}':String(part??'');const chip=chips.createSpan({text:`${key}: ${shown}`,attr:{title:`${key}: ${shown}`}});colorChip(this.app,chip,key,part)}}
      const controls=footer.createDiv({cls:'atlas-note-card-actions'});
      const edit=controls.createEl('button',{cls:'atlas-card-property-button',attr:{'aria-label':'Propriedades de '+item.file.basename,title:'Editar propriedades'}});setIcon(edit,'sliders-horizontal');edit.onclick=()=>new PropertiesModal(this.app,item.file,()=>this.loadNotes()).open();
      const more=controls.createEl('button',{cls:'atlas-card-property-button',attr:{'aria-label':'Ações de '+item.file.basename,title:'Ações da nota'}});setIcon(more,'ellipsis');more.onclick=event=>this.app.showNoteMenu(item.file,event);
    }
    this.more.hidden=items.length<=this.limit;
  }
  async onClose(){this.alive=false;this.loadToken++;clearTimeout(this.refreshTimer)}
}
