import {Modal,Notice} from './compat.js';

const clone=value=>structuredClone(value);
const children=board=>board.nodes.filter(node=>node.type==='whiteboard').map(node=>node.path);
export function installBoardOrganization(app){
 app.boardOrder=Object.create(null);const ready=window.atlasNative.call('board-order:read').then(data=>{if(data&&typeof data==='object'&&!Array.isArray(data))for(const [key,values]of Object.entries(data))if(Array.isArray(values))Object.defineProperty(app.boardOrder,key,{value:values.filter(value=>typeof value==='string'),writable:true,enumerable:true,configurable:true})}).catch(error=>new Notice('A ordem dos quadros não pôde ser carregada: '+error.message));app.boardOrganizationReady=ready;
 app.sortBoards=(files,parent='')=>{const order=app.boardOrder[parent]||[],rank=new Map(order.map((path,index)=>[path,index]));return [...files].sort((a,b)=>(rank.get(a.path)??1e9)-(rank.get(b.path)??1e9)||a.path.localeCompare(b.path))};
 app.boardDescendants=path=>{const seen=new Set(),stack=[path];while(stack.length){const next=stack.pop();if(seen.has(next))continue;seen.add(next);stack.push(...(app.boardChildren.get(next)||[]))}return seen};
 let moving=false;
 app.moveBoard=async(file,{from='',to='',anchor='',position='inside'}={})=>{
  await ready;if(moving)throw Error('Aguarde o movimento anterior terminar.');if(app.vault.getFileByPath(file.path)!==file||file.extension!=='imageboard')throw Error('Whiteboard não encontrado.');
  if(to&&app.boardDescendants(file.path).has(to))throw Error('Um quadro não pode ficar dentro dele mesmo ou de um de seus subwhiteboards.');
  if(from===to&&(!anchor||anchor===file.path))return false;
  moving=true;
  try{
   await app.flushAll();if(to&&app.boardDescendants(file.path).has(to))throw Error('Um quadro não pode ficar dentro dele mesmo ou de um de seus subwhiteboards.');const entries=new Map();
   for(const path of new Set([from,to].filter(Boolean))){const boardFile=app.vault.getFileByPath(path);if(boardFile?.extension!=='imageboard')throw Error('O quadro de destino não existe mais.');const raw=await app.vault.read(boardFile),board=JSON.parse(raw);if(board.version!==1||!Array.isArray(board.nodes)||!Array.isArray(board.edges))throw Error('O quadro não pôde ser lido.');entries.set(path,{file:boardFile,raw,before:board,next:clone(board)})}
   const source=entries.get(from),target=entries.get(to);let removed=[];
   if(from!==to&&source){removed=source.next.nodes.filter(node=>node.type==='whiteboard'&&node.path===file.path);if(!removed.length)throw Error('Esse vínculo mudou. Tente mover o quadro novamente.');const ids=new Set(removed.map(node=>node.id));source.next.nodes=source.next.nodes.filter(node=>!ids.has(node.id));source.next.edges=source.next.edges.filter(edge=>!ids.has(edge.from.node)&&!ids.has(edge.to.node));for(const group of source.next.groups||[])if(Array.isArray(group.members))group.members=group.members.filter(id=>!ids.has(id))}
   if(from!==to&&target&&!target.next.nodes.some(node=>node.type==='whiteboard'&&node.path===file.path)){
    // A new occurrence uses free space; existing cards keep their coordinates.
    let x=80,y=80;for(let attempt=0;attempt<target.next.nodes.length+1;attempt++){const collision=target.next.nodes.find(node=>x<node.x+node.w+32&&x+360+32>node.x&&y<node.y+node.h+74&&y+277+32>node.y);if(!collision)break;y=collision.y+collision.h+100}
    const node=removed[0]?clone(removed[0]):{w:360,h:235};Object.assign(node,{id:crypto.randomUUID(),type:'whiteboard',path:file.path,title:file.basename,x,y});target.next.nodes.push(node);
   }
   const previousOrder=clone(app.boardOrder),nextOrder=clone(app.boardOrder);
   if(from!==to)nextOrder[from]=(nextOrder[from]||[]).filter(path=>path!==file.path);
   const candidates=to?children(target.next):app.vault.getFiles().filter(item=>item.extension==='imageboard'&&!([...app.boardChildren].some(([parent,links])=>parent!==from&&links.includes(item.path)))).map(item=>item.path);
   const paths=[...new Set([...(nextOrder[to]||[]),...candidates])].filter(path=>path!==file.path);const index=anchor?paths.indexOf(anchor):-1;paths.splice(index<0?paths.length:index+(position==='after'?1:0),0,file.path);nextOrder[to]=paths;
   const written=[];let orderWritten=false;
   try{
    for(const entry of entries.values()){if(JSON.stringify(entry.before)===JSON.stringify(entry.next))continue;await app.vault.process(entry.file,raw=>{if(raw!==entry.raw)throw Error('O quadro mudou durante o movimento. Tente novamente.');return JSON.stringify(entry.next,null,2)});written.push(entry)}
    await app.vault.adapter.write('.atlas-board-order.json',JSON.stringify(nextOrder,null,2));orderWritten=true;app.boardOrder=nextOrder;
   }catch(error){for(const entry of written.reverse())await app.vault.process(entry.file,raw=>raw===JSON.stringify(entry.next,null,2)?entry.raw:raw);if(orderWritten)await app.vault.adapter.write('.atlas-board-order.json',JSON.stringify(previousOrder,null,2));throw error}
   for(const leaf of app.workspace.getLeavesOfType('image-atlas-board')){const entry=entries.get(leaf.view.file?.path);if(!entry)continue;const view=leaf.view;
    // Merge only the moved cards, preserving any concurrent note edits and players.
    const oldIds=new Set(entry.before.nodes.filter(node=>node.type==='whiteboard'&&node.path===file.path).map(node=>node.id));const nextCards=entry.next.nodes.filter(node=>node.type==='whiteboard'&&node.path===file.path);
    view.board.nodes=view.board.nodes.filter(node=>!oldIds.has(node.id));view.board.nodes.push(...clone(nextCards));if(from!==to&&entry.file.path===from){view.board.edges=view.board.edges.filter(edge=>!oldIds.has(edge.from.node)&&!oldIds.has(edge.to.node));for(const group of view.board.groups||[])if(Array.isArray(group.members))group.members=group.members.filter(id=>!oldIds.has(id))}
    view.requestSave();view.render();app.plugin.syncIndex(view.board).catch(error=>new Notice(error.message));
   }
   app.renderFiles();return true;
  }finally{moving=false}
 };
 app.pickBoardParent=(file,from='')=>{const modal=new Modal(app);modal.setTitle('Mover · '+file.basename);modal.contentEl.createEl('p',{text:'O subwhiteboard será transferido para o quadro escolhido.'});const select=modal.contentEl.createEl('select',{attr:{'aria-label':'Quadro de destino'}});select.createEl('option',{text:'Quadros principais',attr:{value:''}});const blocked=app.boardDescendants(file.path);for(const target of app.vault.getFiles().filter(item=>item.extension==='imageboard'&&!blocked.has(item.path)).sort((a,b)=>a.basename.localeCompare(b.basename)))select.createEl('option',{text:target.basename,attr:{value:target.path}});select.value=from;const button=app.uiButton(modal.contentEl,'Mover whiteboard','folder-input',async()=>{button.disabled=true;try{await app.moveBoard(file,{from,to:select.value});modal.close()}finally{button.disabled=false}});modal.open()};
 app.vault.on('rename',(file,old)=>{if(app.boardOrder[old]){app.boardOrder[file.path]=app.boardOrder[old];delete app.boardOrder[old]}for(const key of Object.keys(app.boardOrder))app.boardOrder[key]=app.boardOrder[key].map(path=>path===old?file.path:path)});
 ready.then(()=>app.renderFiles());
}
