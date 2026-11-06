import {Component,Notice,setIcon} from './compat.js';
import {NoteEditor} from './note-editor.js';

// Only the card being edited owns an editor. Reading cards keep their cheap,
// cached Markdown preview; the canonical note remains the source of truth.
export function installBoardNoteEditor(view){
 const app=view.app;let active=null,pending=Promise.resolve();
 const restore=record=>{
  record.body._romusContent=false;record.body.classList.remove('romus-board-edit-body');
  record.element.classList.remove('romus-card-editing');record.root.remove();
  record.body._romusSummaryKey=null;
  if(record.body.isConnected)view.queueNotePreview(record.file.path,record.body);
 };
 const close=async()=>{
  const record=active;if(!record)return;await record.ready;
  // A failed save deliberately leaves the editor and its draft alive.
  await record.editor.onClose();record.editor.unload();app.embeddedEditors.delete(record.editor);
  if(active===record)active=null;restore(record);
 };
 const report=error=>new Notice(error.message);
 const location=event=>{
  if(!event)return{};const range=document.caretRangeFromPoint(event.clientX,event.clientY),text=range?.startContainer;
  const block=text?.parentElement?.closest('p,h1,h2,h3,h4,h5,h6,li');if(!block)return{};
  const prefix=document.createRange();prefix.selectNodeContents(block);prefix.setEnd(range.startContainer,range.startOffset);
  return{text:block.textContent,offset:prefix.toString().length};
 };
 view.editCardNote=(node,event)=>{
  const point=location(event),board=view.board,id=node.id;
  const task=pending.catch(()=>{}).then(async()=>{
   if(view.board!==board)return;
   if(active?.id===id){await active.ready;active.editor.formatted.editor.view.dom.focus({preventScroll:true});return active.editor}
   await close();const element=view.nodeElements.get(id),body=element?.querySelector('.ia-note-content');
   if(!body||body._romusContent)return;
   const path=node.mediaNote||node.visualNote||node.path,file=app.metadataCache.getFirstLinkpathDest(path,view.file.path);
   if(!file||file.extension!=='md')return;
   const scroll=body.scrollTop,child=view.previews.get(body);if(child){view.removeChild(child);view.previews.delete(body)}
   body._atlasToken=Symbol();body._romusContent=true;body.empty();body.classList.add('romus-board-edit-body');element.classList.add('romus-card-editing');
   view.selected={node:id};view.highlight();
   const root=body.createDiv({cls:'romus-card-editor',attr:{role:'region','aria-label':'Editar no whiteboard · '+file.basename}}),bar=root.createDiv({cls:'romus-card-editor-bar'});
   const label=bar.createSpan({text:'Editando nota'}),tools=bar.createDiv({cls:'romus-card-editor-tools'});
   const button=(title,icon,run)=>{const b=tools.createEl('button',{attr:{type:'button',title,'aria-label':title}});setIcon(b,icon);b.onclick=()=>Promise.resolve(run()).catch(report);return b};
   const host=root.createDiv({cls:'romus-card-editor-host'}),editor=new NoteEditor({app,containerEl:host});editor.embeddedSummary=true;editor.file=file;
   const record=active={id,file,element,body,root,editor};app.embeddedEditors||=new Set();
   for(const type of ['pointerdown','click','dblclick','wheel','drop','dragover'])root.addEventListener(type,e=>e.stopPropagation(),type==='wheel'?{passive:true}:undefined);
   root.addEventListener('keydown',e=>{if(e.defaultPrevented||((e.ctrlKey||e.metaKey)&&['z','y'].includes(e.key.toLowerCase()))){e.stopPropagation();return}if(e.key==='Escape'&&!editor.formatted?.menu&&!editor.slash?.menu){e.preventDefault();e.stopPropagation();close().then(()=>view.viewport.focus({preventScroll:true})).catch(report)}});
   const image=button('Adicionar imagem','image-plus',()=>record.ready.then(()=>editor.images.pick()));
   const media=button('Incorporar link','link',()=>record.ready.then(()=>editor.media.pick()));
   button('Concluir edição · Esc','check',()=>close());image.disabled=media.disabled=true;
   record.ready=(async()=>{
    Component.prototype.load.call(editor);await editor.onOpen();await editor.readFile(file);await editor.setEditorMode('formatted');app.embeddedEditors.add(editor);
    label.replaceWith(editor.status);image.disabled=media.disabled=false;
    const rich=editor.formatted.editor;let position=1,found=false;
    if(point.text)rich.state.doc.descendants((n,pos)=>{if(!found&&n.isTextblock&&n.textContent===point.text){position=pos+1+Math.min(point.offset,n.content.size);found=true}});
    rich.commands.setTextSelection(position);editor.pageScrollElement.scrollTop=scroll;rich.commands.focus(undefined,{scrollIntoView:false});
   })();
   try{await record.ready}catch(error){try{await editor.onClose()}catch{}editor.unload();app.embeddedEditors.delete(editor);active=null;restore(record);throw error}
   return editor;
  });pending=task;return task;
 };
 view.finishCardEditing=()=>pending.catch(()=>{}).then(close);
 view.cardEditorHasFocus=()=>!!active?.root.contains(document.activeElement);
 view.focusCardEditor=()=>active?.editor.formatted?.editor.view.dom.focus({preventScroll:true});
 view.cardEditingContext=()=>active&&view.selected?.node===active.id?{note:active.file,owner:active.editor}:null;
 view.syncCardEditor=()=>{
  if(!active)return;const record=active,element=view.nodeElements.get(record.id),body=element?.querySelector('.ia-note-content');
  if(body===record.body)return;
  if(body){const previous=view.previews.get(body);if(previous){view.removeChild(previous);view.previews.delete(body)}body.empty();body._romusContent=true;body.classList.add('romus-board-edit-body');element.classList.add('romus-card-editing');body.moveBefore&&record.root.isConnected?body.moveBefore(record.root,null):body.append(record.root);record.body._romusContent=false;record.body.classList.remove('romus-board-edit-body');record.element.classList.remove('romus-card-editing');Object.assign(record,{body,element});return}
  // A hidden/deleted card may disappear during a map change. Save it before
  // releasing its editor; if saving fails, expose the retained draft for recovery.
  if(!record.releasing){record.releasing=true;close().catch(error=>{record.releasing=false;record.root.classList.add('romus-card-editor-recovery');view.contentEl.append(record.root);report(error)})}
 };
 const onClose=view.onClose.bind(view);view.onClose=async()=>{await view.finishCardEditing();return onClose()};
}
