# Atualizações do ROMUS

As novidades de cada versão ficam neste arquivo. O [README](README.md) continua sendo o guia de instalação e uso.

## 0.3.7 — 1 de novembro de 2026

- Duplo clique no resumo do cartão edita a própria nota dentro do whiteboard, com o mesmo editor formatado, atalhos, links, cores e imagens. Um editor é criado apenas para o cartão em edição.
- Adicionar notas novas ou existentes mantém o whiteboard aberto. Alt+clique e o botão Abrir nota ao lado continuam como ações explícitas de abertura lateral.
- Salvamento na nota original, preservando propriedades e conteúdo de estudo. Concluir/Esc retorna à prévia; fechar o quadro salva o rascunho. Conflitos de edição mantêm o texto disponível.
- Câmera com composição temporária durante o movimento; visão distante evita pintar textos ilegíveis, sem desmontar suas prévias. Títulos, ações dos cartões e players continuam disponíveis. O texto volta à renderização normal ao aproximar/parar.
- Cache limitado dos resumos já preparados evita repetir o processamento da mesma nota em várias ocorrências. Posições, tamanhos, funções de estudo e zoom próprio das mídias preservados.

## 0.3.6 — 1 de novembro de 2026

- Marca-texto ajusta automaticamente a cor da letra: preto nas cores claras da paleta e contraste legível nos fundos escuros.
- Comportamento compartilhado pelo editor da nota, resumo do whiteboard e renderização Markdown; destaques antigos também ficam legíveis sem migração.
- Cor anterior preservada ao remover o fundo, inclusive depois de salvar/reabrir. Alteração explícita da cor da fonte após marcar continua respeitada. Negrito, links e desfazer/refazer mantidos.

## 0.3.5 — 1 de novembro de 2026

- Ctrl+O responde à digitação a cada quadro da interface, retirando a espera fixa de 70 ms por uma pausa.
- Resultados reutilizam linhas e ícones; apenas o texto/realce alterado é atualizado. Primeiros dezesseis resultados com ampliação pelo botão ou seta para baixo, sem perder a contagem nem os demais resultados.
- Consultas antigas são agrupadas ou canceladas no worker; filtros longos cedem processamento em pequenos lotes. Fechar a busca cancela o trabalho pendente.
- Cache limitado para texto normalizado e consultas repetidas, invalidado por edição/exclusão. Progresso da indexação deixa de reiniciar consultas enquanto a pessoa digita.
- Enter aguarda a consulta atual em vez de abrir um resultado que ainda pertencia ao texto anterior. Aspas ainda abertas preservam a última letra digitada.

## 0.3.4 — 1 de novembro de 2026

- Cada painel tem sua própria barra de abas. Ícones, +, fechamento, arraste entre barras, reordenação e divisões inferiores acompanham o grupo correto, mantendo os editores/leitores montados.
- Ctrl+O substituído pela busca de título e conteúdo inspirada no Omnisearch, com MiniSearch, relevância, aliases, cabeçalhos, prefixos, tolerância a pequenos erros, frases, exclusões e filtros de pasta/tag/extensão.
- Trechos destacados e abertura no painel de origem; Ctrl+Enter em nova aba e Alt+Enter ao lado. Saltar ao trecho encontrado na nota, quando disponível.
- Índice local em worker, cache por biblioteca e atualização incremental para edições, renomeações e lixeira. Metadados de gravação agora retornam as datas reais do arquivo, evitando invalidar todo o cache ao reiniciar.
- Pesquisa de resumos/temas nos quadros e dos conteúdos de estudo nas notas. PDFs/imagens pesquisados pelo nome; OCR/conteúdo binário não incluídos nesta versão.

## 0.3.3 — 1 de novembro de 2026

- Zoom e arraste priorizam a câmera; Markdown, metadados e verificações nativas dos leitores aguardam o término do movimento. Prévias próximas reutilizadas num cache limitado e conteúdo fora da tela não pintado desnecessariamente.
- Atualizações de resolução do PDF limitadas ao quadro correspondente, conservando o zoom próprio dos documentos.
- **Ctrl+F no whiteboard**: busca local de títulos sem leitura de arquivos ao digitar, pesquisa sem acentos, navegação por setas/Enter, seleção e centralização, inclusive em ramos recolhidos.
- Ícones de tipo nas abas e cabeçalhos; botão **×** direto em cada painel com o salvamento existente.
- Alternativas de quizzes embaralhadas por tentativa, conservando a escolha durante a resposta e o gabarito original. Nova tentativa evita repetir imediatamente a mesma ordem.

## 0.3.2 — 1 de novembro de 2026

- Importação de quizzes por colagem ou arquivo Markdown, com alternativas `[ ]`/`[x]`, explicação, modelo copiável, validação e prevenção de duplicados. IDs e ordem existentes conservados.
- Alternativas também exibem formatação Markdown. Listas grandes carregam de dez em dez.
- Cartões de notas com conteúdo exibem Mídia da nota e Quizzes; cartões sem conteúdo extra continuam com seu Markdown.
- Quiz respondido/criado/importado em painel dentro do whiteboard; YouTube, PDFs, casos clínicos, imagens e arquivos consultados no próprio cartão, com retorno ao resumo.
- Leitura em janela, tela cheia e painel ao lado mantida. Conteúdo de cartões de imagem/página usa um painel do quadro para preservar suas marcações.
- Controles carregados por visibilidade e cache, com adiamento abaixo de 35% de zoom; players são criados ao abrir e reutilizados no movimento da câmera.
- Estado de consulta separado por ocorrência; posições dos nós e histórico FSRS permanecem na estrutura existente.

## 0.3.1 — 1 de novembro de 2026

- Barra de ferramentas da nota oculta, com abertura por hover/foco ou toque, sem ocupar uma faixa permanente.
- **+ nas abas** para buscar/abrir notas e whiteboards ou criar conteúdo na nova aba.
- Página de nota em largura total e responsiva aos painéis, com uma única rolagem e texto alinhado ao título.
- Propriedades em linhas, etiquetas coloridas e edição por campo: Enter conclui e retorna à leitura.
- Capas com cores prontas, arquivo local ou URL; altura redimensionável pela borda, controles de posição e enquadramento.
- **Mídia da nota** em grade responsiva, com miniaturas do YouTube, arquivos/PDFs, links, busca, filtros, abertura em janela/ao lado e remoção.
- Casos clínicos em Markdown e quizzes de múltipla escolha com explicação, edição e remoção, armazenados na nota original.
- Importação de arquivos por cópia local, evitando transferir arquivos grandes pelo editor. Novos itens aparecem também na biblioteca de mídia.
- Metadados editados sem reconstruir o editor de texto. Conteúdos novos conservam o corpo da nota, mapas e FSRS; a exclusão global de mídia também limpa os vínculos e capas nas notas.

## 0.3.0 — 1 de novembro de 2026

- Nova identidade **ROMUS** com os SVGs fornecidos: nome, ícone do Windows, instalador, navegação e tela inicial.
- Paleta preto/branco, azul e verde e fonte Inter local com licença incluída; temas claro e escuro coerentes em notas, bibliotecas, editores, menus e prévias.
- Whiteboard com canvas escuro pontilhado, cartões de cantos arredondados, linhas finas, título e ações flutuantes, dock de criação e ferramentas de enquadramento/histórico na lateral. Cores escolhidas pelo usuário continuam disponíveis.
- Revisão com título de tema dentro do cartão, filtros agrupados, ações compactas, pergunta central, realces estáticos azul/verde e os dois botões existentes **Errei/Acertei**, conservando todos os controles, a edição direta e o FSRS.
- Sem filtros de desfoque no canvas, fontes remotas ou animações contínuas. Câmera e leitores continuam usando o motor existente.
- Barra de abas integrada aos controles nativos de minimizar/maximizar/fechar, com arraste da janela pelo espaço livre e sem faixa branca adicional. O título duplicado deixa de ocupar uma linha no painel único; os cabeçalhos das divisões e o menu das abas continuam disponíveis.
- Compatibilidade de atualização: identificador da instalação, biblioteca, configurações e armazenamento do Image Atlas preservados. Não há migração dos arquivos das notas.

## 0.2.16 — 1 de novembro de 2026

- Clique no texto da **pergunta ou resposta** durante a revisão para editar o próprio flashcard, sem abrir outro painel. Markdown e vínculos de notas continuam disponíveis. Ctrl+Enter/Salvar conclui, Esc cancela e sair do campo salva. Links e imagens mantêm suas ações normais.
- Botão **Remover flashcard** visível junto da navegação, com **Desfazer remoção**. A alteração atinge o cartão original e as revisões abertas, sem apagar o resumo ou o mapa. Edição e restauração conservam o registro FSRS.
- A digitação no editor de cartões não percorre todos os cartões nem força recálculo de altura a cada letra: contagem e ajuste são agrupados após uma pausa. O campo de treino evita o corretor ortográfico automático para reduzir trabalho sobre respostas longas.
- Notas novas e notas existentes procuram espaço livre próximo ao ponto escolhido, considerando também o tamanho do mapa incorporado. Os cartões que já estavam no quadro permanecem nas mesmas posições.
- Botão direito no espaço vazio do whiteboard: **Nova nota aqui** e **Adicionar nota existente aqui**, aproveitando a posição do clique.

## 0.2.15 — 31 de outubro de 2026

- **Colar link nesta nota** no whiteboard segue o fluxo de colar imagem: cole YouTube, página web, Spotify ou PDF e a mídia ocupa o cartão da própria nota, com player/leitor e opções Janela, Tela cheia e Ao lado. O resumo continua na mesma nota e pode ser consultado com Ctrl.
- No editor, colar uma URL sozinha incorpora a mídia na posição do cursor. Também há **Mídia**, `/` → **Link / vídeo** e um ícone de link nas prévias editáveis. Colar sobre palavras selecionadas mantém o comportamento de link de texto.
- As incorporações são armazenadas no Markdown da nota. Reutilizar a nota em outro quadro leva o player, resumo e conteúdo de estudo, conservando posições independentes e o histórico FSRS.
- O player aberto ao lado pode mostrar e editar o resumo original, sem criar uma cópia da nota. Ctrl funciona também sobre o leitor nativo; prévias de consulta não iniciam outros players automaticamente.
- O menu da incorporação e o ícone de lixeira permitem **Excluir mídia de todo o aplicativo**. As referências saem das notas, resumos e quadros e vão à lixeira. Notas que apenas contêm a incorporação, seus textos, mapas e cartões de estudo são preservados.
- O movimento da câmera não recria o player nem altera o zoom interno da página. Atualizações do resumo/agendamento mantêm o player se a mídia não mudou; o carregamento segue limitado aos cartões visíveis.

## 0.2.14 — 31 de outubro de 2026

- **Fixar prévia** no cabeçalho mantém a caixa aberta ao clicar fora, soltar Ctrl ou pressionar Esc. A posição fica travada até **Desafixar prévia**; você continua escrevendo, colando imagens e consultando outras notas normalmente. O botão fechar continua disponível, com salvamento antes de sair.
- Cada prévia tem sua própria fixação: é possível deixar várias notas fixadas enquanto trabalha em outras abas ou painéis. Desafixar devolve o comportamento de fechamento normal.
- Links como `[[Notas/ACV Hemorrágico]]` passam a mostrar **ACV Hemorrágico**, preservando o caminho de destino. Apelidos, referências a títulos e extensões de anexos continuam preservados.
- Corrigidos os vínculos do editor formatado que podiam perder a cor e a prévia com Ctrl após digitar e mudar o foco. Seus atributos agora são conservados quando o editor redesenha o texto.

## 0.2.13 — 31 de outubro de 2026

- **Um clique no texto da prévia** permite editar no próprio lugar, com colagem de texto/imagens e os recursos do editor Markdown.
- **Prévias encadeadas com Ctrl** preservam as anteriores: ACV → Troponina → Globulina. Entrar na prévia a mantém aberta ao soltar Ctrl, sem substituir a nota principal ou perder edições e rolagem das outras prévias.
- O título permanece no cabeçalho de cada prévia, inclusive durante a edição. Arraste o cabeçalho para reposicionar; cada caixa tem fechamento independente. Esc fecha a prévia em edição e retorna ao contexto anterior.
- Ctrl+clique dentro da prévia continua a consulta, sem navegar para outro painel ou duplicar a mesma prévia. Os comandos usam a nota da prévia em foco.
- Fechar salva antes de remover o editor; falhas de gravação conservam o rascunho. O editor só é carregado quando o texto recebe um clique; a consulta encadeada mantém leitores leves.

## 0.2.12 — 31 de outubro de 2026

- A edição da prévia do Ctrl agora acontece **dentro da própria caixa flutuante**, mantendo o elemento, tamanho e posição. O duplo clique não abre uma janela grande nem adiciona fundo escurecido.
- Visual compacto com o texto formatado e ícones pequenos para imagem, ampliar/restaurar e fechar. Rolagem própria e redimensionamento pela borda.
- Colagem de texto/fotos por Ctrl+V, comando `/`, formatação e ações de imagens usam o editor Markdown existente e salvam na nota original.
- A edição permanece ao soltar Ctrl. Clique fora, Esc ou fechar salvam antes de remover a prévia; falhas de gravação mantêm o rascunho. Menus de edição e visualizadores ficam acima da caixa.
- Funciona nas prévias das notas, nas abas de flashcards e na janela de revisão, preservando os painéis e as sessões abertas.

## 0.2.11 — 31 de outubro de 2026

- O botão **Flashcards** das notas em painel abre o editor ao lado, preservando o resumo. Os botões **Editar cartões** e **Adicionar flashcards** da revisão também abrem em painel; a edição continua restrita à questão atual. Janelas sobrepostas mantêm seu formato.
- Colagem em lote e salvamentos sucessivos atualizam a revisão de origem e preservam o histórico FSRS. Reabrir o mesmo editor reutiliza o painel existente.
- **Duplo clique no texto da prévia do Ctrl** abre uma janela com o editor normal da nota, pronta para digitar e colar. Soltar Ctrl não a fecha. O arquivo original é atualizado, sem criar uma cópia da nota.
- A janela salva antes de fechar e conserva o rascunho se ocorrer falha de gravação. O fluxo funciona a partir de links nas notas e nos flashcards.

## 0.2.10 — 31 de outubro de 2026

- Corrigido **Ctrl+Shift+F**: lista **notas que têm flashcards**, como ACV e Respuesta inmunitaria, com uma linha por nota e quantidade de cartões. A busca usa o nome da nota; perguntas isoladas e notas sem cartões não aparecem.
- Escolher a nota abre sua revisão completa em **Vencidos e novos**, no painel/aba/janela de origem. Ctrl+Enter abre nova aba e Alt+Enter abre ao lado.
- O histórico FSRS e os vencimentos permanecem preservados. Cartões futuros não são antecipados pela busca.
- Sessões de cartão isolado salvas pela versão 0.2.9 passam a abrir a revisão da nota com seu agendamento normal, sem apagar os registros.

## 0.2.9 — 31 de outubro de 2026

- **Ctrl+Shift+F** abre a busca global de flashcards por pergunta ou tema, com setas, Enter e identificação da nota de origem. Resultados incluem notas, mídias, resumos de quadros e cartões locais dos mapas, sem mostrar respostas.
- Enter abre somente a questão escolhida no painel de origem; numa janela de revisão, continua naquela janela. Ctrl+Enter abre nova aba e Alt+Enter abre ao lado.
- Histórico FSRS preservado ao consultar e abrir cartões. A revisão antecipada de um cartão ainda não vencido fica indicada; somente avaliar registra uma revisão e modifica o agendamento.
- Índice local com cache por arquivo, leituras limitadas e atualização na próxima abertura após alterações. Digitar e navegar entre resultados não relê os arquivos. A lista carrega resultados em lotes de 40.
- Fonte da interface padronizada em **Segoe UI**, com pesos estáticos, e abertura da interface em escala de 100%, respeitando a escala do Windows. O zoom dos whiteboards e dos leitores incorporados continua independente. A nitidez percebida também depende do monitor e das configurações do sistema; a mudança não confirma a causa de uma percepção de desfoque.

## 0.2.8 — 31 de outubro de 2026

- **Ctrl+O** abre notas e whiteboards no painel de origem da busca, preservando os demais painéis. Escolher o arquivo já exibido mantém sua posição de leitura.

- Até quatro painéis independentes para combinar notas, whiteboards, resumos e revisões. Arraste uma aba ou o cabeçalho de um painel para uma borda para dividir; para o centro, mova a aba para aquele painel. A área destacada indica o destino.
- Divisores ajustáveis com mouse ou setas do teclado. Duplo clique no cabeçalho amplia/restaura um painel; o menu de opções também permite dividir e fechar.
- O layout e as abas são recuperados ao reabrir o aplicativo. Alternar o foco preserva o editor, a posição de leitura e a sessão de revisão, sem recriar os painéis.
- No resumo do quadro, **Abrir ao lado** mantém o whiteboard visível. Índice, imagens, colagem, formatação e links continuam disponíveis.
- Clique em `[[Nota]]` no editor formatado ou na prévia abre a nota ao lado. Se ainda não existir, ela é criada com esse título. No modo de código Markdown, use Ctrl+clique no link. Shift+clique abre apenas os flashcards da nota vinculada, quando existirem.
- Ao selecionar palavras no editor, **Criar ou vincular nota ao lado** transforma a seleção em link e abre a nota correspondente.
- Ctrl+P reconhece a nota ou o resumo ativo e oferece **Responder flashcards desta nota ou resumo ao lado** e **Criar / editar flashcards da nota ou resumo ao lado**. O resumo e o editor de cartões permanecem visíveis juntos.
- Os cartões do resumo de um whiteboard ficam vinculados àquele resumo e conservam o agendamento FSRS. Seu armazenamento interno fica fora da biblioteca de notas.
- Em painéis baixos, **Controles** expande as ações secundárias de revisão, reservando espaço para a pergunta e a resposta.

Estas mudanças estão incluídas no instalador 0.2.8 para Windows.

## 0.2.7 — 29 de outubro de 2026

- Menu ao clicar com o botão direito nas imagens das notas e dos resumos de whiteboards, tanto na edição quanto na prévia. Também disponível pelo botão de opções sobre a imagem.
- **Remover imagem do texto** retira aquela ocorrência e permite Desfazer/Refazer com Ctrl+Z/Ctrl+Shift+Z.
- **Excluir imagem de todo o aplicativo** retira suas referências das notas, flashcards, resumos e quadros e leva o arquivo gerenciado pela biblioteca à lixeira, junto de sua nota de mídia quando existir. Exemplos de código e outros arquivos são preservados.
- Na lixeira, **Restaurar** recupera o arquivo e as referências preservadas no registro da exclusão. **Excluir definitivamente** apaga o arquivo e suas cópias guardadas naquele item da lixeira. Resumos alterados depois da exclusão são preservados, sem sobrescrever novas edições.
- Botões **Voltar** e **Avançar** na barra superior, com atalhos Alt+← e Alt+→. O histórico recupera notas e quadros, inclusive uma nota cuja aba foi fechada por engano, preservando rascunhos e posição de leitura.

## 0.2.6 — 29 de outubro de 2026

### Cores mais práticas

- Paletas com quadradinhos de vermelho, amarelo, azul, verde, laranja, roxo, rosa, cinza, branco e preto, substituindo os seletores RGB do editor, das propriedades, dos alfinetes e dos grupos.
- Na barra de seleção do texto, o botão **Cor de fundo** aplica ou remove a última cor escolhida. A seta ao lado abre a paleta; **Sem cor** remove apenas aquela cor, preservando a cor da fonte e as demais formatações.
- A mesma interação está disponível para a cor da fonte. Branco e preto também foram incluídos na paleta dos cartões do whiteboard.

### Posição de leitura e fluidez

- Entrar em edição mantém a passagem visível, tanto nas notas como no resumo do whiteboard, sem forçar o cursor para o fim.
- Alternar entre leitura e edição reaproveita o documento quando o conteúdo não mudou. A prévia também deixa de ser reconstruída sem necessidade.
- Atualizações da barra de formatação e da decoração de vínculos são agrupadas por quadro de animação; os vínculos já tratados deixam de receber alterações repetidas.

### Prévia dos subwhiteboards

- A contagem e os títulos seguem a visibilidade do quadro, excluindo cenas internas ocultas que podiam continuar listadas após remover uma mídia.
- A prévia usa o conteúdo atual dos quadros abertos e acompanha alterações, remoções e cores, sem depender de uma versão anterior em disco.
- Subwhiteboards presentes no quadro também aparecem entre os títulos da prévia. Cada item mostra a cor aplicada à sua ocorrência, inclusive branco e preto.

Atualize com **Image-Atlas-0.2.6-Setup.exe**, após fechar o aplicativo instalado e a versão de teste. A biblioteca e o histórico FSRS são mantidos.

## 0.2.5 — 29 de outubro de 2026

### Navegação nos resumos

- Índice lateral nos resumos das notas e dos whiteboards. Passe o mouse na borda direita para abrir a lista de títulos H1–H6, na ordem e hierarquia do texto.
- Busca de títulos e acesso direto à seção desejada. Títulos repetidos permanecem separados; exemplos dentro de blocos de código ficam fora do índice.
- Botão para voltar ao início após descer no resumo. Disponível no editor formatado, na prévia e no código Markdown, incluindo os resumos das notas de mídia.
- Lista do índice com renderização das linhas visíveis e posições em cache durante a rolagem. Conversões para Markdown agrupadas durante a digitação, com conclusão antes de salvar ou fechar.

### Notas e vínculos

- A barra lateral mostra **Notas recentes**, em ordem de abertura. A biblioteca de notas continua reunindo a coleção completa.
- Correção do vínculo criado ao escolher uma nota nas sugestões de `[[`. O texto seguinte deixa de continuar dentro do mesmo link.
- Conversão de vínculos completos como `[[Nota|Apelido]]` no editor formatado e prévia ao pressionar Ctrl com o mouse sobre o link.
- Títulos legíveis nas buscas, listas e prévias, com ocultação das pastas técnicas e da extensão `.md` na apresentação das notas.
- Cartões da biblioteca mostram o texto do usuário, sem rodapés de índice do whiteboard ou caminhos de imagens.

### Imagens e cores

- Imagens inseridas no texto podem ser abertas em janela ou tela cheia.
- Legendas salvas na nota e na Biblioteca de mídia, com exibição junto à imagem.
- Imagens adicionadas pelo editor passam a integrar a Biblioteca de mídia.
- Paleta de cores para notas, mapas mentais, imagens, mídias e subwhiteboards. A cor pertence à ocorrência naquele quadro e não altera a cor da mesma nota em outros quadros.

### Abas e salvamento

- **Ctrl+P → Fechar todas as abas** salva e fecha notas, whiteboards e demais abas abertas. O aplicativo retorna à tela inicial.
- **Fechar todas as notas** permanece disponível para fechar apenas notas e leitores de mídia.
- O fechamento de todas as abas é interrompido se o salvamento falhar. O resumo do whiteboard também aguarda o salvamento antes de fechar.

### Como atualizar

Feche o Image Atlas instalado e a versão de teste. Execute **Image-Atlas-0.2.5-Setup.exe**, mantendo a mesma pasta de instalação. A biblioteca e o histórico FSRS ficam separados dos arquivos do programa; não é necessário importá-los novamente.

As atualizações do programa instalado continuam manuais. Para compartilhar o aplicativo, envie o instalador; ele não contém a biblioteca pessoal do desenvolvedor.

## 0.2.4

- Nova barra lateral com largura ajustável, rolagem própria e menu compacto da biblioteca.
- Arraste de whiteboards para reordenar a lista ou mover subwhiteboards entre quadros, com atualização do cartão correspondente no quadro.
- Organização visual das notas criadas pelas versões anteriores do plugin, preservando os caminhos dos arquivos e seus vínculos.

## 0.2.3

- Resumo próprio de cada whiteboard, armazenado dentro do quadro.
- Subwhiteboards apresentados abaixo do quadro principal na barra lateral.
- Colagem de imagens com Ctrl+V e menu `/` no editor para inserir imagens e estruturas de texto.
- Correção da continuidade da digitação com Enter nos mapas de notas vinculadas.

## Versões anteriores

A origem no plugin do Obsidian e a evolução para um aplicativo independente estão descritas no [README](README.md). Os registros de testes e os limites de validação ficam em [VALIDACAO.md](VALIDACAO.md).
