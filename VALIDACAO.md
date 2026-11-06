# Escopo e validação

## Edição no cartão e renderização do whiteboard — 0.3.7, 01/11/2026

- Vinte e nove testes unitários passaram. `electron-board-inline-edit.cjs` passou no código-fonte e no executável: duplo clique real abre o editor no cartão, Ctrl+B/desfazer, colagem de imagem pelo evento de clipboard, link interno, mesma instância/foco após redesenhar, salvamento de propriedades e flashcards, conflito mantém o rascunho, Alt+clique/botão abrem ao lado, notas novas/existentes não criam painel, fechamento do quadro salva. Captura inspecionada.
- `electron-board-reading-motion.cjs`: biblioteca descartável com 120 cartões de resumos extensos já carregados. Antes da alteração: mediana de 100 ms e p95 de 166,7 ms entre quadros de animação. Depois: mediana de 33,4 ms e p95 de 50,1 ms, tanto no código-fonte quanto no executável final. Câmera com p95 de 0,3 ms no fonte e 0,2 ms no pacote; nenhuma leitura ou renderização de prévia iniciada durante o movimento. DOM das prévias e geometria dos cartões preservados. São medições locais desse cenário, sem comparação controlada com outros aplicativos nem garantia para qualquer computador.
- A composição temporária do mundo usa `will-change: transform` durante o gesto e é retirada ao terminar. A visão distante não pinta o corpo textual abaixo de 35%, mas conserva DOM/cache, títulos, ações e players. Aproximar restaura o conteúdo. O cache de resumos preparados é limitado a cem entradas/dois milhões de caracteres.
- `electron-board-performance.cjs`: 247 nós e seis páginas nativas; zero leituras de geometria e zero consultas de zoom nativo **enquanto a câmera está ativa**, sem reinstalar páginas após redesenhar. O teste separa as verificações legítimas de zoom feitas após pausas daquelas dentro do gesto; `requestAnimationFrame` pode ser limitado quando a janela de teste perde o foco. p95 do trabalho síncrono da câmera: 1,1 ms no arraste e 1,2 ms no zoom nesta execução; esses tempos não representam o custo total de pintura.
- `electron-board-find-motion.cjs` passou: cache de prévias, busca local sem leituras ao digitar, ramos recolhidos, ícones/fechamento com salvamento e quizzes. `electron-note-media.cjs` passou: player, página web, Ctrl, zoom independente, ocorrências em quadros distintos, exclusão/restauração e editor flutuante. `electron-highlight-contrast.cjs` passou no pacote: contraste, cores, negrito, desfazer/refazer e resumo do quadro.
- Os seis arquivos de runtime/estilos indicados na validação anterior foram conferidos byte a byte no ASAR 0.3.7. SHA-256 do instalador: `358b121ae82ddf7d7a48cf77d760a1c38cbd34a6139b669cc3325fe107c5fc42`. Nenhuma biblioteca pessoal foi utilizada nos testes.

## Contraste do marca-texto — 0.3.6, 01/11/2026

- Vinte e nove testes unitários passaram. As cores claras da paleta, incluindo amarelo, rosa, azul e roxo, geram texto preto; preto gera texto branco. A marca automática preserva a cor anterior e respeita alteração manual posterior.
- `electron-highlight-contrast.cjs` passou no código-fonte e no executável empacotado: aplicação real pela paleta nas dez cores, identidade do editor mantida, negrito, desfazer/refazer, salvamento, alternância leitura/edição e remoção do fundo restaurando a cor original.
- No pacote, a escolha explícita de fonte azul após aplicar fundo rosa continuou azul ao salvar/reabrir. Destaques antigos em HTML, inclusive `<mark>`, ficaram legíveis nos temas claro e escuro. Abrir e salvar uma nota antiga sem editá-la não reescreveu seu conteúdo.
- O resumo do whiteboard foi conferido em leitura e edição com texto preto sobre rosa e negrito preservado. O editor formatado e o renderizador Markdown compartilhados aplicam o comportamento aos demais contextos que os utilizam. A captura temporária foi inspecionada.
- Regressões `electron-note-page.cjs` e `electron-note-media.cjs` passaram: página/propriedades/capas/quizzes, texto e FSRS, imagem/arquivo/player, Ctrl, zoom independente, posições e exclusão/restauração. A alteração calcula contraste ao formatar/renderizar, sem novos ouvintes de digitação, varreduras durante a câmera ou remontagem do editor.
- `src/main.cjs`, `src/storage.cjs`, `dist/app.js`, `dist/search-worker.js`, `dist/romus.css` e `dist/note-page.css` conferidos byte a byte no pacote final 0.3.6. Biblioteca pessoal não foi usada nos testes. SHA-256 do instalador em `release/SHA256SUMS.txt`.

## Digitação e atualização da busca — 0.3.5, 01/11/2026

- A espera fixa de 70 ms após digitar foi retirada. A consulta é enviada no próximo quadro da interface; o worker agrupa consultas superadas e pode abandonar filtros longos em lotes de aproximadamente 4 ms. Fechar a janela cancela a consulta pendente.
- Resultados reaproveitam os mesmos botões/ícones e atualizam apenas texto/realce alterado. Dezesseis resultados iniciais, com todos os demais acessíveis por Mostrar mais ou seta para baixo. Cache limitado a oito milhões de caracteres de texto normalizado e 24 respostas de consultas, invalidado quando o índice muda.
- `electron-search-typing.cjs`: 1.200 notas de estudo em biblioteca descartável, sem criar 1.200 arquivos reais. Antes, a medição de evento de entrada até renderização mais dois quadros teve p95 de 122,5 ms e exibiu apenas as duas últimas etapas de “imunidade” digitada a intervalos de 115 ms. Com a alteração, exibiu as nove etapas; p95 de 59,2 ms no código-fonte e 51,6 ms no executável empacotado. Manipulador de entrada com p95 de 0,2 ms no pacote, sem tarefas longas observadas nesse cenário. Esses números são locais, incluem a espera de dois quadros do teste e não garantem os mesmos tempos em outro computador/cofre.
- O teste do pacote também verifica digitação rápida com apenas a consulta mais recente exibida, identidade do mesmo botão após consulta equivalente, carregamento de 16 → 32 resultados por teclado e 32 → 48 pelo botão. Nenhum documento é excluído da busca por causa da lista progressiva.
- Vinte e sete testes unitários passaram, incluindo cancelamento sem alterar o índice, equivalência da busca síncrona/assíncrona, invalidação após edição e aspas ainda abertas sem perder a última letra.
- `electron-pane-tabs-omni.cjs` passou no código-fonte e no pacote: título/conteúdo/erros de digitação, filtros, abrir no painel atual/nova aba/ao lado, rascunhos, edição/renomeação/lixeira, cache após reiniciar e zero leituras de arquivos durante consultas consecutivas. Um atraso artificial de 100 ms confirmou que Enter não abre o resultado da consulta anterior. A regressão de Ctrl+F, câmera, ícones, fechamento e quizzes também passou no código-fonte.
- Arquivos `src/main.cjs`, `src/storage.cjs`, `dist/app.js`, `dist/search-worker.js`, `dist/romus.css` e `dist/note-page.css` do pacote final 0.3.5 conferidos byte a byte com os arquivos compilados. Os testes não alteraram a biblioteca pessoal.

## Abas em cada divisão e Ctrl+O por conteúdo — 0.3.4, 01/11/2026

- Vinte e cinco testes unitários passaram: busca por conteúdo/acentos/prefixos/erros de digitação, peso dos títulos, frases, exclusões, pastas, tags, extensão, aliases, conteúdo de casos/quizzes/cartões, remoção de campos internos, atualização/exclusão e limites de resultados. A gravação também foi comparada ao catálogo do disco: datas e tamanho retornados são idênticos, permitindo reutilizar o índice após reiniciar.
- `electron-pane-tabs-omni.cjs` passou no código-fonte e no executável empacotado. Cria 83 notas e um quadro; verifica buscas de conteúdo e digitação incorreta, trechos destacados, abertura no painel de origem, Ctrl+Enter em nova aba no mesmo grupo e Alt+Enter em outra divisão. Quatro consultas consecutivas pelo índice não leram arquivos.
- O mesmo teste verifica + próprio em cada grupo, arraste real da aba entre barras, divisão inferior, posição da aba no painel correspondente e preservação do mesmo editor/rascunho. Após reiniciar, três barras de abas e a divisão foram restauradas, com pelo menos oitenta documentos recuperados do cache. Modificar, renomear e mover uma nota para a lixeira atualizou o índice sem deixar o resultado antigo; a exclusão continuou respeitada após reiniciar.
- Regressões `electron-study-workspace.cjs`, `electron-note-page.cjs`, `electron-note-media.cjs` e `electron-board-find-motion.cjs` passaram: quatro painéis, arraste/redimensionamento, notas/resumos/flashcards, propriedades, capas, quizzes, vínculo e exclusão de mídia, prévias com Ctrl, leitores/zoom independentes, FSRS e busca local Ctrl+F. Os seletores dos testes foram adaptados à nova barra por painel.
- Índice e consulta usam MiniSearch em um worker. O processo da interface coordena apenas pequenos lotes de leitura e monta até sessenta resultados. O índice persistido é separado pela biblioteca; campos de posição, IDs internos e agendamento não fazem parte do texto pesquisado. Falha do cache não impede a indexação em memória. Documentos muito grandes continuam pesquisáveis, mas não entram no cache persistente acima do limite de um milhão de caracteres por documento.
- A busca de PDFs e imagens é pelo nome do arquivo. Não foi implementado OCR nem extração do conteúdo desses anexos. O [Omnisearch](https://github.com/scambier/obsidian-omnisearch) informa usar [MiniSearch](https://github.com/lucaong/minisearch) e delegar extração de anexos ao Text Extractor; foi consultado como referência, sem importar o código do plugin. A licença MIT do MiniSearch acompanha o pacote.
- Captura da busca com as três barras foi inspecionada. `src/main.cjs`, `src/storage.cjs`, `dist/app.js`, `dist/search-worker.js`, `dist/romus.css` e `dist/note-page.css` conferidos byte a byte no pacote final. Testes usaram uma biblioteca temporária, separada da biblioteca pessoal. Integridade do instalador em `release/SHA256SUMS.txt`.

## Navegação do quadro, busca local, abas e quizzes — 0.3.3, 01/11/2026

- Vinte testes unitários passaram. O novo teste de embaralhamento confere a permutação dos índices originais, a preservação do gabarito e a mudança em relação à tentativa anterior para duas a oito alternativas.
- `electron-board-find-motion.cjs` passou no código-fonte e no executável empacotado: 162 cartões, zoom/arraste alternados, zero leituras de notas iniciadas durante o gesto e a mesma prévia Markdown após sair e voltar. Busca local por Ctrl+F sem leitura de arquivos ao digitar, acentos, lista limitada a trinta resultados montados, seleção e revelação de ramo recolhido, Esc, ícones de nota/whiteboard e fechamento direto com o último texto salvo.
- Nesse teste, 95% das chamadas síncronas da câmera ficaram em até aproximadamente 0,3 ms no pacote local. Essa medida não inclui todo o custo de pintura/composição e não garante uma taxa de quadros em qualquer computador.
- `electron-board-performance.cjs`: 247 cartões e seis páginas nativas. No cenário anterior, as fases registraram seis consultas de zoom nativo durante arraste e 24 durante zoom; com a alteração, ambas registraram zero. Nenhuma leitura de geometria das ferramentas nem reinstalação do leitor após três renderizações. No teste local atualizado, medianas de 0,1 ms para arraste e 0,5 ms para zoom; p95 de 0,3 ms e 1,1 ms, respectivamente. Os números são diagnósticos locais, não uma promessa de desempenho universal.
- Regressões `electron-board-note-content.cjs`, `electron-note-page.cjs`, `electron-note-media.cjs` e `electron-study-workspace.cjs` passaram: PDFs, vídeo/página, zoom interno independente, Ctrl, notas em quadros independentes, resumos, importação, exclusão/restauração, FSRS, propriedades, capas e quatro painéis.
- O embaralhamento foi conferido na interface: escolher uma alternativa e conferir não muda sua posição; Tentar novamente muda a ordem e conserva a resposta correta. A ordem é apenas da tentativa, sem reescrever os quizzes na nota nem alterar o FSRS.
- Prévias reutilizadas têm limite de oitenta fora da tela; leitores abertos são preservados. Trabalho adiado é cancelado ao fechar o quadro, retomado após o gesto e repartido em pequenos lotes. Atualizações de resolução do PDF atingem somente o quadro correspondente.
- `src/main.cjs`, `dist/app.js`, `dist/romus.css` e `dist/note-page.css` do pacote 0.3.3 foram conferidos byte a byte. As capturas temporárias do Ctrl+F e dos painéis foram inspecionadas.
- Referências consultadas: [orientação do Obsidian sobre vistas adiadas](https://docs.obsidian.md/plugins/guides/defer-views) e [análise de desempenho do K-Plex](https://github.com/zsviczian/kplex/blob/main/PerformanceOptimizationHandoff.md). A alteração aplica cache limitado e trabalho incremental no motor próprio; não importa o código do K-Plex.

## Quizzes Markdown e conteúdo da nota no whiteboard — 0.3.2, 01/11/2026

- Dezenove testes unitários passaram. Os novos testes cobrem importação em lote, alternativas e explicações Markdown, separadores, arquivos com BOM/CRLF, validação integral, preservação dos IDs/ordem e prevenção de duplicados.
- `electron-board-note-content.cjs` passou no código-fonte e no executável empacotado: colagem/arquivo `.md`, erro sem gravação parcial, duplicados, resposta no quadro, casos clínicos, YouTube, PDF e arquivo local no próprio cartão. Notas sem conteúdo extra conservaram o Markdown sem os novos botões.
- Trinta quizzes adicionais foram importados no quadro; a lista montou dez cartões inicialmente e mais dez após a ação explícita. Players só foram criados ao abrir o conteúdo. Leitura de metadados usa visibilidade/cache e adia novos cartões abaixo de 35% de zoom.
- Oitenta atualizações da câmera mantiveram o mesmo leitor nativo e o mesmo zoom interno, sem mudar as posições dos nós. A execução JavaScript dessa sequência levou aproximadamente 1,1 ms no pacote local; não mede a renderização completa nem garante o mesmo desempenho em outros computadores.
- Remover o vínculo da mídia na nota restaurou o resumo, mesmo conservando o item na biblioteca de mídia. O retorno ao resumo, a abertura de caso em janela e duas ocorrências em whiteboards independentes foram verificados. Texto, identidade, histórico e agendamento FSRS permaneceram conservados.
- Regressões `electron-note-page.cjs` e `electron-note-media.cjs` passaram no código-fonte: página, propriedades, capas, quiz, vínculos, resumo, players, zoom independente e exclusão/restauração.
- Pacote final: `src/main.cjs`, `dist/app.js`, `dist/romus.css` e `dist/note-page.css` comparados byte a byte aos arquivos compilados. O teste de conteúdo do quadro passou nesse executável, usando biblioteca temporária separada. Instalador `release/ROMUS-0.3.2-Setup.exe`, integridade em `release/SHA256SUMS.txt`.

## Página de nota e nova aba — 0.3.1, 01/11/2026

- Quinze testes unitários passaram, incluindo preservação do corpo/FSRS/YAML ao salvar capa, recursos, casos e quizzes; formatos desconhecidos e questões inválidas são rejeitados.
- `electron-note-page.cjs` passou no código-fonte e no executável empacotado: + e busca/criação na aba, quadro preservado, propriedades tipadas e Enter concluindo edição sem remontar o texto, ferramentas por hover, capa por link real em servidor local, carregamento da imagem, redimensionamento por arraste e teclado, enquadramento e altura persistentes, importação nativa de arquivo, miniaturas, casos Markdown/links, quiz certo/errado/tentar novamente, reabertura e exclusão global de mídia. Não criou notas de mídia duplicadas.
- Revisão FSRS foi respondida antes de adicionar os conteúdos e reaberta depois: registro, histórico e agendamento permaneceram idênticos. Painéis estreitos em janela de 950 px passaram sem transbordamento horizontal; hub com rolagem visível desativada e página com uma única superfície de rolagem. Temas claro e escuro conferidos.
- `electron-note-outline.cjs` passou com a nova rolagem: 426 títulos em 1.071.753 caracteres; hierarquia, títulos repetidos, índice virtualizado, salto, voltar ao topo, Markdown/Prévia e preservação da edição. A rolagem não reconstruiu o índice nem serializou o documento.
- Regressões: `electron-edit-preview.cjs`, `electron-study-workspace.cjs`, `electron-note-media.cjs` e `electron-study-practical.cjs` passaram: prévias em cadeia/fixação/fotos, painéis/arraste, vínculo de mídia, zoom independente e edição/exclusão/desfazer de flashcards com histórico preservado.
- Metadados permanecem em `atlas-internal-page` na nota original. O índice recebe aviso quando a altura da capa/propriedades muda. Alterar somente o resumo reutiliza os metadados e o editor já montado.


- Pacote final 0.3.1: `src/main.cjs`, `dist/app.js`, `dist/romus.css` e `dist/note-page.css` conferidos byte a byte com o código final. O teste completo de página passou nesse executável. SHA-256 do instalador em `release/SHA256SUMS.txt`.

## Identidade ROMUS — 0.3.0, 01/11/2026

- Conferência visual em Electron das telas de whiteboard, revisão/pergunta/resposta, nota, biblioteca e editor de cartões, em temas claro e escuro. Fonte Inter normal e itálica e SVGs carregam localmente, sem rede.
- `electron-romus.cjs` passou no código-fonte e no executável empacotado: nome ROMUS, controles nativos integrados à barra de abas, logo por tema, títulos nos cartões, dock de adicionar e ferramentas laterais, posições/cores dos nós e histórico/agendamento FSRS conservados. Cem atualizações da câmera reutilizaram os mesmos elementos, sem filtro ou backdrop-filter no canvas.
- Treze testes unitários passaram: biblioteca, propriedades, índice, importação e lixeira.
- `electron-study-practical.cjs` passou no código-fonte e no pacote: edição direta, Markdown, links, Ctrl+Enter, cancelamento, salvar ao sair/fechar, excluir/desfazer, rascunhos em outros painéis, cartões de mapas e inserção sem sobreposição. No pacote, 100 eventos de uma resposta de 25 mil caracteres consumiram cerca de 15 ms de execução JavaScript; 180 eventos no editor de 500 cartões consumiram cerca de 5 ms sem recalcular todos os campos. Esses valores medem o teste local, não garantem tempos em outro computador.
- `electron-flashcard-editor-panels.cjs` passou no código-fonte e no pacote: edição e adição em painel, pergunta atual, colagem, salvamentos repetidos e FSRS conservado.
- `electron-edit-preview.cjs` passou: edição na própria prévia, imagens/colagem, Ctrl em cadeia, títulos, fixação, posição e proteção do rascunho.
- `electron-note-media.cjs` passou: players, Ctrl, resumo original, duas ocorrências independentes, câmera sem recarregar mídia ou alterar zoom, exclusão/restauração/lixeira.
- `electron-study-workspace.cjs` passou com a nova barra de janela: painéis independentes, arrastar, redimensionar, links inexistentes, comandos contextuais, resumo do quadro e flashcards.
- O pacote preserva `com.douglas.imageatlas` e a pasta de dados `%APPDATA%/Image Atlas`. Os testes usam bibliotecas temporárias isoladas; não migraram nem reescreveram a biblioteca pessoal.
- Conteúdo do pacote comparado ao código compilado final: `src/main.cjs`, `dist/app.js` e `dist/romus.css` idênticos. Instalador Windows x64 `release/ROMUS-0.3.0-Setup.exe`, SHA-256 em `release/SHA256SUMS.txt`.


## Revisão prática e posicionamento — 0.2.16, 01/11/2026

- `electron-study-practical.cjs`: clique único para editar pergunta/resposta, Markdown renderizado, cancelar sem alterar o arquivo, Ctrl sobre vínculo sem iniciar edição e Ctrl+Enter no popup sem abrir outro editor. Identidade do registro, histórico e agendamento FSRS mantidos após mudar o conteúdo.
- Remoção direta e desfazer atingem o cartão correto; outra revisão aberta mantém o mesmo elemento de resposta e seu rascunho. Cartões antigos do mapa também podem ser editados/removidos sem excluir o nó.
- Em um editor com 500 cartões, 180 eventos consecutivos de digitação consumiram cerca de 5–10 ms de processamento síncrono no teste, sem recálculos de altura nem contagem da lista a cada evento. Esse valor mede o trabalho do manipulador; não é uma garantia de latência em qualquer máquina.
- Inserção sobre um ponto ocupado escolhe outra posição sem mover a nota existente. O menu do botão direito cria uma nota e seleciona uma preexistente.

- Executável empacotado 0.2.16 validado com `IMAGE_ATLAS_VERIFY_PACKAGE=1`: edição direta, Markdown, cancelamento, salvamento por clique fora e pelo fechamento geral, revisão em popup, exclusão/desfazer, cartões de notas visuais e cartões locais do quadro passaram. Uma resposta de mais de 25 mil caracteres foi exercitada sem reconstruir o cartão.
- Testes dos editores em painel e os 13 testes de armazenamento, propriedades, índice e lixeira também passaram. Inspeção visual confirmou o editor dentro do cartão e o botão de remoção visível. Perfis, capturas e resíduos da montagem são temporários e removidos ao concluir.

## Mídia incorporada à nota — 0.2.15, 31/10/2026

- `electron-note-media.cjs` verifica colagem real de URL no editor, colagem automática na ação do whiteboard, player YouTube e página nativa dentro do cartão, prévia com Ctrl enviada pelo leitor nativo e abertura ao lado com o resumo original. Não há criação de cópia Markdown da nota.
- A mesma nota é incorporada em dois quadros; mover a ocorrência nova não move a anterior, e os mapas existentes, propriedades, texto e registro FSRS são conservados.
- 80 atualizações da câmera mantêm o mesmo leitor nativo, zoom e largura interna da página; não recarregam a mídia. A renderização usa a fila/cache já existente, e um resumo/agendamento alterado conserva o player quando sua fonte permanece igual.
- A exclusão global pela interface retira o vídeo de outra nota e do resumo do quadro, preserva as notas e o histórico e cria o registro na lixeira. Os 13 testes de armazenamento, propriedades, índice e lixeira passaram.

- Executável empacotado 0.2.15 validado com `IMAGE_ATLAS_VERIFY_PACKAGE=1`: YouTube criou seu player real no leitor nativo (superfície de 358 × 213, componente do player pronto), o cartão mostrou a mídia sem o texto do resumo, Ctrl no leitor abriu a nota e Ao lado manteve o arquivo original. A captura visual foi inspecionada temporariamente.
- Restauração recuperou as incorporações; excluir definitivamente retirou o registro da lixeira e manteve as notas. O botão de link da prévia flutuante também incorporou e salvou na nota original.
- Regressão `electron-image-global-trash.cjs` passou: imagens em notas/resumos/flashcards, restauração exata e expurgo continuam funcionando. A montagem reutiliza o Electron já instalado para evitar outro download grande; arquivos de teste e montagem são removidos ao concluir.

## Fixar prévias e nomes dos links — 0.2.14, 31/10/2026

- O teste de integração verifica fixação em leitura e edição, posição preservada após tentativa de arrastar o cabeçalho, permanência ao clicar fora/soltar Ctrl/pressionar Esc e edição na mesma nota. Duas prévias fixadas coexistem e podem ser fechadas separadamente. Desafixar restaura o fechamento ao clicar fora, salvando o texto.
- Links com pasta mostram somente o nome; o destino completo continua no vínculo. Verificados apelido explícito, referência a título, extensão PDF e nota ainda inexistente. Salvamento mantém os caminhos e apelidos originais.
- A sequência editar → mudar foco → consultar link com Ctrl permanece funcional. O atributo do vínculo faz parte da renderização do editor, sem depender apenas de uma correção posterior no DOM.
- Os testes existentes de encadeamento, títulos, fotos por colagem, menu `/`, contextos de notas/flashcards, salvamento e falha de gravação continuam passando em biblioteca descartável.

- A regressão de vínculos e notas recentes passou: sugestão por `[[`, destino persistido, texto seguinte fora do vínculo, Ctrl após hover e reabertura da nota conservando os links. A inspeção visual confirmou o botão de fixação ativo e nomes sem o prefixo de pasta.

- Executável empacotado 0.2.14 validado com `IMAGE_ATLAS_VERIFY_PACKAGE=1`: fixação, edição na posição escolhida, prévias encadeadas, fechamento independente, nomes dos links e colagem de fotos passaram usando perfil descartável. O perfil de teste, as capturas e os resíduos de montagem são removidos ao concluir, conservando somente o instalador atual e a biblioteca pessoal.

## Prévias encadeadas e títulos — 0.2.13, 31/10/2026

- Teste com clique único real preserva o mesmo elemento, tamanho e posição, colagem de texto/fotos, imagens em visualizador, menu `/`, ampliar/restaurar, propriedades e nota original. Contextos de nota, aba e janela de flashcards foram verificados em perfil descartável.
- Encadeamento Bacteriologia → ACV → Troponina → Globulina verifica três prévias abertas, leitor intermediário e dois editores independentes, títulos conservados, identidade do elemento original, rascunho e rolagem do pai, nota principal intacta e contexto correto dos comandos.
- Esc e fechar a última prévia preservam as anteriores. Ctrl+clique não duplica a prévia nem troca de painel. Fechamento grava cada arquivo correto, remove editores e limpa as camadas quando termina; erro simulado mantém o rascunho.
- Regressão dos editores de flashcards em painel passou, incluindo adição/colagem, salvamentos sucessivos e histórico FSRS preservado.
- Referência: [Page preview do Obsidian](https://obsidian.md/help/Plugins/Page%20preview), com Ctrl sobre links no modo de edição. A preservação das prévias e a edição no mesmo lugar atendem ao fluxo solicitado por Douglas.

- Executável empacotado 0.2.13: testes de prévias encadeadas e editores de flashcards em painel passaram com `IMAGE_ATLAS_VERIFY_PACKAGE=1`. A inspeção visual confirmou ACV, Troponina e Globulina com seus títulos visíveis. Os 13 testes automatizados de armazenamento, propriedades, lixeira e índice também passaram. Perfis e capturas de teste são temporários e removidos ao concluir.

## Motor preservado

O aplicativo compila o mesmo motor do plugin, em vez de reimplementar os mapas e o FSRS. Isso inclui:

- Whiteboards renomeáveis, subwhiteboards, grupos, conectores, câmera, zoom e desfazer/refazer. EDITRI AQUI
- Mapas mentais com relações, recolhimento, imagens, movimentação de ramos, renomeação e criação de notas por atalhos.
- Notas Markdown vinculadas, ocorrências independentes e resumos visuais nas imagens.
- Importação de imagens, colagem, marcações por ponto/área, páginas externas e leitor com alfinetes.
- Criação de flashcards por nota, colagem em lote, Markdown, edição da questão atual e reordenação.
- Motor FSRS, vencidos/novos, erros, histórico, revisão anterior, reset arquivado e primeiro acerto em um dia.
- Escolha, ordenação e busca de temas por whiteboard; links de notas e revisão vinculada ao lado.
- Busca de notas/mapas em todos os whiteboards e tratamento de arquivos inexistentes.

## Testes executados no aplicativo independente

- Inicialização real de Electron com renderizador isolado e sem acesso direto a Node.
- Criação de whiteboard e mapa mental pelo formulário original.
- Criação de filho com Tab e preservação da hierarquia.
- Criação e edição de nota Markdown.
- Criação de flashcard pelo editor original.
- Responder, visualizar intervalo de um dia e salvar avaliação FSRS.
- Persistência do identificador, histórico e data de revisão após encerrar e reiniciar o aplicativo.
- Inclusão de nota existente no quadro e gravação de arquivos nativos.
- Escolha e busca de temas do quadro, com cartões futuros fora da fila do dia.
- Reutilização da aba do mesmo quadro para evitar versões divergentes em memória.
- Caminhos restritos à biblioteca, rejeição de traversal, gravação serializada e backup da versão anterior.
- Importação de estrutura com revisões, exclusão de plugins, migração dos vínculos do Image Atlas e preservação da fonte.
- Inicialização do executável empacotado, sem Obsidian e sem Node disponível ao conteúdo da janela.
- Inspeção do pacote: somente código e recursos, sem biblioteca pessoal.

Os scripts de regressão anteriores do plugin continuam no diretório do plugin. Eles não equivalem a testes completos da aplicação independente.

## Índice do Markdown — versão de teste, 29/10/2026

- `heading-index.test.cjs`: ordem H1–H6, títulos repetidos, Setext, listas/citações, exclusão de exemplos de código e 1.500 títulos sem truncamento.
- `electron-note-outline.cjs`: nota com 1.071.753 caracteres e 426 títulos; painel ao passar o mouse, lista virtualizada com menos de 30 botões montados, busca, salto exato entre seções repetidas, retorno ao início e operação por teclado. Navegação conferida no editor formatado, na prévia e no código Markdown.
- Na mesma execução, 45 movimentos de rolagem não reconstruíram o índice nem serializaram o Markdown. Quarenta alterações seguidas em um parágrafo foram agrupadas em uma serialização; salvar imediatamente preservou a última edição. Alterar o nível de um título e desfazer atualizaram o índice.
- Regressões `electron-note-links-recents.cjs` e `electron-images-colors-commands.cjs`: vínculos, prévia com Ctrl, recentes, imagens/legendas, cores e fechamento com rascunho preservado passaram após a alteração no salvamento.
- `npm test`: 13 testes aprovados. Captura visual conferida em `test-results/note-outline.png`.
- `electron-summary-outline-tabs.cjs`: mesmo índice aplicado ao resumo do whiteboard, com 166 títulos, busca, entradas repetidas, navegação e retorno ao início nos três modos. Rascunho salvo ao fechar o resumo. O comando **Fechar todas as abas** fechou duas abas de whiteboard, uma nota e a biblioteca; preservou a última edição, manteve os arquivos, restaurou o espaço vazio após recarregar e interrompeu o fechamento diante de falha de salvamento simulada. Captura conferida em `test-results/board-summary-outline.png`.

Esses recursos foram incluídos no instalador 0.2.5. O teste de documento grande valida esse cenário local, sem prometer o mesmo tempo em qualquer computador ou biblioteca.

## Pacote Windows 0.2.5 — 29/10/2026

- `electron-release.cjs` abriu o executável empacotado (`app.isPackaged === true`) com versão 0.2.5 e biblioteca temporária independente da biblioteca pessoal.
- Conferidos o índice da nota, o índice do resumo do quadro, o comando de fechar todas as abas pelo Ctrl+P e a preservação da última edição.
- Inspecionados 303 itens do arquivo `app.asar`, sem notas Markdown, whiteboards ou metadados de biblioteca pessoal. Confirmada a presença dos recursos recentes no código distribuído.
- Instalador gerado em `release/Image-Atlas-0.2.5-Setup.exe`; integridade registrada em `release/SHA256SUMS.txt`.
- Essa etapa validou o executável empacotado. O assistente de instalação não foi executado sobre a instalação pessoal durante a verificação.

## Editor e prévias — pacote 0.2.6, 29/10/2026

- `electron-editor-quality.cjs`: paleta com dez cores e ausência de inputs RGB; alternância do fundo sem perder a cor da fonte; seleção de cores nas propriedades e na interface utilizada pelo motor.
- Na mesma execução, notas e resumo do whiteboard conservaram o texto visível ao entrar em edição. Três ciclos de leitura/edição não reconstruíram o documento formatado quando o conteúdo permaneceu igual.
- Reprodução dos três itens internos da cena de mídia removida: a prévia passou a excluí-los, mostrando os itens e subwhiteboards visíveis com suas cores. Remoção e mudança para preto refletidas na prévia antes da gravação em disco; resultado mantido após salvar e fechar o quadro de origem.
- `electron-note-outline.cjs`: documento com 1.071.753 caracteres e 426 títulos; rolagem sem reconstrução do índice ou serialização de Markdown. Teste concluído sem erros da página.
- `npm test`: 13 testes aprovados.
- `electron-release.cjs`: executável empacotado 0.2.6, índices, Ctrl+P, salvamento e paleta conferidos em biblioteca temporária. Cores de fonte e fundo preservadas ao fechar e reabrir a nota. Inspecionados 303 itens do pacote, sem biblioteca pessoal.
- Capturas conferidas em `test-results/editor-palette.png` e `test-results/subboard-current-items.png`. Instalador e soma de integridade em `release/`.

## Imagens e navegação — pacote 0.2.7

- `electron-image-removal-navigation.cjs`: botão direito e opções sobre a imagem; remoção na nota e no resumo em edição/prévia; Desfazer/Refazer; Voltar/Avançar, Alt+setas, substituição da mesma aba, recuperação de aba fechada, rascunhos e histórico após recarregar.
- `electron-image-global-trash.cjs`, também executado no aplicativo empacotado com biblioteca temporária: exclusão global do arquivo e das referências em notas abertas/fechadas, listas, flashcards e resumo do quadro; outra imagem e exemplos de código preservados; restauração das referências; exclusão pelo resumo aberto; expurgo pela lixeira sem arquivo nem backup remanescentes nos caminhos gerenciados.
- Integridade do instalador 0.2.7 conferida com `release/SHA256SUMS.txt`.

## Ainda requer homologação antes de produção

- Exercitar todas as combinações de atalhos, mapas aninhados, páginas de terceiros, clipboard e temas reais no novo ambiente.
- Testar cópias grandes de bibliotecas e recuperação de falhas de energia/espaço em disco.
- Verificar leitores de tela, contraste, atalhos e máquinas com diferentes escalas de DPI.
- Testar instalação/desinstalação em Windows limpo, diferentes antivírus e contas sem privilégios.
- Revisar o instalador assinado e o pacote de loja após definir a identidade do editor.
- Aplicativo móvel nativo, sincronização entre aparelhos e atualização automática não são fornecidos por este instalador Windows.

O objetivo de equivalência integral é mantido; esta lista evita tratar reaproveitamento de código como prova de que cada fluxo já foi homologado.

## Painéis de estudo — versão de teste, 31/10/2026

- `tests/electron-study-workspace.cjs`: integração em biblioteca descartável. Verifica clique em link, criação de nota ausente, Ctrl+P contextual, quatro painéis, arrastar a aba, redimensionamento pelo teclado, instâncias preservadas ao alternar foco, resumo ao lado do quadro, gravações sucessivas de cartões, conteúdo sincronizado no resumo, armazenamento interno oculto e reabertura do layout.
- O mesmo teste avalia um cartão do resumo, edita o texto formatado e reabre a revisão: o cartão agendado para depois continua fora da fila e seu histórico permanece igual.
- `tests/electron-image-removal-navigation.cjs` e `tests/electron-summary-outline-tabs.cjs`: regressões de imagens, exclusão local, desfazer, índice H1–H6, navegação, rascunhos e fechar todas as abas.
- Alternar foco não reconstrói a árvore dos painéis. Arrastar/dividir usa movimentação de DOM que preserva estado quando suportada pelo Chromium; os editores não são recriados. O redimensionamento agrupa alterações por quadro de animação e não serializa o Markdown.
- Não cria instalador nem cópias de distribuição adicionais. Bibliotecas descartáveis deste teste são removidas ao terminar.

## Instalador 0.2.8 e Ctrl+O — 31/10/2026

- `tests/electron-pane-switcher.cjs`: Ctrl+O troca o conteúdo no painel em que a busca foi iniciada, tanto para notas quanto para whiteboards, incluindo arquivo já aberto em outro painel. Verifica que outros editores e a câmera do outro quadro continuam iguais, que escolher o mesmo arquivo preserva a instância e que rascunhos são salvos. Também verifica a busca iniciada no resumo em janela.
- O teste aceita `IMAGE_ATLAS_VERIFY_PACKAGE=1` para validar o executável empacotado usando perfil temporário, sem a biblioteca pessoal.

- Executável empacotado 0.2.8: `electron-pane-switcher.cjs` e `electron-study-workspace.cjs` passaram com `IMAGE_ATLAS_VERIFY_PACKAGE=1`. Ambos conferem que o perfil usado é descartável. A validação inclui Ctrl+O, quatro painéis, criação de nota por link, edição dos cartões do resumo, histórico FSRS e reabertura do layout.

## Busca de flashcards e tipografia — 0.2.9, 31/10/2026

- `tests/electron-flashcard-search.cjs`: atalho, busca com/sem acentos, perguntas/temas, ocultação de respostas, abertura de um cartão no mesmo painel, nova aba por Ctrl+Enter, cartões de mídia/mapa/resumo, busca em janela de revisão, atualização após edição e retorno à revisão normal com filtro de vencimento.
- O teste compara o registro FSRS completo antes/depois de abrir um cartão futuro e confirma que a avaliação explícita registra uma nova revisão; a mera busca e abertura preservam o registro. Também verifica zero leituras de arquivo ao filtrar e navegar pela lista já carregada.
- `tests/electron-pane-switcher.cjs` e `tests/electron-study-workspace.cjs` passaram após a integração da busca: Ctrl+O, painéis independentes, rascunhos, resumo e FSRS preservados.
- Verificados em execução: fonte calculada Segoe UI sem Variable, peso base 400, área principal sem transformação e zoom da interface 1. O aplicativo usa o zoom isolado do Electron; leitores externos mantêm sua própria escala. Referência: [webContents.setZoomFactor](https://www.electronjs.org/docs/latest/api/web-contents#contentssetzoomfactorfactor).
- Essas verificações conferem as configurações e o resultado capturado, mas não diagnosticam o monitor físico ou o ClearType do computador.

- Executável empacotado 0.2.9 validado com `IMAGE_ATLAS_VERIFY_PACKAGE=1`: busca, abertura de questão específica, mídia/mapa/resumo, painel/aba/janela, avaliação explícita, preservação do registro FSRS, ausência de leituras por tecla e tipografia/escala passaram. Perfil temporário separado da biblioteca pessoal.

## Correção da busca por nota — 0.2.10, 31/10/2026

- `tests/electron-flashcard-search.cjs` foi atualizado para verificar o comportamento solicitado: ACV e Respuesta inmunitaria aparecem uma única vez, com contagem; perguntas, respostas e notas sem cartões ficam fora da lista. Busca pelo título, sem distinguir maiúsculas/acentos.
- A revisão recebe o conjunto de cartões da nota e começa em vencidos/novos. Um cartão avaliado e agendado para o futuro continua fora da fila; o registro FSRS completo permanece igual após a busca.
- Verifica painel de origem, nova aba, janela de revisão, notas de mídia, resumos, atualização ao remover cartões de uma nota, ausência de leituras por tecla e migração das sessões isoladas da versão anterior.
- Teste de integração passou em biblioteca descartável, sem alterar a biblioteca pessoal.

- Executável empacotado 0.2.10 validado com IMAGE_ATLAS_VERIFY_PACKAGE=1: o teste corrigido de busca por notas passou. Instalador conferido por SHA-256.

## Editores em painel e prévia editável — 0.2.11, 31/10/2026

- `tests/electron-flashcard-editor-panels.cjs`: botão Flashcards da nota, edição exata da questão atual, adição/colagem, dois salvamentos sucessivos, revisão atualizada, histórico FSRS inalterado pela edição, nota e outro painel preservados e comportamento da janela sobreposta mantido.
- `tests/electron-edit-preview.cjs`: Ctrl sobre link, duplo clique real na prévia, janela persistente ao soltar Ctrl, colagem de texto, gravação no arquivo original, dois arquivos Markdown antes/depois (sem duplicação), fluxo em nota e flashcards, limpeza do editor e preservação do rascunho diante de falha simulada de gravação.
- Ambos passaram em perfis temporários descartáveis. Não geram capturas PNG nem bibliotecas de demonstração permanentes.

- Executável empacotado 0.2.11: testes de editores em painel e prévia editável passaram com IMAGE_ATLAS_VERIFY_PACKAGE=1, usando perfis temporários separados. Os perfis são removidos ao terminar; a pasta de compilação e os caches são limpos após a validação.

## Edição dentro da prévia — 0.2.12, 31/10/2026

- `tests/electron-edit-preview.cjs` verifica a identidade do elemento DOM e dimensões antes/depois do duplo clique, ausência de nova janela modal, permanência ao soltar Ctrl, texto e foto por eventos de colagem, menu `/` clicável, ampliar/restaurar, YAML e arquivo original preservados e ausência de cópias Markdown.
- Testa origem em nota, aba de revisão e janela de revisão; valida contexto da nota em edição, limpeza dos editores, fechamento por Esc e preservação do rascunho diante de erro de gravação. Captura visual usada temporariamente para comparar a caixa flutuante com a referência.
- `tests/electron-flashcard-editor-panels.cjs` continua passando para editar/adicionar flashcards em painel com histórico preservado.
- A caixa usa o editor existente; não há download de novo editor, criação de cópia da nota ou mudança da biblioteca pessoal nos testes.
- Referências de interação: [Page preview do Obsidian](https://obsidian.md/help/Plugins/Page%20preview) e [Hover Editor](https://github.com/nothingislost/obsidian-hover-editor). Implementação própria no Image Atlas, orientada pela captura enviada.

- Executável empacotado 0.2.12 validado com IMAGE_ATLAS_VERIFY_PACKAGE=1: prévia editável no mesmo elemento e tamanho, colagem de texto/foto, imagem em visualizador acima da prévia, menu / clicável, ampliar/restaurar, notas/aba/janela de revisão, fechamento por clique fora e Esc e preservação diante de falha passaram. A captura de QA é temporária e removida após validar.
