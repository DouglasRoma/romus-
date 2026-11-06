import {installMediaMotion} from './board-performance.js';
import {installMediaHover} from './board-note-actions.js';
import {repairMediaOccurrences,prepareMediaVisibility} from './media-occurrence.js';
import {applyDocumentZoom,placeInlineDocument} from './media-zoom.js';
import {setIcon} from './compat.js';
import {nodeMedia} from './media-source.js';
import {mediaSource} from './media-source.js';
export function prepareMediaBoard(view){
 if(!view.app.media||view.app.media.readOnly)return;
 let changed=repairMediaOccurrences(view);for(const node of view.board?.nodes||[]){if(!nodeMedia(node))continue;const item=view.app.media.forNode(node);if(node.mediaFile&&node.type==='note'&&!node.noteMaps?.length&&!node.visualSource){item.notePath||=node.mediaNote||node.path;node.mediaNote=item.notePath;node.type='web';node.path=node.mediaFile;node.pins||=[];node.h=Math.max(480,node.h);changed=true}if((item.customTitle||item.metadataResolved)&&node.title!==item.title){node.title=item.title;changed=true}if(item.notePath&&node.mediaNote!==item.notePath){node.mediaNote=item.notePath;changed=true}}
 if(changed&&view.file)view.requestSave();
}
export function decorateMediaBoard(view){
 for(const layout of view.mediaLayouts||[])if(!layout.element.isConnected)layout.dispose();
 const app=view.app;if(!app.mediaUI||app.media.readOnly||!view.board?.nodes)return;
 for(const [id,element]of view.nodeElements||[]){
  const node=view.nodeById.get(id);if(!nodeMedia(node))continue;const item=app.media.forNode(node),head=element.querySelector('.ia-card-head');
  if(head&&!head.querySelector('.atlas-media-menu')){
   const more=head.createEl('button',{cls:'ia-card-remove atlas-media-menu',attr:{title:'Ações da mídia','aria-label':'Ações da mídia'}});setIcon(more,'ellipsis');more.onpointerdown=event=>event.stopPropagation();more.onclick=event=>{event.stopPropagation();app.mediaUI.menu(app.media.forNode(view.nodeById.get(id)),event,view,view.nodeById.get(id))};
   const label=head.querySelector('.ia-card-title');label.title='Ctrl: prévia da nota · Duplo clique: renomear mídia';label.addEventListener('dblclick',event=>{event.preventDefault();event.stopImmediatePropagation();app.mediaUI.rename(app.media.forNode(view.nodeById.get(id)))},true);
  }
  if(head){
   const root=view.nodeById.get(node.mediaStudyNode);let toggle=head.querySelector('.atlas-media-collapse');
   if(root){if(!toggle){toggle=view.button(head,'','chevron-down',()=>view.toggleMediaStudy(view.nodeById.get(id)));toggle.addClass('atlas-media-collapse');toggle.onpointerdown=event=>event.stopPropagation()}const collapsed=node.mediaStudyCollapsed===true;toggle.textContent=collapsed?'Expandir':'Recolher';toggle.title=collapsed?'Expandir resumo e mapa':'Recolher resumo e mapa';toggle.setAttribute('aria-label',toggle.title);toggle.setAttribute('aria-expanded',String(!collapsed))}else toggle?.remove();
  }
  if(node.type==='web'){
   const session=view.webSessions?.get(id);if(!session)continue;
   if(item.type!=='web'){
    if(!session.reader?.atlasMediaInline){session.reader?.onClose();session.host.empty();const dispose=app.mediaUI.inline(session.host,item,view);session.reader={atlasMediaInline:true,node,refresh(){},applyPageZoom(){},setMarking(){},onClose(){dispose()}}}const frame=session.host.querySelector('iframe');if(frame&&frame.title!==item.title)frame.title=item.title;
    view.place(element,node);
   }else if(session.reader&&!session.reader.atlasIndependentZoom){
    const reader=session.reader;reader.atlasIndependentZoom=true;
    reader.applyPageZoom=()=>applyDocumentZoom(reader);reader.applyPageZoom();
    const pull=reader.pullEvents.bind(reader);reader.pullEvents=()=>reader.marking||reader.node.pins?.length?pull():Promise.resolve();
    const controls=session.host.querySelector('.ia-reader-toolbar');if(controls){for(const [title,icon,delta]of [['Diminuir zoom da página','minus',-.1],['Restaurar zoom da página','scan',0],['Aumentar zoom da página','plus',.1]]){const button=view.button(controls,title,icon,()=>{reader.node.mediaPageZoom=delta?Math.max(.4,Math.min(3,(reader.node.mediaPageZoom||1)+delta)):1;reader.applyPageZoom();view.changed(false)});button.onpointerdown=e=>e.stopPropagation()}}
   }
  }
 }
 if(view.viewport&&!view.viewport.dataset.mediaKeyboard){view.viewport.dataset.mediaKeyboard='true';view.viewport.addEventListener('keydown',event=>{if(event.key!=='Tab'||event.ctrlKey||event.metaKey||event.altKey||event.target.closest('input,textarea,select,[contenteditable=true]'))return;const node=view.nodeById.get(view.selected?.node),item=node&&app.media.forNode(node);if(!item)return;event.preventDefault();event.stopImmediatePropagation();if(event.repeat||view.mediaTabBusy)return;view.mediaTabBusy=true;app.mediaUI.map(item,view,node,{ensure:true,addChild:true,existingNote:event.shiftKey}).catch(error=>app.mediaError(error)).finally(()=>{view.mediaTabBusy=false})},true)}
 const add=view.contentEl.querySelector('button[data-original-label="Página"]');if(add&&!add.dataset.mediaAdd){add.dataset.mediaAdd='true';add.onclick=()=>app.mediaUI.add(view);add.setAttribute('aria-label','Página, vídeo, áudio ou PDF');add.title='Adicionar página, YouTube, Spotify ou PDF';const label=add.querySelector('span:last-child');if(label)label.textContent='Link, vídeo ou PDF'}
 if(view._atlasMediaObservedNodes!==view.nodeElements){view._atlasMediaObservedNodes=view.nodeElements;app.media.observeBoard(view.file,view.board)}
}
export function installMediaBoard(view){
 installMediaHover(view);
 view.registerDomEvent(view.contentEl,'paste',event=>{if(event.defaultPrevented||event.target.closest('input,textarea,[contenteditable=true]')||[...(event.clipboardData?.items||[])].some(item=>item.kind==='file'))return;const node=view.board.nodes.find(n=>n.id===view.selected?.node),note=view.app.vault.getFileByPath(node?.visualNote||node?.path),url=event.clipboardData?.getData('text/plain')?.trim();if(note?.extension!=='md'||!mediaSource(url))return;event.preventDefault();event.stopImmediatePropagation();view.app.noteMedia.attach(note,url).catch(error=>view.app.mediaError(error))},true);
 const prepare=view.prepareMind.bind(view);view.prepareMind=(...args)=>{const result=prepare(...args);prepareMediaVisibility(view);return result};
 const groupNodes=view.groupNodes.bind(view);view.groupNodes=ids=>{const expanded=new Set(ids);for(const id of ids){const node=view.board.nodes.find(n=>n.id===id);if(node?.mediaStudyNode)expanded.add(node.mediaStudyNode)}return groupNodes([...expanded])};
 view.onMediaReaderMounted=reader=>{if(view.app.media.forNode(reader.node)?.type!=='web')decorateMediaBoard(view)};
 view.toggleMediaStudy=node=>{if(!node||!view.nodeById.has(node.mediaStudyNode))return;view.checkpoint();node.mediaStudyCollapsed=node.mediaStudyCollapsed!==true;if(node.mediaStudyCollapsed&&view.hiddenVisualNodes?.has(view.selected?.node))view.selected={node:node.id};view.changed(true);view.render()};
 const addVisual=view.addVisualNote.bind(view);view.addMediaStudyNote=addVisual;
 view.addVisualNote=(note,pos)=>{const item=view.app.media?.byNote(note);return item?view.app.mediaUI.insert(view,item,pos):addVisual(note,pos)};
 const remove=view.removeNode.bind(view);view.removeNode=async node=>{const root=node.type==='web'&&view.board.nodes.find(n=>n.id===node.mediaStudyNode);if(!root)return remove(node);const board=view.board;(view.mediaDetachPending||=new Set()).add(root.id);try{await remove(node);if(view.board===board&&!board.nodes.includes(node)&&board.nodes.includes(root)){root.mediaSourceDetached=true;view.changed(true)}}finally{view.mediaDetachPending.delete(root.id)}};
 const open=view.openWeb.bind(view);view.openWeb=(node,pin)=>{if(pin)return open(node,pin);const item=view.app.media.forNode(node);if(item)view.app.mediaUI.open(item);else open(node,pin)};
 const importFiles=view.importFiles.bind(view);view.importFiles=async(files,pos)=>{const pdfs=files.filter(file=>file.type==='application/pdf'||/\.pdf$/i.test(file.name));for(const file of pdfs)await view.app.mediaUI.importPDF(view,file);const rest=files.filter(file=>!pdfs.includes(file));return rest.length?importFiles(rest,pos):[]};
 installMediaMotion(view);
 const notify=()=>{const scale=view.board.camera.z;if(view.mediaCameraScale!==scale){view.mediaCameraScale=scale;view.app.vault.trigger('media-scale-changed',view.viewport)}};
 view.registerEvent(view.app.vault.on('atlas-board-motion-idle',owner=>{if(owner===view){notify();view.checkMediaZoomAfterMotion()}}));
 const camera=view.camera.bind(view);view.camera=(...args)=>{const result=camera(...args);if(view.viewport)view.viewport._atlasCameraScale=view.board.camera.z;if(!view.boardMotionActive&&!view.drag){view.checkMediaZoomAfterMotion();notify()}return result};
}
