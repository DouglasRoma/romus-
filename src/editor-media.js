import {Notice} from './compat.js';
import {mediaSource} from './media-source.js';
import {mediaMarkdown,MEDIA_MARKER} from './note-media-format.js';

// A delayed clipboard/dialog operation follows the selection as the text changes.
function insertion(owner){
 const rich=owner.editorMode==='formatted'?owner.formatted?.editor:null;
 if(rich){let bookmark=rich.state.selection.getBookmark();const map=({transaction})=>{bookmark=bookmark.map(transaction.mapping)};rich.on('transaction',map);return{put(item){if(rich.isDestroyed)return;const at=bookmark.resolve(rich.state.doc);rich.commands.insertContentAt({from:at.from,to:at.to},[{type:'image',attrs:{src:item.source,alt:item.title,title:MEDIA_MARKER}},{type:'paragraph'}]);rich.view.dom.focus({preventScroll:true})},dispose(){rich.off('transaction',map)}}}
 const input=owner.sourceInput;let value=input.value,start=input.selectionStart,end=input.selectionEnd;
 const map=()=>{const next=input.value;let left=0;while(left<value.length&&left<next.length&&value[left]===next[left])left++;let a=value.length,b=next.length;while(a>left&&b>left&&value[a-1]===next[b-1]){a--;b--}const move=p=>p<=left?p:p>=a?p+b-a:b;start=move(start);end=move(end);value=next};input.addEventListener('input',map);
 return{put(item){input.setRangeText('\n'+mediaMarkdown(item.source,item.title)+'\n',start,end,'end');input.dispatchEvent(new Event('input',{bubbles:true}));input.focus({preventScroll:true})},dispose(){input.removeEventListener('input',map)}};
}
export function installEditorMedia(owner){
 const jobs=owner.imageJobs;
 const add=(url,position=insertion(owner))=>{
  const file=owner.file;const job=(async()=>{try{const item=owner.app.noteMedia.register(url,file.path);if(owner.file!==file)return;position.put(item);owner.status.textContent='Mídia incorporada';owner.queueSave();owner.app.media.metadata(item)}catch(error){owner.status.textContent=error.message;new Notice(error.message);throw error}finally{position.dispose()}})();jobs.add(job);job.finally(()=>jobs.delete(job)).catch(()=>{});return job;
 };
 const paste=event=>{
  if(event.defaultPrevented||owner.editorMode==='preview'||!event.target.closest('.atlas-rich-editor,.atlas-source-input'))return;
  if([...(event.clipboardData?.items||[])].some(item=>item.kind==='file'))return;
  const text=event.clipboardData?.getData('text/plain')?.trim();if(!text||/\s/.test(text)||!mediaSource(text))return;
  const rich=owner.editorMode==='formatted'?owner.formatted?.editor:null;if(rich?.isActive('codeBlock')||rich?.isActive('code'))return;
  // Pasting over selected words still creates an ordinary text link.
  if(rich&&!rich.state.selection.empty||owner.editorMode==='source'&&owner.sourceInput.selectionStart!==owner.sourceInput.selectionEnd)return;
  event.preventDefault();event.stopPropagation();add(text).catch(()=>{});
 };
 owner.contentEl.addEventListener('paste',paste,true);
 return{add,pick(){const position=insertion(owner);return owner.app.noteMedia.prompt(url=>add(url,position),()=>position.dispose())},dispose(){owner.contentEl.removeEventListener('paste',paste,true)}};
}
