const {test}=require('node:test'),assert=require('node:assert/strict'),esbuild=require('esbuild'),Module=require('node:module'),path=require('node:path');
const source=esbuild.buildSync({entryPoints:[path.resolve(__dirname,'../src/heading-index.js')],bundle:true,platform:'node',format:'cjs',write:false}).outputFiles[0].text;
const compiled=new Module(__filename);compiled._compile(source,__filename+'.compiled.cjs');const {markdownHeadings}=compiled.exports;
test('índice mantém ordem, níveis e títulos repetidos, exclui exemplos de código',()=>{
 const text='# Patogênia\n\n## Mecanismo **principal**\n\n### [[Nota]]\n\n#### Detalhe\n\n# Diagnóstico\n\n## [Exames](https://example.com)\n\n# Diagnóstico\n\n```md\n# Não é título\n```\n\n    # Também é código\n\nFinal\n=====\n\nSubtítulo\n--------\n';
 const rows=markdownHeadings(text);assert.deepEqual(rows.map(({level,title})=>[level,title]),[[1,'Patogênia'],[2,'Mecanismo principal'],[3,'[[Nota]]'],[4,'Detalhe'],[1,'Diagnóstico'],[2,'Exames'],[1,'Diagnóstico'],[1,'Final'],[2,'Subtítulo']]);assert.ok(rows.every((row,i)=>i===0||row.start>rows[i-1].start));assert.ok(text.slice(rows[4].start).startsWith('# Diagnóstico'));assert.ok(text.slice(rows[6].start).startsWith('# Diagnóstico'));
});
test('índice conserva cabeçalhos em listas e citações e não limita a quantidade',()=>{
 const text='> ## Em citação\n> Texto\n\n- ### Em lista\n\n'+Array.from({length:1500},(_,i)=>'###### Título '+i+'\n\nTexto\n\n').join('');const rows=markdownHeadings(text);assert.equal(rows.length,1502);assert.equal(rows[0].title,'Em citação');assert.equal(rows[1].title,'Em lista');assert.equal(rows.at(-1).title,'Título 1499');assert.ok(rows.every((row,i)=>i===0||row.start>rows[i-1].start));
});
