import {prepareMediaVisibility} from './media-occurrence.js';

export function installSubboardPreview(view){
 const app=view.app,cache=app.subboardPreviewCache||=new Map(),prepare=Object.getPrototypeOf(view).prepareMind;
 const summary=board=>{
  // Compute the same visibility as the canvas, without altering the source scene.
  const scene={board:structuredClone(board)};prepare.call(scene);prepareMediaVisibility(scene);
  const nodes=scene.board.nodes.filter(node=>node&&!node.deleted&&!scene.hiddenVisualNodes.has(node.id)&&!scene.directVisualNodes.has(node.id)&&!scene.noteMapOwners.has(node.id)&&(node.type!=='mind'||scene.visibleMind.has(node.id)));
  const exists=node=>!['note','image','whiteboard'].includes(node.type)||!node.path||!!app.vault.getFileByPath(node.path);
  const cards=nodes.filter(node=>node.type!=='whiteboard'&&!node.relation&&exists(node));
  const boards=nodes.filter(node=>node.type==='whiteboard'&&exists(node)),entries=nodes.filter(node=>!node.relation&&exists(node));
  return{items:cards.length,boards:boards.length,total:entries.length,labels:entries.slice(0,12).map(node=>({id:node.id,title:node.title||node.path?.split('/').pop()?.replace(/\.md$/i,'')||'Sem título',color:node.cardColor||node.color}))};
 };
 view.renderSubboardPreview=async(node,el)=>{
  const token=Symbol();el._atlasBoardToken=token;const file=app.vault.getFileByPath(node.path);if(!file){el.replaceChildren();el.createDiv({cls:'ia-muted',text:'Whiteboard não encontrado.'});return}
  const live=app.workspace.getLeavesOfType('image-atlas-board').map(leaf=>leaf.view).find(source=>source.file?.path===file.path&&source.invalidData===null),key=live?live.board: file.stat.mtime+':'+file.stat.size,revision=live?.subboardPreviewRevision||0;let entry=cache.get(file.path);
  if(!entry||entry.key!==key||entry.revision!==revision){entry={key,revision,pending:live?Promise.resolve().then(()=>summary(live.board)):app.vault.cachedRead(file).then(raw=>{const board=JSON.parse(raw);if(board.version!==1||!Array.isArray(board.nodes))throw Error('Formato inválido');return summary(board)})};cache.set(file.path,entry);while(cache.size>40)cache.delete(cache.keys().next().value)}
  try{const result=await entry.pending;if(!el.isConnected||el._atlasBoardToken!==token||!view.board.nodes.includes(node))return;el.replaceChildren();el.createDiv({cls:'ia-board-count',text:result.items+' itens · '+result.boards+' subwhiteboards'});const pills=el.createDiv({cls:'ia-board-pills'});for(const item of result.labels){const pill=pills.createDiv({cls:'ia-board-pill',text:item.title,attr:{title:item.title,'data-preview-node':item.id}});if(/^#[a-f\d]{6}$/i.test(item.color||'')){pill.classList.add('atlas-preview-colored');pill.style.setProperty('--atlas-preview-color',item.color)}}if(result.total>result.labels.length)pills.createDiv({cls:'ia-board-pill ia-muted',text:'+'+(result.total-result.labels.length)});if(!result.labels.length)el.createDiv({cls:'ia-muted',text:'Quadro vazio. Abra para adicionar conteúdo.'})}
  catch(error){if(cache.get(file.path)===entry)cache.delete(file.path);if(el.isConnected&&el._atlasBoardToken===token){el.replaceChildren();el.createDiv({cls:'ia-muted',text:'Não foi possível atualizar a prévia: '+error.message})}}
 };
 const paths=new Set();let timer;
 const schedule=path=>{if(path)cache.delete(path);else cache.clear();paths.add(path||'*');clearTimeout(timer);timer=setTimeout(()=>{for(const node of view.board.nodes){if(node.type!=='whiteboard'||!paths.has('*')&&!paths.has(node.path))continue;const el=view.nodeElements?.get(node.id)?.querySelector('.ia-board-preview');if(el?._atlasBoardVisible)view.renderSubboardPreview(node,el)}paths.clear()},80)};
 view.registerEvent(app.vault.on('atlas-board-preview-changed',schedule));view.registerEvent(app.vault.on('modify',file=>{if(file.extension==='imageboard')schedule(file.path)}));view.registerEvent(app.vault.on('delete',()=>schedule()));view.registerEvent(app.vault.on('rename',()=>schedule()));view.register(()=>clearTimeout(timer));
}
