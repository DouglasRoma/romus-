import {removeImageMedia,restoreImageDocuments} from './image-deletion.js';
import {nodeMedia,mediaSource} from './media-source.js';
import {propertyDocument} from './property-data.js';
const uid=()=>crypto.randomUUID(),safeName=text=>text.replace(/[\\/:*?"<>|#\[\]\r\n]/g,' ').trim().slice(0,100)||'Mídia';
export class MediaStore{
 constructor(app){this.app=app;this.items=new Map();this.byKey=new Map();this.scanned=new Map();this.notes=new Map();this.boardItems=new Map();this.knownNotes=new Set();this.noteOwners=new Map();this.version=0;this.saved=0}
 own(item){if(item.notePath){this.noteOwners.set(item.notePath,item);this.app.mediaOwnedPaths.add(item.notePath)}}
 async init(){
  try{for(const path of JSON.parse(localStorage.getItem(this.ownedKey())||'[]'))if(typeof path==='string')this.app.mediaOwnedPaths.add(path)}catch{}
  try{
   const data=JSON.parse(await window.atlasNative.call('read','.atlas-media.json'));if(data.version!==1||!Array.isArray(data.items))throw Error('Formato da biblioteca de mídia inválido.');
   for(const item of data.items){
    const source=mediaSource(item.source,item.local);if(!source||typeof item.id!=='string'||!/^[a-f0-9-]{36}$/.test(item.id)||typeof item.title!=='string')continue;if(item.type==='image'&&!item.local){source.type='image';source.key='image:'+source.source}
    const title=item.title;Object.assign(item,source);item.title=title;item.refs=Array.isArray(item.refs)?item.refs:[];this.items.set(item.id,item);this.byKey.set(item.key,item);this.own(item);
    for(const ref of item.refs){if(!this.boardItems.has(ref.boardPath))this.boardItems.set(ref.boardPath,new Set());this.boardItems.get(ref.boardPath).add(item.id)}
   }
  }catch(error){if(!/ENOENT/.test(error.message)){this.readOnly=true;this.error=error.message}}
  return this;
 }
 touch(){this.version++;clearTimeout(this.timer);this.timer=setTimeout(()=>this.flush().catch(error=>this.app.mediaError?.(error)),250);clearTimeout(this.notify);this.notify=setTimeout(()=>this.app.vault.trigger('media-changed'),30)}
 ownedKey(){return 'atlas:media-owned:'+this.app.info.library}
 async flush(){localStorage.setItem(this.ownedKey(),JSON.stringify([...this.app.mediaOwnedPaths]));clearTimeout(this.timer);if(this.readOnly||this.version===this.saved)return;const version=this.version,data=JSON.stringify({version:1,items:[...this.items.values()]},null,2);this.writing=(this.writing||Promise.resolve()).catch(()=>{}).then(async()=>{await window.atlasNative.call('write','.atlas-media.json',data);this.saved=version});await this.writing;if(this.version!==this.saved)return this.flush()}
 get(source,title,local=false){const parsed=mediaSource(source,local);if(!parsed)throw Error('Use um endereço http:// ou https:// válido, ou um PDF da biblioteca.');let item=this.byKey.get(parsed.key);if(!item){if(this.readOnly)throw Error('A biblioteca de mídia precisa ser reparada antes de adicionar itens.');item={...parsed,id:uid(),title:title||parsed.title,notePath:'',addedAt:Date.now(),refs:[]};this.items.set(item.id,item);this.byKey.set(item.key,item);this.touch()}return item}
 forNode(node){const source=nodeMedia(node);if(!source)return null;const known=this.items.get(node.mediaId),item=known&&known.source===source.source&&!!known.local===!!source.local?known:this.get(source.source,node.title,source.local);if(!item.notePath&&node.mediaNote&&!node.mediaAttachment){item.notePath=node.mediaNote;this.own(item);this.touch()}return item}
 observeBoard(file,board){
  if(!file||!board?.nodes)return;const refs=new Map();for(const node of board.nodes){if(!nodeMedia(node))continue;const item=this.forNode(node);if(!refs.has(item.id))refs.set(item.id,[]);refs.get(item.id).push({boardPath:file.path,nodeId:node.id})}
  for(const id of new Set([...(this.boardItems.get(file.path)||[]),...refs.keys()])){const item=this.items.get(id);if(!item)continue;const next=[...item.refs.filter(ref=>ref.boardPath!==file.path),...(refs.get(item.id)||[])];if(JSON.stringify(next)!==JSON.stringify(item.refs)){item.refs=next;this.touch()}}
  this.boardItems.set(file.path,new Set(refs.keys()));this.scanned.set(file.path,file.stat.mtime+':'+file.stat.size);
 }
 async scan(alive=()=>true){
  const files=this.app.vault.getFiles().filter(file=>file.extension==='imageboard');let next=0;
  await Promise.all(Array.from({length:Math.min(3,files.length)},async()=>{while(next<files.length&&alive()){const file=files[next++],open=this.app.workspace.leaves.find(leaf=>leaf.view?.file===file&&leaf.view.board);if(open){this.observeBoard(file,open.view.board);continue}const signature=file.stat.mtime+':'+file.stat.size;if(this.scanned.get(file.path)===signature)continue;try{const board=JSON.parse(await this.app.vault.cachedRead(file));if(Array.isArray(board.nodes))this.observeBoard(file,board)}catch{}await new Promise(resolve=>setTimeout(resolve,0))}}));
  if(!alive())return;
  const paths=new Set(files.map(file=>file.path));for(const item of this.items.values()){const refs=item.refs.filter(ref=>paths.has(ref.boardPath));if(refs.length!==item.refs.length){item.refs=refs;this.touch()}}
 }
 async ensureNote(item){
  if(this.items.get(item.id)!==item||this.removing?.has(item.id))throw Error('Esta mídia foi excluída. Restaure-a pela lixeira.');this.own(item);let note=this.app.vault.getFileByPath(item.notePath);if(note?.extension==='md'){if((item.customTitle||item.metadataResolved)&&item.noteTitle!==item.title)await this.rename(item,item.title);if(!this.knownNotes.has(note.path)){const props=propertyDocument(await this.app.vault.read(note)).props;if(props['atlas-internal-note-kind']!=='media'||props['atlas-internal-media-source']!==item.source)await this.app.fileManager.processFrontMatter(note,fm=>{fm['atlas-internal-media-id']=item.id;fm['atlas-internal-note-kind']='media';fm['atlas-internal-media-source']=item.source;fm['atlas-internal-media-type']=item.type});this.knownNotes.add(note.path)}return note}if(this.notes.has(item.id))return this.notes.get(item.id);
  const task=(async()=>{const path=this.app.plugin.unique('Mídia/Notas/'+safeName(item.title)+'.md'),origin=item.local?`[[${item.source}]]`:`[Abrir fonte](<${item.source}>)`;note=await this.app.vault.create(path,`---\natlas-internal-media-id: ${item.id}\natlas-internal-note-kind: media\natlas-internal-media-source: ${JSON.stringify(item.source)}\natlas-internal-media-type: ${item.type}\n---\n# ${item.title.replace(/[\r\n]/g,' ')}\n\n${origin}\n\n`);item.notePath=note.path;item.noteTitle=item.title;this.own(item);this.knownNotes.add(note.path);this.touch();this.app.vault.trigger('note-catalog-changed');return note})();this.notes.set(item.id,task);try{return await task}finally{this.notes.delete(item.id)}
 }
 byNote(file){return this.noteOwners.get(file?.path)||null}
 isMediaNote(file){return !!this.byNote(file)||/^Mídia\/Notas\//i.test(file?.path||'')||this.app.mediaOwnedPaths?.has(file?.path)}
 bind(view,node,item,note){if(view&&view.board.nodes.includes(node)&&node.mediaNote!==note.path){node.mediaNote=note.path;node.mediaId=item.id;view.changed(true);view.render()}}
 async metadata(item){if(!['youtube','spotify'].includes(item.type)||item.metadataChecked)return;item.metadataChecked=true;try{const data=await window.atlasNative.call('media:metadata',item.source);if(data?.title&&!item.customTitle){item.title=data.title;item.metadataResolved=true;}if(data?.thumbnail&&!item.thumbnail)item.thumbnail=data.thumbnail;this.touch();this.app.refreshMediaBoards?.(item.id)}catch{}}
 async rename(item,title){
  title=title.trim();if(!title)return;await this.app.flushAll();const note=this.app.vault.getFileByPath(item.notePath),oldTitle=item.title,oldBase=note?.basename;
  if(note){const folder=note.path.split('/').slice(0,-1).join('/'),target=folder+'/'+safeName(title)+'.md',existing=this.app.vault.getFileByPath(target),path=existing&&existing!==note?this.app.plugin.unique(target):target;if(path!==note.path)await this.app.fileManager.renameFile(note,path);
   await this.app.vault.process(note,text=>{const body=propertyDocument(text).body,prefix=text.slice(0,text.length-body.length),updated=body.replace(/^# ([^\r\n]+)$/m,(line,name)=>[oldTitle,oldBase,'Vídeo do YouTube','Áudio do Spotify'].includes(name.trim())?'# '+title:line);return prefix+updated});
  }
  item.title=title;item.noteTitle=title;item.customTitle=true;this.touch();this.app.refreshMediaBoards?.();await this.flush();
 }
 async remove(item){return removeImageMedia(this,item)}
 async restoreSnapshot(data){
  if(data.version!==1||!data.item||!Array.isArray(data.boards))throw Error('Backup de mídia inválido.');await this.app.flushAll();const parsed=mediaSource(data.item.source,data.item.local);if(!parsed)throw Error('Fonte de mídia inválida.');if(data.item.type==='image'&&!data.item.local){parsed.type='image';parsed.key='image:'+parsed.source}const item=this.byKey.get(parsed.key)||data.item;this.items.set(item.id,item);this.byKey.set(parsed.key,item);this.own(item);
  for(const saved of data.boards){const file=this.app.vault.getFileByPath(saved.boardPath);if(!file)continue;const live=this.app.workspace.leaves.find(leaf=>leaf.view?.file===file&&leaf.view.board)?.view;await this.app.vault.process(file,raw=>{const board=JSON.parse(raw),ids=new Set(board.nodes.map(node=>node.id));for(const node of saved.nodes)if(!ids.has(node.id)){if(nodeMedia(node)?.key===item.key)node.mediaId=item.id;board.nodes.push(node);ids.add(node.id)}for(const edge of saved.edges)if(ids.has(edge.from.node)&&ids.has(edge.to.node)&&!board.edges.some(existing=>existing.id===edge.id))board.edges.push(edge);return JSON.stringify(board,null,2)});if(live)live.setViewData(await this.app.vault.read(file),true);}
  await restoreImageDocuments(this.app,data.documents);this.touch();await this.flush();
 }
}
