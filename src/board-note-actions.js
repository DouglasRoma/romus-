import {Modal,Notice,Menu} from './compat.js';
import {freeBoardPosition} from './board-placement.js';
export function createBoardNote(view,position){
 const app=view.app,board=view.board,modal=new Modal(app);modal.setTitle('Nova nota');
 const name=modal.contentEl.createEl('input',{value:'Nova nota',attr:{'aria-label':'Título da nova nota',placeholder:'Título da nota'}});
 const create=app.uiButton(modal.contentEl,'Criar nota','plus',async()=>{
  const title=name.value.trim().replace(/[\\/:*?"<>|#\[\]\r\n]/g,' ').trim();if(!title){name.focus();return}create.disabled=true;
  try{const folder=app.preferences.notesFolder||'Notas',path=app.plugin.unique((folder?folder+'/':'')+title+'.md'),note=await app.vault.create(path,'# '+title+'\n\n');if(view.board===board){await view.addVisualNote(note,position);await app.workspace.revealLeaf(view.leaf)}modal.close()}catch(error){create.disabled=false;new Notice(error.message)}
 });name.onkeydown=event=>{if(event.key==='Enter'){event.preventDefault();create.click()}};modal.open();name.focus();name.select();return modal;
}
export function installBoardNoteActions(view){
 const add=view.addVisualNote.bind(view);let pending=Promise.resolve();
 view.addVisualNote=(note,position)=>{const board=view.board;const task=pending.catch(()=>{}).then(async()=>{
  if(view.board!==board)return;const r=view.viewport.getBoundingClientRect(),preferred=position||view.toWorld(r.left+r.width/2-180,r.top+r.height/2-140);
  let footprint={x:0,y:0,w:360,h:322};const media=view.app.media?.byNote(note);
  if(media)footprint={x:0,y:0,w:600,h:media.type==='pdf'?662:media.type==='web'?582:392};
  else if(await view.plugin.visualSource(note)){const bundle=await view.plugin.loadVisualNote(note);if(bundle.nodes.length){const x=Math.min(...bundle.nodes.map(n=>n.x)),y=Math.min(...bundle.nodes.map(n=>n.y));footprint={x,y,w:Math.max(...bundle.nodes.map(n=>n.x+n.w))-x,h:Math.max(...bundle.nodes.map(n=>n.y+n.h+42))-y}}}
  if(view.board!==board)return;return add(note,freeBoardPosition(board.nodes,preferred,footprint));
 });pending=task;return task};
 view.registerDomEvent(view.contentEl,'contextmenu',event=>{
  if(!view.viewport?.contains(event.target)||event.target.closest('.ia-card,.ia-sidebar,.ia-toolbar,.atlas-canvas-tools,button,a,input,textarea,[contenteditable=true],.ia-edge-hit,.ia-group-title'))return;
  event.preventDefault();event.stopPropagation();const board=view.board,position=view.toWorld(event.clientX,event.clientY),menu=new Menu();
  menu.addItem(i=>i.setTitle('Nova nota aqui').setIcon('file-plus').onClick(()=>{if(view.board===board)createBoardNote(view,position)}));
  menu.addItem(i=>i.setTitle('Adicionar nota existente aqui').setIcon('file-input').onClick(()=>{if(view.board===board)view.pickVisualNote(position)}));menu.showAtMouseEvent(event);
 },true);
}
export function installMediaHover(view){
 const preview=view.previewImageNote.bind(view);
 view.previewImageNote=(event,target=event.target)=>{
  if(target?.closest?.('.atlas-note-media')){view.imageHover=null;return false}
  const card=target?.closest?.('.ia-web')||target?.closest?.('[data-ia-node]')?.querySelector('.atlas-note-media')?.closest('[data-ia-node]');if(!card)return preview(event,target);
  if(!view.contentEl.contains(card)||target.closest('button,.ia-resize'))return false;
  view.imageHover={target,x:event.clientX,y:event.clientY};
  if(!event.ctrlKey&&!event.metaKey){view.imageHoverShown=null;return false}if(view.drag)return false;
  const node=view.nodeById?.get(card.dataset.atlasNodeId||card.dataset.iaNode),path=node?.mediaNote||node?.path;if(!path||!view.app.vault.getFileByPath(path))return false;
  if(view.imageHoverShown===card)return true;view.imageHoverShown=card;
  view.app.workspace.trigger('hover-link',{event,source:'image-atlas',hoverParent:view,targetEl:card,linktext:path,sourcePath:view.file.path});return true;
 };
}
