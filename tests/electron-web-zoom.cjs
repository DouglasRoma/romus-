const {_electron}=require('C:/Users/dougl/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
(async()=>{
 const home=await fs.mkdtemp(path.join(os.tmpdir(),'atlas-web-zoom-')),server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html');res.end('<!doctype html><style>body{margin:20px}h1{font:32px Arial}p{font:18px Arial}button{font:16px Arial}@media(max-width:450px){h1{font-size:72px}button{font-size:96px}}</style><h1>Estrutura da célula</h1><p>Esta página deve manter o mesmo enquadramento.</p><button>Índice</button><div style="height:3000px"></div>')});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const app=await _electron.launch({executablePath:require('electron'),args:[path.resolve(__dirname,'..')],env:{...process.env,IMAGE_ATLAS_TEST_HOME:home}});
 try{
  const page=await app.firstWindow(),errors=[];page.on('pageerror',error=>errors.push(error.message));await page.waitForFunction(()=>window.atlasApp?.mediaUI&&document.querySelector('.welcome'));
  await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].show());
  await page.evaluate(async url=>{const file=await atlasPlugin.createBoardFile('Zoom independente');await atlasApp.workspace.getLeaf('tab').openFile(file);window.board=atlasApp.workspace.activeLeaf.view;window.item=atlasApp.media.get(url,'Artigo');window.node=await atlasApp.mediaUI.insert(board,item,{x:20,y:20});board.board.camera={x:10,y:10,z:1};board.camera()},'http://127.0.0.1:'+server.address().port+'/page');
  await page.waitForFunction(()=>board.webSessions.get(node.id)?.reader?.ready);
  await page.evaluate(async()=>{
   const reader=board.webSessions.get(node.id).reader;
   for(const local of [1,1.2,.8]){
    reader.node.mediaPageZoom=local;reader.applyPageZoom();await new Promise(resolve=>setTimeout(resolve,100));
    const before=await reader.frame.executeJavaScript('({width:innerWidth,font:getComputedStyle(document.querySelector("h1")).fontSize})');
    for(const scale of [.35,.7,1,1.8,.5,1]){
     board.zoom(scale/board.board.camera.z,20,20);board.flushCameraFrame();await new Promise(resolve=>setTimeout(resolve,40));
     if(Math.abs(reader.frame.getZoomFactor()/reader.rasterDensity-local)>.001)throw Error(`Página mudou de ${local} para ${reader.frame.getZoomFactor()} ao ampliar o quadro para ${scale}`);
     if(reader.node.mediaPageZoom!==local)throw Error('Zoom salvo da página foi alterado');
     const after=await reader.frame.executeJavaScript('({width:innerWidth,font:getComputedStyle(document.querySelector("h1")).fontSize})');
     if(Math.abs(after.width-before.width)>2||after.font!==before.font)throw Error('Página reenquadrada ao afastar o quadro: '+JSON.stringify({scale,before,after}));
    }
   }
   reader.frame.setZoomFactor(1.4*reader.rasterDensity);reader.applyPageZoom();if(Math.abs(reader.node.mediaPageZoom-1.4)>.001)throw Error('Zoom próprio da página não foi conservado');
   await reader.frame.executeJavaScript('scrollTo(0,200)');const scroll=await reader.frame.executeJavaScript('scrollY');board.zoom(.7,20,20);board.flushCameraFrame();if(Math.abs(reader.frame.getZoomFactor()/reader.rasterDensity-1.4)>.001)throw Error('Quadro alterou o zoom próprio');if(await reader.frame.executeJavaScript('scrollY')!==scroll)throw Error('Quadro alterou a leitura da página');
  });
  const viewport=page.locator('.ia-viewport');const rect=await viewport.boundingBox();await page.mouse.move(rect.x+rect.width-25,rect.y+rect.height-25);const before=await page.evaluate(()=>board.board.camera.z);await page.mouse.wheel(0,-350);await page.waitForFunction(value=>board.board.camera.z!==value,before);assert(Math.abs(await page.evaluate(()=>(board.webSessions.get(node.id).reader.frame.getZoomFactor()/board.webSessions.get(node.id).reader.rasterDensity))-1.4)<.001);
  await page.evaluate(()=>{const reader=board.webSessions.get(node.id).reader;reader.node.mediaPageZoom=1;reader.applyPageZoom();reader.frame.executeJavaScript('scrollTo(0,0)');board.board.camera={x:50,y:40,z:.35};board.camera()});await page.screenshot({path:path.join(home,'pagina-quadro-35.png')});console.log(home);assert.deepEqual(errors,[]);console.log('Zoom da página permanece em 100%, 120%, 80% e 140% ao ampliar/reduzir o quadro; roda real do mouse e posição de leitura: OK.');
 }finally{await app.evaluate(({app})=>app.exit());server.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
