const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process');
(async()=>{
 const root=path.resolve(__dirname,'..'),pkg=require('../package.json');
 const run=args=>{const result=spawnSync(process.execPath,args,{cwd:root,stdio:'inherit',windowsHide:true});if(result.status!==0)throw Error('A geração do pacote falhou; o instalador anterior não foi substituído.')};
 run(['scripts/build.cjs']);
 const stage=path.join(process.env.LOCALAPPDATA||os.tmpdir(),'ImageAtlasBuild',pkg.version);
 const electronDist=path.join(root,'node_modules/electron/dist');
 // Reuse the installed runtime instead of downloading another large ZIP.
 const localElectron=await fs.stat(path.join(electronDist,'electron.exe')).then(()=>true,()=>false);
 run(['node_modules/electron-builder/cli.js','--win','nsis','--x64','--config.directories.output='+stage,...(localElectron?['--config.electronDist='+electronDist]:[])]);
 const name=pkg.build.win.artifactName.replace('${version}',pkg.version).replace('${ext}','exe'),destination=path.join(root,'release');await fs.mkdir(destination,{recursive:true});await fs.copyFile(path.join(stage,name),path.join(destination,name));
 const data=await fs.readFile(path.join(destination,name)),hash=crypto.createHash('sha256').update(data).digest('hex');
 await fs.writeFile(path.join(destination,'SHA256SUMS.txt'),`${hash}  ${name}\n`);
 console.log(`Instalador: ${path.join(destination,name)}\nSHA-256: ${hash}`);
})().catch(error=>{console.error(error);process.exitCode=1});
