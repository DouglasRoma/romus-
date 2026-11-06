// Navigation history, never modification dates: typing does not reorder this list.
export function installRecentNotes(app){
 const key='atlas:recent-notes:'+app.info.library;let paths=[];
 try{const saved=JSON.parse(localStorage.getItem(key)||'null');if(Array.isArray(saved))paths=saved.filter(path=>typeof path==='string');else{const workspace=JSON.parse(localStorage.getItem('atlas:workspace:'+app.info.library)||'null');paths=(workspace?.tabs||[]).map(tab=>tab.path).filter(path=>typeof path==='string').reverse()}}catch{}
 const persist=()=>localStorage.setItem(key,JSON.stringify(paths));
 const eligible=file=>file&&app.noteCatalog.isMainNote(file)&&app.vault.getFileByPath(file.path)===file;
 app.recentNotes={
  files(){return[...new Set(paths)].map(path=>app.vault.getFileByPath(path)).filter(eligible).slice(0,12)},
  touch(file){if(app.restoringWorkspace||!eligible(file)||paths[0]===file.path)return;paths=[file.path,...paths.filter(path=>path!==file.path)].slice(0,30);persist()},
 };
 app.vault.on('rename',(file,old)=>{if(paths.includes(old)){paths=paths.map(path=>path===old?file.path:path);persist()}});
 app.vault.on('delete',file=>{if(paths.includes(file.path)){paths=paths.filter(path=>path!==file.path);persist()}});
}
