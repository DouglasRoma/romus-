const fs=require('node:fs/promises'),path=require('node:path'),esbuild=require('esbuild');
(async()=>{
 const root=path.resolve(__dirname,'..'),engine=path.resolve(root,'../.obsidian/plugins/image-atlas');
 await fs.mkdir(path.join(root,'dist'),{recursive:true});
 const source=(await fs.readFile(path.join(engine,'main.js'),'utf8')).replace(/\r\n/g,'\n');
 let standalone=source.replace('if (ms < 86400000) return','if (ms < 23.5 * 3600000) return').replaceAll('Editar nota no Obsidian','Editar nota').replaceAll('Editar no Obsidian','Editar nota').replaceAll('pelo Obsidian','pelo editor').replaceAll('do cofre','da biblioteca').replace("const path = node.visualNote || (['note', 'mind'].includes(node.type) ? node.path : '');","const path = node.mediaNote || node.visualNote || (['note', 'mind'].includes(node.type) ? node.path : '');").replace('  flashcardContext() {', '  editMediaFlashcards(note) { new NoteFlashcardEditor(this.flashcardContext(), note).open(); }\n  flashcardContext() {').replace('const factor = this.inline ? this.view.board.camera.z : 1;', 'const factor = this.node.mediaPageZoom || 1;').replace('this.updateMarkLabel();\n  }\n  async refresh()', 'this.updateMarkLabel(); this.app.mediaUI?.wireReader(this);\n  }\n  async refresh()').replace('node.type, node.title, node.path, node.visualNote', 'node.type, node.title, node.path, node.mediaNote, node.visualNote');
 standalone=standalone.replace("this.file?.basename || 'Image Atlas'","this.file?.basename || 'ROMUS'").replace("text: 'IMAGE ATLAS'","text: 'ROMUS'").replace("display: 'Image Atlas'","display: 'ROMUS'").replace('Image Atlas: abrir quadro','ROMUS: abrir quadro').replaceAll('internos do Image Atlas','internos do ROMUS');
 standalone=standalone.replace('  editMediaFlashcards(note) {', '  createFlashcardEditor(note, options = {}) { return new NoteFlashcardEditor(this.flashcardContext(), note, options); }\n  editMediaFlashcards(note) {');
 standalone=standalone.replace('  createFlashcardEditor(note, options = {}) {', `  async readBoardFlashcardsForSearch(file) {
    const live = this.app.workspace.getLeavesOfType(VIEW).find(leaf => leaf.view.file?.path === file.path && !leaf.view.invalidData)?.view;
    const board = live?.board || parseBoard(await this.app.vault.read(file));
    const ownership = new Map();
    for (const root of board.nodes.filter(node => node.visualSource)) for (const member of reusableNodes(board, root)) ownership.set(member.id, root);
    const seen = new Set(), cards = [];
    for (const node of board.nodes) for (const card of node.flashcards || []) {
      const owner = ownership.get(node.id), notePath = owner?.visualNote || (node.path?.endsWith('.md') ? node.path : null);
      if (notePath || seen.has(card.id)) continue; seen.add(card.id);
      cards.push({ ...card, order: cards.length, nodeTitle: node.title, answer: card.answerSource === 'children' ? board.nodes.filter(child => child.parentId === node.id).map(child => child.title).join('\\n') : card.answer });
    }
    return { title: board.title || file.basename, summaryNote: board.summaryNote, cards };
  }
  createFlashcardEditor(note, options = {}) {`);
 standalone=standalone.replace('class NoteFlashcardEditor extends Modal {', `class NoteFlashcardEditor extends Modal {\n  open() { if (this.app.shouldDockFlashcardEditor?.()) return this.app.dockFlashcardEditor(this).catch(error => new Notice(error.message)); return super.open(); }`);
 standalone=standalone.replace('  createFlashcardEditor(note, options = {}) {','  reviewSourceTools() { return { parseNoteFlashcards, serializeFlashcardRows, parseBoard, readVisualBundle }; }\n  createFlashcardEditor(note, options = {}) {');
 standalone=standalone.replace('    this.bindNoteLinks();','    this.bindNoteLinks();\n    this.app.reviewInteractions?.install(this);\n    this.app.romusUI?.review(this);');
 standalone=standalone.replace("text: 'REVISÃO ESPAÇADA · FSRS'","text: 'FLASHCARDS · REVISÃO ESPAÇADA'");
 standalone=standalone.replace("const source = el.createDiv({ cls: 'ia-eyebrow', text: item.entry.nodeTitle || this.spec.title });", "const heading = el.createDiv({ cls: 'romus-flashcard-header' }); heading.createSpan({ cls: 'romus-flashcard-kind', text: 'FLASHCARD' }); const source = heading.createEl('h3', { cls: 'romus-flashcard-title', text: item.entry.nodeTitle || this.spec.title || 'Flashcards' });");
 standalone=standalone.replace("const question = el.createDiv({ cls: 'ia-flash-question' });", "heading.append(history); const question = el.createDiv({ cls: 'ia-flash-question' });");
 standalone=standalone.replace('  handleReviewKey(event) {','  handleReviewKey(event) {\n    if (this.inlineCardEditor?.active) return false;');
 standalone=standalone.replace('input.oninput = () => { this.resizeInput(input); this.updateCount(); };','input.oninput = () => { if (this.app.reviewInteractions) this.app.reviewInteractions.scheduleTyping(this, input); else { this.resizeInput(input); this.updateCount(); } };');
 standalone=standalone.replace('  async pickVisualNote() {','  async pickVisualNote(pos) {').replace("file => { if (this.board === board) this.addVisualNote(file); }, 'Adicionar uma nota existente", "file => { if (this.board === board) this.addVisualNote(file, pos); }, 'Adicionar uma nota existente");
 standalone=standalone.replace("    const rect = link.getBoundingClientRect(), width = Math.min(420, win.innerWidth - 24), height = Math.min(360, win.innerHeight - 24);", "    this.app.wireEditableNotePreview?.(preview, note, options => this.notePreview === preview ? this.closeNotePreview(options) : undefined, link);\n    const rect = link.getBoundingClientRect(), width = Math.min(420, win.innerWidth - 24), height = Math.min(360, win.innerHeight - 24);");
 standalone=standalone.replace('  closeNotePreview() {', '  closeNotePreview(options = {}) {').replace('    this.notePreviewComponent?.unload(); this.notePreviewComponent = null;', '    const component = this.notePreviewComponent; this.notePreviewComponent = null;\n    if (!options.preserve) component?.unload();').replace('    this.notePreview?.remove(); this.notePreview = null;', '    if (!options.preserve) this.notePreview?.remove(); this.notePreview = null;\n    if (options.preserve) return () => component?.unload();');
 standalone=standalone.replace('      if (!this.alive || token !== this.previewToken) return;', '      if (!preview.isConnected || preview.dataset.editing) return;').replace("    } catch (error) { if (token === this.previewToken) body.textContent =", "    } catch (error) { if (preview.isConnected && !preview.dataset.editing) body.textContent =");
 // Keep embedded page surfaces at physical pixel dimensions; never raster-scale text.
 standalone=standalone.replace("      this.button(this.panel, 'Colar imagem nesta nota', 'clipboard-paste', () => new MapImageModal(this, n, true).open());", "      this.button(this.panel, 'Colar imagem nesta nota', 'clipboard-paste', () => new MapImageModal(this, n, true).open());\n      this.button(this.panel, 'Colar link nesta nota', 'link', () => this.app.noteMedia.pickForNode(this, n));");
 standalone=standalone.replace("    if (!node.relation) this.button(this.panel, 'Colar imagem nesta nota ou nó', 'clipboard-paste', () => new MapImageModal(this, node, true).open());", "    if (!node.relation) { this.button(this.panel, 'Colar imagem nesta nota ou nó', 'clipboard-paste', () => new MapImageModal(this, node, true).open()); if (node.path) this.button(this.panel, 'Colar link nesta nota', 'link', () => this.app.noteMedia.pickForNode(this, node)); }");
 standalone=standalone.replace("      if (!node.relation) action('Colar imagem nesta nota ou nó', 'clipboard-paste', () => new MapImageModal(this, node, true).open());", "      if (!node.relation) { action('Colar imagem nesta nota ou nó', 'clipboard-paste', () => new MapImageModal(this, node, true).open()); if (node.path) action('Colar link nesta nota', 'link', () => this.app.noteMedia.pickForNode(this, node)); }");
 standalone=standalone.replace('await MarkdownRenderer.render(this.app, body.text, el, file.path, child);', 'await MarkdownRenderer.render(this.app, compact ? this.app.noteMedia?.cardMarkdown(raw) || body.text : body.text, el, file.path, child);');
 standalone=standalone.replace("if (n.type === 'web' && !safeUrl(n.path))", "if (n.type === 'web' && !safeUrl(n.path) && !(n.mediaFile === n.path && /\\.pdf$/i.test(n.path) && !/^(?:[a-z]+:|[\\\\/])|(?:^|\\/)\\.\\.(?:\\/|$)/i.test(n.path)))");
 standalone=standalone.replace("return this.files.filter(f => f.path.toLocaleLowerCase().includes(query.toLocaleLowerCase())).slice(0, 70);", "return this.files.filter(f => this.app.vault.getFileByPath(f.path) === f && (f.extension !== 'md' || !this.app.noteCatalog || this.app.noteCatalog.isMainNote(f) || this.app.media?.byNote(f)) && f.path.toLocaleLowerCase().includes(query.toLocaleLowerCase())).slice(0, 70);");
 standalone=standalone.replace("'visualCollapsed', 'visualIdentity']", "'visualCollapsed', 'visualIdentity', 'mediaStudyNode', 'mediaStudyCollapsed', 'mediaStudyFor', 'mediaSourceDetached', 'cardColor']");
 standalone=standalone.replace('n.x = prior.x; n.y = prior.y;', 'n.x = prior.x; n.y = prior.y; if (prior.cardColor) n.cardColor = prior.cardColor;');
 // Keep a bounded warm preview cache when cards cross the viewport during a gesture.
 // Shift-click and text selection belong to the inline editor, not board selection.
 standalone=standalone.replaceAll("event.target.closest('input,textarea,select')", "event.target.closest('input,textarea,select,[contenteditable=true],.romus-card-editor')");
 standalone=standalone.replace('if (content?._atlasRequested) { const child', 'if (this.deferNoteRelease?.(id, content)) continue; if (content?._atlasRequested) { const child');
 standalone=standalone.replace('let leaf = this.app.workspace.getLeavesOfType(VIEW).find(leaf => leaf.view.file?.path === file.path);','let leaf = this.app.workspace.getLeavesOfType(VIEW).find(leaf => leaf.id === result.leafId && leaf.view.file?.path === file.path) || this.app.workspace.getLeavesOfType(VIEW).find(leaf => leaf.view.file?.path === file.path);');
 standalone=standalone.replaceAll('text: group.path','text: this.app.metadataCache.getFirstLinkpathDest(group.path)?.basename || group.path.split(\'/\').pop().replace(/\\.md$/i,\'\')').replaceAll('text: file.path','text: this.app.displayFileLabel?.(file) || file.basename').replaceAll("text: n.path, cls: 'ia-muted'", "text: this.app.metadataCache.getFirstLinkpathDest(n.path)?.basename || n.path.split('/').pop().replace(/\\.md$/i,''), cls: 'ia-muted'");
 standalone=standalone.replace('text: row.boardPath','text: row.boardTitle').replaceAll('Nota salva em ${file.path}','Nota salva: ${file.basename}').replaceAll('Nota visual salva: ${note.path}','Nota visual salva: ${note.basename}');
 // New notes share the user's Notes folder, regardless of where they were created.
 standalone=standalone.replace('await this.plugin.folder(`${ROOT}/Mapas`);','await this.plugin.folder(this.app.preferences.notesFolder || \'Notas\');').replace('`${ROOT}/Mapas/${namePart(title)}.md`','`${this.app.preferences.notesFolder || \'Notas\'}/${namePart(title)}.md`').replace('await this.plugin.folder(`${ROOT}/Notas visuais`);','await this.plugin.folder(this.app.preferences.notesFolder || \'Notas\');').replace('`${ROOT}/Notas visuais/${namePart(image.title || \'Nota visual\')}.md`','`${this.app.preferences.notesFolder || \'Notas\'}/${namePart(image.title || \'Nota visual\')}.md`');
 // A queued save must never replay its old snapshot over a newer local edit.
 // Capture the originating occurrences before awaiting disk writes. Other copies
 // still receive the canonical update, including copies in the same board.
 standalone=standalone.replace('  saveVisualSource(source, notePath, bundle, origin, archive) {',`  saveVisualSource(source, notePath, bundle, origin, archive) {
    const originHash = visualContentHash(bundle);
    const originRoots = new Set((origin?.board.nodes || []).filter(node => (node.visualSource === source || node.visualNote === notePath) && visualContentHash(reusableBundle(origin.board, node)) === originHash).map(node => node.id));`);
 standalone=standalone.replace('this.publishVisual(source, bundle, origin, notePath);','this.publishVisual(source, bundle, origin, notePath, originRoots);').replace('  publishVisual(source, bundle, origin, notePath) {','  publishVisual(source, bundle, origin, notePath, originRoots) {').replace("        // The editing occurrence already contains this content; do not replace live references.","        if (view === origin && originRoots?.has(image.id)) continue;\n        // The editing occurrence already contains this content; do not replace live references.");
 await fs.writeFile(path.join(root,'src/engine.cjs'),standalone);
 await fs.writeFile(path.join(root,'resources/engine-origin.json'),JSON.stringify({name:'Image Atlas',pluginVersion:JSON.parse(await fs.readFile(path.join(engine,'manifest.json'),'utf8')).version,patches:['standalone interface wording','round 24-hour preview as one day','media note flashcards','independent embedded page zoom','media reader controls','untransformed crisp web surfaces','inline media and PDF reader','local PDF web cards']},null,2));
 await fs.copyFile(path.join(engine,'styles.css'),path.join(root,'dist/engine.css'));
 await fs.copyFile(path.join(engine,'vendor/ts-fsrs-LICENSE'),path.join(root,'resources/ts-fsrs-LICENSE'));
 for(const [pkg,license] of [['dompurify','LICENSE'],['marked','LICENSE.md'],['yaml','LICENSE'],['lucide','LICENSE'],['minisearch','LICENSE.txt']])await fs.copyFile(path.join(root,'node_modules',pkg,license),path.join(root,'resources',pkg+'-LICENSE.txt'));
 await fs.mkdir(path.join(root,'dist/pdfjs'),{recursive:true});
 for(const folder of ['cmaps','standard_fonts','wasm'])await fs.cp(path.join(root,'node_modules/pdfjs-dist',folder),path.join(root,'dist/pdfjs',folder),{recursive:true});
 await fs.cp(path.join(root,'node_modules/pdfjs-dist/web/images'),path.join(root,'dist/pdfjs/images'),{recursive:true});
 await fs.copyFile(path.join(root,'node_modules/pdfjs-dist/web/pdf_viewer.css'),path.join(root,'dist/pdfjs/pdf_viewer.css'));
 await fs.copyFile(path.join(root,'node_modules/pdfjs-dist/build/pdf.worker.min.mjs'),path.join(root,'dist/pdfjs/pdf.worker.min.mjs'));
 await fs.copyFile(path.join(root,'node_modules/pdfjs-dist/LICENSE'),path.join(root,'resources/pdfjs-LICENSE.txt'));
 await fs.copyFile(path.join(root,'src/index.html'),path.join(root,'dist/index.html'));
 await fs.copyFile(path.join(root,'src/shell.css'),path.join(root,'dist/shell.css'));
 await fs.copyFile(path.join(root,'src/refined.css'),path.join(root,'dist/refined.css'));
 await fs.copyFile(path.join(root,'src/romus.css'),path.join(root,'dist/romus.css'));
 await fs.copyFile(path.join(root,'src/note-page.css'),path.join(root,'dist/note-page.css'));
 for(const folder of ['brand','fonts'])await fs.cp(path.join(root,'resources',folder),path.join(root,'dist/assets',folder),{recursive:true});
 await esbuild.build({entryPoints:[path.join(root,'src/renderer.js')],bundle:true,outfile:path.join(root,'dist/app.js'),platform:'browser',format:'esm',target:'chrome140',alias:{obsidian:path.join(root,'src/compat.js')},sourcemap:true});
 await esbuild.build({entryPoints:[path.join(root,'src/search-worker.js')],bundle:true,outfile:path.join(root,'dist/search-worker.js'),platform:'browser',format:'esm',target:'chrome140'});
 console.log('Motor Image Atlas copiado e aplicativo compilado sem dados pessoais.');
})().catch(e=>{console.error(e);process.exitCode=1});
