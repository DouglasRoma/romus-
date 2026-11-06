import {prepareMediaBoard,decorateMediaBoard,installMediaBoard} from './media-board.js';
import {Component,MarkdownRenderer,Notice,setIcon} from './compat.js';
import {propertyDocument} from './property-data.js';
import {summaryText} from './note-content.js';
import {createBoardNote,installBoardNoteActions} from './board-note-actions.js';
import {openBoardSummary} from './board-summary.js';
import {installBoardColors} from './board-colors.js';
import {installSubboardPreview} from './subboard-preview.js';
import {BoardNoteContent} from './board-note-content.js';
import {installBoardMotion} from './board-motion.js';
import {installBoardFind} from './board-find.js';
import {installBoardNoteEditor} from './board-note-editor.js';

/** Restyle original controls; callbacks, undo, layout and persistence stay in the engine. */
export function decorateBoard(view) {
  view.decorateCardColors?.();
  decorateNoteShortcuts(view);
  view.noteContent?.sync();
  const toolbar = view.contentEl.querySelector('.ia-toolbar');
  if (!toolbar) return;
  if (toolbar.dataset.atlasRefined) {
    const name=toolbar.querySelector('.atlas-board-name'),text=view.board.title||view.file?.basename||'Whiteboard';if(name.textContent!==text)name.textContent=text;
    updateModes(view);decorateMediaBoard(view); return;
  }
  toolbar.dataset.atlasRefined='true';
  const controls=new Map([...toolbar.querySelectorAll(':scope > button')].map(button=>[button.textContent.trim(),button]));
  for(const [label,button] of controls){button.dataset.originalLabel=label;button.setAttribute('aria-label',label);button.title=label}
  toolbar.querySelector('.ia-brand')?.remove();
  const title=toolbar.createEl('button',{cls:'atlas-board-heading',attr:{title:'Renomear whiteboard','aria-label':'Título do whiteboard'}});
  const glyph=title.createSpan();setIcon(glyph,'panels-top-left');title.createSpan({cls:'atlas-board-name',text:view.board.title||view.file?.basename||'Whiteboard'});
  title.onclick=()=>controls.get('Renomear whiteboard')?.click(); toolbar.prepend(title);
  const menu=(label,icon,labels)=>{
    const details=toolbar.createEl('details',{cls:'atlas-tool-menu'}),summary=details.createEl('summary',{attr:{'aria-label':label}});
    const glyph=summary.createSpan();setIcon(glyph,icon);summary.createSpan({text:label});
    const panel=details.createDiv({cls:'atlas-tool-menu-panel'});
    for(const text of labels){const button=controls.get(text);if(button)panel.append(button)}
    panel.addEventListener('click',event=>{if(event.target.closest('button'))details.open=false});
    return details;
  };
  const addMenu=menu('Adicionar','plus',['Mapa mental','Adicionar nota existente','Imagem','Subwhiteboard','Página','Importar']);
  const create=view.button(addMenu.querySelector('.atlas-tool-menu-panel'),'Nova nota','file-plus',()=>createBoardNote(view));addMenu.querySelector('.atlas-tool-menu-panel').prepend(create);
  const study=controls.get('Estudar todos os flashcards');
  const summary=view.button(toolbar,'Resumo','notebook-pen',()=>openBoardSummary(view));summary.classList.add('atlas-board-summary-button');summary.title='Ler ou editar o resumo deste whiteboard';
  if(study){study.classList.add('atlas-study-primary');study.querySelector('span:last-child').textContent='Estudar';toolbar.append(study)}
  const details=controls.get('Detalhes');if(details){details.classList.add('atlas-icon-button');toolbar.append(details)}
  const more=menu('Mais opções','ellipsis',['Buscar notas e mapas','Renomear whiteboard','Criar grupo','Colocar / retirar do grupo','Mostrar mapas existentes']);
  const dock=view.contentEl.querySelector('.ia-body').createDiv({cls:'atlas-canvas-tools',attr:{role:'toolbar','aria-label':'Ferramentas do quadro'}});
  for(const label of ['Mover','Conectar','Alfinete','Área','Desfazer','Refazer','Enquadrar']){const button=controls.get(label);if(button){button.classList.add('atlas-icon-button');dock.append(button)}}
  const back=controls.get('Voltar ao quadro anterior');if(back){back.classList.add('atlas-icon-button');toolbar.insertBefore(back,title)}
  // Move the real controls once; keep their handlers, labels and engine state.
  const context=toolbar.createDiv({cls:'romus-board-context'});if(back)context.append(back);context.append(title);
  const actions=toolbar.createDiv({cls:'romus-board-actions'});actions.append(summary);if(study)actions.append(study);if(details)actions.append(details);actions.append(more);
  dock.prepend(addMenu);
  const cameraTools=view.contentEl.querySelector('.ia-body').createDiv({cls:'romus-canvas-secondary',attr:{role:'toolbar','aria-label':'Visualização e histórico do quadro'}});
  for(const label of ['Enquadrar','Desfazer','Refazer']){const control=controls.get(label);if(control)cameraTools.append(control)}
  updateModes(view);decorateMediaBoard(view);
}
function decorateNoteShortcuts(view){
 for(const [id,element]of view.nodeElements||[]){
  const node=view.nodeById?.get(id),path=node?.visualNote||(node?.path?.endsWith('.md')?node.path:'');if(!path)continue;
  element.dataset.atlasNotePath=path;if(element.dataset.atlasSplitReady)continue;element.dataset.atlasSplitReady='true';
  const open=async()=>{try{await view.finishCardEditing();const file=view.app.metadataCache.getFirstLinkpathDest(element.dataset.atlasNotePath,view.file.path);if(!file)return;let leaf=view.leaf.splitPartner;if(leaf?.view?.file?.path===file.path)await view.app.workspace.revealLeaf(leaf);else{leaf=view.app.workspace.getLeaf('split');await leaf.openFile(file)}}catch(error){new Notice(error.message)}};
  const head=element.querySelector('.ia-card-head');if(head){const button=head.createEl('button',{cls:'ia-card-remove atlas-open-beside',attr:{title:'Abrir nota ao lado · Alt+clique no cartão','aria-label':'Abrir nota ao lado'}});setIcon(button,'panel-right-open');button.onpointerdown=event=>event.stopPropagation();button.onclick=event=>{event.stopPropagation();open()}}
  element.addEventListener('pointerdown',event=>{if(event.altKey&&!event.target.closest('button')){event.preventDefault();event.stopImmediatePropagation();open()}},true);
  element.addEventListener('dblclick',event=>{if(node.mediaFile&&event.target.closest('.ia-card-head'))return;if(event.target.closest('button,a,input,textarea,.ia-resize,[contenteditable=true],.romus-card-editor'))return;if(node.type!=='note'&&!event.target.closest('.ia-note-content'))return;event.preventDefault();event.stopImmediatePropagation();view.editCardNote(node,event).catch(error=>new Notice(error.message))},true);
 }
}
function updateModes(view){for(const button of view.contentEl.querySelectorAll('.atlas-canvas-tools button')){const mode={'Mover':'select','Conectar':'connect','Alfinete':'pin','Área':'area'}[button.dataset.originalLabel];if(mode){button.classList.toggle('is-active',mode===view.mode);button.setAttribute('aria-pressed',String(mode===view.mode))}}}

export function installBoardAppearance(app){
  const original=app.factories.get('image-atlas-board');if(!original)return;
  app.factories.set('image-atlas-board',leaf=>{
    const view=original(leaf),render=view.render.bind(view);installBoardMotion(view);installMediaBoard(view);installBoardNoteActions(view);installBoardColors(view);installSubboardPreview(view);installBoardFind(view);installBoardNoteEditor(view);
    const summaries=new Map();let summaryBytes=0;
    const summaryFor=(key,raw)=>{let value=summaries.get(key);if(value)return value;const media=view.app.noteMedia?.cardMarkdown(raw)||null,text=summaryText(propertyDocument(raw).body).slice(0,32001);value={media,text};summaries.set(key,value);summaryBytes+=text.length;while(summaries.size>100||summaryBytes>2e6){const [old,item]=summaries.entries().next().value;summaries.delete(old);summaryBytes-=item.text.length}return value};
    view.register(()=>summaries.clear());
    // Initialize after the first board render has created its viewport.
    // Keep the engine's lazy preview queue/cache, but show only the user's summary.
    view.notePreview=async(path,el)=>{
      if(el._romusContent)return;
      if(view.deferBoardWork(el,()=>{if(el.isConnected)view.queueNotePreview(path,el)}))return;
      const mediaNode=view.nodeById?.get(el.closest('[data-atlas-node-id]')?.dataset.atlasNodeId);if(mediaNode?.mediaFile&&view.app.mediaUI){el.classList.add('romus-preview-player');const item=view.app.media.forNode(mediaNode);if(el.dataset.mediaInline!==item.id||!view.previews.has(el)){const previous=view.previews.get(el);if(previous){view.removeChild(previous);view.previews.delete(el)}el.dataset.mediaInline=item.id;const child=new Component();view.addChild(child);view.previews.set(el,child);child.register(view.app.mediaUI.inline(el,item,view))}return}
      const clear=()=>{const previous=view.previews.get(el);if(previous){view.removeChild(previous);view.previews.delete(el)}el.empty();el._atlasMediaMarkdown=null};
      const token=Symbol('summary'),generation=view.previewGeneration;el._atlasToken=token;el.setAttribute('data-ia-source',path);
      if(el.classList.contains('ia-note-content')&&view.board.camera.z<.35&&!el._atlasMediaMarkdown){if(view.previews.has(el))return;clear();el._atlasRequested=false;el.createSpan({text:'Resumo · amplie para ler',cls:'ia-muted'});return}
      const file=view.app.vault.getFileByPath(path);if(!file){clear();el.createEl('p',{text:'Nota não encontrada.'});return}
      const summaryKey=path+':'+file.stat.mtime+':'+file.stat.size;if(el._romusSummaryKey===summaryKey&&view.previews.has(el))return;
      try{
       const raw=await view.readNote(file);if(el._romusContent||!el.isConnected||el._atlasToken!==token||view.previewGeneration!==generation)return;
       if(view.deferBoardWork(el,()=>{if(el.isConnected)view.queueNotePreview(path,el)}))return;
       const compact=el.classList.contains('ia-note-content'),summary=summaryFor(summaryKey,raw),media=compact?summary.media:null;el.classList.toggle('romus-preview-player',!!media);
       // A summary/FSRS edit must not reload an unchanged video in this card.
       if(media&&el._atlasMediaMarkdown===media&&view.previews.has(el)&&el.querySelector('.atlas-note-media'))return;
       clear();el._atlasMediaMarkdown=media;el._romusSummaryKey=summaryKey;const child=new Component();view.addChild(child);view.previews.set(el,child);let text=media||summary.text,limit=compact?8000:32000;const truncated=text.length>limit;text=text.slice(0,limit);await MarkdownRenderer.render(view.app,text,el,path,child);if(truncated)el.createEl('a',{cls:'internal-link ia-muted',text:'Abrir nota completa',attr:{href:'#','data-href':path}})
      }catch{if(el.isConnected&&el._atlasToken===token){clear();el.createEl('p',{text:'Não foi possível carregar a nota.'})}}
    };
    view.render=(...args)=>{const editing=view.cardEditorHasFocus();prepareMediaBoard(view);view.subboardPreviewRevision=(view.subboardPreviewRevision||0)+1;const result=render(...args);view.syncCardEditor();if(!view.noteContent&&view.viewport)view.noteContent=new BoardNoteContent(view);decorateBoard(view);if(editing)view.focusCardEditor();if(view.file)app.vault.trigger('atlas-board-preview-changed',view.file.path);return result};return view;
  });
}
