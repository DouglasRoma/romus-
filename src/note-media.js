import {Modal,Menu,Notice,setIcon} from './compat.js';
import {mediaSource} from './media-source.js';
import {firstNoteMedia,mediaMarkdown} from './note-media-format.js';
import {summaryText} from './note-content.js';
import {propertyDocument} from './property-data.js';

export function installNoteMedia(app){
 const guests=new Map();let hovered;
 const preview=(host,notePath,event)=>{
  const file=app.vault.getFileByPath(notePath);if(file?.extension!=='md'||!host.isConnected)return;
  const rect=host.getBoundingClientRect();app.workspace.trigger('hover-link',{event:event||new MouseEvent('mouseover',{ctrlKey:true,clientX:rect.left+12,clientY:rect.top+10}),targetEl:host,linktext:file.path,sourcePath:file.path});
 };
 app.noteMedia={
  register(url,notePath){const item=app.media.get(url);if(notePath&&!(item.sourceNotes||[]).includes(notePath)){(item.sourceNotes||=[]).push(notePath);app.media.touch()}return item},
  cardMarkdown(raw){const media=firstNoteMedia(summaryText(raw));return media?mediaMarkdown(media.source,media.label):null},
  prompt(accept,cancel){
   const modal=new Modal(app);modal.setTitle('Incorporar link nesta nota');modal.contentEl.createEl('p',{cls:'ia-muted',text:'Cole um link de YouTube, página web, Spotify ou PDF. A mídia aparece na nota e no seu cartão do whiteboard.'});
   const input=modal.contentEl.createEl('input',{attr:{type:'url',placeholder:'https://…','aria-label':'Link para incorporar'}});let busy=false,done=false;
   const submit=async value=>{if(busy)return;if(!mediaSource(value)){input.setCustomValidity('Cole um link http:// ou https:// válido.');input.reportValidity();return}busy=true;save.disabled=true;try{await accept(value);done=true;modal.close()}catch(error){busy=false;save.disabled=false;new Notice(error.message)}};
   const save=app.uiButton(modal.contentEl,'Incorporar link','link',()=>submit(input.value.trim()));input.oninput=()=>input.setCustomValidity('');input.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();submit(input.value.trim())}};
   input.onpaste=e=>{const url=e.clipboardData?.getData('text/plain')?.trim();if(mediaSource(url)){e.preventDefault();input.value=url;submit(url)}};
   modal.onClose=()=>{if(!done)cancel?.()};modal.open();input.focus();return modal;
  },
  async attach(note,url){
   if(note?.extension!=='md')throw Error('Vincule uma nota antes de incorporar a mídia.');await app.flushAll();const item=app.noteMedia.register(url,note.path);
   await app.vault.process(note,raw=>{const doc=propertyDocument(raw),existing=firstNoteMedia(doc.body);if(existing?.key===item.key)return raw;const title=doc.body.match(/^# [^\r\n]+(?:\r?\n)*/)?.[0]||'',embed=mediaMarkdown(item.source,item.title);return raw.slice(0,raw.length-doc.body.length)+title+'\n'+embed+'\n\n'+doc.body.slice(title.length)});
   for(const leaf of app.workspace.getLeavesOfType('image-atlas-board'))leaf.view.renderNotes(note.path);app.media.metadata(item);return item;
  },
  pickForNode(view,node){const note=app.vault.getFileByPath(node.visualNote||node.path);return app.noteMedia.prompt(url=>app.noteMedia.attach(note,url))},
  mount(host,url,{notePath,onRemove,item:existingItem}={}){
   const item=existingItem||app.noteMedia.register(url,notePath),view=app.workspace.getLeavesOfType('image-atlas-board').find(leaf=>leaf.containerEl.contains(host))?.view;
   host.classList.add('atlas-note-media');host.dataset.mediaId=item.id;host.dataset.notePath=notePath||'';
   if(host.closest('.ia-review-note-preview:not([data-editing])')){host.classList.add('atlas-note-media-summary');host.createEl('span',{text:item.title});app.uiButton(host,'Abrir mídia ao lado','panel-right-open',()=>app.mediaUI.open(item,'side',view,{notePath}));const off=app.vault.on('media-changed',()=>{if(!app.media.items.has(item.id))host.remove()});return()=>{off();host.empty()}}
   let disposed=false,guestId;
   const dispose=app.mediaUI.inline(host,item,view,{notePath,onGuest(id){guestId=id;guests.set(id,{host,notePath});window.atlasNative.call('media:register-guest',id).catch(()=>{})}});
   const controls=host.querySelector('.atlas-media-inline-actions');
   const trash=controls.createEl('button',{attr:{title:'Excluir mídia de todo o aplicativo','aria-label':'Excluir mídia de todo o aplicativo'}});setIcon(trash,'trash-2');trash.onclick=()=>app.mediaUI.remove(item);
   const menu=event=>{event.preventDefault?.();event.stopPropagation?.();const menu=new Menu();for(const [title,run]of [['Abrir em janela',()=>app.mediaUI.open(item,'modal',view,{notePath})],['Abrir ao lado',()=>app.mediaUI.open(item,'side',view,{notePath})],['Tela cheia',()=>app.mediaUI.open(item,'fullscreen',view,{notePath})],...(onRemove?[['Remover incorporação desta nota',onRemove]]:[]),['Excluir mídia de todo o aplicativo',()=>app.mediaUI.remove(item)]])menu.addItem(i=>i.setTitle(title).onClick(()=>Promise.resolve(run()).catch(e=>new Notice(e.message))));const r=host.getBoundingClientRect();menu.showAtPosition({x:event.clientX||r.left+10,y:event.clientY||r.top+10})};
   host.addEventListener('contextmenu',menu);host.querySelector('webview')?.addEventListener('context-menu',menu);
   const over=event=>{hovered={host,notePath};if(event.ctrlKey||event.metaKey)preview(host,notePath,event)};host.addEventListener('pointerover',over);host.addEventListener('pointermove',over);const leave=()=>{if(hovered?.host===host)hovered=null};host.addEventListener('pointerleave',leave);
   const stop=event=>event.stopPropagation();host.addEventListener('pointerdown',stop);
   const off=app.vault.on('media-changed',()=>{if(!app.media.items.has(item.id)){cleanup();host.remove()}});
   function cleanup(){if(disposed)return;disposed=true;off();if(guestId)guests.delete(guestId);leave();host.removeEventListener('contextmenu',menu);host.removeEventListener('pointerover',over);host.removeEventListener('pointermove',over);host.removeEventListener('pointerleave',leave);host.removeEventListener('pointerdown',stop);dispose()}
   return cleanup;
  }
 };
 window.addEventListener('keydown',event=>{if(['Control','Meta'].includes(event.key)&&!event.repeat&&hovered)preview(hovered.host,hovered.notePath,event)});
 window.atlasNative.onMediaPreview?.((id,active)=>{const target=guests.get(id);if(!target)return;if(active)preview(target.host,target.notePath);else app.closeHoverPreview?.()});
 app.vault.on('rename',(file,old)=>{for(const item of app.media.items.values())if(item.sourceNotes?.includes(old)){item.sourceNotes=item.sourceNotes.map(path=>path===old?file.path:path);app.media.touch()}});
}
