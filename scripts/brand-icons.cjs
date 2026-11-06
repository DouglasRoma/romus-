// Rasterize the supplied vector only for Windows' required multi-size ICO.
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const root=path.resolve(__dirname,'..');
if(!process.versions.electron){
 (async()=>{const home=await fs.mkdtemp(path.join(os.tmpdir(),'atlas-brand-icons-'));try{
  const {spawnSync}=require('node:child_process');const run=spawnSync(require('electron'),[__filename],{env:{...process.env,ROMUS_ICON_HOME:home},stdio:'inherit',windowsHide:true});if(run.status!==0)throw Error('Falha ao preparar o ícone ROMUS.');
 }finally{await fs.rm(home,{recursive:true,force:true,maxRetries:12,retryDelay:300})}})().catch(error=>{console.error(error);process.exitCode=1});
}else{
 const {app,BrowserWindow}=require('electron');app.setPath('userData',process.env.ROMUS_ICON_HOME);
 app.whenReady().then(async()=>{const win=new BrowserWindow({show:false,webPreferences:{sandbox:true,contextIsolation:true}});await win.loadURL('data:text/html,<html><body></body></html>');
  const svg=await fs.readFile(path.join(root,'resources/brand/romus-icon.svg'),'utf8');
  const sizes=[16,24,32,48,64,128,256];const pngs=await win.webContents.executeJavaScript(`(async()=>{const img=new Image();img.src=${JSON.stringify('data:image/svg+xml;base64,'+Buffer.from(svg).toString('base64'))};await img.decode();return ${JSON.stringify(sizes)}.map(size=>{const c=document.createElement('canvas');c.width=c.height=size;const x=c.getContext('2d');x.fillStyle='#0d0d0d';x.beginPath();x.roundRect(0,0,size,size,size*.21);x.fill();const w=size*.78,h=w*img.naturalHeight/img.naturalWidth;x.drawImage(img,(size-w)/2,(size-h)/2,w,h);return c.toDataURL('image/png').split(',')[1]})})()`);
  const images=pngs.map(p=>Buffer.from(p,'base64')),header=Buffer.alloc(6+16*sizes.length);header.writeUInt16LE(1,2);header.writeUInt16LE(sizes.length,4);let offset=header.length;
  sizes.forEach((size,i)=>{const at=6+i*16;header[at]=header[at+1]=size===256?0:size;header.writeUInt16LE(1,at+4);header.writeUInt16LE(32,at+6);header.writeUInt32LE(images[i].length,at+8);header.writeUInt32LE(offset,at+12);offset+=images[i].length});
  await fs.writeFile(path.join(root,'resources/icon.ico'),Buffer.concat([header,...images]));win.destroy();console.log('Ícone ROMUS criado a partir do SVG fornecido.');app.exit(0);
 }).catch(error=>{console.error(error);app.exit(1)});
}
