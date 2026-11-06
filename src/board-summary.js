import {Modal,Component,MarkdownRenderer,Notice} from './compat.js';
import {FormattedEditor,removeRenderedImage} from './formatted-editor.js';
import {installEditorImages} from './editor-images.js';
import {installEditorMedia} from './editor-media.js';
import {EditorSlashMenu} from './editor-slash.js';
import {attachWikiLinks} from './wiki-links.js';
import {NoteOutline} from './note-outline.js';
import {captureReadingPosition,restoreReadingPosition} from './editor-location.js';
import {splitNoteContent,mergeNoteContent,summaryText} from './note-content.js';

export class BoardSummary extends Modal{
 constructor(view){super(view.app);this.view=view;this.board=view.board;this.file=view.file;this.setTitle('Resumo · '+this.board.title);this.modalEl.addClass('atlas-board-summary')}
 async onOpen(){
  if(!this.docked)this.app.boardSummaryModal=this;const tools=this.contentEl.createDiv({cls:'atlas-summary-tools'});
  this.app.uiButton(tools,'Ler','book-open',()=>this.setMode('preview'));this.app.uiButton(tools,'Editar','square-pen',()=>this.setMode('formatted'));this.app.uiButton(tools,'Markdown','code',()=>this.setMode('source'));
  if(!this.docked)this.app.uiButton(tools,'Abrir ao lado','panel-right-open',()=>this.app.openSummaryBeside(this));
  this.app.uiButton(tools,'Flashcards','layers',()=>this.app.studyWorkspace.edit({summary:this}));this.app.uiButton(tools,'Estudar','play',()=>this.app.studyWorkspace.review({summary:this}));
  this.status=tools.createSpan({cls:'atlas-note-save-status',text:'Salvo no whiteboard'});this.input=this.contentEl.createEl('textarea');this.input.hidden=true;this.input.value=this.board.summary||'';
  const writing=this.writingArea=this.contentEl.createDiv({cls:'atlas-writing-area atlas-summary-writing'});
  this.richHost=writing.createDiv({cls:'atlas-rich-editor'});this.sourceInput=writing.createEl('textarea',{cls:'note-input atlas-source-input',attr:{'aria-label':'Resumo do whiteboard',placeholder:'Escreva o resumo deste quadro. Digite / para inserir…'}});this.rendered=writing.createDiv({cls:'markdown-preview'});
  this.sourceInput.oninput=()=>{this.input.value=mergeNoteContent(this.sourceInput.value,this.sourceManaged||[]);this.queueSave();this.slash.update()};this.images=installEditorImages(this);this.media=installEditorMedia(this);this.slash=new EditorSlashMenu(this);this.wiki=attachWikiLinks({input:this.sourceInput,app:this.app,file:this.file,status:this.status});(this.app.embeddedEditors||=new Set()).add(this);
  this.outline=new NoteOutline(this);await this.setMode(this.input.value.trim()?'preview':'formatted');
 }
 queueSave(){if(this.view.board!==this.board)return;if(this.board.summary!==this.input.value){this.board.summary=this.input.value;this.view.changed(false,false)}this.status.textContent='Salvo no whiteboard'}
 async save(){this.formatted?.flushToOwner(false);await Promise.all(this.imageJobs||[]);this.formatted?.flushToOwner(false);this.queueSave();if(this.view.board===this.board)await this.view.save();await this.app.syncSummaryNote?.(this)}
 async setMode(mode){if(mode===this.editorMode)return;const position=captureReadingPosition(this);this.formatted?.flushToOwner();await Promise.all(this.imageJobs||[]);this.formatted?.flushToOwner();this.slash?.close();this.wiki?.close();this.formatted?.bubble.hide();this.editorMode=mode;this.richHost.hidden=mode!=='formatted';this.sourceInput.hidden=mode!=='source';this.rendered.hidden=mode!=='preview';for(const button of this.contentEl.querySelectorAll('.atlas-summary-tools button'))button.setAttribute('aria-pressed',String(button.textContent===({preview:'Ler',formatted:'Editar',source:'Markdown'}[mode])));if(mode==='formatted'){this.formatted||=new FormattedEditor(this,this.richHost);this.formatted.load(this.input.value);}else if(mode==='source'){const parts=splitNoteContent(this.input.value);this.sourceManaged=parts.managed;this.sourceInput.value=parts.text;}else await this.refreshPreview();this.outline.refresh();restoreReadingPosition(this,position,{focus:mode!=='preview'})}
 async refreshPreview(){if(this.previewText===this.input.value)return;this.previewText=this.input.value;this.preview?.unload();this.preview=new Component();this.rendered.empty();if(!this.input.value.trim())this.rendered.createEl('p',{cls:'ia-muted',text:'Este quadro ainda não tem resumo. Clique em Editar para começar.'});else await MarkdownRenderer.render(this.app,summaryText(this.input.value),this.rendered,this.file.path,this.preview,{onRemoveImage:index=>removeRenderedImage(this,index,()=>this.refreshPreview())})}
 close(){if(this.closing)return this.closing;this.closing=(async()=>{try{await this.save();super.close();return true}catch(error){this.closing=null;new Notice('Não foi possível salvar o resumo: '+error.message);return false}})();return this.closing}
 onClose(){this.previewImageUndoDispose?.();this.outline?.dispose();this.images.dispose();this.media.dispose();this.slash.dispose();this.wiki.dispose();this.formatted?.destroy();this.preview?.unload();this.app.embeddedEditors.delete(this);if(this.app.boardSummaryModal===this)this.app.boardSummaryModal=null}
}
export async function openBoardSummary(view){const current=view.app.boardSummaryModal;if(current?.board===view.board)return current;if(current&&!await current.close())return;return new BoardSummary(view).open()}
