import {Notice,setIcon} from './compat.js';
import {attachWikiLinks} from './wiki-links.js';
import {changeFlashcard,undoFlashcardRemoval} from './flashcard-source.js';

export function installReviewInteractions(app){
 const surfaces=new Set(),typing=new WeakMap();let writing=Promise.resolve();
 const serialize=fn=>{const result=writing.catch(()=>{}).then(fn);writing=result;return result};
 async function refresh(entry,deleted=false){
  for(const view of surfaces){
   if(!view.alive||!view.entries.some(e=>e.deckId===entry.deckId))continue;
   const current=view.current(),oldIndex=view.position,data=await app.plugin.loadReviewEntries(view.spec),byId=new Map(data.entries.map(e=>[e.id,e]));
   const oldQueue=view.queue,priorRemoved=oldQueue.slice(0,oldIndex).filter(item=>!byId.has(item.entry.id)).length;
   view.entries=data.entries;view.queue=oldQueue.filter(item=>byId.has(item.entry.id)).map(item=>{item.entry=byId.get(item.entry.id);return item});
   const same=current&&view.queue.findIndex(item=>item.entry.id===current.entry.id);view.position=same>=0?same:Math.min(Math.max(0,oldIndex-priorRemoved),view.queue.length);
   const cached=view.cache.get(entry.id);if(cached){cached.component.unload();cached.el.remove();view.cache.delete(entry.id)}
   if(current?.entry.id===entry.id||!current)await view.show();else{view.updateStats();view.number.textContent=`${Math.min(view.position+1,view.queue.length)} de ${view.queue.length}`;view.next.disabled=view.position>=view.queue.length}
  }
 }
 async function mutate(entry,values){
  const saved=await changeFlashcard(app,entry,values),store=app.plugin.getReviewStore();
  if(values){entry.record.question=saved.values.question;entry.record.answer=saved.values.answer;entry.question=saved.values.question;entry.answer=saved.values.answer}else entry.record.active=false;
  store.touch(store.decks.get(entry.deckId));await refresh(entry,!values);return saved;
 }
 function wirePanel(view,panel){
  if(panel._atlasInline)return;panel._atlasInline=true;
  panel.input.spellcheck=false;panel.input.autocomplete='off';panel.input.setAttribute('autocorrect','off');
  for(const [field,selector,label]of [['question','.ia-flash-question','pergunta'],['answer','.ia-flash-answer','resposta']]){
   const host=panel.el.querySelector(selector);host.title=`Clique para editar a ${label}`;host.classList.add('atlas-editable-flashcard');host.tabIndex=0;
   const open=event=>{
    if(view.inlineCardEditor?.active||event.ctrlKey||event.metaKey||event.shiftKey||event.target.closest('a,button,img,textarea,iframe,webview')||!getSelection()?.isCollapsed)return;
    if(event.type==='keydown'&&!['Enter','F2'].includes(event.key))return;
    if(view.current()?.entry.id!==panel.item.entry.id)return;event.preventDefault();event.stopPropagation();
    const item=view.current(),entry=item.entry,original=entry[field],body=document.createElement('div');body.className='atlas-inline-card-editor';
    const text=body.createEl('textarea',{value:original,attr:{'aria-label':'Editar '+label,rows:field==='question'?'3':'5',spellcheck:'false'}}),tools=body.createDiv({cls:'atlas-inline-card-tools'}),status=tools.createSpan({cls:'ia-muted',text:'Markdown · Ctrl+Enter salva · Esc cancela',attr:{role:'status'}});
    const previous=[...host.childNodes];host.replaceChildren(body);let active=true,pending;
    const file=app.vault.getFileByPath(entry.sourcePath),wiki=file?.extension==='md'?attachWikiLinks({input:text,app,file,status}):null;
    const state=view.inlineCardEditor={active:true,cancel,save};
    const draftGuard={async save(){if(!await save())throw Error('Conclua ou cancele a edição do flashcard antes de fechar.')}};(app.embeddedEditors||=new Set()).add(draftGuard);
    function cancel(){if(pending)return;active=state.active=false;wiki?.dispose();app.embeddedEditors.delete(draftGuard);host.replaceChildren(...previous);if(view.inlineCardEditor===state)view.inlineCardEditor=null}
    async function save(){
     if(pending)return pending;if(!active)return true;if(text.value===original){cancel();return true}
     status.textContent='Salvando…';const values={question:entry.question,answer:entry.answer,[field]:text.value};
     pending=serialize(async()=>{try{await mutate(entry,values);active=state.active=false;wiki?.dispose();app.embeddedEditors.delete(draftGuard);if(view.inlineCardEditor===state)view.inlineCardEditor=null;return true}catch(error){status.textContent=error.message;text.focus({preventScroll:true});return false}});
     const ok=await pending;pending=null;return ok;
    }
    const saveButton=app.uiButton(tools,'Salvar','check',save),cancelButton=app.uiButton(tools,'Cancelar','x',cancel);
    for(const button of [saveButton,cancelButton])button.onpointerdown=e=>e.preventDefault();
    text.addEventListener('keydown',e=>{if(e.isComposing)return;if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();cancel();host.focus({preventScroll:true})}else if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();e.stopImmediatePropagation();save()}});
    text.addEventListener('blur',()=>queueMicrotask(()=>{if(active&&!body.contains(document.activeElement))save()}));text.focus({preventScroll:true});text.setSelectionRange(text.value.length,text.value.length);
   };
   host.addEventListener('click',open);host.addEventListener('keydown',open);
  }
 }
 app.reviewInteractions={
  scheduleTyping(editor,input){let state=typing.get(editor);if(!state){state={};typing.set(editor,state)}clearTimeout(state.timer);state.timer=setTimeout(()=>{if(editor.alive&&input.isConnected){editor.resizeInput(input);editor.updateCount()}},160)},
  install(view){
   if(view._atlasInteractions)return;view._atlasInteractions=true;surfaces.add(view);
   const panel=view.panel.bind(view);view.panel=async item=>{const value=await panel(item);wirePanel(view,value);return value};
   let lastRemoval;const nav=view.host.querySelector('.ia-fsrs-navigation');nav.style.flexWrap='wrap';const remove=app.uiButton(nav,'Remover flashcard','trash-2',async()=>{
    if(view._atlasRemoving)return;if(view.inlineCardEditor?.active&&!await view.inlineCardEditor.save())return;const entry=view.current()?.entry;if(!entry)return;
    view._atlasRemoving=true;remove.disabled=true;try{lastRemoval=await serialize(()=>mutate(entry,null));undo.hidden=false;message.textContent='Flashcard removido.'}catch(error){new Notice(error.message)}finally{view._atlasRemoving=false;remove.disabled=!view.current()}
   });remove.classList.add('atlas-remove-review-card');
   const footer=view.host.createDiv({cls:'atlas-card-removal-status'}),message=footer.createSpan({attr:{role:'status'}}),undo=app.uiButton(footer,'Desfazer remoção','undo',async()=>{const saved=lastRemoval;if(!saved)return;undo.disabled=true;try{await serialize(async()=>{await undoFlashcardRemoval(app,saved);saved.entry.record.active=true;app.plugin.getReviewStore().touch(app.plugin.getReviewStore().decks.get(saved.entry.deckId));await refresh(saved.entry);lastRemoval=null});undo.hidden=true;message.textContent='Flashcard restaurado.';await view.load({preserveSession:true})}catch(error){new Notice(error.message)}finally{undo.disabled=false}});undo.hidden=true;
   const show=view.show.bind(view);view.show=async(...args)=>{const result=await show(...args);remove.disabled=!view.current();return result};
   for(const method of ['move','reveal','grade','start','editCurrent','addCards','openSummary','load']){const original=view[method].bind(view);view[method]=(...args)=>view.inlineCardEditor?.active?view.inlineCardEditor.save().then(ok=>ok?original(...args):undefined):original(...args)}
   const close=view.onClose.bind(view);view.onClose=async()=>{if(view.inlineCardEditor?.active&&!await view.inlineCardEditor.save())throw Error('Salve ou cancele a edição do flashcard antes de fechar.');surfaces.delete(view);return close()};
  }
 };
}
