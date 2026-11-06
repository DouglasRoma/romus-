const {_electron}=require('C:/Users/dougl/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
(async()=>{
 const home=await fs.mkdtemp(path.join(os.tmpdir(),'atlas-reading-motion-')),pkg=require('../package.json'),packaged=process.env.IMAGE_ATLAS_VERIFY_PACKAGE==='1';
 const app=await _electron.launch({executablePath:packaged?path.join(process.env.LOCALAPPDATA,'ImageAtlasBuild',pkg.version,'win-unpacked',pkg.productName+'.exe'):require('electron'),args:packaged?['--user-data-dir='+home]:[path.resolve(__dirname,'..')],env:{...process.env,IMAGE_ATLAS_TEST_HOME:home}});
 try{
  const page=await app.firstWindow();await page.waitForFunction(()=>window.atlasApp?.noteMedia&&!atlasApp.restoringWorkspace);await app.evaluate(({BrowserWindow})=>{const w=BrowserWindow.getAllWindows()[0];w.setSize(1440,1000);w.show();w.focus()});
  await page.evaluate(async()=>{
   await atlasApp.closeAllTabs();const body='# Conceito de estudo\n\n'+Array.from({length:65},(_,i)=>'## Parte '+i+'\n\nTexto de estudo com **explicação importante**, uma frase para leitura e um [[Conceito]] relacionado.\n\n- Primeira ideia do resumo\n- Segunda ideia preservada\n').join('\n');
   window.note=await atlasApp.vault.create('Notas/Conceito.md',body);const file=await atlasPlugin.createBoardFile('Quadro carregado');await atlasApp.workspace.getLeaf('tab').openFile(file);window.board=atlasApp.workspace.activeLeaf.view;
   for(let i=0;i<120;i++)board.board.nodes.push({id:'reading-'+i,type:'note',path:note.path,title:'Conceito '+i,x:i%10*380,y:Math.floor(i/10)*310,w:350,h:250});
   board.board.camera={x:10,y:10,z:1};board.render();await new Promise(r=>setTimeout(r,250));
   for(const element of board.nodeElements.values())await board.notePreview(note.path,element.querySelector('.ia-note-content'));
  });
  const result=await page.evaluate(async variant=>{
   if(['compositor','both'].includes(variant))board.world.style.willChange='transform';
   if(['no-auto','both'].includes(variant)){const style=document.createElement('style');style.textContent='.ia-note,.ia-mind,.ia-whiteboard{content-visibility:visible!important}';document.head.append(style)}
   if(variant==='empty')for(const el of board.nodeElements.values())el.querySelector('.ia-note-content').replaceChildren();
   const identities=[...board.nodeElements.values()].map(el=>el.querySelector('.ia-note-content strong')),positions=JSON.stringify(board.board.nodes);let reads=0,previews=0;
   const read=board.readNote.bind(board),preview=board.notePreview;board.readNote=(...args)=>{reads++;return read(...args)};board.notePreview=(...args)=>{previews++;return preview(...args)};
   const times=[],work=[];let previous;for(let i=0;i<135;i++){const now=await new Promise(requestAnimationFrame);if(previous!==undefined&&i>15)times.push(now-previous);previous=now;board.board.camera={x:20+Math.sin(i/18)*60,y:20+Math.cos(i/16)*35,z:.28+Math.sin(i/25)*.035};const start=performance.now();board.camera();work.push(performance.now()-start)}
   const moving={reads,previews};await new Promise(r=>setTimeout(r,350));const overview=board.viewport.classList.contains('romus-board-overview');board.board.camera={x:10,y:10,z:1};board.camera();await new Promise(r=>setTimeout(r,400));
   const same=identities.every((el,i)=>board.nodeElements.get('reading-'+i).querySelector('.ia-note-content strong')===el);times.sort((a,b)=>a-b);work.sort((a,b)=>a-b);
   return{cards:120,frameMedianMs:+times[Math.floor(times.length*.5)].toFixed(2),frameP95Ms:+times[Math.floor(times.length*.95)].toFixed(2),cameraP95Ms:+work[Math.floor(work.length*.95)].toFixed(2),moving,samePreviewDOM:same,unchangedCards:positions===JSON.stringify(board.board.nodes),overview,hiddenAfterReturn:board.viewport.classList.contains('romus-board-overview')};
  },process.env.ROMUS_MOTION_VARIANT||'');
  console.log(JSON.stringify(result));assert.equal(result.samePreviewDOM,true);assert.equal(result.unchangedCards,true);assert.equal(result.moving.reads,0);assert.equal(result.hiddenAfterReturn,false);if(process.env.ROMUS_EXPECT_OVERVIEW==='1')assert.equal(result.overview,true);
 }finally{await app.evaluate(({app})=>app.exit());await fs.rm(home,{recursive:true,force:true,maxRetries:12,retryDelay:250})}
})().catch(error=>{console.error(error);process.exitCode=1});
