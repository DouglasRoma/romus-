export const fileLabel=file=>file?.extension==='md'||file?.extension==='imageboard'?file.basename:file?.name||'';
export function noteFolder(app,file){return app.noteCatalog?.sidebarFolder(file.path.split('/').slice(0,-1).join('/'))||''}
