const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const ignored=new Set(['.obsidian','.git','node_modules','local-backups','image-atlas-desktop','remnote-rebuild','.trash']);
class Library {
 constructor(root){this.root=path.resolve(root);this.queues=new Map()}
 async resolve(name,allowRoot=false){
  if(typeof name!=='string'||name.includes('\0')||name.includes('\\')||path.isAbsolute(name)||name.split('/').some(p=>p==='..'||p.includes(':')))throw Error('Caminho inválido.');
  const target=path.resolve(this.root,name);if(target!==this.root&&!target.startsWith(this.root+path.sep)||!allowRoot&&target===this.root)throw Error('Caminho fora da biblioteca.');
  let current=this.root;
  for(const piece of path.relative(this.root,target).split(path.sep).filter(Boolean)){current=path.join(current,piece);try{if((await fs.lstat(current)).isSymbolicLink())throw Error('Links de sistema não são permitidos na biblioteca.')}catch(e){if(e.code!=='ENOENT')throw e}}
  return target;
 }
 async catalog(){const files=[],folders=[];const walk=async(dir,base='')=>{for(const item of await fs.readdir(dir,{withFileTypes:true})){if(item.isSymbolicLink()||ignored.has(item.name)||item.name.startsWith('.atlas-'))continue;const rel=base+item.name;if(item.isDirectory()){folders.push(rel);await walk(path.join(dir,item.name),rel+'/')}else{const stat=await fs.stat(path.join(dir,item.name));files.push({path:rel,stat:{ctime:stat.birthtimeMs,mtime:stat.mtimeMs,size:stat.size}})}}};await fs.mkdir(this.root,{recursive:true});await walk(this.root);return{files,folders}}
 async list(){return(await this.catalog()).files}
 async trash(name,metadata={}){
  if(metadata.kind==='media'&&metadata.attachments?.length)return this.trashGroup(name,metadata);
  const source=await this.resolve(name),stat=await fs.stat(source);if(stat.isDirectory()&&(await fs.readdir(source)).length)throw Error('Mova as notas desta pasta antes de excluí-la.');
  const id=crypto.randomUUID(),folder=await this.resolve('.atlas-trash/'+id);await fs.mkdir(folder,{recursive:true});
  let backup;try{const target=await this.resolve(name+'.atlas-backup');if((await fs.stat(target)).isFile())backup=target}catch(error){if(error.code!=='ENOENT')throw error}
  const entry={id,path:name,folder:stat.isDirectory(),backup:!!backup,at:new Date().toISOString()};if(metadata.kind==='media'){entry.kind='media';entry.title=String(metadata.title||'Mídia').slice(0,400);entry.mediaId=String(metadata.mediaId||'')}
  await fs.writeFile(path.join(folder,'entry.json'),JSON.stringify(entry));await fs.rename(source,path.join(folder,'content'));
  if(backup)try{await fs.rename(backup,path.join(folder,'backup'))}catch(error){await fs.rename(path.join(folder,'content'),source);await fs.unlink(path.join(folder,'entry.json'));await fs.rmdir(folder);throw error}return entry;
 }
 async trashList(){const root=await this.resolve('.atlas-trash');try{const entries=[];for(const id of await fs.readdir(root)){if(!/^[a-f0-9-]{36}$/.test(id))continue;try{const folder=await this.resolve('.atlas-trash/'+id);await fs.access(path.join(folder,'content'));entries.push(JSON.parse(await fs.readFile(path.join(folder,'entry.json'),'utf8')))}catch{}}return entries.sort((a,b)=>b.at.localeCompare(a.at))}catch(error){if(error.code==='ENOENT')return[];throw error}}
 async restore(id){
  if(typeof id!=='string'||!/^[a-f0-9-]{36}$/.test(id))throw Error('Item da lixeira inválido.');const folder=await this.resolve('.atlas-trash/'+id),entry=JSON.parse(await fs.readFile(path.join(folder,'entry.json'),'utf8')),destination=await this.resolve(entry.path);
  if(entry.attachments)return this.restoreGroup(folder,entry);
  await fs.mkdir(path.dirname(destination),{recursive:true});
  try{if(entry.folder){await fs.mkdir(destination);await fs.rmdir(path.join(folder,'content'))}else{await fs.link(path.join(folder,'content'),destination);await fs.unlink(path.join(folder,'content'))}}catch(error){if(error.code==='EEXIST')throw Error('Já existe um arquivo ou pasta nesse caminho. Mova-o antes de restaurar.');throw error}
  if(entry.backup){const backup=await this.resolve('.atlas-trash/'+id+'/backup');try{await fs.link(backup,await this.resolve(entry.path+'.atlas-backup'))}catch(error){if(error.code!=='EEXIST')throw error}await fs.unlink(backup)}
  await fs.unlink(path.join(folder,'entry.json'));await fs.rmdir(folder);return entry;
 }
 async purge(id){
  if(typeof id!=='string'||!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(id))throw Error('Item da lixeira inválido.');
  const base='.atlas-trash/'+id,folder=await this.resolve(base),manifest=await this.resolve(base+'/entry.json');
  const entry=JSON.parse(await fs.readFile(manifest,'utf8'));if(entry.id!==id)throw Error('Item da lixeira inválido.');
  const permitted=['entry.json','content','backup'];for(const item of this.groupAttachments(entry)){permitted.push(item.stored);if(item.backup)permitted.push(item.stored+'-backup')}
  const names=await fs.readdir(folder);if(names.some(name=>!permitted.includes(name)))throw Error('Este item contém arquivos inesperados e foi preservado.');
  const owned=[];for(const name of permitted.filter(name=>name!=='entry.json'))if(names.includes(name)){const target=await this.resolve(base+'/'+name),stat=await fs.stat(target);if(stat.isDirectory()&&(await fs.readdir(target)).length)throw Error('Este item contém uma pasta não vazia e foi preservado.');owned.push({target,folder:stat.isDirectory()})}
  // Never recurse or touch the original path: it may already contain a different note.
  for(const item of owned)if(item.folder)await fs.rmdir(item.target);else await fs.unlink(item.target);
  await fs.unlink(manifest);await fs.rmdir(folder);return entry;
 }
 groupAttachments(entry){
  if(!entry.attachments)return[];if(!Array.isArray(entry.attachments)||entry.attachments.length>16)throw Error('Anexos da lixeira inválidos.');
  const names=new Set(),paths=new Set([entry.path]);for(const item of entry.attachments){if(typeof item.path!=='string'||!/^attachment-\d+$/.test(item.stored)||names.has(item.stored)||paths.has(item.path))throw Error('Anexos da lixeira inválidos.');names.add(item.stored);paths.add(item.path)}return entry.attachments;
 }
 async trashGroup(name,metadata){
  const attachments=[...new Set(metadata.attachments)];if(attachments.length>16)throw Error('Muitos anexos para este item.');
  const id=crypto.randomUUID(),base='.atlas-trash/'+id,folder=await this.resolve(base),entry={id,path:name,folder:false,backup:false,kind:'media',title:String(metadata.title||'Mídia').slice(0,400),mediaId:String(metadata.mediaId||''),at:new Date().toISOString(),attachments:[]};
  const moves=[];for(const [i,p]of [name,...attachments].entries()){
   if(i&&p===name)throw Error('Anexo duplicado.');const source=await this.resolve(p);if(!(await fs.stat(source)).isFile())throw Error('O anexo deve ser um arquivo.');const stored=i?'attachment-'+(i-1):'content',item=i?{path:p,stored,backup:false}:entry;moves.push({source,target:path.join(folder,stored)});
   try{const backup=await this.resolve(p+'.atlas-backup');if((await fs.stat(backup)).isFile()){item.backup=true;moves.push({source:backup,target:path.join(folder,i?stored+'-backup':'backup')})}}catch(error){if(error.code!=='ENOENT')throw error}if(i)entry.attachments.push(item);
  }
  this.groupAttachments(entry);await fs.mkdir(folder,{recursive:true});await fs.writeFile(path.join(folder,'entry.json'),JSON.stringify(entry));const done=[];
  try{for(const move of moves){await fs.rename(move.source,move.target);done.push(move)}return entry}catch(error){for(const move of done.reverse()){await fs.link(move.target,move.source);await fs.unlink(move.target)}await fs.unlink(path.join(folder,'entry.json'));await fs.rmdir(folder);throw error}
 }
 async restoreGroup(folder,entry){
  const files=[{path:entry.path,stored:'content',backup:entry.backup},...this.groupAttachments(entry)],copies=[];
  for(const item of files){copies.push({from:path.join(folder,item.stored),to:await this.resolve(item.path)});if(item.backup)copies.push({from:path.join(folder,item.stored==='content'?'backup':item.stored+'-backup'),to:await this.resolve(item.path+'.atlas-backup')})}
  for(const copy of copies){try{await fs.access(copy.to);throw Error('Já existe um arquivo nesse caminho. Mova-o antes de restaurar.')}catch(error){if(error.code!=='ENOENT')throw error}await fs.access(copy.from)}
  const created=[];try{for(const copy of copies){await fs.mkdir(path.dirname(copy.to),{recursive:true});await fs.link(copy.from,copy.to);created.push(copy.to)}}catch(error){for(const p of created.reverse())await fs.unlink(p);throw error}
  for(const copy of copies)await fs.unlink(copy.from);await fs.unlink(path.join(folder,'entry.json'));await fs.rmdir(folder);return entry;
 }
 async read(name,binary=false){const data=await fs.readFile(await this.resolve(name));return binary?data.toString('base64'):data.toString('utf8')}
 async write(name,data,binary=false,create=false){
  const run=async()=>{const dest=await this.resolve(name);await fs.mkdir(path.dirname(dest),{recursive:true});if(create){const handle=await fs.open(dest,'wx');try{await handle.writeFile(binary?Buffer.from(data,'base64'):data,'utf8')}finally{await handle.close()}}
   else{const temp=path.join(path.dirname(dest),'.atlas-'+crypto.randomUUID());try{await fs.writeFile(temp,binary?Buffer.from(data,'base64'):data,'utf8');try{await fs.copyFile(dest,dest+'.atlas-backup')}catch(e){if(e.code!=='ENOENT')throw e}await fs.rename(temp,dest)}finally{await fs.rm(temp,{force:true})}}const stat=await fs.stat(dest);return{path:name,stat:{ctime:stat.birthtimeMs,mtime:stat.mtimeMs,size:stat.size}}};
  const operation=(this.queues.get(name)||Promise.resolve()).catch(()=>{}).then(run);this.queues.set(name,operation);try{return await operation}finally{if(this.queues.get(name)===operation)this.queues.delete(name)}
 }
 async rename(from,to){const src=await this.resolve(from),dest=await this.resolve(to);try{await fs.access(dest);throw Error('Já existe um arquivo com esse nome.')}catch(e){if(e.code!=='ENOENT')throw e}await fs.mkdir(path.dirname(dest),{recursive:true});await fs.rename(src,dest)}
 async importFrom(source){source=path.resolve(source);const targetLower=this.root.toLowerCase(),sourceLower=source.toLowerCase();if(targetLower===sourceLower||targetLower.startsWith(sourceLower+path.sep))throw Error('A pasta de importação não pode conter a biblioteca de destino.');const walk=async(dir,base='')=>{for(const item of await fs.readdir(dir,{withFileTypes:true})){if(item.isSymbolicLink()||ignored.has(item.name)||item.name.endsWith('.atlas-backup'))continue;const rel=base+item.name;if(item.isDirectory())await walk(path.join(dir,item.name),rel+'/');else{const dest=await this.resolve(rel);await fs.mkdir(path.dirname(dest),{recursive:true});await fs.copyFile(path.join(dir,item.name),dest)}}};await fs.mkdir(this.root,{recursive:true});await walk(source);try{const metadata=JSON.parse(await fs.readFile(path.join(source,'.obsidian/types.json'),'utf8'));if(metadata.types&&typeof metadata.types==='object'&&!Array.isArray(metadata.types))await this.write('.atlas-property-types.json',JSON.stringify(metadata.types,null,2))}catch(e){if(e.code!=='ENOENT')throw e}try{const settings=JSON.parse(await fs.readFile(path.join(source,'.obsidian/plugins/image-atlas/data.json'),'utf8'));const imported={demoOpened:true,noteRenames:settings.noteRenames||{},pendingMindMoves:settings.pendingMindMoves||[]};await this.write('.atlas-settings.json',JSON.stringify(imported,null,2))}catch(e){if(e.code!=='ENOENT')throw e}}
}
module.exports={Library};
