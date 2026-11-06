import {Notice} from './compat.js';

const extensions={'image/png':'png','image/jpeg':'jpg','image/webp':'webp','image/gif':'gif','image/avif':'avif','image/bmp':'bmp','image/svg+xml':'svg'};
// Store attachments in the library, so pasted images survive closing and exporting.
export function installEditorImages(owner){
 const app=owner.app,jobs=new Set();owner.imageJobs=jobs;
 const capture=()=>{
  const rich=owner.editorMode==='formatted'?owner.formatted?.editor:null;
  if(rich){let bookmark=rich.state.selection.getBookmark();const map=({transaction})=>{bookmark=bookmark.map(transaction.mapping)};rich.on('transaction',map);return{insert(files){if(rich.isDestroyed)return;const selection=bookmark.resolve(rich.state.doc);rich.commands.insertContentAt({from:selection.from,to:selection.to},files.map(file=>({type:'image',attrs:{src:app.vault.getResourcePath(file),alt:file.basename}})))},dispose(){rich.off('transaction',map)}}}
  const input=owner.sourceInput;let value=input.value,start=input.selectionStart,end=input.selectionEnd;
  const map=()=>{const next=input.value;let left=0;while(left<value.length&&left<next.length&&value[left]===next[left])left++;let oldEnd=value.length,newEnd=next.length;while(oldEnd>left&&newEnd>left&&value[oldEnd-1]===next[newEnd-1]){oldEnd--;newEnd--}const delta=newEnd-oldEnd;const move=pos=>pos<=left?pos:pos>=oldEnd?pos+delta:newEnd;start=move(start);end=move(end);value=next};input.addEventListener('input',map);
  return{insert(files){input.setRangeText(files.map(file=>'![['+file.path+']]').join('\n')+'\n',start,end,'end');input.dispatchEvent(new Event('input',{bubbles:true}))},dispose(){input.removeEventListener('input',map)}};
 };
 const add=(files,position=capture())=>{
  const file=owner.file;const job=(async()=>{try{
   const saved=[];for(const image of files){const ext=extensions[image.type]||image.name?.match(/\.(png|jpe?g|webp|gif|avif|bmp|svg)$/i)?.[1];if(!ext)throw Error('Escolha uma imagem PNG, JPEG, WebP, GIF ou SVG.');const stem=(image.name||'Imagem colada').replace(/\.[^.]+$/,'').replace(/[\\/:*?"<>|\r\n]/g,' ').trim()||'Imagem';const path=app.plugin.unique('Anexos/'+stem+'-'+crypto.randomUUID().slice(0,8)+'.'+ext),savedFile=await app.vault.createBinary(path,await image.arrayBuffer());saved.push(savedFile);app.images?.register(savedFile,owner.file.path)}
   if(owner.file!==file)return;position.insert(saved);owner.status.textContent='Imagem adicionada';
  }catch(error){owner.status.textContent=error.message;new Notice(error.message)}finally{position.dispose()}})();jobs.add(job);job.finally(()=>jobs.delete(job));return job;
 };
 const paste=event=>{if(event.defaultPrevented||!event.target.closest('.atlas-rich-editor,.atlas-source-input')||owner.editorMode==='preview')return;const clipboard=event.clipboardData;let files=[...(clipboard?.items||[])].filter(item=>item.kind==='file'&&/^image\//i.test(item.type)).map(item=>item.getAsFile()).filter(Boolean);if(!files.length)files=[...(clipboard?.files||[])].filter(file=>/^image\//i.test(file.type));if(!files.length)return;event.preventDefault();event.stopPropagation();add(files)};
 owner.contentEl.addEventListener('paste',paste,true);
 return{add,pick(){const position=capture(),input=document.createElement('input');input.type='file';input.accept='image/*';input.multiple=true;input.onchange=()=>{if(input.files.length)add([...input.files],position);else position.dispose()};input.oncancel=()=>position.dispose();input.click()},dispose(){owner.contentEl.removeEventListener('paste',paste,true)}};
}
