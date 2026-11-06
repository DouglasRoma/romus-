import {Notice} from './compat.js';
/** Internal pointer dragging: one visual update per frame, no reads or writes until drop. */
export function installFolderDrag(app){
 let candidate,active=false,ghost,frame,target,hoverTimer,hoverFolder,lastX=0,lastY=0,blockedUntil=0;
 const clearHover=()=>{clearTimeout(hoverTimer);hoverFolder=null;target?.classList.remove('atlas-folder-drop-target');target=null};
 const hit=(x,y)=>document.elementFromPoint(x,y)?.closest('[data-drop-folder]')||null;
 const paint=()=>{
  frame=null;if(!active)return;ghost.style.transform=`translate3d(${lastX+15}px,${lastY+14}px,0)`;
  const next=hit(lastX,lastY);if(next===target)return;clearHover();target=next;target?.classList.add('atlas-folder-drop-target');
  if(target?.matches('details')&&!target.open){hoverFolder=target;hoverTimer=setTimeout(()=>{if(active&&hoverFolder?.isConnected)hoverFolder.open=true},550)}
 };
 const finish=()=>{
  const wasActive=active;active=false;candidate=null;cancelAnimationFrame(frame);frame=null;clearHover();ghost?.remove();ghost=null;document.body.classList.remove('atlas-dragging-note');for(const el of document.querySelectorAll('.atlas-note-drag-source'))el.classList.remove('atlas-note-drag-source');
  if(wasActive){blockedUntil=Date.now()+200;if(app.sidebarNeedsRender){app.sidebarNeedsRender=false;app.renderFiles()}}
 };
 app.bindNoteDrag=(el,file)=>{
  el.draggable=false;
  el.addEventListener('pointerdown',event=>{if(event.button!==0||event.pointerType==='touch'||event.target.closest('input,textarea,select,.atlas-card-property-button')||!app.noteCatalog.isMainNote(file))return;candidate={file,el,x:event.clientX,y:event.clientY,pointer:event.pointerId}});
  el.addEventListener('click',event=>{if(active||Date.now()<blockedUntil){event.preventDefault();event.stopImmediatePropagation()}},true);
 };
 app.bindFolderDrop=(el,folder)=>{el.dataset.dropFolder=folder;if(el.matches('summary'))el.title='Solte uma nota aqui para movê-la para a raiz da biblioteca'};
 document.addEventListener('pointermove',event=>{
  if(!candidate||event.pointerId!==candidate.pointer)return;lastX=event.clientX;lastY=event.clientY;
  if(!active){if(Math.hypot(lastX-candidate.x,lastY-candidate.y)<6)return;active=true;document.body.classList.add('atlas-dragging-note');candidate.el.addClass('atlas-note-drag-source');ghost=document.body.createDiv({cls:'atlas-note-drag-ghost'});ghost.createEl('strong',{text:candidate.file.basename});ghost.createEl('small',{text:'Solte em uma pasta ou em “Notas”'});try{document.body.setPointerCapture(event.pointerId)}catch{}}
  event.preventDefault();event.stopImmediatePropagation();if(frame==null)frame=requestAnimationFrame(paint);
 },{capture:true,passive:false});
 document.addEventListener('pointerup',event=>{
  if(!candidate||event.pointerId!==candidate.pointer)return;if(!active){candidate=null;return}event.preventDefault();event.stopImmediatePropagation();const file=candidate.file,drop=hit(event.clientX,event.clientY),folder=drop?.dataset.dropFolder;try{document.body.releasePointerCapture(event.pointerId)}catch{}finish();
  if(folder!==undefined)app.moveNoteToFolder(file,folder).then(moved=>{if(moved)new Notice('Nota movida para '+(folder||'a raiz da biblioteca')+'.')}).catch(error=>new Notice(error.message));
 },true);
 document.addEventListener('pointercancel',()=>{if(candidate)finish()},true);
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&candidate){event.preventDefault();event.stopImmediatePropagation();finish()}},true);
 window.addEventListener('blur',()=>{if(candidate)finish()});
}
