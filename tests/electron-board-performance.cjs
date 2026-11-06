const {_electron}=require('C:/Users/dougl/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path'),http=require('node:http');
(async()=>{
 const home=await fs.mkdtemp(path.join(os.tmpdir(),'atlas-board-performance-')),server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end('<!doctype html><h1>Texto de estudo</h1><p>Artigo com conteúdo de leitura e marcações.</p>')});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const app=await _electron.launch({executablePath:require('electron'),args:[path.resolve(__dirname,'..')],env:{...process.env,IMAGE_ATLAS_TEST_HOME:home}});
 try{
  const page=await app.firstWindow();await page.waitForFunction(()=>window.atlasApp?.mediaUI&&document.querySelector('.welcome'));await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].show());
  await page.evaluate(async url=>{await atlasApp.workspace.getLeaf('tab').openFile(await atlasPlugin.createBoardFile('Desempenho'));window.board=atlasApp.workspace.activeLeaf.view;for(let i=0;i<6;i++)await atlasApp.mediaUI.insert(board,atlasApp.media.get(url+'?p='+i,'Artigo '+i),{x:20+i%3*640,y:20+Math.floor(i/3)*600});const root=board.makeMindMap('Estudo','',{x:2100,y:20});for(let i=0;i<240;i++){const node={id:crypto.randomUUID(),type:'mind',mapId:root.id,parentId:root.id,path:'',title:'Tema '+i,body:'Resumo do conceito.',color:'#60b8bb',collapsed:false,x:2450+(i%8)*300,y:Math.floor(i/8)*180,w:240,h:130};board.board.nodes.push(node);board.board.edges.push({id:crypto.randomUUID(),from:{node:root.id},to:{node:node.id},mindTree:true,color:node.color})}board.board.camera={x:15,y:15,z:.35};board.render();await board.save()},'http://127.0.0.1:'+server.address().port+'/page');
  // A loaded guest can still be applying its initial independent zoom. Measure
  // steady camera movement only after that initialization has finished.
  await page.waitForFunction(()=>[...board.webSessions.values()].filter(s=>s.reader?.ready&&s.reader.nativePageZoom).length===6,null,{timeout:15000});
  await page.waitForFunction(()=>!board.boardMotionActive);await page.waitForTimeout(350);
  const results=await page.evaluate(async()=>{
   let reads=0,zoomCalls=0,idleZoomChecks=0,installs=0;const rect=Element.prototype.getBoundingClientRect;Element.prototype.getBoundingClientRect=function(){if(this.classList.contains('ia-reader-toolbar'))reads++;return rect.call(this)};
   // rAF can be throttled when the test window loses foreground focus. Distinguish
   // an idle verification after a real pause from work inside an active gesture.
   for(const {reader}of board.webSessions.values()){const zoom=reader.frame.getZoomFactor.bind(reader.frame),execute=reader.frame.executeJavaScript.bind(reader.frame);reader.frame.getZoomFactor=(...args)=>{if(board.boardMotionActive)zoomCalls++;else idleZoomChecks++;return zoom(...args)};reader.frame.executeJavaScript=(...args)=>{installs++;return execute(...args)}}
   const run=async(kind)=>{reads=zoomCalls=idleZoomChecks=installs=0;const times=[];for(let i=0;i<35;i++){await new Promise(requestAnimationFrame);if(kind==='pan'){board.board.camera.x+=2;board.board.camera.y+=1}else board.board.camera.z=.35+Math.sin(i*.15)*.08;const start=performance.now();board.camera();times.push(performance.now()-start)}return{medianMs:+times.sort((a,b)=>a-b)[17].toFixed(2),p95Ms:+times[33].toFixed(2),layoutReads:reads,nativeZoomCalls:zoomCalls,idleZoomChecks}};
   const pan=await run('pan'),zoom=await run('zoom');await new Promise(resolve=>setTimeout(resolve,250));installs=0;for(let i=0;i<3;i++)board.render();const redrawPageInstalls=installs;Element.prototype.getBoundingClientRect=rect;return{nodes:board.board.nodes.length,webPages:board.webSessions.size,pan,zoom,redrawPageInstalls};
  });console.log(JSON.stringify(results));if(results.pan.layoutReads||results.pan.nativeZoomCalls||results.zoom.layoutReads||results.zoom.nativeZoomCalls||results.redrawPageInstalls)throw Error('Trabalho pesado voltou ao caminho da animação');
 }finally{await app.evaluate(({app})=>app.exit());server.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
