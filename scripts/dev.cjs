const fs=require('node:fs'),fsp=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto'),{spawn,spawnSync}=require('node:child_process'),esbuild=require('esbuild');
const root=path.resolve(__dirname,'..');let child,context,watcher,closing=false,restart=false,timer,lastHash;const pending=new Set();
function send(message){if(child?.connected)child.send(message,error=>{if(error&&error.code!=='ERR_IPC_CHANNEL_CLOSED')console.error(error)})}
const hash=()=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'dist/app.js'))).digest('hex');
function launch(){child=spawn(require('electron'),[root],{cwd:root,env:{...process.env,IMAGE_ATLAS_DEV:'1'},stdio:['ignore','inherit','inherit','ipc'],windowsHide:true});child.on('message',message=>{if(message?.restart)restart=true});child.on('exit',()=>{child=null;if(restart&&!closing){restart=false;launch()}else shutdown()});child.on('error',error=>{console.error(error);shutdown()})}
async function shutdown(){if(closing)return;closing=true;clearTimeout(timer);watcher?.close();await context?.dispose();if(child)send('atlas:backend-update')}
(async()=>{
 const first=spawnSync(process.execPath,['scripts/build.cjs'],{cwd:root,stdio:'inherit',windowsHide:true});if(first.status!==0)throw Error('Falha ao preparar o aplicativo.');lastHash=hash();
 context=await esbuild.context({entryPoints:[path.join(root,'src/renderer.js')],bundle:true,outfile:path.join(root,'dist/app.js'),platform:'browser',format:'esm',target:'chrome140',alias:{obsidian:path.join(root,'src/compat.js')},sourcemap:true,plugins:[{name:'atlas-live-update',setup(build){build.onEnd(result=>{if(result.errors.length)return;const current=hash();if(current!==lastHash){lastHash=current;send('atlas:renderer-update')}})}}]});
 await context.watch();
 watcher=fs.watch(path.join(root,'src'),{recursive:true},(_,name)=>{
  if(!name)return;pending.add(name);clearTimeout(timer);timer=setTimeout(async()=>{const names=[...pending];pending.clear();for(const name of names){
   try{
    if(['main.cjs','storage.cjs','preload.cjs','media-player-server.cjs'].includes(name)){send('atlas:backend-update');continue}
    if(/\.(css|html)$/.test(name)){await fsp.copyFile(path.join(root,'src',name),path.join(root,'dist',name));send(name.endsWith('.css')?'atlas:styles-update':'atlas:renderer-update')}
   }catch(error){console.error('Atualização não aplicada:',error.message)}}
  },200);
 });
 launch();console.log('Image Atlas em desenvolvimento. Alterações são aplicadas sem reinstalar.');
})().catch(error=>{console.error(error);process.exitCode=1;shutdown()});
process.on('SIGINT',shutdown);process.on('SIGTERM',shutdown);
