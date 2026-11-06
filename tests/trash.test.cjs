const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path'),{Library}=require('../src/storage.cjs');
test('lixeira conserva o arquivo e a versão anterior para restaurar',async()=>{
 const lib=new Library(await fs.mkdtemp(path.join(os.tmpdir(),'atlas-trash-')));await lib.write('Notas/A.md','primeira',false,true);await lib.write('Notas/A.md','atual');const entry=await lib.trash('Notas/A.md');
 await assert.rejects(()=>lib.read('Notas/A.md'));await assert.rejects(()=>lib.read('Notas/A.md.atlas-backup'));assert.equal((await lib.trashList()).length,1);await lib.restore(entry.id);assert.equal(await lib.read('Notas/A.md'),'atual');assert.equal(await lib.read('Notas/A.md.atlas-backup'),'primeira');assert.equal((await lib.trashList()).length,0);
});
test('exclusão definitiva fica restrita ao item da lixeira e preserva uma nota recriada',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'atlas-purge-')),lib=new Library(root);await lib.write('Notas/A.md','antiga',false,true);await lib.write('Notas/A.md','descartada');const entry=await lib.trash('Notas/A.md');await lib.write('Notas/A.md','nova e independente',false,true);await lib.write('Revisões/histórico.json','preservar',false,true);
 await assert.rejects(()=>lib.purge('../Notas/A.md'),/inválido/);await lib.purge(entry.id);await assert.rejects(()=>fs.access(path.join(root,'.atlas-trash',entry.id)));assert.equal(await lib.read('Notas/A.md'),'nova e independente');assert.equal(await lib.read('Revisões/histórico.json'),'preservar');assert.equal((await lib.trashList()).length,0);
});
test('restaurar não substitui uma nota existente; conteúdo inesperado bloqueia a exclusão definitiva',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'atlas-purge-guard-')),lib=new Library(root);await lib.write('A.md','original',false,true);const entry=await lib.trash('A.md');await lib.write('A.md','nova',false,true);await assert.rejects(()=>lib.restore(entry.id),/Já existe/);assert.equal(await lib.read('A.md'),'nova');
 await fs.writeFile(path.join(root,'.atlas-trash',entry.id,'inesperado.txt'),'não excluir');await assert.rejects(()=>lib.purge(entry.id),/inesperados/);assert.equal(await lib.read('.atlas-trash/'+entry.id+'/content'),'original');
});
