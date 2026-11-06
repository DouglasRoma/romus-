const {_electron}=require('C:/Users/dougl/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
(async()=>{
 const home=await fs.mkdtemp(path.join(os.tmpdir(),'atlas-media-linking-')),server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end('<!doctype html><h1>Célula</h1><p>Fonte original da nota.</p>')});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const app=await _electron.launch({executablePath:require('electron'),args:[path.resolve(__dirname,'..')],env:{...process.env,IMAGE_ATLAS_TEST_HOME:home}});
 try{
  const page=await app.firstWindow(),errors=[];page.on('pageerror',error=>errors.push(error.message));await page.waitForFunction(()=>window.atlasApp?.mediaUI&&document.querySelector('.welcome'));await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].show());
  await page.evaluate(async url=>{
   const file=await atlasPlugin.createBoardFile('Original');await atlasApp.workspace.getLeaf('tab').openFile(file);window.original=atlasApp.workspace.activeLeaf.view;window.items=[atlasApp.media.get(url,'Célula'),atlasApp.media.get('https://youtu.be/M7lc1UVf-VE','Bolsonaro')];window.records=[];
   for(const [i,item]of items.entries()){
    const source=await atlasApp.mediaUI.insert(original,item,{x:20,y:20+i*750}),note=await atlasApp.media.ensureNote(item);await atlasApp.vault.process(note,text=>text+'\nResumo exclusivo de '+item.title+'.\n\n<!-- image-atlas-flashcards:start -->\nPergunta de '+item.title+' == Resposta\n<!-- image-atlas-flashcards:end -->\n');await atlasApp.fileManager.processFrontMatter(note,props=>props.Tema='Estudo');await atlasApp.mediaUI.map(item,original,source,{ensure:true,addChild:true});original.inlineRename?.finish();await original.save();await atlasApp.flushAll();const entry=(await atlasPlugin.loadReviewEntries({notePath:note.path})).entries[0];atlasPlugin.getReviewStore().rate(entry,3,entry.record.revision,new Date());records.push({id:entry.id,history:JSON.stringify(entry.record),raw:await atlasApp.vault.read(note)});
   }
   await atlasApp.flushAll();window.positions=JSON.stringify(original.board.nodes.map(node=>[node.id,node.x,node.y]));window.secondFile=await atlasPlugin.createBoardFile('Outro quadro');await atlasApp.workspace.getLeaf('tab').openFile(secondFile);window.second=atlasApp.workspace.activeLeaf.view;
  },'http://127.0.0.1:'+server.address().port+'/page');
  // Exercise the ordinary existing-note picker, the path that lost the source.
  for(const title of ['Célula','Bolsonaro']){
   await page.evaluate(()=>second.contentEl.querySelector('[data-original-label="Adicionar nota existente"]').click());await page.locator('.suggest-input').fill(title);await page.locator('.suggest-results .suggest-item').filter({hasText:title}).first().click();await page.waitForFunction(name=>second.board.nodes.some(node=>node.type==='web'&&node.title===name),title);
  }
  await page.waitForFunction(()=>second.board.nodes.filter(node=>node.type==='web').length===2&&second.board.nodes.filter(node=>node.type==='mind').length>=2);
  await page.evaluate(async()=>{
   for(const [i,item]of items.entries()){const source=second.board.nodes.find(node=>node.type==='web'&&node.mediaId===item.id);if(source.path!==item.source||source.mediaNote!==item.notePath)throw Error('Fonte ou resumo não vinculado');if(!second.webSessions.get(source.id))throw Error('Fonte não incorporada');const entry=(await atlasPlugin.loadReviewEntries({notePath:item.notePath})).entries[0];if(entry.id!==records[i].id||JSON.stringify(entry.record)!==records[i].history)throw Error('FSRS alterado');if(await atlasApp.vault.read(atlasApp.vault.getFileByPath(item.notePath))!==records[i].raw)throw Error('Conteúdo da nota alterado')}
   if(JSON.stringify(original.board.nodes.map(node=>[node.id,node.x,node.y]))!==positions)throw Error('Ocorrência original movida');for(let i=0;i<3;i++)second.render();if(second.board.nodes.filter(node=>node.type==='web').length!==2)throw Error('Fontes duplicadas');await second.save();
   const file=await atlasPlugin.createBoardFile('Cartões antigos');await atlasApp.workspace.getLeaf('tab').openFile(file);window.legacy=atlasApp.workspace.activeLeaf.view;for(const [i,item]of items.entries())await legacy.addMediaStudyNote(atlasApp.vault.getFileByPath(item.notePath),{x:720,y:20+i*750});if(legacy.board.nodes.some(node=>node.type==='web'))throw Error('Clone Markdown fabricou players');if(legacy.board.nodes.filter(node=>node.type==='note').length!==2)throw Error('Conteúdo dos clones foi removido');await legacy.save();
  });
  await page.waitForFunction(()=>[second,legacy].every(view=>view.board.nodes.filter(node=>node.type==='web').every(node=>{const reader=view.webSessions.get(node.id)?.reader;return reader?.ready||reader?.atlasMediaInline})),null,{timeout:12000});
  await page.evaluate(async()=>{const node=second.board.nodes.find(node=>node.type==='web');await second.removeNode(node);second.render();if(second.board.nodes.includes(node)||second.board.nodes.some(n=>n.type==='web'&&n.mediaId===node.mediaId))throw Error('Fonte removida foi recriada');await atlasApp.flushAll()});
  assert.deepEqual(errors,[]);console.log('Vínculo pelo seletor normal: página web e player YouTube incorporados, mapas, resumos, propriedades e FSRS preservados; clones Markdown sem geração de players, sem duplicação nem alteração do quadro original: OK.');
 }finally{await app.evaluate(({app})=>app.exit());server.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
