# ROMUS

**Whiteboards, notas conectadas, mídias e flashcards com revisão espaçada.**

O ROMUS (anteriormente Image Atlas) é um aplicativo de estudo e organização do conhecimento. Ele reúne um espaço visual para organizar ideias, um editor de notas Markdown e um sistema de flashcards com agendamento FSRS.

O projeto começou como um plugin pessoal de Douglas para o Obsidian. Depois evoluiu para um aplicativo independente para Windows, mantendo o motor de mapas e revisão e ganhando interface, bibliotecas e leitores próprios.

**Versão:** 0.3.7 — prévia para Windows 64 bits.

No whiteboard, dê dois cliques no texto de uma nota para editar no próprio cartão. O editor tem os mesmos atalhos de negrito/itálico, cores, links e colagem de imagens. Use **Concluir** ou **Esc** para voltar à leitura; as alterações são salvas na nota original. Adicionar uma nota mantém você no quadro. Para abrir ao lado, use **Alt+clique** ou **Abrir nota ao lado**.

A visualização distante simplifica o desenho dos resumos e mantém títulos e ações disponíveis. Ao aproximar, as prévias voltam usando o cache. A composição da cena durante zoom/arraste é temporária; os leitores de mídia mantêm seu zoom próprio.

[Instalar o aplicativo](release/ROMUS-0.3.7-Setup.exe) · [Ver atualizações](CHANGELOG.md) · [Como atualizar](release/COMO-ATUALIZAR.txt)

## Marca-texto no Markdown

Ao aplicar uma cor de fundo, o texto fica preto automaticamente nas cores claras da paleta, incluindo amarelo, rosa, azul e roxo. Fundos escuros mantêm contraste legível. Isso vale para a nota, o resumo do whiteboard e as prévias, inclusive para destaques antigos. Negrito, links, desfazer/refazer e salvamento continuam disponíveis.

Remover o marca-texto restaura a cor da fonte anterior. Escolher uma cor de fonte depois de marcar é uma decisão explícita e permanece respeitada; aplicar outro fundo volta a ajustar o contraste automaticamente. Os destaques antigos não exigem migração ou regravação para aparecer corretamente.

## Abas por painel e busca por conteúdo

Cada divisão tem sua própria barra de abas, com ícones, fechamento e **+**. Arraste uma aba para a barra de outro painel ou para uma borda para reorganizar. A aba acompanha a divisão, incluindo divisões inferiores. Os editores e leitores existentes são movidos, sem abrir cópias ou descartar rascunhos.

**Ctrl+O** agora abre uma busca por título e conteúdo, inspirada no Omnisearch e usando MiniSearch. Títulos, aliases e cabeçalhos têm maior peso; a busca ignora acentos, aceita prefixos e tolera pequenos erros de digitação. Os resultados mostram trechos destacados, sem expor caminhos internos ou `.md` no título. Enter abre no painel de origem; Ctrl+Enter abre uma nova aba nesse painel; Alt+Enter abre ao lado. Quando o termo está no resumo visível da nota, a leitura vai ao trecho correspondente.

Use `"frase exata"`, `-excluir`, `path:pasta`, `tag:tema` e `.md`/`.pdf` para filtrar. Casos clínicos, quizzes e flashcards da nota também participam da pesquisa; dados internos de posição e agendamento ficam fora. Whiteboards são pesquisados por nome, resumo e títulos/textos dos nós. PDFs e imagens participam por nome do arquivo; esta versão não faz OCR nem extrai conteúdo de anexos binários.

A digitação dispara a consulta no próximo quadro da interface, sem esperar uma pausa. Consultas superadas são descartadas; as linhas de resultados e seus ícones são reaproveitados. Os primeiros dezesseis resultados são mostrados imediatamente; **Mostrar mais resultados** ou continuar com a seta para baixo amplia a lista. A contagem considera todos os resultados, e os filtros/pesquisa por conteúdo continuam completos.

O índice é local, separado por biblioteca, processado fora da interface e atualizado por arquivo alterado. O cache é reaproveitado após reiniciar. Digitar uma busca não rele os arquivos; os resultados aparecem também enquanto a indexação inicial está em andamento.

## Navegação e busca no quadro

**Ctrl+F** abre a busca somente no whiteboard em uso. Digite o título de uma nota ou tópico; a busca ignora acentos. Clique no resultado ou use as setas/Enter para centralizar e selecionar o cartão. Ramos recolhidos são revelados quando necessário. Os botões anterior/próximo percorrem os resultados; Esc fecha a busca. Outros quadros não entram nessa lista.

As abas e os cabeçalhos dos painéis têm ícones de nota, whiteboard e conteúdo de estudo. O **×** no cabeçalho fecha a aba daquele painel diretamente, com o salvamento normal. O arquivo permanece na biblioteca.

Durante zoom e arraste, o trabalho de Markdown, metadados e atualização dos leitores aguarda o término do gesto. Prévias próximas são reaproveitadas num cache limitado; leitores existentes mantêm seu zoom próprio.

## Importar quizzes em Markdown

Na nota ou no cartão do whiteboard, abra **Quizzes → Importar Markdown**. Cole o texto ou use **Abrir arquivo .md**. **Copiar modelo** copia um exemplo pronto.

```markdown
## Título do quiz
Qual é a alternativa correta?
- [ ] Alternativa incorreta
- [x] Alternativa correta
- [ ] Outra alternativa
Explicação: Use **Markdown** e [[Nota]] aqui.

---

## Segundo quiz
Outra pergunta?
- [x] Resposta correta
- [ ] Outra resposta
```

Use de duas a oito alternativas e marque exatamente uma com `[x]`. Separe os quizzes com `---` numa linha própria. O título e a explicação são opcionais. O importador valida todos os blocos antes de salvar, acrescenta aos existentes e ignora duplicados idênticos, conservando os IDs e a ordem dos quizzes anteriores. Há um arquivo pronto em [quiz-modelo.md](examples/quiz-modelo.md).

## Conteúdo da nota diretamente no whiteboard

Os cartões mostram **Mídia da nota** e **Quizzes** somente quando a nota tem esse conteúdo. Sem mídia, o Markdown continua aparecendo normalmente.

Clique em **Quizzes** para responder em um painel dentro do quadro; também é possível criar, editar e importar ali. Em **Mídia da nota**, clique num vídeo, PDF, imagem, arquivo ou caso clínico para consultar no próprio cartão. **Voltar ao resumo** restaura o Markdown. Os leitores mantêm Janela, Tela cheia e Ao lado. Em cartões que já são imagens/páginas, o conteúdo abre num painel do próprio quadro, preservando as marcações existentes.

O painel pode ser movido, redimensionado e fechado. A consulta não muda posições ou tamanhos dos nós, nem o agendamento FSRS. Players só são criados ao abrir um item; os controles de conteúdo carregam para cartões visíveis, com carregamento adiado em visões muito afastadas. Importações grandes mostram os quizzes em grupos de dez para limitar o trabalho da interface.

## Notas com capa, propriedades e conteúdo de estudo

O **+ na barra de abas** abre uma busca para escolher uma nota ou um whiteboard naquela nova aba. Também permite criar uma nota ou um quadro. Os outros painéis continuam abertos.

As ferramentas da nota ficam escondidas no botão **⋯ Ferramentas da nota** no canto superior: passe o mouse ou use o teclado para mostrá-las; no toque, clique no botão. Elas não deslocam o texto.

Cada nota tem uma página que se adapta à largura da janela ou do painel, com uma única rolagem. Use **Adicionar capa** para escolher uma cor, enviar uma imagem ou usar um link da internet. **Ajustar capa** controla altura, enquadramento e posição vertical; a borda inferior também permite redimensionar. A capa por URL usa o endereço original, sem criar um download temporário. Imagens enviadas ficam na biblioteca.

As **propriedades ficam em linhas abaixo do título**. Clique no valor para editar; Enter conclui e Esc cancela. Há caixas de seleção, números, datas, etiquetas e seleção/status com cores. **Adicionar propriedade** escolhe o nome, tipo e cor. O botão Propriedades mantém o editor completo de configurações.

- **Resumo:** editor Markdown existente, links, fotos, formatação, índice e flashcards.
- **Mídia da nota:** grade responsiva com miniaturas, busca e filtros para vídeos, arquivos/PDFs, links e casos clínicos. A seta abre o conteúdo; **Ao lado** usa o leitor/player em outro painel. O menu do cartão permite remover o vínculo desta nota ou excluir a mídia de todo o aplicativo pela lixeira. Arquivos são copiados para a biblioteca, sem depender da pasta de origem.
- **Casos clínicos:** título e texto em Markdown, com leitura, edição e remoção dentro da mesma nota.
- **Quizzes:** questões com duas a oito alternativas, uma resposta correta e explicação opcional. Escolha uma alternativa e use Conferir resposta; Tentar novamente reinicia a tentativa. As alternativas são embaralhadas em cada nova tentativa, sem mudar enquanto você escolhe ou confere a resposta; a ordem anterior não se repete imediatamente. O quiz não altera o agendamento dos flashcards FSRS.

Capa, organização da mídia, casos e quizzes são armazenados no próprio arquivo Markdown, em um campo interno YAML que fica oculto na página e nos filtros de propriedades. Não são criadas cópias da nota na biblioteca. O texto, mapas e registros FSRS existentes continuam preservados.

## Identidade ROMUS

O ROMUS apresenta sua identidade visual: logo original, fonte **Inter** incluída localmente, canvas pontilhado escuro, controles flutuantes, dock de criação, ferramentas na lateral, cartões com bordas finas e superfícies em preto e branco. Os acentos **azul #6DB5FF**, **verde #5BE3A1** e **azul #3D8BFF** aparecem na navegação, nos controles e na revisão. O tema claro também foi atualizado. Os controles do Windows foram integrados à barra de abas, sem a antiga faixa branca; o título duplicado é ocultado quando há um único painel.

A mudança de identidade é visual. Os mapas, posições, cores personalizadas, notas, mídias, atalhos, painéis, editores e histórico FSRS usam o mesmo motor. A revisão continua com **Errei** e **Acertei**. Os efeitos de cor são estáticos, sem desfoque do canvas, animações contínuas ou serviços externos de fontes.

**Atualizando do Image Atlas:** feche a versão anterior e instale o ROMUS na mesma pasta. A identidade de instalação e a pasta de dados `%APPDATA%/Image Atlas` foram conservadas para reutilizar a biblioteca e as configurações. A pasta do código continua se chamando `image-atlas-desktop`; guarde essa pasta para futuras alterações. O nome técnico antigo nos arquivos não exige renomear nem importar suas notas.

## Estudar lado a lado

As funcionalidades anteriores continuam incluídas no instalador **0.3.7**. Arraste uma aba para a borda de outro painel para dividir a tela em até quatro áreas. Arraste para o centro para mover a aba. Ajuste os divisores ou dê dois cliques no cabeçalho para ampliar um painel.

No resumo do whiteboard, use **Abrir ao lado** para consultar o texto e o quadro juntos. Na nota ou no resumo, pressione **Ctrl+P** e busque **Responder flashcards** ou **Criar / editar flashcards** para estudar ou editar os cartões ao lado do texto.

Clique num link `[[Nota]]` para abri-lo ao lado; uma nota inexistente será criada com esse nome. **Shift+clique** revisa os cartões daquele link, quando a nota tiver flashcards. **Ctrl** sobre o link mantém a prévia. No modo de código Markdown, Ctrl+clique segue o link.

Veja os detalhes de cada versão em [Atualizações](CHANGELOG.md).

Nas prévias, **um clique no texto** permite editar. Continue consultando links com **Ctrl** para abrir outras prévias, mantendo as anteriores com seus títulos, textos e posições de leitura. Por exemplo: Bacteriologia → ACV → Troponina → Globulina. O título fica sempre no cabeçalho de cada caixa; arraste-o para reposicionar. Cada prévia pode ser fechada separadamente.

**Ctrl+O** abre a nota ou o whiteboard escolhido no painel em que a busca foi iniciada. Os outros painéis permanecem abertos.

## Buscar notas com flashcards

Pressione **Ctrl+Shift+F** ou use **Buscar notas com flashcards** no Ctrl+P. Digite o nome da nota, como **ACV** ou **Respuesta inmunitaria**. A lista exibe cada nota uma única vez, com sua quantidade de flashcards. Não exibe perguntas isoladas nem notas sem cartões.

- **Enter** ou clique: abrir a revisão dos flashcards daquela nota no painel atual. Se a busca começou numa janela de revisão, continua naquela janela.
- **Ctrl+Enter**: abrir em nova aba.
- **Alt+Enter**: abrir ao lado.
- **↑/↓**: escolher a nota; **Esc**: cancelar.

A revisão começa em **Vencidos e novos** e preserva o histórico e o agendamento FSRS. Cartões agendados para depois continuam fora da fila. Também é possível localizar notas de mídia e resumos de quadros que tenham flashcards.

## Editar mantendo o contexto

Nas notas abertas em painel, **Flashcards** abre o editor ao lado. **Editar cartões** e **Adicionar flashcards** na revisão também usam um painel, mantendo a nota e a sessão de estudo abertas. A edição da questão atual continua mostrando apenas aquela questão. Quando a revisão está em uma janela sobreposta, o editor mantém esse formato.

Segure **Ctrl** sobre um link para ver a prévia de uma nota. Dê **um clique no texto da prévia** para editar **dentro da própria caixa flutuante**, mantendo seu tamanho e posição. Ela permanece aberta ao soltar Ctrl e usa a nota original. Você pode colar texto e fotos com Ctrl+V, usar `/` ou o botão de imagem, formatar a seleção e rolar o texto. O ícone no canto amplia/restaura a prévia, e a borda permite redimensionar. Quando não está fixada, Esc ou um clique fora salvam e fecham; se ocorrer falha de gravação, o rascunho fica aberto. Funciona nas notas e nos flashcards.

Use o **alfinete no cabeçalho** para **Fixar prévia**: ela fica aberta mesmo ao trabalhar em outra nota, e sua posição permanece travada. Continue escrevendo e colando imagens normalmente. Clique no alfinete novamente para desafixar e poder mover a caixa. Cada prévia é independente, e o botão **Fechar prévia** continua salvando e fechando a nota mesmo quando fixada. Os links mostram apenas o nome da nota, sem o caminho das pastas, mantendo os destinos e apelidos.

## O que você pode fazer

Durante a revisão, **clique na pergunta ou na resposta** para editar aquele texto no próprio cartão. Use Markdown e `[[Nota]]`; **Ctrl+Enter** ou **Salvar** conclui, **Esc** cancela e sair do campo salva. **Remover flashcard**, ao lado da navegação, exclui o cartão original e oferece **Desfazer remoção**. Seu resumo e mapa permanecem na nota.

No espaço vazio do whiteboard, o **botão direito** oferece **Nova nota aqui** e **Adicionar nota existente aqui**. A inserção procura espaço livre próximo, sem mover os cartões existentes.

Para usar um vídeo ou site como a imagem de uma nota no quadro, selecione a nota e escolha **Colar link nesta nota**, junto de **Colar imagem nesta nota**. Cole o endereço: o próprio cartão mostra o conteúdo incorporado. Use **Ctrl** sobre ele para consultar o resumo, ou **Janela**, **Tela cheia** e **Ao lado** para abrir o player/leitor. O resumo, os mapas e os flashcards continuam vinculados à nota original.

Dentro do editor, cole uma URL sozinha ou use **Mídia** / **`/` → Link / vídeo**. A incorporação é salva no Markdown. A lixeira e o menu do player oferecem **Excluir mídia de todo o aplicativo**, retirando suas referências sem apagar as notas que a contêm. A exclusão definitiva fica na lixeira.

- Organizar assuntos em whiteboards e subwhiteboards.
- Reorganizar os whiteboards pela barra lateral, com atualização dos cartões nos quadros.
- Guardar e consultar um resumo próprio de cada whiteboard.
- Escrever notas, conectar conceitos com links `[[Nota]]` e consultar suas conexões.
- Criar mapas mentais, relações, ramos e notas diretamente no quadro.
- Estudar imagens com alfinetes e marcações de áreas.
- Incorporar páginas web, PDFs, YouTube e Spotify como notas de mídia.
- Escrever um resumo enquanto acompanha a fonte ao lado.
- Criar flashcards por nota e revisar os temas de um whiteboard.
- Organizar notas em pastas e filtrar a biblioteca por propriedades.
- Reutilizar notas em diferentes quadros, com organização visual própria para cada ocorrência.

## Como o projeto começou

O ponto de partida foi a necessidade de estudar de forma visual dentro do Obsidian: partir de uma imagem ou de um assunto, escrever um resumo, relacionar conceitos e transformar esse material em perguntas para revisão.

Criamos o plugin **Image Atlas** para reunir essas tarefas no mesmo ambiente. Ao longo dos testes, o foco passou a ser reduzir os passos necessários para estudar: criar filhos com Tab, transformar nós em notas, colar imagens, recolher ramos e abrir flashcards da nota que estava sendo estudada.

O desenvolvimento foi guiado por situações reais de uso. Douglas testava o material de estudo e apontava dificuldades; a implementação e os ajustes foram feitos com assistência de IA, revisão do código e testes automatizados em bibliotecas temporárias.

O Canvas do Obsidian e o Kplex foram referências de fluidez desejada. Heptabase e Noteey foram referências de organização visual e apresentação das notas. Essas referências orientaram a experiência de uso do projeto.

### O que o plugin fazia no Obsidian

A base do aplicativo utiliza o motor do plugin Image Atlas **0.16.9**. Essa base reúne:

| Área | Funções desenvolvidas no plugin |
| --- | --- |
| Whiteboard | Quadros renomeáveis, conexões, grupos, subwhiteboards, zoom, enquadramento e desfazer/refazer. |
| Mapas mentais | Filhos, irmãos, relações, recolhimento, renomeação e movimentação de ramos. |
| Notas | Vínculos com arquivos Markdown, criação de notas a partir de nós e reutilização de notas visuais. |
| Imagens | Importação, colagem, alfinetes, áreas marcadas e resumos associados. |
| Flashcards | Pergunta e resposta em Markdown, editor numerado, colagem em lote, edição e reordenação. |
| Revisão | FSRS, cartões novos e vencidos, erros, navegação entre questões e histórico. |
| Estudo por quadro | Escolha de temas, busca, ordenação e revisão das notas presentes no whiteboard. |
| Busca | Localização de notas e mapas nos quadros. |

## Como o plugin virou aplicativo

A transformação foi feita em etapas. Reaproveitamos o motor do plugin e construímos os serviços que antes eram fornecidos pelo Obsidian.

1. **Preservação do motor:** mapas, cenas visuais e revisão FSRS continuaram usando a base do Image Atlas.
2. **Adaptação das interfaces:** foram implementadas as interfaces de arquivos, abas, janelas, menus e renderização necessárias para executar esse motor fora do Obsidian.
3. **Biblioteca local:** o aplicativo ganhou leitura, gravação, importação, exportação e lixeira próprias.
4. **Interface de notas:** foram adicionados o editor formatado, links entre notas, propriedades, pastas e biblioteca de notas.
5. **Notas de mídia:** páginas, vídeos, áudio e PDFs passaram a ter uma biblioteca específica e uma nota vinculada com resumo, mapas e flashcards.
6. **Desempenho e correções:** os testes de uso orientaram ajustes de zoom, nitidez, reutilização de ocorrências e redução de trabalho repetido durante os movimentos do quadro.
7. **Distribuição:** o projeto passou a gerar um instalador `.exe` para Windows.

### O que foi automatizado

A automação do desenvolvimento inclui a preparação do motor, a compilação da interface, a cópia dos recursos necessários, os testes e a geração do instalador.

Durante o desenvolvimento, há um modo que acompanha alterações de código e prepara a atualização da aplicação. Esse processo é diferente da atualização do aplicativo instalado: quem recebe o `.exe` ainda precisa executar um novo instalador para atualizar.

A assistência de IA foi utilizada no desenvolvimento. A organização das notas e o agendamento das revisões funcionam localmente.

## Como o aplicativo está organizado hoje

### Whiteboards

São espaços para distribuir notas, imagens, fontes e mapas mentais. Você pode criar um quadro para um assunto geral e incluir subwhiteboards para seus temas.

Exemplo: um quadro de **Urologia** pode organizar subwhiteboards de **Próstata**, **Infecções urinárias** e **Bolsa escrotal**.

### Notas convencionais e notas de mídia

| | Nota convencional | Nota de mídia |
| --- | --- | --- |
| Ponto de partida | Um texto ou conceito criado por você. | Uma página, vídeo, áudio ou PDF. |
| Biblioteca | Biblioteca de notas. | Biblioteca de mídia. |
| Conteúdo | Resumo, propriedades, mapas e flashcards. | Fonte vinculada, resumo, propriedades, mapas e flashcards. |
| Reutilização | Pode aparecer em outros quadros. | Pode aparecer em outros quadros com sua fonte e conteúdo vinculados. |

A nota de mídia é uma entidade de estudo: o vídeo ou documento e o resumo pertencem ao mesmo item. Seu Markdown de apoio não deve aparecer como uma segunda nota convencional na biblioteca.

### Conteúdo compartilhado e posição independente

Reutilizar uma nota mantém o vínculo com seu conteúdo. O resumo, os flashcards e o agendamento pertencem à nota.

A posição, o tamanho e o recolhimento de uma ocorrência pertencem ao whiteboard. Assim, uma nota pode participar de dois contextos de estudo com organizações visuais diferentes.

**O histórico FSRS continua compartilhado:** responder um cartão em um quadro atualiza o agendamento daquele cartão onde a mesma nota for utilizada.

## Instalar e atualizar

1. Baixe o [instalador ROMUS 0.3.7](release/ROMUS-0.3.7-Setup.exe).
2. Execute o instalador e conclua a instalação.
3. Abra o ROMUS.

Para atualizar uma instalação existente, feche o aplicativo e a versão de teste, se estiver aberta. Execute o novo instalador, mantendo a mesma pasta de instalação. A biblioteca fica separada dos arquivos do programa; não é necessário importá-la novamente.

Para compartilhar o aplicativo, envie o instalador. Cada pessoa terá sua própria biblioteca. O instalador não inclui as notas ou o histórico pessoal de quem desenvolveu o projeto.

O programa instalado funciona sem o Obsidian e sem uma instalação separada do Node.js.

A versão de teste local pode ser aberta pelo atalho **Image Atlas - Teste**, quando configurado neste computador. Ela executa o projeto em desenvolvimento e recebe as mudanças sem reinstalação. Ela usa a biblioteca local atual; as alterações feitas durante o estudo são salvas. Para distribuir o aplicativo a outras pessoas, utilize o instalador.

Use **Voltar** e **Avançar** na barra superior, ou **Alt+← / Alt+→**, para retornar às notas e quadros visitados. O histórico também permite reabrir uma nota fechada por engano.

## Navegar pela barra lateral

- **Buscar:** procura notas e quadros; também pode ser aberto com **Ctrl+O**.
- **Criar:** oferece **Nova nota**, **Novo whiteboard** e **Nova pasta**.
- **Biblioteca de notas**, **Biblioteca de mídia** e **Revisões de hoje:** abrem as respectivas telas.
- **Explorar:** mostra a hierarquia dos quadros. a seção **Notas recentes** reúne até 12 notas consultadas, em ordem de abertura; **Ver todas as notas** abre a biblioteca completa. O campo de filtro reduz a lista; o botão ao lado de Explorar abre **Buscar nos mapas**.
- **Biblioteca local**, no rodapé: reúne configurações, tema, lixeira, importação, exportação e comandos.

Arraste a borda direita para ajustar a largura. Use o botão de recolhimento ou **Ctrl+\\** para ocultar e mostrar a barra. A lista tem rolagem própria, mantendo os controles da biblioteca acessíveis.

## Começar a estudar

1. Mostre a barra lateral pelo botão do canto superior esquerdo.
2. Clique em **Criar → Novo whiteboard** e dê um nome ao assunto.
3. No quadro, abra **Adicionar → Nova nota** ou **Adicionar nota existente**.
4. Escreva seu resumo e conecte outras notas usando `[[Nome da nota]]`.
5. Crie um mapa mental a partir da nota e desenvolva os ramos.
6. Adicione imagens ou uma fonte de mídia quando precisar.
7. Abra **Flashcards** na nota para preparar suas perguntas.
8. No quadro, clique em **Estudar** para escolher um tema ou responder os cartões disponíveis de todos os temas.

## Usar os whiteboards e mapas mentais

- Arraste o fundo para deslocar a visão do quadro.
- Use a roda do mouse para aproximar ou afastar.
- Arraste os cartões pelo cabeçalho para mudar sua posição.
- Use **Enquadrar** para localizar o conteúdo do quadro.
- Use **Conectar** para criar uma ligação visual entre cartões.
- Use grupos para organizar conjuntos de elementos.
- Adicione um subwhiteboard para dividir um assunto em partes.

No mapa mental, selecione um nó e pressione **Tab** para criar um filho. **Enter** cria um irmão quando o foco está no mapa. **Shift+Tab** permite escolher uma nota existente para um filho.

Um tópico pode começar como um nó sem arquivo. Use **Ctrl+Shift+Enter** para criar sua nota. Também é possível selecionar vários nós e criar as notas em lote com esse atalho.

Use os controles de **Recolher/Expandir** para reduzir a quantidade de informação visível. Nas mídias, o botão do cartão controla a exibição do resumo e do mapa associados; novas incorporações começam recolhidas.

A prévia de um subwhiteboard mostra seus itens visíveis atuais e as cores de cada ocorrência. Cenas internas ocultas não entram na contagem.

### Reorganizar whiteboards pela barra lateral

| Onde soltar o whiteboard | Resultado |
| --- | --- |
| No centro da linha de outro whiteboard | Torna-se um subwhiteboard daquele quadro. |
| Na borda superior ou inferior de uma linha | Reordena a lista naquele nível. |
| No título **Quadros** | Retira o vínculo com o quadro de origem; sem outros vínculos, passa a aparecer como quadro principal. |

Ao transferir um subwhiteboard entre quadros, seu cartão sai do quadro de origem e aparece em um espaço livre no destino. Seu conteúdo, resumo, mapas e flashcards permanecem preservados. Os outros cartões mantêm suas posições. Se o mesmo subwhiteboard estiver vinculado a outros quadros, esses vínculos continuam existindo.

Também é possível usar o botão direito sobre um whiteboard e escolher **Mover whiteboard…**. A ordem da lista é salva e reaparece ao reabrir o aplicativo. O programa impede colocar um quadro dentro dele mesmo ou de seus descendentes.

### Resumo do whiteboard

Clique em **Resumo**, na barra superior do quadro, para escrever ou consultar uma apresentação, roteiro ou síntese daquele assunto. Há modos de leitura, editor formatado e Markdown, com salvamento automático. o resumo também possui o índice lateral H1–H6: passe o mouse na borda direita, busque ou clique em uma seção para navegar; a seta para cima retorna ao início.

O resumo fica no próprio arquivo do whiteboard. Cada quadro possui seu resumo; ele não cria outra nota na biblioteca. O editor também aceita imagens coladas e o menu **/**.

## Escrever e organizar notas

### Editor formatado

O modo padrão pode ser escolhido em **Configurações**:

- **Editor formatado:** escreve com títulos, listas e formatação visível.
- **Código Markdown:** mostra o texto para edição da sintaxe.
- **Somente leitura/Prévia:** apresenta a nota renderizada.

Selecione um trecho para abrir a barra flutuante de formatação. Ela oferece negrito, itálico, títulos, listas, citações, código, links, cores da fonte e do fundo, entre outras opções.

As cores são escolhidas em uma paleta de quadradinhos. O botão de cor da fonte ou do fundo aplica e remove a última cor; a seta ao lado permite escolher outra. Remover o fundo preserva a cor da fonte.

Ao alternar entre leitura e edição, a passagem visível é mantida. O editor e a prévia reaproveitam o conteúdo que não mudou.

Formatações visuais, como cores, podem ser representadas por HTML dentro do Markdown.

### Índice do resumo

Passe o mouse sobre a faixa com o ícone de índice, na borda direita do editor da nota. O painel **Neste resumo** aparece sobre o documento, preservando o espaço de leitura. Ele mostra os títulos H1 a H6 na ordem do texto, com recuo para cada nível; um novo H1 inicia outra seção principal. Clique em um título para ir àquela passagem ou use **Buscar um título…** para encontrá-la rapidamente. Títulos repetidos permanecem como entradas separadas.

Ao sair da faixa, o painel se recolhe. Também é possível abri-lo pelo teclado: dê foco ao botão **Índice do resumo**, use a seta para baixo para entrar na lista e **Esc** para fechar. Em telas de toque, toque no ícone e, para fechar, fora do painel.

Depois de descer no resumo, aparece um botão com seta para cima, **Voltar ao início do resumo**. A navegação funciona no editor formatado, na prévia e no código Markdown, incluindo os resumos das notas de mídia. Exemplos de títulos dentro de blocos de código não entram no índice.

Para reduzir o trabalho em notas extensas, a rolagem consulta posições em cache e a lista monta apenas as linhas visíveis. Alterações nos títulos atualizam o índice automaticamente. A conversão do editor para Markdown é agrupada durante a digitação e concluída antes de salvar, trocar de modo ou fechar a nota.

### Imagens e menu de inserção

Copie uma imagem e pressione **Ctrl+V** no editor formatado ou no modo Markdown. Ela é salva como anexo na biblioteca e incorporada ao texto, permanecendo disponível após fechar e reabrir a nota.

Digite **/** no começo de um bloco ou depois de um espaço para abrir o menu de inserção. Você pode procurar uma opção digitando, como **/ima**, e confirmar com Enter. O menu oferece imagem por arquivo, títulos, listas, tarefas, citação, código e divisória. Use as setas para escolher ou Escape para fechar.

Clique com o botão direito na imagem ou no botão de opções sobre ela. **Remover imagem do texto** permite desfazer; **Excluir imagem de todo o aplicativo** leva o arquivo da biblioteca à lixeira e retira suas referências dos textos e quadros. Na lixeira, você pode restaurar ou excluir definitivamente.

### Links e conexões

Digite `[[` no editor para procurar e vincular uma nota. Exemplo: `[[PSA]]`.

Use as conexões e backlinks para consultar os vínculos da nota. No whiteboard, a opção **Abrir nota ao lado** permite escrever enquanto acompanha o quadro.

Para consultar o Markdown de uma mídia, mantenha **Ctrl** sobre seu título. O leitor web também encaminha esse comando quando o foco está dentro da página.

### Pastas e propriedades

Use **Criar → Nova pasta** para organizar os arquivos. O menu de cada nota permite **Mover para pasta…**, tanto nos recentes quanto na biblioteca. A **Biblioteca de notas** reúne todas as notas principais e oferece busca, ordenação e filtros por propriedades.

As notas convencionais ficam reunidas na biblioteca, sem uma categoria separada para notas de mapas mentais. a barra lateral mostra somente as **Notas recentes**. Os caminhos antigos são preservados nos arquivos, enquanto o cabeçalho do editor oculta pastas técnicas como **Image Atlas → Mapas**. Notas novas criadas pelo editor, por nós do mapa ou por imagens usam a pasta configurada, normalmente **Notas**.

Use **Mover para pasta…** no botão direito para escolher uma pasta ou subpasta. O histórico de notas recentes acompanha a renomeação e movimentação dos arquivos e não muda quando uma nota é apenas editada.

Em **Propriedades**, você pode usar texto, seleção, seleção múltipla, status, listas, números, datas, caixas de seleção e tags. Há opções de cores para a organização visual.

Os índices técnicos dos whiteboards e as notas auxiliares das mídias ficam separados da biblioteca de notas principais.

## Estudar uma página, vídeo ou PDF

1. Abra um whiteboard.
2. Em **Adicionar**, escolha a opção de link, vídeo ou PDF.
3. Cole o endereço da página, YouTube, Spotify ou PDF. Para um arquivo local, use **Escolher PDF**.
4. Dê um nome à mídia e adicione ao quadro.
5. Use o menu do cartão para acessar resumo, propriedades, flashcards e mapa mental.

A mídia entra automaticamente na **Biblioteca de mídia**, onde você pode buscá-la e filtrar pelo tipo.

### Ler e escrever ao mesmo tempo

Abra a mídia em **Janela** ou **Ao lado** e clique em **Resumo**. A fonte e o editor ficam lado a lado para acompanhar a leitura ou reprodução enquanto escreve.

Páginas web, vídeos e PDFs também têm apresentação incorporada no quadro. A reprodução depende das permissões do serviço externo; **Abrir fonte** permite acessar o endereço original.

O zoom do quadro controla a apresentação do cartão. O zoom da página ou do PDF é um controle de leitura separado. O leitor web e o PDF utilizam renderização com mais resolução para melhorar a nitidez.

### Reutilizar uma mídia

Na Biblioteca de mídia, use **⋯ → Adicionar a outro whiteboard…**. A mídia também pode ser vinculada pelo seletor de notas existentes.

O vínculo inclui a fonte e o conteúdo de estudo da nota. Cada ocorrência mantém sua organização visual no respectivo quadro, enquanto o conteúdo e o FSRS continuam associados à mesma nota.

## Criar flashcards

Abra uma nota convencional ou de mídia e clique em **Flashcards**.

Você pode escrever em cartões numerados ou usar o formato:

```text
Pergunta == Resposta
```

Exemplo:

```text
Qual é a função de uma nota atômica? == Registrar uma ideia principal e conectá-la a outras notas.
O que é um whiteboard? == Um espaço visual para organizar notas e suas relações.
```

Para adicionar um conjunto de perguntas, use **Colar vários cartões**. Escolha a posição de inserção e confirme. Os cartões podem ser reordenados no editor.

Perguntas e respostas aceitam Markdown e links como `[[Nome da nota]]`. Durante a revisão, **Editar cartões** permite editar a questão que está sendo respondida.

Os blocos gerenciados de estudo ficam separados do resumo no editor. Use **Flashcards e mapa** quando quiser consultar esses blocos na nota.

## Revisar com FSRS

O FSRS calcula as próximas revisões a partir do estado e do histórico de cada cartão. Na interface de avaliação, você escolhe **Errei** ou **Acertei**.

1. Leia a pergunta.
2. Escreva uma tentativa de resposta, se desejar.
3. Clique em **Mostrar resposta** ou pressione **Ctrl+Enter**.
4. Compare as respostas e avalie o cartão.

O intervalo previsto aparece antes da avaliação. A configuração implementada prevê aproximadamente um dia para o primeiro acerto de um cartão novo; os próximos intervalos dependem do histórico.

### Estudar as notas de um quadro

Clique em **Estudar** no whiteboard. A tela reúne os temas das notas presentes no quadro e mostra quantos cartões estão disponíveis em cada um.

Você pode pesquisar um tema, ordenar pela organização do quadro, pelos primeiros adicionados ou pelos primeiros respondidos. Escolha uma nota ou use **Responder todos**.

A sessão do quadro considera cartões novos e revisões já vencidas, preservando o agendamento. Cartões futuros não entram automaticamente nessa fila.

### Navegação e revisões vinculadas

- Use **Questão anterior** e **Próxima questão** para navegar.
- A janela de revisão pode ser ampliada ou aberta em uma aba.
- Em links dentro dos flashcards, **Ctrl** permite consultar a prévia da nota.
- **Shift+clique** em um link abre a revisão dos flashcards daquela nota ao lado, quando ela possui cartões.

Na revisão de uma nota, **Todos** é uma revisão antecipada: avaliar esses cartões também atualiza o agendamento FSRS.

### Reiniciar uma sessão e resetar cartões

**Resetar progresso**, na revisão da nota, recomeça a sessão com todos os cartões e preserva o histórico FSRS.

**Resetar como novos**, na seleção de temas do quadro, reinicia o estado de agendamento dos cartões abrangidos pela confirmação. O histórico anterior é arquivado. Essa alteração afeta as mesmas notas em outros quadros, pois o agendamento pertence à nota.

## Buscar conteúdo

| Onde | O que procurar |
| --- | --- |
| Biblioteca de notas | Notas principais, pastas e propriedades. |
| Biblioteca de mídia | Fontes adicionadas aos quadros, por nome ou tipo. |
| Buscar nos mapas | Notas e mapas presentes nos whiteboards. |
| Seleção de temas | Uma nota específica para revisar seus flashcards. |

Para encontrar um assunto como Hematuria quando você não lembra em qual quadro está, use **Buscar nos mapas**.

## Excluir e restaurar

**Remover deste whiteboard** retira uma ocorrência visual; o item continua disponível na biblioteca.

**Excluir mídia de todo o aplicativo** move a mídia, seu Markdown e suas ocorrências nos quadros para a lixeira. PDFs importados e gerenciados pelo aplicativo acompanham essa exclusão. O arquivo original escolhido no computador fica separado da cópia importada.

Na **Lixeira**, você pode restaurar o conjunto ou excluir definitivamente. A restauração da mídia recupera a nota e os vínculos; seu histórico FSRS é preservado. A exclusão definitiva elimina os arquivos daquele item na lixeira.

As notas convencionais também podem ser excluídas pela biblioteca, pela barra lateral e pelas ações da própria nota.

## Atalhos principais

No painel **Ctrl+P**, escolha **Fechar todas as abas** para salvar e fechar notas, whiteboards e demais abas. **Fechar todas as notas** fecha apenas notas e leitores de mídia, mantendo os quadros abertos.

Os atalhos do mapa devem ser usados com o foco no whiteboard, fora de um campo de edição.

| Atalho | Contexto e ação |
| --- | --- |
| `Tab` | Criar um filho no mapa selecionado. |
| `Shift+Tab` | Escolher uma nota existente para um filho. |
| `Enter` | Criar um irmão no mapa. |
| `F2` | Renomear um nó. |
| `Ctrl+Shift+Enter` | Criar notas para o nó ou os nós selecionados. |
| `Shift+clique` | Adicionar ou remover um cartão da seleção do quadro. |
| `Alt+clique` | Abrir uma nota convencional do quadro ao lado. |
| `Ctrl+Enter` | Revelar a resposta durante a revisão de flashcards. |
| `Ctrl+O` | Busca rápida de notas convencionais e quadros. |
| `Ctrl+Shift+O` | Buscar notas e mapas nos whiteboards. |
| `Ctrl+\` | Mostrar ou ocultar a barra lateral. |
| `Ctrl+V` | Colar uma imagem no editor ou no whiteboard, conforme o foco. |
| `/` | Abrir o menu de inserção ao escrever no editor. |
| `Ctrl+P` | Abrir a lista de comandos. |
| `Ctrl+S` | Solicitar a gravação das alterações pendentes. |
| `Ctrl+Z` / `Ctrl+Shift+Z` | Desfazer / refazer no quadro. |

## Dados, importação e exportação

Por padrão, a biblioteca fica em `%APPDATA%/Image Atlas/libraries/default`. Após uma importação, a biblioteca ativa pode ficar em outra subpasta de `libraries`.

Os principais dados são:

- Notas em arquivos `.md`, com propriedades e referências de estudo.
- Whiteboards em arquivos `.imageboard`.
- Imagens e PDFs na estrutura de arquivos da biblioteca.
- Arquivos de apoio com catálogo de mídias, revisão FSRS e configurações.

**Importar biblioteca** copia uma biblioteca ou cofre selecionado para uma nova biblioteca do aplicativo. A importação preserva a estrutura e não modifica a pasta de origem; plugins de terceiros do Obsidian não são executados no Image Atlas.

Importação, exportação e lixeira ficam no menu **Biblioteca local**, no rodapé da barra lateral. O resumo do quadro acompanha seu arquivo `.imageboard`; a ordem da navegação é guardada em `.atlas-board-order.json` e acompanha a exportação completa da biblioteca.

**Exportar cópia** cria uma cópia independente da biblioteca para backup ou transferência. Para levar quadros, arquivos e histórico juntos, use a exportação completa.

Notas e revisões ficam no computador. Ao acessar páginas e players, o conteúdo é fornecido pelos respectivos serviços externos.

## Fluidez e critérios do desenvolvimento

A praticidade de estudo orienta o projeto: criar uma nota deve exigir poucos passos, o mapa precisa permanecer legível e os controles devem ficar acessíveis sem ocupar todo o quadro.

As otimizações recentes reduziram consultas ao zoom interno dos leitores durante as animações, reaproveitaram medidas de layout e evitaram reinstalar marcações em páginas sem mudanças. Também foram separados o conteúdo compartilhado da nota e o estado visual de cada ocorrência.

Os testes usam bibliotecas temporárias para verificar persistência, arquivos, exclusão/restauração, revisão e interações de interface. A prévia continua recebendo ajustes a partir do uso real.

## Desenvolvimento técnico

### Componentes principais

| Componente | Responsabilidade |
| --- | --- |
| Electron | Executar a interface e fornecer os recursos locais da aplicação Windows. |
| Motor Image Atlas | Mapas, cenas visuais e integração com o sistema de revisão. |
| Tiptap | Editor formatado e ferramentas de seleção. |
| Markdown, YAML e arquivos locais | Conteúdo das notas, propriedades e persistência. |
| FSRS | Cálculo do agendamento de revisões. |
| PDF.js | Leitura e renderização dos PDFs. |
| esbuild | Compilação da interface. |
| electron-builder / NSIS | Empacotamento e instalador Windows. |

### Preparar e executar

O desenvolvimento requer Windows 64 bits e Node.js 22.12 ou superior. Execute os comandos na pasta do aplicativo:

```powershell
npm ci
npm run dev
```

Outros comandos:

```powershell
npm run build   # Prepara o motor, a interface e os recursos
npm start       # Compila e abre o aplicativo
npm test        # Executa os testes unitários
npm run dist    # Gera o instalador na pasta release
```

O motor original precisa estar no projeto irmão `.obsidian/plugins/image-atlas`, conforme o caminho utilizado por `scripts/build.cjs`.

Os testes de interface estão em `tests/electron-*.cjs`. Eles dependem de Playwright e usam um caminho de runtime configurado neste ambiente; esse caminho precisa ser ajustado em outra máquina. `npm test` executa os testes unitários, não toda a bateria de interface.

### Estrutura do projeto

```text
image-atlas-desktop/
├── src/                  Interface, armazenamento e integrações
│   ├── main.cjs          Processo principal e operações locais
│   ├── preload.cjs       Ponte entre a interface e o processo principal
│   ├── renderer.js       Biblioteca e organização das abas
│   ├── compat.js         Interfaces utilizadas pelo motor original
│   ├── engine.cjs        Motor gerado pela compilação
│   └── ...               Editor, mídias, propriedades e whiteboard
├── scripts/              Compilação, desenvolvimento e empacotamento
├── resources/            Ícones, licenças e identificação da base
├── tests/                Testes unitários e de interface
├── dist/                 Interface e recursos compilados
└── release/              Instaladores para distribuição
```

`src/engine.cjs` é gerado a partir do plugin: suas adaptações devem ser mantidas no processo de compilação ou nos módulos do aplicativo. A compilação não redistribui o aplicativo Obsidian.

## Estado da distribuição

Esta versão é uma prévia Windows em evolução. As atualizações do programa instalado são manuais. Não há sincronização própria entre dispositivos, aplicativo móvel nativo, hospedagem web ou publicação em loja fornecidos por este instalador.

Para os registros de validação, consulte [VALIDACAO.md](VALIDACAO.md). As etapas para uma publicação em produção estão em [PUBLICACAO.md](PUBLICACAO.md).
