import {Modal,Notice} from './compat.js';
import {PROPERTY_TYPES,reserved,publicProperties,propertyDocument,inferType,patchProperties} from './property-data.js';
import {PALETTE,colorChip} from './property-colors.js';
export {PROPERTY_TYPES,publicProperties,propertyDocument,inferType,patchProperties,valueMatches} from './property-data.js';

export class PropertiesModal extends Modal{
  constructor(app,file,afterSave){super(app);this.file=file;this.afterSave=afterSave;this.rows=[];this.alive=true}
  async onOpen(){
    this.modalEl.addClass('atlas-properties-modal');this.setTitle('Propriedades · '+this.file.basename);
    try{
      this.original=propertyDocument(await this.app.vault.read(this.file)).props;
      this.styles=structuredClone(this.app.propertyStyles||{});
      this.contentEl.createEl('p',{cls:'ia-muted',text:'Organize esta nota com campos que também podem ser usados nos filtros da biblioteca.'});
      this.namesId='atlas-property-names-'+Date.now();const names=this.contentEl.createEl('datalist',{attr:{id:this.namesId}});for(const name of Object.keys(this.app.propertyTypes||{}))names.createEl('option',{attr:{value:name}});
      this.host=this.contentEl.createDiv({cls:'atlas-property-rows'});
      for(const [key,value] of Object.entries(publicProperties(this.original)))this.addRow(key,value);
      if(!this.rows.length)this.addRow('','');
      const add=this.contentEl.createEl('button',{text:'+ Adicionar propriedade'});add.onclick=()=>this.addRow('','');
      this.status=this.contentEl.createDiv({cls:'atlas-form-status',attr:{role:'status','aria-live':'polite'}});
      const actions=this.contentEl.createDiv({cls:'ia-modal-actions'});
      const cancel=actions.createEl('button',{text:'Cancelar'});cancel.onclick=()=>this.close();
      this.saveButton=actions.createEl('button',{cls:'mod-cta',text:'Salvar propriedades'});this.saveButton.onclick=()=>this.saveProperties();
    }catch(error){this.contentEl.createEl('p',{text:error.message})}
  }
  addRow(key,value){
    const row={key,value,original:value,dirty:false,el:this.host.createDiv({cls:'atlas-property-row'})};
    row.name=row.el.createEl('input',{value:key,attr:{placeholder:'Nome, por exemplo: tema','aria-label':'Nome da propriedade',list:this.namesId}});
    row.type=row.el.createEl('select',{attr:{'aria-label':'Tipo da propriedade'}});
    for(const [id,label] of PROPERTY_TYPES)row.type.createEl('option',{text:label,attr:{value:id}});
    row.type.value=inferType(key,value,this.app.propertyTypes);row.valueHost=row.el.createDiv({cls:'atlas-property-value'});
    row.color=row.el.createEl('input',{attr:{type:'color','aria-label':'Cor da propriedade',title:'Cor da propriedade'}});row.color.value=this.styles[key]?.color||PALETTE[this.rows.length%PALETTE.length];row.color.oninput=()=>this.renderValue(row);
    const remove=row.el.createEl('button',{text:'×',attr:{'aria-label':'Remover propriedade'}});remove.onclick=()=>{this.rows.splice(this.rows.indexOf(row),1);row.el.remove()};
    row.type.onchange=()=>{row.typeTouched=true;row.value=row.selected?([...row.selected].length>1?[...row.selected]:[...row.selected][0]||''):row.input.type==='checkbox'?row.input.checked:row.input.value;row.selected=null;row.dirty=true;this.renderValue(row)};
    row.name.oninput=()=>{const known=this.app.propertyTypes?.[row.name.value.trim()],type=known==='multitext'?'list':known;if(type&&!row.typeTouched&&row.type.value!==type){row.type.value=type;this.renderValue(row)}};
    this.rows.push(row);this.renderValue(row);if(!key)row.name.focus();return row;
  }
  renderValue(row){
    const type=row.type.value;row.valueHost.empty();const inputType={number:'number',checkbox:'checkbox',date:'date',datetime:'datetime-local'}[type]||'text';
    if(['select','multi-select','status'].includes(type)){this.renderSelect(row);return}
    row.input=row.valueHost.createEl('input',{attr:{type:inputType,'aria-label':'Valor da propriedade'}});
    if(type==='checkbox')row.input.checked=row.value===true;
    else if(type==='structured'){row.input.value=JSON.stringify(row.value);row.input.readOnly=true}
    else if(type==='list'||type==='tags'){row.input.value=Array.isArray(row.value)?row.value.join(', '):String(row.value??'');row.input.placeholder='Separe os valores com vírgulas'}
    else{row.input.value=String(row.value??'');if(type==='number')row.input.step='any'}
    row.input.oninput=()=>{row.dirty=true;row.value=type==='checkbox'?row.input.checked:row.input.value};
  }
  renderSelect(row){
    const key=row.name.value.trim()||row.key,multiple=row.type.value==='multi-select';
    row.selected||=new Set((Array.isArray(row.value)?row.value:[row.value]).filter(v=>v!==undefined&&v!==null&&v!=='').map(String));
    row.options||=structuredClone(this.styles[key]?.options||[]);
    if(row.type.value==='status'&&!row.options.length)row.options=[{value:'A fazer',color:PALETTE[0]},{value:'Em andamento',color:PALETTE[2]},{value:'Concluído',color:PALETTE[4]}];
    for(const value of row.selected)if(!row.options.some(option=>option.value===value))row.options.push({value,color:row.color.value});
    const details=row.valueHost.createEl('details',{cls:'atlas-property-select'}),summary=details.createEl('summary',{attr:{'aria-label':'Valor da propriedade'}});
    const renderSummary=()=>{summary.empty();if(!row.selected.size)summary.createSpan({text:'Selecionar…',cls:'ia-muted'});for(const value of row.selected){const chip=summary.createSpan({text:value});colorChip({propertyStyles:{[key]:{color:row.color.value,options:row.options}}},chip,key,value)}};renderSummary();
    const panel=details.createDiv({cls:'atlas-property-options'});
    const renderOptions=()=>{panel.empty();for(const option of row.options){const line=panel.createDiv({cls:'atlas-property-option'}),choose=line.createEl('button',{text:(row.selected.has(option.value)?'✓ ':'')+option.value});colorChip({propertyStyles:{[key]:{options:[option]}}},choose,key,option.value);choose.onclick=()=>{if(!multiple){row.selected.clear();row.selected.add(option.value);details.open=false}else if(row.selected.has(option.value))row.selected.delete(option.value);else row.selected.add(option.value);row.dirty=true;renderSummary();renderOptions()};const color=line.createEl('input',{attr:{type:'color','aria-label':'Cor de '+option.value}});color.value=option.color||row.color.value;color.oninput=()=>{option.color=color.value;colorChip({propertyStyles:{[key]:{options:[option]}}},choose,key,option.value);renderSummary()}}
      const add=panel.createDiv({cls:'atlas-property-option-add'}),name=add.createEl('input',{attr:{placeholder:'Nova opção…','aria-label':'Nome da opção'}}),color=add.createEl('input',{attr:{type:'color','aria-label':'Cor da nova opção'}});color.value=PALETTE[row.options.length%PALETTE.length];const button=add.createEl('button',{text:'+'});const create=()=>{const value=name.value.trim();if(!value)return;if(!row.options.some(option=>option.value===value))row.options.push({value,color:color.value});if(!multiple)row.selected.clear();row.selected.add(value);row.dirty=true;renderSummary();renderOptions()};button.onclick=create;name.onkeydown=event=>{if(event.key==='Enter'){event.preventDefault();create()}};
      const clear=panel.createEl('button',{text:'Limpar seleção',cls:'atlas-clear-selection'});clear.onclick=()=>{row.selected.clear();row.dirty=true;renderSummary();renderOptions()};
    };renderOptions();
    row.input={type:'text',get value(){return[...row.selected].join(', ')}};
  }
  async saveProperties(){
    if(this.busy)return;this.busy=true;this.saveButton.disabled=true;
    try{
      const values={},types={...this.app.propertyTypes};
      for(const row of this.rows){
        const key=row.name.value.trim(),type=row.type.value;if(!key)continue;
        if(reserved(key))throw Error('Esse nome é reservado para os dados internos do aplicativo.');
        if(Object.hasOwn(values,key))throw Error(`A propriedade “${key}” aparece duas vezes.`);
        let value=row.original;
        if(row.dirty||!row.key){
          if(type==='multi-select')value=[...row.selected];
          else if(type==='select'||type==='status')value=[...row.selected][0]||'';
          else if(type==='structured')value=row.original;
          else if(type==='checkbox')value=row.input.checked;
          else if(type==='list'||type==='tags')value=[...new Set(row.input.value.split(',').map(s=>s.trim().replace(type==='tags'?/^#/:/$^/,'')).filter(Boolean))];
          else if(type==='number'){if(!row.input.value.trim()||!Number.isFinite(Number(row.input.value)))throw Error(`Informe um número válido para “${key}”.`);value=Number(row.input.value)}
          else value=row.input.value;
        }
        values[key]=value;types[key]=type;this.styles[key]={color:row.color.value,options:row.options||this.styles[key]?.options||[]};
      }
      await this.app.vault.process(this.file,text=>patchProperties(text,this.original,values));
      await window.atlasNative.call('property-types:write',types);this.app.propertyTypes=types;
      await window.atlasNative.call('write','.atlas-property-styles.json',JSON.stringify(this.styles,null,2));this.app.propertyStyles=this.styles;
      await this.afterSave?.();this.close();
    }catch(error){if(this.alive)this.status.textContent=error.message}
    finally{this.busy=false;if(this.alive)this.saveButton.disabled=false}
  }
  onClose(){this.alive=false;this.contentEl.empty()}
}
