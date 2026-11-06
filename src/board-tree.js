// Links form a graph: render shared children under each parent, and stop cycles.
export function renderBoardTree(app,host,files,{query,open,active,createRow}){
 const byPath=new Map(files.map(file=>[file.path,file])),children=new Map(),parents=new Set();
 for(const file of files){const links=(app.boardChildren.get(file.path)||[]).filter(path=>byPath.has(path));children.set(file.path,links);for(const path of links)parents.add(path)}
 const matches=new Set(files.filter(file=>file.path.toLocaleLowerCase().includes(query)).map(file=>file.path));
 if(query){let changed=true;while(changed){changed=false;for(const [path,links]of children)if(!matches.has(path)&&links.some(link=>matches.has(link))){matches.add(path);changed=true}}}
 const visited=new Set();let count=0;
 const draw=(file,parent,ancestors=[])=>{
  if(count>=600||query&&!matches.has(file.path))return;count++;visited.add(file.path);const links=children.get(file.path).filter(path=>!ancestors.includes(path)&&path!==file.path),chain=[...ancestors,file.path];
  const parentPath=ancestors.at(-1)||'';if(!links.length){createRow(file,parent,parentPath);return}
  const branch=parent.createEl('details',{cls:'atlas-board-branch'}),key=JSON.stringify(chain);branch.dataset.treeKey=key;branch.open=!!query||(open.get(key)??true);const head=branch.createEl('summary');head.createSpan({cls:'atlas-board-chevron',text:'›',attr:{'aria-label':'Expandir ou recolher subwhiteboards'}});createRow(file,head,parentPath);const body=branch.createDiv({cls:'atlas-board-children'});for(const path of app.sortBoards(links.map(path=>byPath.get(path)),file.path).map(file=>file.path))draw(byPath.get(path),body,chain);
 };
 for(const file of app.sortBoards(files.filter(file=>!parents.has(file.path))))draw(file,host);
 for(const file of app.sortBoards(files))if(!visited.has(file.path)&&(!query||matches.has(file.path)))draw(file,host);
 if(count>=600)host.createDiv({cls:'ia-muted',text:'Use a busca para encontrar outros quadros.'});
}
