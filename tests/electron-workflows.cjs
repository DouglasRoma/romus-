const {_electron:electron}=require('C:/Users/dougl/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
const home=await fs.mkdtemp(path.join(os.tmpdir(),'atlas-workflows-'));const launch=()=>electron.launch({executablePath:require('electron'),args:[path.resolve(__dirname,'..')],env:{...process.env,IMAGE_ATLAS_TEST_HOME:home}});
let application=await launch();
try{
let page=await application.firstWindow();const errors=[];page.on('pageerror',error=>errors.push(error.message));
await page.getByRole('heading',{name:'Conhecimento que ganha conexões.'}).waitFor();
await page.getByRole('button',{name:'Novo whiteboard',exact:true}).click();await page.locator('.ia-viewport').waitFor();
await page.locator('summary[aria-label="Adicionar"]').click();await page.getByRole('button',{name:'Mapa mental',exact:true}).click();await page.getByRole('button',{name:'Criar do zero',exact:true}).click();await page.getByPlaceholder('Ex.: Riñón').fill('Tema de teste');await page.getByRole('button',{name:'Salvar',exact:true}).click();
await page.waitForFunction(()=>atlasApp.workspace.activeLeaf.view.board.nodes.some(n=>n.title==='Tema de teste'));
await page.locator('.ia-viewport').focus();await page.keyboard.press('Tab');await page.waitForFunction(()=>atlasApp.workspace.activeLeaf.view.board.nodes.length===2);await page.keyboard.press('Escape');
await page.evaluate(()=>{const view=atlasApp.workspace.activeLeaf.view;window.testBoard=view.file.path;window.testRoot=view.board.nodes.find(n=>n.title==='Tema de teste').id});
await page.getByRole('button',{name:'Nova nota',exact:true}).click();await page.getByRole('textbox',{name:'Criar nota',exact:true}).fill('Nota de teste');await page.getByRole('button',{name:'Salvar',exact:true}).click();
await page.getByRole('textbox',{name:'Texto da nota',exact:true}).fill('# Nota de teste\n\nResumo com **Markdown** e [[Outra nota]].\n');await page.keyboard.press('Control+s');
await page.getByRole('button',{name:'Flashcards',exact:true}).click();await page.getByRole('textbox',{name:'Pergunta do cartão 1',exact:true}).fill('Pregunta uno');await page.getByRole('textbox',{name:'Resposta do cartão 1',exact:true}).fill('Respuesta **uno**');
await page.getByRole('button',{name:'Salvar e estudar',exact:true}).click();await page.locator('.ia-fsrs-card .ia-flash-question').waitFor();
assert.equal((await page.locator('.ia-flash-question').textContent()).trim(),'Pregunta uno');await page.getByRole('button',{name:'Mostrar resposta · Ctrl+Enter',exact:true}).click();assert.equal(await page.locator('.ia-fsrs-rating-3 .ia-fsrs-interval').textContent(),'1 d');await page.locator('.ia-fsrs-rating-3').click();await page.getByRole('heading',{name:'Sessão concluída',exact:true}).waitFor();
const state=await page.evaluate(()=>{const entry=atlasPlugin.activeReviewPopup.controller.entries[0];return{id:entry.id,schedule:entry.record.schedule,history:entry.record.history,path:entry.sourcePath}});assert.equal(state.history.length,1);
await page.locator('.ia-fsrs-modal .modal-close-button').click();
await page.evaluate(async()=>{const board=atlasApp.vault.getFileByPath(testBoard);await atlasApp.workspace.getLeaf(false).openFile(board);const view=atlasApp.workspace.activeLeaf.view;});
// Add an ordinary note card through the original UI if this note has no scene yet.
await page.locator('summary[aria-label="Adicionar"]').click();await page.getByRole('button',{name:'Adicionar nota existente',exact:true}).click();await page.locator('.suggest-item').first().waitFor();
const suggestion=page.locator('.suggest-item').filter({hasText:'Nota de teste'});if(await suggestion.count())await suggestion.first().click();
await page.waitForFunction(()=>atlasApp.workspace.activeLeaf.view.board.nodes.some(n=>n.path==='Notas/Nota de teste.md'));
await page.evaluate(async()=>{const leaf=atlasApp.workspace.activeLeaf;if(leaf.view.save)await leaf.view.save();});
await page.evaluate(()=>{window.scopeTrace=[];window.noteTrace=[];const read=atlasPlugin.readNoteFlashcards.bind(atlasPlugin);atlasPlugin.readNoteFlashcards=async(...args)=>{const cards=await read(...args);noteTrace.push({note:{...args[0]},cards:cards.map(c=>c.question)});return cards};const original=atlasPlugin.loadReviewEntries.bind(atlasPlugin);atlasPlugin.loadReviewEntries=async spec=>{const value=await original(spec);scopeTrace.push({spec,entries:value.entries.length,active:atlasApp.workspace.activeLeaf.view.file?.path,nodes:atlasApp.workspace.activeLeaf.view.board?.nodes.map(n=>({type:n.type,path:n.path}))});return value}});
await page.getByRole('button',{name:'Estudar todos os flashcards',exact:true}).click();await page.locator('.ia-study-topic').first().waitFor().catch(async error=>{console.error('TRACE:',JSON.stringify(await page.evaluate(()=>({scopeTrace,noteTrace,nodes:atlasApp.workspace.activeLeaf.view.board.nodes}))));console.error('TOPIC ERROR:',await page.locator('.ia-study-topics-summary').allTextContents(),await page.locator('.notice').allTextContents());throw error});assert((await page.locator('.ia-study-topics-summary').textContent()).includes('0 para responder agora'));await page.getByRole('searchbox',{name:'Buscar tema',exact:true}).fill('NOTA TESTE');assert.equal(await page.locator('.ia-study-topic').count(),1);await page.locator('.ia-study-topics-modal .modal-close-button').click();
await application.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].showInactive());await page.screenshot({path:path.resolve(__dirname,'../test-results/workflows.png')});
assert.equal(errors.length,0,errors.join('\n'));
await application.close();application=await launch();page=await application.firstWindow();await page.getByRole('button',{name:'Revisões de hoje',exact:true}).first().waitFor();
const persisted=await page.evaluate(async()=>{const file=atlasApp.vault.getFileByPath('Notas/Nota de teste.md');const data=await atlasPlugin.loadReviewEntries({notePath:file.path});return{id:data.entries[0].id,history:data.entries[0].record.history,schedule:data.entries[0].record.schedule}});assert.equal(persisted.id,state.id);assert.equal(persisted.history.length,1);assert.equal(persisted.schedule.due,state.schedule.due);
console.log('PASS: native standalone whiteboard/mind creation, Markdown editing, flashcard creation, 1-day Good rating, FSRS persistence/identity after full app restart; data isolated:',home);
}finally{await application.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
