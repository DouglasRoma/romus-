import {Modal} from './compat.js';
export class SettingsModal extends Modal{
  onOpen(){
    this.setTitle('Configurações');this.modalEl.addClass('atlas-settings-modal');
    const field=(title,description)=>{const row=this.contentEl.createDiv({cls:'atlas-setting-row'});const text=row.createDiv();text.createEl('strong',{text:title});text.createEl('p',{text:description});return row};
    const mode=field('Visualização padrão das notas','Escolha como suas notas abrem para ler e escrever.');
    this.mode=mode.createEl('select',{attr:{'aria-label':'Visualização padrão das notas'}});
    for(const [value,label]of [['formatted','Editor formatado'],['source','Código Markdown'],['preview','Somente leitura']])this.mode.createEl('option',{text:label,attr:{value}});
    this.mode.value=this.app.preferences.noteMode||'formatted';
    const theme=field('Aparência','Escolha o tema do aplicativo.');this.theme=theme.createEl('select',{attr:{'aria-label':'Tema do aplicativo'}});
    for(const [value,label]of [['dark','Escuro'],['light','Claro']])this.theme.createEl('option',{text:label,attr:{value}});this.theme.value=document.documentElement.dataset.theme||'dark';
    const folder=field('Pasta de novas notas','Pasta usada quando você cria uma nota pela navegação.');this.folder=folder.createEl('input',{value:this.app.preferences.notesFolder||'Notas',attr:{'aria-label':'Pasta de novas notas'}});
    const sidebar=field('Barra lateral ao iniciar','Você também pode mostrar ou ocultar pelo botão no canto superior esquerdo.');this.sidebar=sidebar.createEl('input',{attr:{type:'checkbox','aria-label':'Mostrar barra lateral ao iniciar'}});this.sidebar.checked=!!this.app.preferences.sidebarOpen;
    const actions=this.contentEl.createDiv({cls:'ia-modal-actions'});const cancel=actions.createEl('button',{text:'Cancelar'});cancel.onclick=()=>this.close();
    const save=actions.createEl('button',{text:'Salvar configurações',cls:'mod-cta'});save.onclick=async()=>{
      save.disabled=true;try{
        const folder=this.folder.value.trim().replace(/\\/g,'/');if(folder.split('/').some(part=>part==='..'||part==='.')||/[<>:"|?*]/.test(folder))throw Error('Escolha uma pasta válida dentro da biblioteca.');
        const old=this.app.preferences.noteMode;this.app.preferences={...this.app.preferences,noteMode:this.mode.value,notesFolder:folder||'Notas',sidebarOpen:this.sidebar.checked};
        localStorage.setItem('atlas:preferences',JSON.stringify(this.app.preferences));this.app.setTheme(this.theme.value);this.app.toggleSidebar(this.sidebar.checked);
        if(old!==this.mode.value)for(const leaf of this.app.workspace.leaves)if(leaf.view?.setEditorMode)await leaf.view.setEditorMode(this.mode.value);
        this.close();
      }catch(error){let status=this.contentEl.querySelector('.atlas-form-status');status||=this.contentEl.createDiv({cls:'atlas-form-status'});status.textContent=error.message;save.disabled=false}
    };
  }
}
