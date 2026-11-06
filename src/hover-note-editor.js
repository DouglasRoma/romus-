import {Component,Notice,setIcon} from './compat.js';
import {NoteEditor} from './note-editor.js';

/** Retained previews own their readers/editors independently of the Ctrl hover. */
export function installHoverNoteEditor(app){
 const previews=new Map(),underlays=new Set();
 app.previewNoteEditors=new Set();
 const recordAt=element=>previews.get(element?.closest?.('.ia-review-note-preview'));
 const connected=()=>[...previews.values()].filter(record=>record.root.isConnected);
 const syncLayers=()=>{
  const retained=connected().some(record=>record.retained);
  document.body.classList.toggle('atlas-has-editable-preview',retained);
  if(!retained){for(const el of underlays)el.classList.remove('atlas-preview-underlay');underlays.clear()}
  for(const [root,record]of previews)if(!root.isConnected&&!record.editor){record.disposeReader?.();previews.delete(root)}
 };
 function retain(record){
  if(!record||record.retained)return;
  retain(record.parent);
  const modal=record.root.closest('.modal-container')||record.origin?.closest('.modal-container');
  if(modal){underlays.add(modal);modal.classList.add('atlas-preview-underlay')}
  record.retained=true;record.root.dataset.retained='true';
  record.disposeReader=record.detach?.({preserve:true});
  document.body.append(record.root);syncLayers();
 }
 app.retainPreviewAncestors=element=>retain(recordAt(element));
 app.findNotePreview=(origin,file)=>connected().find(record=>record.origin===origin&&record.file.path===file.path)?.root;
 app.activePreviewNoteEditor=()=>recordAt(document.activeElement)?.editor||null;
 app.placeNotePreview=(root,origin)=>{
  const parent=recordAt(origin);if(!parent)return;
  const r=parent.root.getBoundingClientRect(),width=root.getBoundingClientRect().width||440;
  const left=r.right+12+width<=innerWidth-12?r.right+12:r.left-width-12>=12?r.left-width-12:Math.min(r.left+32,innerWidth-width-12);
  const top=Math.max(12,Math.min(r.top+40,innerHeight-192));
  Object.assign(root.style,{left:Math.round(Math.max(12,left))+'px',top:Math.round(top)+'px',maxHeight:Math.min(340,innerHeight-top-12)+'px'});
 };
 async function closeRecord(record,{restoreFocus=false}={}){
  if(record.closing)return record.closing;
  record.closing=(async()=>{try{
   if(record.editor){
    const editor=record.editor;await editor.ready?.catch(()=>{});
    if(editor.failed&&editor.editor)editor.editor.file=null;
    await editor.editor?.onClose();editor.editor?.unload();app.embeddedEditors?.delete(editor.editor);
    window.removeEventListener('resize',editor.resize);app.previewNoteEditors.delete(editor);
   }
   if(!record.retained)record.detach?.();record.disposeReader?.();record.disposeReader=null;
   record.root.remove();previews.delete(record.root);
   for(const child of previews.values())if(child.parent===record)child.parent=record.parent;
   app.previewNoteEditor=[...app.previewNoteEditors].at(-1)||null;syncLayers();
   if(restoreFocus){const target=record.parent?.editor?.editor?.formatted?.editor?.view.dom||record.origin||record.beforeFocus;if(target?.isConnected)target.focus({preventScroll:true})}
   return true;
  }catch(error){record.closing=null;if(record.editor){record.editor.notice.textContent='Falha ao salvar';record.editor.notice.title=error.message}new Notice('A prévia ficou aberta para preservar seu texto: '+error.message);return false}})();return record.closing;
 }
 app.closeNotePreviews=async({includePinned=true}={})=>{for(const record of connected().reverse())if(includePinned||!record.pinned)await closeRecord(record)};
 document.addEventListener('pointerdown',event=>{
  const record=recordAt(event.target);if(record){retain(record);return}
  if(event.target.closest('.atlas-selection-toolbar,.atlas-common-palette,.atlas-note-link-menu,.atlas-slash-menu,.atlas-editor-slash,.ia-wikilink-suggestions,.context-menu,.modal-container:not(.atlas-preview-underlay)'))return;
  app.closeNotePreviews({includePinned:false});
 },true);
 document.addEventListener('keydown',event=>{
  if(event.key!=='Escape'||event.defaultPrevented)return;
  const record=recordAt(event.target);if(!record)return;
  event.preventDefault();event.stopImmediatePropagation();if(!record.pinned)closeRecord(record,{restoreFocus:true});
 },true);
 function button(host,label,icon,run){const el=host.createEl('button',{attr:{type:'button',title:label,'aria-label':label}});setIcon(el,icon);el.onclick=()=>Promise.resolve().then(run).catch(error=>new Notice(error.message));return el}
 function wire(preview,file,detach,origin){
  const existing=previews.get(preview);if(existing)return existing;
  syncLayers();preview.dataset.editablePreview='true';preview.dataset.previewNotePath=file.path;
  const record={root:preview,file,detach,origin,parent:recordAt(origin),beforeFocus:document.activeElement};previews.set(preview,record);
  const title=preview.querySelector('.ia-review-note-preview-title')||preview.createDiv({cls:'ia-review-note-preview-title'});title.empty();title.classList.add('atlas-preview-heading');
  record.title=title.createSpan({cls:'atlas-preview-title-text',text:file.basename,attr:{title:file.basename}});
  record.tools=title.createDiv({cls:'atlas-preview-inline-tools'});
  record.pin=button(record.tools,'Fixar prévia','pin',()=>{
   retain(record);record.pinned=!record.pinned;preview.toggleAttribute('data-pinned',record.pinned);
   const label=record.pinned?'Desafixar prévia':'Fixar prévia';record.pin.title=label;record.pin.setAttribute('aria-label',label);record.pin.setAttribute('aria-pressed',String(record.pinned));setIcon(record.pin,record.pinned?'pin-off':'pin');
  });record.pin.setAttribute('aria-pressed','false');
  record.closeButton=button(record.tools,'Fechar prévia','x',()=>closeRecord(record,{restoreFocus:true}));
  const tip=preview.querySelector('.ia-review-note-preview-tip')||preview.createDiv({cls:'ia-muted ia-review-note-preview-tip'});tip.textContent+=(tip.textContent?' ':'')+'Clique no texto para editar aqui.';
  preview.addEventListener('pointerenter',()=>retain(record));
  preview.addEventListener('click',event=>{
   const link=event.target.closest('a.internal-link');
   if(link&&(event.ctrlKey||event.metaKey)){
    event.preventDefault();event.stopImmediatePropagation();retain(record);
    app.workspace.trigger('hover-link',{event,targetEl:link,linktext:link.dataset.href,sourcePath:record.file.path});return;
   }
   if(record.editor||event.target.closest('a,button,img,input,textarea,.atlas-preview-heading,.ia-review-note-preview-tip'))return;
   if(!window.getSelection()?.isCollapsed)return;
   event.preventDefault();event.stopImmediatePropagation();
   const block=event.target.closest('p,li,h1,h2,h3,h4,h5,h6,pre'),location={text:block?.textContent||'',offset:0},point=document.caretPositionFromPoint?.(event.clientX,event.clientY);
   if(block&&point&&block.contains(point.offsetNode)){const range=document.createRange();range.selectNodeContents(block);range.setEnd(point.offsetNode,point.offset);location.offset=range.toString().length}
   app.editPreviewNote(file,location,preview,detach).catch(error=>new Notice(error.message));
  },true);
  // The persistent heading doubles as a lightweight drag handle.
  title.addEventListener('pointerdown',event=>{
   if(event.button!==0||event.target.closest('button'))return;event.preventDefault();event.stopPropagation();retain(record);if(record.pinned)return;
   const r=preview.getBoundingClientRect(),x=event.clientX,y=event.clientY;
   const move=e=>Object.assign(preview.style,{left:Math.round(Math.max(12,Math.min(r.left+e.clientX-x,innerWidth-r.width-12)))+'px',top:Math.round(Math.max(12,Math.min(r.top+e.clientY-y,innerHeight-60)))+'px'});
   const end=()=>{document.removeEventListener('pointermove',move);document.removeEventListener('pointerup',end);document.removeEventListener('pointercancel',end)};
   document.addEventListener('pointermove',move);document.addEventListener('pointerup',end,{once:true});document.addEventListener('pointercancel',end,{once:true});
  });
  return record;
 }
 class InlinePreviewEditor{
  constructor(record,location){this.record=record;this.app=app;this.file=record.file;this.containerEl=record.root;this.location=location}
  open(){
   const record=this.record,root=record.root,rect=root.getBoundingClientRect(),body=root.querySelector('.ia-review-note-preview-body');this.oldScroll=body?.scrollTop||0;
   retain(record);record.disposeReader?.();record.disposeReader=null;root.dataset.editing='true';root.classList.add('atlas-inline-note-editor');root.setAttribute('role','dialog');root.setAttribute('aria-label','Editar prévia · '+this.file.basename);root.setAttribute('aria-modal','false');
   Object.assign(root.style,{left:Math.round(rect.left)+'px',top:Math.round(rect.top)+'px',width:Math.round(rect.width||440)+'px',height:Math.max(180,Math.round(rect.height||340))+'px',maxHeight:'calc(100vh - 24px)'});
   root.querySelector('.ia-review-note-preview-tip')?.remove();body?.remove();
   const tools=record.tools;record.closeButton.remove();this.notice=tools.createSpan({cls:'atlas-preview-inline-status',attr:{role:'status','aria-live':'polite'}});
   this.image=button(tools,'Adicionar imagem','image-plus',()=>this.ready.then(()=>this.editor.images.pick()));this.image.disabled=true;
   this.media=button(tools,'Incorporar link','link',()=>this.ready.then(()=>this.editor.media.pick()));this.media.disabled=true;
   this.expand=button(tools,'Ampliar prévia','maximize-2',()=>this.toggleExpanded());button(tools,'Fechar prévia','x',()=>this.close({restoreFocus:true}));
   this.body=root.createDiv({cls:'ia-review-note-preview-body'});const host=this.body.createDiv({cls:'atlas-preview-note-host'});
   this.resize=()=>this.clamp();window.addEventListener('resize',this.resize);
   root.addEventListener('pointerdown',event=>event.stopPropagation());root.addEventListener('dblclick',event=>event.stopPropagation());
   this.ready=this.mount(host);this.ready.catch(error=>{this.failed=true;this.notice.textContent='Não foi possível abrir a nota';new Notice(error.message)});return this;
  }
  async mount(host){
   const editor=this.editor=new NoteEditor({app,containerEl:host});editor.file=this.file;Component.prototype.load.call(editor);await editor.onOpen();await editor.readFile(this.file);await editor.setEditorMode('formatted');(app.embeddedEditors||=new Set()).add(editor);
   const rich=editor.formatted.editor;let position=1,found=false;const {text,offset=0}=this.location;
   if(text)rich.state.doc.descendants((node,pos)=>{if(!found&&node.isTextblock&&node.textContent===text){position=pos+1+Math.min(offset,node.content.size);found=true}});
   rich.commands.setTextSelection(position);editor.writingArea.scrollTop=this.oldScroll;rich.commands.focus(undefined,{scrollIntoView:false});this.image.disabled=false;this.media.disabled=false;this.clamp();
  }
  clamp(){const root=this.containerEl,r=root.getBoundingClientRect();root.style.left=Math.round(Math.max(12,Math.min(r.left,innerWidth-Math.min(r.width,innerWidth-24)-12)))+'px';root.style.top=Math.round(Math.max(12,Math.min(r.top,innerHeight-Math.min(r.height,innerHeight-24)-12)))+'px'}
  toggleExpanded(){const root=this.containerEl;if(!this.expanded){const r=root.getBoundingClientRect();this.small={left:r.left,top:r.top,width:r.width,height:r.height};const width=Math.min(900,innerWidth-24),height=Math.min(760,innerHeight-24);Object.assign(root.style,{left:Math.round((innerWidth-width)/2)+'px',top:Math.round((innerHeight-height)/2)+'px',width:width+'px',height:height+'px'});}else{for(const [key,value]of Object.entries(this.small))root.style[key]=Math.round(value)+'px';this.clamp()}this.expanded=!this.expanded;const label=this.expanded?'Restaurar tamanho da prévia':'Ampliar prévia';this.expand.title=label;this.expand.setAttribute('aria-label',label);setIcon(this.expand,this.expanded?'minimize-2':'maximize-2')}
  close(options){return closeRecord(this.record,options)}
 }
 app.editPreviewNote=async(file,location={},preview,detach)=>{
  if(!preview){preview=document.body.createDiv({cls:'ia-review-note-preview'});Object.assign(preview.style,{left:Math.max(12,Math.round((innerWidth-440)/2))+'px',top:'80px',width:'440px',height:'340px'});preview.createDiv({cls:'ia-review-note-preview-body'})}
  const record=wire(preview,file,detach);if(record.editor){await record.editor.ready;record.editor.editor.formatted.editor.view.dom.focus({preventScroll:true});return record.editor}
  const editor=record.editor=new InlinePreviewEditor(record,typeof location==='string'?{text:location}:location);app.previewNoteEditors.add(editor);app.previewNoteEditor=editor;return editor.open();
 };
 app.wireEditableNotePreview=(preview,file,detach,origin)=>wire(preview,file,detach,origin);
 app.vault.on('rename',file=>{for(const record of previews.values())if(record.file===file){record.title.textContent=file.basename;record.title.title=file.basename;record.root.dataset.previewNotePath=file.path}});
}
