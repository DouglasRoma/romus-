const {test}=require('node:test'),assert=require('node:assert/strict'),esbuild=require('esbuild'),Module=require('node:module'),path=require('node:path');
const source=esbuild.buildSync({entryPoints:[path.resolve(__dirname,'../src/property-data.js')],bundle:true,platform:'node',format:'cjs',write:false}).outputFiles[0].text;
const moduleRef=new Module(__filename);moduleRef._compile(source,__filename+'.compiled.cjs');const {propertyDocument,patchProperties,inferType,valueMatches}=moduleRef.exports;
test('propriedades preservam texto, comentários, dados visuais e campos simultâneos',()=>{
 const text='---\r\n# Minha organização\r\ntema: Urologia\r\nstatus: estudando\r\nrevisado: false\r\nimage-atlas-data: \'{"nodes":[1,2]}\'\r\nexterno:\r\n  chave: valor\r\n---\r\n# Resumo\r\nQ == A\r\n<!-- image-atlas-fsrs-deck:abc -->\r\n';
 const before=propertyDocument(text);const next={...before.props,tema:'Próstata',tags:['uro','estudo'],peso:20};
 const current=text.replace('status: estudando','status: concluído').replace('{"nodes":[1,2]}','{"nodes":[1,2,3]}');
 const edited=patchProperties(current,before.props,next),after=propertyDocument(edited);
 assert.equal(after.body,before.body);assert.equal(after.props.status,'concluído');assert.equal(after.props['image-atlas-data'],'{"nodes":[1,2,3]}');assert.equal(after.props.externo.chave,'valor');assert.equal(after.props.revisado,false);assert(edited.includes('# Minha organização'));assert.deepEqual(after.props.tags,['uro','estudo']);assert.equal(after.props.peso,20);
 assert.throws(()=>patchProperties(text.replace('tema: Urologia','tema: Nefrologia'),before.props,next),/mudou em outra tela/);
 assert.equal(patchProperties('Sem cabeçalho\n',{},{}),'Sem cabeçalho\n');
 const removed={...before.props};delete removed.status;assert(!Object.hasOwn(propertyDocument(patchProperties(text,before.props,removed)).props,'status'));
});
test('tipos e filtros preservam valores reais, números, datas e listas',()=>{
 assert.equal(inferType('feito',false),'checkbox');assert.equal(inferType('peso',0),'number');assert.equal(inferType('tags',['uro']),'tags');assert.equal(inferType('assunto',['uro']),'list');assert.equal(inferType('dia','2026-10-25'),'date');assert.equal(inferType('hora','2026-10-25T10:30'),'datetime');assert.equal(inferType('campos',{x:1}),'structured');assert.equal(inferType('assunto',['uro'],{assunto:'multitext'}),'list');
 assert(valueMatches(['Próstata','Urologia'],'contains','prostata'));assert(valueMatches(false,'equals','false'));assert(valueMatches(false,'exists',''));assert(valueMatches(0,'exists',''));assert(valueMatches(undefined,'missing',''));assert(valueMatches(20,'greater','12'));assert(!valueMatches('texto','greater','12'));assert(valueMatches('2026-10-25','less','2026-11-01'));assert(valueMatches(['uro','renal'],'equals','RENAL'));assert(!valueMatches(['uro','renal'],'not','renal'));
});
test('YAML inválido é rejeitado sem reescrever a nota',()=>{assert.throws(()=>propertyDocument('---\na: [incompleto\n---\nResumo'),/erro/);assert.throws(()=>propertyDocument('---\n- lista\n---\nResumo'),/nomes e valores/)});
