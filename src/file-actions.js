import {Modal,Menu,Notice,normalizePath,setIcon} from './compat.js';
import {PropertiesModal} from './properties.js';
import {NoteConnections} from './note-connections.js';
const safeName=name=>name.replace(/[\\/:*?"<>|]/g,' ').trim();
export function installFileActions(app){
 app.moveNoteToFolder=async(file,folder)=>{
  if(app.vault.getFileByPath(file.path)!==file||file.extension!=='md'||!app.noteCatalog.isMainNote(file))throw Error('Escolha uma nota da sua biblioteca.');
  if(typeof folder!=='string'||folder.split('/').some(part=>part==='..')||/[\\:*?"<>|]/.test(folder))throw Error('Pasta de destino inválida.');
  folder=normalizePath(folder);if(folder===(app.preferences.notesFolder||'Notas')&&!app.vault.folders.has(folder))await app.vault.createFolder(folder);if(folder&&!app.vault.folders.has(folder))throw Error('A pasta de destino não existe mais.');const path=(folder?folder+'/':'')+file.name;if(path===file.path)return false;
  if(app.vault.getFileByPath(path))throw Error('Já existe uma nota com esse nome na pasta. Renomeie uma delas antes de mover.');
  await app.flushAll();await app.fileManager.renameFile(file,path);app.noteCatalog.rememberFolder(folder);app.renderFiles();return true;
 };
 app.copyNoteLink=async file=>{await navigator.clipboard.writeText(app.fileManager.generateMarkdownLink(file,file.path));new Notice('Link da nota copiado.')};
 app.showNoteConnections=async file=>{await app.flushAll();new NoteConnections(app,file).open()};
 app.showNoteMenu=(file,event)=>{
  const media=app.media?.byNote(file);if(media)return app.mediaUI.menu(media,event);
  const menu=new Menu();
  menu.addItem(item=>item.setTitle('Abrir em outra aba').onClick(()=>app.workspace.getLeaf('tab').openFile(file)));
  menu.addItem(item=>item.setTitle('Abrir ao lado').onClick(()=>app.workspace.getLeaf('split').openFile(file)));
  menu.addItem(item=>item.setTitle('Copiar link [[nota]]').onClick(()=>app.copyNoteLink(file).catch(error=>new Notice(error.message))));
  menu.addItem(item=>item.setTitle('Ver conexões e backlinks').onClick(()=>app.showNoteConnections(file).catch(error=>new Notice(error.message))));menu.addSeparator();
  menu.addItem(item=>item.setTitle('Renomear nota').onClick(()=>app.renameNote(file)));
  menu.addItem(item=>item.setTitle('Mover para pasta…').onClick(()=>app.moveNote(file)));
  menu.addItem(item=>item.setTitle('Propriedades').onClick(()=>new PropertiesModal(app,file).open()));menu.addSeparator();
  menu.addItem(item=>item.setTitle('Excluir nota').onClick(()=>app.deleteFile(file)));menu.el.lastElementChild.addClass('mod-warning');
  if(event?.currentTarget?.matches?.('button')){const rect=event.currentTarget.getBoundingClientRect();menu.showAtPosition({x:rect.right-220,y:rect.bottom+5})}else menu.showAtMouseEvent(event);return menu;
 };
 app.createFolder=(parent=app.preferences.notesFolder||'Notas')=>{
  const modal=new Modal(app);modal.setTitle('Criar pasta');modal.contentEl.createEl('p',{cls:'ia-muted',text:'Dentro de: '+(parent||'Biblioteca')});const input=modal.contentEl.createEl('input',{attr:{placeholder:'Nome da pasta','aria-label':'Nome da pasta'}});
  const save=modal.contentEl.createEl('button',{text:'Criar pasta',cls:'mod-cta'});save.onclick=async()=>{try{const name=safeName(input.value);if(!name)return;const path=normalizePath((parent?parent+'/':'')+name);await app.vault.createFolder(path);app.noteCatalog.rememberFolder(path);modal.close();app.renderFiles();}catch(error){new Notice(error.message)}};input.onkeydown=event=>{if(event.key==='Enter'){event.preventDefault();save.click()}};modal.open();input.focus();
 };
 app.moveNote=file=>{
  const modal=new Modal(app);modal.setTitle('Mover · '+file.basename);modal.contentEl.createEl('p',{cls:'ia-muted',text:'Os vínculos e o histórico da nota serão mantidos.'});const select=modal.contentEl.createEl('select',{attr:{'aria-label':'Pasta de destino'}}),root=app.preferences.notesFolder||'Notas';select.createEl('option',{text:'Notas (sem pasta)',attr:{value:root}});
  const seen=new Set();for(const folder of [...app.vault.folders].filter(f=>app.noteCatalog.isUserFolder(f)).sort()){const label=app.noteCatalog.sidebarFolder(folder);if(!label||seen.has(label))continue;seen.add(label);select.createEl('option',{text:label,attr:{value:folder}})}const parent=file.path.split('/').slice(0,-1).join('/');select.value=[...select.options].some(option=>option.value===parent)?parent:root;
  const move=modal.contentEl.createEl('button',{text:'Mover nota',cls:'mod-cta'});move.onclick=async()=>{move.disabled=true;try{await app.moveNoteToFolder(file,select.value);modal.close()}catch(error){new Notice(error.message);move.disabled=false}};modal.open();
 };
 app.deleteFile=file=>{
  const modal=new Modal(app);modal.setTitle('Excluir '+(file.extension==='imageboard'?'quadro':'nota'));modal.contentEl.createEl('p',{text:`Mover “${file.basename}” para a lixeira?`});modal.contentEl.createEl('p',{cls:'ia-muted',text:file.extension==='imageboard'?'As notas e suas revisões não serão excluídas.':'A nota pode ser restaurada pela lixeira. Os cartões de outros quadros poderão indicar que ela não foi encontrada.'});
  const actions=modal.contentEl.createDiv({cls:'ia-modal-actions'}),cancel=actions.createEl('button',{text:'Cancelar'});cancel.onclick=()=>modal.close();const remove=actions.createEl('button',{text:'Mover para a lixeira',cls:'mod-warning'});
  remove.onclick=async()=>{remove.disabled=true;try{await app.flushAll();if(app.boardSummaryModal?.file===file&&!await app.boardSummaryModal.close())throw Error('Salve o resumo antes de excluir.');for(const leaf of [...app.workspace.leaves])if(leaf.view?.file===file||leaf.view?.boardFile===file||leaf.view?.note===file)await leaf.close();await app.vault.trash(file);modal.close();app.renderFiles();new Notice('Movido para a lixeira.')}catch(error){remove.disabled=false;new Notice(error.message)}};modal.open();
 };
 app.openTrash=()=>{
  const modal=new Modal(app);modal.setTitle('Lixeira');modal.contentEl.createEl('p',{cls:'ia-muted',text:'Restaure um item ou exclua seu arquivo definitivamente.'});const list=modal.contentEl.createDiv({cls:'atlas-trash-list'});
  const load=async()=>{
   const entries=await window.atlasNative.call('trash:list');if(!modal.containerEl.isConnected)return;list.empty();
   if(!entries.length)list.createEl('p',{cls:'ia-muted',text:'A lixeira está vazia.'});
   for(const entry of entries){
    const row=list.createDiv({cls:'atlas-trash-row'}),label=row.createDiv({cls:'atlas-trash-label'});label.createEl('strong',{text:entry.title||entry.path.split('/').pop().replace(/\.(md|imageboard)$/i,'')});label.createEl('small',{text:entry.kind==='media'?'Mídia removida da biblioteca e dos quadros':entry.path.endsWith('.md')?'Nota':entry.path.endsWith('.imageboard')?'Whiteboard':entry.path.split('/').pop()});
    const actions=row.createDiv({cls:'atlas-trash-actions'}),restore=actions.createEl('button',{text:'Restaurar'}),remove=actions.createEl('button',{text:'Excluir definitivamente',cls:'mod-warning'});
    restore.onclick=async()=>{restore.disabled=remove.disabled=true;try{await window.atlasNative.call('trash:restore',entry.id);await app.vault.refreshCatalog();if(entry.kind==='media')await app.media.restoreSnapshot(JSON.parse(await window.atlasNative.call('read',entry.path)));else{const file=app.vault.getFileByPath(entry.path);if(file)app.vault.trigger('create',file);}app.renderFiles();await load()}catch(error){restore.disabled=remove.disabled=false;new Notice(error.message)}};
    remove.onclick=()=>{
     const confirm=new Modal(app);confirm.setTitle('Excluir definitivamente');confirm.contentEl.createEl('p',{text:`Excluir “${entry.title||entry.path.split('/').pop().replace(/\.(md|imageboard)$/i,'')}” permanentemente?`});confirm.contentEl.createEl('p',{cls:'ia-muted',text:'O arquivo e sua cópia de segurança nesta lixeira serão apagados. Esta ação não pode ser desfeita.'});const buttons=confirm.contentEl.createDiv({cls:'ia-modal-actions'}),cancel=buttons.createEl('button',{text:'Cancelar'}),erase=buttons.createEl('button',{text:'Excluir definitivamente',cls:'mod-warning'});cancel.onclick=()=>confirm.close();erase.onclick=async()=>{erase.disabled=true;try{await window.atlasNative.call('trash:purge',entry.id);confirm.close();await load();new Notice('Item excluído definitivamente.')}catch(error){erase.disabled=false;new Notice(error.message)}};confirm.open();
    };
   }
  };modal.open();load().catch(error=>new Notice(error.message));
 };
}
