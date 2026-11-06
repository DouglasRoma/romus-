const {_electron}=require('C:/Users/dougl/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
(async()=>{
 const home=await fs.mkdtemp(path.join(os.tmpdir(),'atlas-media-')),server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html');res.end('<!doctype html><h1>Página de estudo</h1><p>Texto com tamanho constante.</p>')});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let app=await _electron.launch({executablePath:require('electron'),args:[path.resolve(__dirname,'..')],env:{...process.env,IMAGE_ATLAS_TEST_HOME:home}});
 try{
  const page=await app.firstWindow(),errors=[];page.on('pageerror',error=>errors.push(error.message));await page.waitForFunction(()=>window.atlasApp?.mediaUI&&document.querySelector('.welcome'));
  await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].showInactive());
  await page.evaluate(async pageUrl=>{
   const app=atlasApp;window.boardFile=await atlasPlugin.createBoardFile('Mídias');await app.workspace.getLeaf('tab').openFile(boardFile);window.board=app.workspace.activeLeaf.view;
   window.video=app.media.get('https://www.youtube.com/watch?v=M7lc1UVf-VE','Aula de urologia');video.customTitle=true;window.videoNode=await app.mediaUI.insert(board,video,{x:20,y:20});
   window.audio=app.media.get('https://open.spotify.com/track/0Lr4kGOYn9l83EjuK6cZFQ','Podcast');await app.mediaUI.insert(board,audio,{x:700,y:20});
   window.web=app.media.get(pageUrl,'Artigo');window.webNode=await app.mediaUI.insert(board,web,{x:20,y:460});
   const pdf=new File(['%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 0/Kids[]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF'],'Resumo.pdf',{type:'application/pdf'});window.pdfNode=await app.mediaUI.importPDF(board,pdf);
   if(app.media.items.size!==4)throw Error('Biblioteca não registrou todas as mídias');if(app.media.get('https://youtu.be/M7lc1UVf-VE').id!==video.id)throw Error('Vídeo duplicado por formato de URL');
   await app.media.rename(video,'Aula renal');if(videoNode.title!=='Aula renal')throw Error('Título não atualizado no quadro');const note=await app.media.ensureNote(video);await app.vault.process(note,text=>text+'\n<!-- image-atlas-flashcards:start -->\nPergunta == Resposta\n<!-- image-atlas-flashcards:end -->\n');
   window.beforeEntry=(await atlasPlugin.loadReviewEntries({notePath:note.path})).entries[0];atlasPlugin.getReviewStore().rate(beforeEntry,3,beforeEntry.record.revision,new Date());window.beforeHistory=JSON.stringify(beforeEntry.record);
   const scope=await atlasPlugin.loadReviewEntries({boardPath:board.file.path,boardNotesOnly:true});if(!scope.entries.some(entry=>entry.id===beforeEntry.id))throw Error('Mídia fora dos flashcards do quadro');
   await app.mediaUI.map(video,board,videoNode);if(!board.board.nodes.some(n=>n.type==='mind'&&n.path===note.path))throw Error('Mapa da mídia não criado');
   const after=(await atlasPlugin.loadReviewEntries({notePath:note.path})).entries[0];if(after.id!==beforeEntry.id||JSON.stringify(after.record)!==beforeHistory)throw Error('Histórico FSRS alterado');await app.flushAll();app.toggleSidebar(true);
  },'http://127.0.0.1:'+server.address().port+'/page');
  await page.waitForFunction(()=>board.webSessions.get(webNode.id)?.reader?.ready,null,{timeout:15000});
  await page.evaluate(async()=>{const reader=board.webSessions.get(webNode.id).reader;reader.node.mediaPageZoom=1.2;reader.applyPageZoom();board.zoom(1.3,200,200);if(Math.abs(reader.frame.getZoomFactor()-1.2)>.01)throw Error('Zoom da página foi alterado pelo quadro');board.zoom(1/1.3,200,200);});
  await page.getByRole('button',{name:'Biblioteca de mídia',exact:true}).click();await page.locator('.atlas-media-library-card').first().waitFor();assert.equal(await page.locator('.atlas-media-library-card').count(),4);await page.getByLabel('Tipo de mídia',{exact:true}).selectOption('youtube');assert.equal(await page.locator('.atlas-media-library-card').count(),1);
  await page.evaluate(()=>atlasApp.mediaUI.open(video));await page.locator('.atlas-media-player-modal iframe').waitFor();const src=await page.locator('.atlas-media-player-modal iframe').getAttribute('src');assert(src.includes('/youtube/M7lc1UVf-VE'));
  assert(await page.evaluate(async()=>{const response=await fetch(atlasApp.info.playerOrigin+'/youtube/M7lc1UVf-VE');return(await response.text()).includes('https://www.youtube.com/embed/M7lc1UVf-VE')}));
  await page.getByRole('button',{name:'Abrir ao lado',exact:true}).click();await page.locator('.atlas-media-player-view iframe').waitFor();assert.equal(await page.locator('.workspace-leaf:visible').count(),2);
  await page.evaluate(async()=>{await atlasApp.mediaUI.cards(video,board,videoNode)});await page.locator('.ia-note-flash-editor').waitFor();await page.locator('.ia-note-flash-editor').getByRole('button',{name:'Fechar',exact:true}).click();
  await page.evaluate(async()=>{await atlasApp.flushAll()});assert.deepEqual(errors,[]);console.log('Mídias, filtros, players, títulos, mapa, flashcards, FSRS e zoom independente: OK.');
  await app.evaluate(({app})=>app.exit());app=null;
  app=await _electron.launch({executablePath:require('electron'),args:[path.resolve(__dirname,'..')],env:{...process.env,IMAGE_ATLAS_TEST_HOME:home}});const restored=await app.firstWindow();await restored.waitForFunction(()=>window.atlasApp?.mediaUI&&document.querySelector('.welcome'));assert.equal(await restored.evaluate(()=>atlasApp.media.items.size),4);assert(await restored.evaluate(()=>[...atlasApp.media.items.values()].some(item=>item.title==='Aula renal'&&item.notePath)));console.log('Biblioteca de mídia preservada após reinício: OK.');
 }finally{if(app)await app.evaluate(({app})=>app.exit());server.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
