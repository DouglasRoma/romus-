export function createMediaNode(item,note,pos){return{id:crypto.randomUUID(),type:'web',path:item.source,title:item.title,x:pos.x,y:pos.y,w:600,h:item.type==='pdf'?620:item.type==='web'?540:350,pins:[],...(item.local?{mediaFile:item.source}:{}),mediaId:item.id,mediaNote:note.path,mediaStudyCollapsed:true}}
export function linkMediaStudyRoot(board,source,root,item){
 source.mediaStudyNode=root.id;root.mediaStudyFor=item.id;delete root.mediaSourceDetached;
 // Media folding is local. Native linkedVisualRoot is for linked-note expansion.
 delete source.linkedVisualRoot;delete source.visualExpanded;
 const nativeParents=(root.visualParents||[]).filter(id=>board.nodes.some(n=>n.id===id&&n.type!=='web'&&n.linkedVisualRoot===root.id));
 if(nativeParents.length)root.visualParents=nativeParents;else{delete root.visualParents;delete root.nestedOnly}
 if(root.visualChildOf&&!board.nodes.some(n=>n.id===root.visualChildOf&&n.type!=='web'))delete root.visualChildOf;
 if(!board.edges.some(e=>e.from.node===source.id&&e.to.node===root.id))board.edges.push({id:crypto.randomUUID(),from:{node:source.id},to:{node:root.id},color:'#60b8bb'});
}
function studyIndex(board){
 const byId=new Map(),children=new Map(),outgoing=new Map();const add=(owner,id)=>{if(!owner)return;if(!children.has(owner))children.set(owner,[]);children.get(owner).push(id)};
 for(const n of board.nodes){byId.set(n.id,n);add(n.parentId,n.id);if(n.mapId!==n.id)add(n.mapId,n.id);add(n.visualChildOf,n.id)}for(const e of board.edges){if(!outgoing.has(e.from.node))outgoing.set(e.from.node,[]);outgoing.get(e.from.node).push(e.to.node)}return{byId,children,outgoing};
}
export function mediaStudyMembers(board,root,index=studyIndex(board)){
 const ids=new Set(),queue=[root.id];while(queue.length){const id=queue.pop(),n=index.byId.get(id);if(!n||ids.has(id))continue;ids.add(id);queue.push(...(index.children.get(id)||[]),...(n.noteMaps||[]),...(n.pins||[]).map(p=>p.mapRoot).filter(Boolean));if(n.noteLinks?.length)for(const child of index.outgoing.get(id)||[])if(n.noteLinks.includes(index.byId.get(child)?.path))queue.push(child)}return [...ids].map(id=>index.byId.get(id));
}
export function prepareMediaVisibility(view){
 const sources=view.board.nodes.filter(n=>n.type==='web'&&n.mediaStudyNode);if(!sources.length)return;const index=studyIndex(view.board),expanded=new Set(sources.filter(n=>!n.mediaStudyCollapsed).map(n=>n.mediaStudyNode));
 for(const source of sources){if(!source.mediaStudyCollapsed||expanded.has(source.mediaStudyNode))continue;const root=index.byId.get(source.mediaStudyNode);if(root)for(const n of mediaStudyMembers(view.board,root,index)){view.hiddenVisualNodes.add(n.id);view.visibleMind.delete(n.id)}}
}
const overlaps=(a,b)=>a.x<b.x+b.w+55&&a.x+a.w+55>b.x&&a.y<b.y+b.h+90&&a.y+a.h+90>b.y;
export function freeMediaPosition(board,pos,w=600,h=540){const sources=board.nodes.filter(n=>n.type==='web');const candidate={...pos,w,h};for(let i=0;i<=sources.length;i++){const hit=sources.find(n=>overlaps(candidate,n));if(!hit)break;candidate.y=hit.y+hit.h+110}return{x:candidate.x,y:candidate.y}}
function separateMediaRoot(view,source,root,item){
 view.mediaRebindJobs||=new Map();if(view.mediaRebindJobs.has(source.id))return;const board=view.board,note=view.app.vault.getFileByPath(item.notePath);if(!note)return;
 const task=view.plugin.loadVisualNote(note).then(bundle=>{if(view.board!==board||!board.nodes.includes(source))return;const pos=freeMediaPosition({nodes:board.nodes.filter(n=>n!==source)},source,source.w,source.h);source.x=pos.x;source.y=pos.y;const installed=view.applyVisualBundle(item.notePath,item.notePath,bundle,{x:source.x+source.w+100,y:source.y},{createNew:true,templateRoot:root});linkMediaStudyRoot(board,source,installed,item);view.changed(false,false);view.render()}).catch(error=>view.app.mediaError(error)).finally(()=>view.mediaRebindJobs.delete(source.id));view.mediaRebindJobs.set(source.id,task);
}
export function repairMediaOccurrences(view){
 const board=view.board,media=view.app.media;if(!board?.nodes||!media)return false;let changed=false;const byId=new Map(board.nodes.map(n=>[n.id,n])),sources=board.nodes.filter(n=>n.type==='web'&&n.mediaNote),claimed=new Set();
 for(const source of sources){const item=media.noteOwners.get(source.mediaNote);let root=byId.get(source.mediaStudyNode);if(!item||media.removing?.has(item.id))continue;
  if(root&&claimed.has(root.id)){const alternate=byId.get(source.linkedVisualRoot);if(alternate&&alternate!==root&&(alternate.visualNote||alternate.path)===item.notePath&&!claimed.has(alternate.id))root=alternate;else{separateMediaRoot(view,source,root,item);continue}}
  if(!root)root=board.nodes.find(n=>n.type==='note'&&(n.visualNote||n.path)===item.notePath&&!claimed.has(n.id)&&!n.mediaSourceDetached);
  if(root){claimed.add(root.id);if(source.mediaStudyNode!==root.id||source.linkedVisualRoot||root.mediaStudyFor!==item.id||root.visualParents?.some(id=>!byId.has(id)||byId.get(id)?.type==='web')){linkMediaStudyRoot(board,source,root,item);changed=true}}
 }
 // Never manufacture players for unclaimed Markdown clones.
 if(board.mediaOccurrenceLayoutVersion!==1&&!view.drag){const placed=[],index=studyIndex(board);for(const source of sources){const root=byId.get(source.mediaStudyNode);if(root&&sources.find(n=>n.mediaStudyNode===root.id)===source&&placed.some(n=>n.mediaNote===source.mediaNote&&overlaps(source,n))){const pos=freeMediaPosition({nodes:placed},source,source.w,source.h),dx=pos.x-source.x,dy=pos.y-source.y;source.x=pos.x;source.y=pos.y;for(const n of mediaStudyMembers(board,root,index)){n.x+=dx;n.y+=dy}changed=true}placed.push(source)}board.mediaOccurrenceLayoutVersion=1;changed=true}return changed;
}
