const { _electron:electron }=require('C:/Users/dougl/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const home=await fs.mkdtemp(path.join(os.tmpdir(),'atlas-app-test-'));
 const application=await electron.launch({executablePath:require('electron'),args:[path.resolve(__dirname,'..')],env:{...process.env,IMAGE_ATLAS_TEST_HOME:home}});
 try{
 const page=await application.firstWindow();page.on('pageerror',e=>console.error('PAGE:',e.message));page.on('console',msg=>{if(msg.type()==='error')console.error('CONSOLE:',msg.text())});
 await page.getByRole('heading',{name:'Conhecimento que ganha conexões.'}).waitFor();
 await page.getByRole('button',{name:'Novo whiteboard',exact:true}).click();
 await page.locator('.ia-viewport').waitFor();
 await page.locator('summary[aria-label="Adicionar"]').click();await page.getByRole('button',{name:'Mapa mental',exact:true}).click();
 console.log('dialogs',await page.locator('.modal-title').allTextContents());
 await application.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].showInactive());
 await fs.mkdir(path.resolve(__dirname,'../test-results'),{recursive:true});await page.screenshot({path:path.resolve(__dirname,'../test-results/desktop.png')});
 assert(await page.locator('.ia-viewport').count());
 console.log('PASS: standalone Electron boot, native-backed new whiteboard, original mind map action. Test data:',home);
 }finally{await application.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
