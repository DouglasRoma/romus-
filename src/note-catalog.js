import {normalizePath} from './compat.js';
export const generatedBoardIndex=text=>/<!--\s*image-atlas:start\s*-->/.test(text)&&/<!--\s*image-atlas:end\s*-->/.test(text)&&/\[\[[^\]\n|]+\.imageboard(?:\|[^\]\n]*)?\]\]/i.test(text);
const indexPath=text=>{try{const match=/"indexPath"\s*:\s*("(?:[^"\\]|\\.)*")/.exec(text);return match?normalizePath(JSON.parse(match[1])):''}catch{return''}};
export function installNoteCatalog(app){
 const boards=new Map(),hidden=new Set(),inspected=new Map(),key='atlas:system-notes:'+app.info.library,userFolders=new Set();
 app.boardChildren=new Map();
 const observeChildren=(file,text)=>{try{const board=JSON.parse(text),children=[...new Set((board.nodes||[]).filter(node=>node.type==='whiteboard'&&typeof node.path==='string'&&node.path!==file.path).map(node=>normalizePath(node.path)))];if(JSON.stringify(app.boardChildren.get(file.path)||[])!==JSON.stringify(children)){app.boardChildren.set(file.path,children);return true}}catch{}return false};
 try{for(const path of JSON.parse(localStorage.getItem(key)||'[]'))if(typeof path==='string')hidden.add(path)}catch{}
 try{for(const path of JSON.parse(localStorage.getItem(key+':folders')||'[]'))if(typeof path==='string')userFolders.add(path)}catch{}
 let persistTimer,notification;
 const changed=()=>{clearTimeout(persistTimer);persistTimer=setTimeout(()=>localStorage.setItem(key,JSON.stringify([...hidden])),200);clearTimeout(notification);notification=setTimeout(()=>{app.renderFiles();app.vault.trigger('note-catalog-changed')},0)};
 const remember=path=>{if(path){try{path=app.metadataCache.getFirstLinkpathDest(path,'')?.path||path}catch{}}if(path&&!hidden.has(path)){hidden.add(path);return true}return false};
 const catalog=app.noteCatalog={
  userFolders,
  sidebarFolder(path){const root=app.preferences.notesFolder||'Notas';if(path===root||path==='Image Atlas')return'';if(path.startsWith(root+'/'))return path.slice(root.length+1);const legacy=path.match(/^Image Atlas\/(?:Mapas|Notas visuais|Exemplo)(?:\/(.*))?$/);return legacy?legacy[1]||'':path.replace(/^Image Atlas\//,'')},
  rememberFolder(path){userFolders.add(path);localStorage.setItem(key+':folders',JSON.stringify([...userFolders]));changed()},
  isUserFolder(path){return!/^Mídia(?:$|\/(?:Arquivos|Notas)(?:\/|$))/i.test(path)&&!/^Image Atlas\/(?:Imagens|Revisões|Dados|Notas visuais\/Dados)(?:\/|$)/i.test(path)},
  isMainNote(file){return file.extension==='md'&&!/^Anexos\/[a-f\d-]{36}\//i.test(file.path)&&!app.media?.isMediaNote(file)&&!app.mediaOwnedPaths?.has(file.path)&&!hidden.has(file.path)&&!/^Image Atlas\/(?:Revisões|Dados|Notas visuais\/Dados)\//i.test(file.path)},
  observeWrite(file,text){
   let update=false;if(file.extension==='imageboard'){const path=indexPath(text);boards.set(file.path,{signature:file.stat.mtime+':'+file.stat.size,index:path});update=remember(path);update=observeChildren(file,text)||update}
   else if(file.extension==='md'&&generatedBoardIndex(text))update=remember(file.path);
   if(update)changed();
  },
  async refresh(){
   const files=app.vault.getFiles().filter(file=>file.extension==='imageboard'||file.extension==='md'&&(/(?:índice|indice)(?:[ -]?\d+)?\.md$/i.test(file.name)||hidden.has(file.path)));let next=0,update=false;
   await Promise.all(Array.from({length:Math.min(4,files.length)},async()=>{while(next<files.length){const file=files[next++],signature=file.stat.mtime+':'+file.stat.size,cache=file.extension==='imageboard'?boards:inspected;if(cache.get(file.path)?.signature===signature)continue;try{const text=await app.vault.cachedRead(file);if(file.extension==='imageboard'){const path=indexPath(text);boards.set(file.path,{signature,index:path});update=remember(path)||update;update=observeChildren(file,text)||update}else{inspected.set(file.path,{signature});if(generatedBoardIndex(text))update=remember(file.path)||update}}catch{/* An unreadable file stays available to open and repair. */}}}));
   const existing=new Set(app.vault.getFiles().map(file=>file.path));for(const path of hidden)if(!existing.has(path)){hidden.delete(path);update=true}for(const path of boards.keys())if(!existing.has(path))boards.delete(path);for(const path of inspected.keys())if(!existing.has(path))inspected.delete(path);if(update)changed();
  }
 };
 app.getMainNotes=()=>app.vault.getMarkdownFiles().filter(file=>catalog.isMainNote(file));
 app.getLinkableNotes=()=>app.vault.getMarkdownFiles().filter(file=>catalog.isMainNote(file)||app.media?.byNote(file));
 app.vault.on('rename',(file,old)=>{if(hidden.delete(old)){hidden.add(file.path);changed()}if(boards.has(old)){boards.set(file.path,boards.get(old));boards.delete(old)}});
 app.vault.on('rename',(file,old)=>{if(app.boardChildren.has(old)){app.boardChildren.set(file.path,app.boardChildren.get(old));app.boardChildren.delete(old)}for(const [path,children]of app.boardChildren)if(children.includes(old))app.boardChildren.set(path,children.map(child=>child===old?file.path:child))});
 app.vault.on('delete',file=>{app.boardChildren.delete(file.path)});
 return catalog;
}
