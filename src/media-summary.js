import {Component} from './compat.js';
import {NoteEditor} from './note-editor.js';

// The summary edits the media's existing Markdown document, never a new note.
export class MediaSummaryPane{
 constructor(app,host,item,notePath){this.app=app;this.host=host;this.item=item;this.notePath=notePath;host.hidden=true}
 async toggle(){
  if(this.opening)return;this.opening=true;
  try{
   if(this.editor){await this.save();this.host.hidden=!this.host.hidden;this.host.parentElement.classList.toggle('has-summary',!this.host.hidden);return}
   const file=await this.app.mediaUI.noteFor(this.item,this.notePath);if(this.disposed)return;
   const editor=this.editor=new NoteEditor({app:this.app,containerEl:this.host});editor.file=file;editor.embeddedSummary=true;
   Component.prototype.load.call(editor);await editor.onOpen();await editor.readFile(file);
   (this.app.embeddedEditors||=new Set()).add(editor);this.host.hidden=false;this.host.parentElement.classList.add('has-summary');
  }finally{this.opening=false}
 }
 async save(){await this.editor?.save()}
 async dispose(){if(this.disposed)return;await this.save();this.disposed=true;if(this.editor){await this.editor.onClose();this.editor.unload();this.app.embeddedEditors?.delete(this.editor)}this.host.empty()}
}
