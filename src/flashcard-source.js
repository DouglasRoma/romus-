import {propertyDocument} from './property-data.js';

/** Mutate the original card only; scheduling is handled by the review store. */
export async function changeFlashcard(app,entry,values){
 const plugin=app.plugin,tools=plugin.reviewSourceTools(),file=app.vault.getFileByPath(entry.sourcePath);
 if(!file)throw Error('A nota original não foi encontrada.');
 for(const editor of new Set([...(app.embeddedEditors||[]),...app.workspace.leaves.flatMap(l=>[l.view,l.view?.summaryPane?.editor])]))if(editor?.file===file&&editor.input)await editor.save?.();
 const live=app.workspace.getLeavesOfType('image-atlas-board').find(l=>l.view.file===file)?.view;if(live)await live.save();await plugin.visualWrites?.get(file.path);
 const before=await app.vault.read(file),changeAnswer=values&&values.answer!==entry.answer;let after;
 if(values){if(!values.question.trim()||!values.answer.trim()||/[\r\n]/.test(values.question))throw Error('Preencha pergunta e resposta. A pergunta deve ocupar uma linha.');values={question:values.question.trim(),answer:values.answer.trim()}}
 if(file.extension==='md'&&!String(entry.sourceCardId).startsWith('legacy:')){
  const matches=tools.parseNoteFlashcards(before,file.path).cards.filter(card=>card.question===entry.question&&card.answer===entry.answer),target=matches.find(card=>card.id===entry.sourceCardId)||(matches.length===1?matches[0]:null);
  if(!target)throw Error('O cartão mudou em outra tela. Atualize a revisão antes de editar.');
  const lines=before.split(/\r?\n/),start=Number(target.id.match(/:line:(\d+)$/)[1])-1;let end=start+1;while(end<lines.length&&/^(?: {2}|\t)/.test(lines[end]))end++;
  const source=values?tools.serializeFlashcardRows([values]):'';
  if(values){const parsed=tools.parseNoteFlashcards(source,file.path,true);if(parsed.errors.length||parsed.cards.length!==1)throw Error('Use Markdown válido para um único cartão.');}
  lines.splice(start,end-start,...(values?source.split('\n'):[]));after=lines.join(before.includes('\r\n')?'\r\n':'\n');
  await app.vault.process(file,raw=>{if(raw!==before)throw Error('A nota mudou durante a edição. Seu texto foi mantido.');return after});
 }else{
  const doc=file.extension==='md'?propertyDocument(before):null,data=doc?.props['image-atlas-data'];
  const scene=file.extension==='md'?tools.readVisualBundle(typeof data==='string'?data:JSON.stringify(data)):tools.parseBoard(before);
  const id=String(entry.sourceCardId||'').replace(/^legacy:/,'');let owner,card;
  for(const node of scene.nodes){const found=node.flashcards?.find(c=>c.id===id);if(found){owner=node;card=found;break}}
  if(!card)throw Error('Este cartão não existe mais no mapa. Atualize a revisão.');
  if(values){card.question=values.question;if(changeAnswer||card.answerSource!=='children'){card.answer=values.answer;delete card.answerSource}}else owner.flashcards=owner.flashcards.filter(c=>c!==card);
  if(file.extension==='md')await plugin.saveVisualSource(file.path,file.path,scene);
  else{after=JSON.stringify(scene,null,2);await app.vault.process(file,raw=>{if(raw!==before)throw Error('O quadro mudou durante a edição. Tente novamente.');return after});if(live)live.setViewData(after,true)}
  after=await app.vault.read(file);
 }
 return{file,before,after,values,entry};
}
export async function undoFlashcardRemoval(app,saved){
 const {file,before,after}=saved;await app.plugin.visualWrites?.get(file.path);
 await app.vault.process(file,raw=>{if(raw!==after)throw Error('A nota mudou após a remoção. Desfazer não vai substituir suas alterações.');return before});
 if(file.extension==='imageboard'){for(const leaf of app.workspace.getLeavesOfType('image-atlas-board'))if(leaf.view.file===file)leaf.view.setViewData(before,true)}
 else{const data=propertyDocument(before).props['image-atlas-data'];if(data){const bundle=app.plugin.reviewSourceTools().readVisualBundle(typeof data==='string'?data:JSON.stringify(data));app.plugin.publishVisual(file.path,bundle,undefined,file.path)}}
}
