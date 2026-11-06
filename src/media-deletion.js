import {nodeMedia} from './media-source.js';
export function mediaOccurrenceNodes(board,item){
 const byId=new Map(board.nodes.map(n=>[n.id,n])),children=new Map(),ids=new Set(),queue=[];
 const add=(key,id)=>{if(!key)return;if(!children.has(key))children.set(key,[]);children.get(key).push(id)};
 for(const node of board.nodes){
  add(node.parentId,node.id);if(node.mapId!==node.id)add(node.mapId,node.id);add(node.visualChildOf,node.id);
  if(nodeMedia(node)?.key===item.key||node.mediaId===item.id||node.mediaStudyFor===item.id||item.notePath&&[node.path,node.mediaNote,node.visualNote,node.visualSource].includes(item.notePath))queue.push(node.id);
 }
 while(queue.length){const id=queue.pop();if(ids.has(id)||!byId.has(id))continue;ids.add(id);const node=byId.get(id);queue.push(...(children.get(id)||[]),...(node.noteMaps||[]),...(node.pins||[]).map(p=>p.mapRoot).filter(Boolean));if(node.mediaStudyNode)queue.push(node.mediaStudyNode)}
 return board.nodes.filter(node=>ids.has(node.id));
}
export async function removeMedia(store,item){
 const app=store.app;await app.flushAll();
 for(const player of [...(app.mediaPlayerModals||[])])if(player.item.id===item.id)await player.close();
 for(const leaf of [...app.workspace.leaves])if(leaf.view?.item?.id===item.id||leaf.view?.file?.path===item.notePath)await leaf.close();
 const snapshots=[];for(const file of app.vault.getFiles().filter(f=>f.extension==='imageboard')){const board=JSON.parse(await app.vault.read(file)),nodes=mediaOccurrenceNodes(board,item);if(!nodes.length)continue;const ids=new Set(nodes.map(n=>n.id));snapshots.push({boardPath:file.path,nodes,edges:board.edges.filter(e=>ids.has(e.from.node)||ids.has(e.to.node))})}
 const snapshot=await app.vault.create('.atlas-media-removed/'+crypto.randomUUID()+'.json',JSON.stringify({version:1,item:structuredClone(item),boards:snapshots})),changed=[];
 const attachments=[item.notePath,item.local&&item.source.startsWith('Mídia/Arquivos/')?item.source:null].filter(p=>p&&app.vault.getFileByPath(p));
 (store.removing||=new Set()).add(item.id);
 try{
  for(const saved of snapshots){const file=app.vault.getFileByPath(saved.boardPath),live=app.workspace.leaves.find(l=>l.view?.file===file&&l.view.board)?.view,raw=await app.vault.read(file),board=live?.board||JSON.parse(raw),ids=new Set(saved.nodes.map(n=>n.id));changed.push({file,raw,live});live?.checkpoint();board.nodes=board.nodes.filter(n=>!ids.has(n.id));board.edges=board.edges.filter(e=>!ids.has(e.from.node)&&!ids.has(e.to.node));if(live){live.changed(true);live.render();await live.save()}else await app.vault.modify(file,JSON.stringify(board,null,2))}
  await app.vault.trash(snapshot,{kind:'media',title:item.title,mediaId:item.id,attachments});
  store.items.delete(item.id);store.byKey.delete(item.key);store.noteOwners.delete(item.notePath);store.knownNotes.delete(item.notePath);for(const ids of store.boardItems.values())ids.delete(item.id);store.touch();await store.flush();app.vault.trigger('note-catalog-changed');
 }catch(error){for(const {file,raw,live}of changed.reverse()){await app.vault.modify(file,raw);if(live)live.setViewData(raw,true)}throw error}finally{store.removing.delete(item.id)}
}
