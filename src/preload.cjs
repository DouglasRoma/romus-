const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('atlasNative',{
 call:(operation,...args)=>ipcRenderer.invoke('atlas:call',operation,...args),
 onMediaTab:handler=>{ipcRenderer.on('atlas:media-tab',(_,id,shift)=>handler(id,shift))},
 onMediaPreview:handler=>{ipcRenderer.on('atlas:media-preview',(_,id,active)=>handler(id,active))},
 onClosing:handler=>{ipcRenderer.on('atlas:closing',handler)},
 onUpdate:handler=>{ipcRenderer.on('atlas:development-update',handler)},
 restartDevelopment:()=>ipcRenderer.send('atlas:restart-ready'),
 readyToClose:()=>ipcRenderer.send('atlas:ready-close')
});
