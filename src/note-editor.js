import {TextFileView,Component,Notice,MarkdownRenderer,setIcon} from './compat.js';
import {attachWikiLinks} from './wiki-links.js';
import {PropertiesModal,propertyDocument,publicProperties} from './properties.js';
import {FormattedEditor,readableDocument,removeRenderedImage} from './formatted-editor.js';
import {splitNoteContent,mergeNoteContent} from './note-content.js';
import {colorChip} from './property-colors.js';
import {installEditorImages} from './editor-images.js';
import {installEditorMedia} from './editor-media.js';
import {EditorSlashMenu} from './editor-slash.js';
import {NoteOutline} from './note-outline.js';
import {captureReadingPosition,restoreReadingPosition} from './editor-location.js';
import {NotePage} from './note-page.js';

export class NoteEditor extends TextFileView{
  async onOpen(){
    this.contentEl.addClass('note-editor');
    const header=this.contentEl.createDiv({cls:'atlas-note-header'});
    this.path=header.createDiv({cls:'atlas-note-breadcrumb'});
    this.toolbar=header.createDiv({cls:'note-tools'});
    this.name=this.toolbar.createEl('button',{text:'Nota',cls:'atlas-note-title',attr:{title:'Renomear nota'}});this.name.onclick=()=>this.app.renameNote(this.file);
    const actions=this.toolbar.createDiv({cls:'atlas-note-actions'});
    this.app.uiButton(actions,'Propriedades','sliders-horizontal',()=>this.openProperties());
    this.app.uiButton(actions,'Flashcards','layers',async()=>{await this.save();return this.app.plugin.editMediaFlashcards(this.file)});
    this.app.uiButton(actions,'Estudar','play',async()=>{await this.save();return this.app.plugin.openNoteFlashcardReview(this.file)});
    this.modeSelect=actions.createEl('select',{attr:{'aria-label':'Modo da nota'}});
    for(const [value,label]of [['formatted','Editor formatado'],['source','Markdown'],['preview','Prévia']])this.modeSelect.createEl('option',{text:label,attr:{value}});
    this.modeSelect.onchange=()=>this.setEditorMode(this.modeSelect.value);
    this.studyToggle=this.app.uiButton(actions,'Flashcards e mapa','eye',()=>this.toggleStudyContent());this.studyToggle.setAttribute('aria-pressed','false');
    const more=actions.createEl('button',{cls:'atlas-note-more',attr:{title:'Mais ações da nota','aria-label':'Mais ações da nota'}});setIcon(more,'ellipsis');more.onclick=event=>this.app.showNoteMenu(this.file,event);
    header.insertBefore(actions,this.path);
    this.propertyPreview=header.createDiv({cls:'atlas-note-properties-preview'});
    this.status=header.createSpan({cls:'atlas-note-save-status',text:'Salvo'});
    const writing=this.writingArea=this.contentEl.createDiv({cls:'atlas-writing-area'});this.documentHost=writing.createDiv({cls:'atlas-note-document'});this.documentHost.hidden=true;
    this.input=writing.createEl('textarea',{cls:'note-input',attr:{'aria-label':'Texto da nota',spellcheck:'true',placeholder:'Comece uma ideia. Digite [[ para conectar uma nota…'}});
    this.rendered=writing.createDiv({cls:'markdown-preview'});this.rendered.hidden=true;
    this.richHost=writing.createDiv({cls:'atlas-rich-editor'});this.richHost.hidden=true;
    this.studyPanel=writing.createDiv({cls:'atlas-note-study-panel'});this.studyPanel.hidden=true;
    this.sourceInput=writing.createEl('textarea',{cls:'note-input atlas-source-input',attr:{'aria-label':'Texto da nota',spellcheck:'true'}});this.sourceInput.hidden=true;
    this.sourceInput.oninput=()=>{this.input.value=this.showStudy?this.sourceInput.value:mergeNoteContent(this.sourceInput.value,this.sourceManaged||[]);this.queueSave();this.slash?.update()};
    this.images=installEditorImages(this);this.media=installEditorMedia(this);this.slash=new EditorSlashMenu(this);
    this.app.uiButton(actions,'Mídia','link',()=>this.media.pick());
    this.notePage=new NotePage(this,header,actions);
    this.pageScrollElement=this.contentEl.createDiv({cls:'romus-page-scroll'});this.pageScrollElement.append(header,writing,this.notePage.hub);
    this.outline=new NoteOutline(this);
    this.input.oninput=()=>this.queueSave();
    const owner=this;this.wiki=attachWikiLinks({input:this.sourceInput,app:this.app,get file(){return owner.file},get status(){return owner.status}});this.register(()=>this.wiki.dispose());
    this.registerEvent(this.app.vault.on('rename',file=>{if(file===this.file){this.name.textContent=file.basename;this.updateLocation()}}));
    this.registerEvent(this.app.vault.on('modify',async file=>{
      if(file!==this.file||this.formatted?.dirty||this.input.value!==this.originalBody)return;
      const before=this.originalBody,text=await this.app.vault.read(file);
      if(!this.formatted?.dirty&&this.input.value===before){const next=text.replace(/^\uFEFF?---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/,'');this.showProperties(text);if(next===before)return;const position=captureReadingPosition(this);this.originalBody=next;this.input.value=this.originalBody;await this.refreshContent();restoreReadingPosition(this,position)}
    }));
  }
  getViewType(){return'markdown'}
  async readFile(file){
    this.file=file;const text=await this.app.vault.read(file);
    // Keep editing possible when imported YAML is malformed, without rewriting it.
    this.originalBody=text.replace(/^\uFEFF?---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/,'');
    this.input.value=this.originalBody;this.name.textContent=file.basename;this.updateLocation();this.status.textContent='Salvo';this.showProperties(text);this.loadAttachedDocument();await this.setEditorMode(this.app.preferences.noteMode||'formatted');
  }
  updateLocation(){const folder=this.file.path.split('/').slice(0,-1).join('/'),shown=this.app.noteCatalog.sidebarFolder(folder);this.path.textContent=shown.split('/').join(' / ');this.path.hidden=!shown}
  loadAttachedDocument(){const media=this.app.media?.byNote(this.file),item=!this.embeddedSummary&&media?.type==='pdf'?media:null;this.documentDispose?.();this.documentHost.empty();this.documentHost.hidden=!item;if(item)this.documentDispose=this.app.mediaUI.inline(this.documentHost,item);if(media){this.name.textContent=media.title;this.path.textContent='Resumo da mídia';this.path.hidden=false}}
  showProperties(text,force=false){
    if(this.notePage){try{this.notePage.load(text,force)}catch(error){this.propertyPreview.empty();this.propertyPreview.hidden=false;this.propertyPreview.createSpan({text:error.message})}return}
    this.propertyPreview.empty();
    try{for(const [key,value]of Object.entries(publicProperties(propertyDocument(text).props)).slice(0,5)){
      const shown=Array.isArray(value)?value.join(', '):typeof value==='object'?'{…}':String(value??'');
      const chip=this.propertyPreview.createEl('button',{text:`${key} · ${shown}`,attr:{title:'Editar propriedade '+key}});colorChip(this.app,chip,key,value);chip.onclick=()=>this.openProperties();
    }}catch{this.propertyPreview.createSpan({text:'Confira o cabeçalho YAML desta nota.'})}
    this.propertyPreview.hidden=!this.propertyPreview.childElementCount;
  }
  queueSave(){clearTimeout(this.timer);this.status.textContent='Salvando…';this.timer=setTimeout(()=>this.save().catch(error=>{this.status.textContent=error.message;new Notice(error.message)}),400)}
  async save(){
    this.formatted?.flushToOwner(false);
    await Promise.all(this.imageJobs||[]);
    this.formatted?.flushToOwner(false);
    clearTimeout(this.timer);
    const run=async()=>{
      if(!this.file||this.input.value===this.originalBody)return;
      const body=this.input.value,before=this.originalBody;
      await this.app.vault.process(this.file,text=>{
        const prefix=text.match(/^\uFEFF?---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/)?.[0]||'';
        if(text.slice(prefix.length)!==before)throw Error('A nota mudou em outra tela. Seu rascunho foi mantido; reabra a nota para conferir.');return prefix+body;
      });
      this.originalBody=body;this.status.textContent=this.input.value===body?'Salvo':'Alterações pendentes';
    };
    this.saving=(this.saving||Promise.resolve()).catch(()=>{}).then(run);return this.saving;
  }
  async openProperties(){await this.save();this.wiki.close();new PropertiesModal(this.app,this.file,async()=>this.showProperties(await this.app.vault.read(this.file))).open()}
  getState(){return{mode:this.editorMode,showStudy:!!this.showStudy}}
  async toggleStudyContent(){await this.save();this.showStudy=!this.showStudy;this.studyToggle.setAttribute('aria-pressed',String(this.showStudy));this.studyToggle.title=this.showStudy?'Ocultar flashcards e mapa mental':'Mostrar flashcards e mapa mental';await this.refreshContent()}
  async setEditorMode(mode){if(mode===this.editorMode)return;const position=captureReadingPosition(this);await this.save();this.wiki.close();this.slash?.close();this.formatted?.closeSuggestions();this.formatted?.bubble.hide();this.editorMode=mode;this.modeSelect.value=mode;this.input.hidden=true;this.sourceInput.hidden=mode!=='source';this.richHost.hidden=mode!=='formatted';this.rendered.hidden=mode!=='preview';await this.refreshContent();restoreReadingPosition(this,position,{focus:!!position&&mode!=='preview'})}
  async refreshContent(){
    const {text,managed}=splitNoteContent(this.input.value);this.sourceManaged=managed;const source=this.showStudy?this.input.value:text;if(this.sourceInput.value!==source)this.sourceInput.value=source;
    if(this.editorMode==='formatted'){this.formatted||=new FormattedEditor(this,this.richHost);this.formatted.load(this.input.value)}
    if(this.editorMode==='preview'&&this.previewText!==text){this.previewText=text;this.previewComponent?.unload();this.previewComponent=new Component();this.rendered.empty();await MarkdownRenderer.render(this.app,text,this.rendered,this.file.path,this.previewComponent,{onRemoveImage:index=>removeRenderedImage(this,index,()=>this.refreshContent())})}
    this.studyPanel.hidden=!this.showStudy||this.editorMode==='source';
    this.studyComponent?.unload();this.studyPanel.empty();
    if(!this.studyPanel.hidden){this.studyPanel.createEl('h2',{text:'Flashcards e mapa mental'});this.studyComponent=new Component();const body=this.studyPanel.createDiv({cls:'markdown-preview'}),study=managed.filter(block=>!block.includes('image-atlas-fsrs-deck:')).join('\n\n').replace(/<!--[^]*?-->/g,'').replace(/^Imagem, marcações, mapas e flashcards são carregados[^\n]*$/gm,'').trim();if(study)await MarkdownRenderer.render(this.app,study,body,this.file.path,this.studyComponent);else body.createEl('p',{cls:'ia-muted',text:'Esta nota ainda não tem flashcards ou mapa mental.'})}
    this.outline.refresh();
  }
  async preview(){return this.setEditorMode(this.editorMode==='preview'?'formatted':'preview')}
  async onClose(){await this.save();this.notePage?.dispose();this.previewImageUndoDispose?.();this.outline?.dispose();this.images?.dispose();this.media?.dispose();this.slash?.dispose();this.documentDispose?.();this.wiki.dispose();this.formatted?.destroy();this.previewComponent?.unload();this.studyComponent?.unload()}
}
