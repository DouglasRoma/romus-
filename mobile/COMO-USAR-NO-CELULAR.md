# ROMUS Mobile — Guia Completo de Uso no Celular

O **ROMUS Mobile** é a réplica 100% fiel e completa do ROMUS de computador, especialmente adaptado e otimizado para celulares (Android e iOS).

**Absolutamente nenhuma funcionalidade foi omitida:**
- 🗺️ **Whiteboards Infinitos:** Navegação com gestos de toque e pinça (*pinch-to-zoom*), mapas mentais e cartões visuais.
- 📝 **Editor Markdown & TipTap:** Formatação rica, links `[[Nota]]`, marca-texto inteligente com contraste automático, tabelas e tarefas.
- ⚡ **Flashcards FSRS:** Revisão ativa espaçada no celular com botões grandes de toque ("Errei" e "Acertei"), edição de cartões em tempo de revisão e desfazer remoção.
- 🎯 **Quizzes Markdown:** Prática de questões com alternativas embaralhadas, validação e explicações.
- 🔍 **Omnisearch Local:** Busca instantânea por título e conteúdo com MiniSearch em Web Worker.
- 📄 **Leitor de Mídia & PDFs:** Abertura integrada de PDFs, YouTube, Spotify e imagens com anotações.
- 💾 **100% Offline & Local:** Armazenamento seguro no aparelho via IndexedDB, sem dependência de nuvem de terceiros.

---

## Como Abrir e Instalar no Celular Agora Mesmo

### Passo 1: Iniciar o Servidor Móvel no Computador
No terminal da pasta do projeto, execute:
```bash
node mobile/server.mjs
```
O terminal exibirá o endereço IP local da sua rede Wi-Fi, por exemplo:
`http://192.168.0.6:3000`

---

### Passo 2: Acessar no Celular (Mesma rede Wi-Fi)
1. No seu celular (conectado ao mesmo Wi-Fi do computador), abra o navegador (**Google Chrome** no Android ou **Safari** no iPhone).
2. Digite o endereço indicado pelo terminal (ex: `http://192.168.0.6:3000`).
3. O ROMUS Mobile carregará instantaneamente!

---

### Passo 3: Instalar como Aplicativo Nativo (PWA)
Você não precisa usar o ROMUS dentro de uma aba de navegador com barras de pesquisa:
- **No Android (Chrome):**
  Toque nos **três pontinhos (⋮)** no canto superior direito e selecione **"Instalar aplicativo"** ou **"Adicionar à tela inicial"**.
- **No iPhone (Safari):**
  Toque no botão de **Compartilhar (quadrado com seta para cima)** e selecione **"Adicionar à Tela de Início"**.

Pronto! Um ícone com a marca do **ROMUS** aparecerá na tela do seu celular. Ao tocar nele, o aplicativo abre em **tela cheia real**, sem barras de navegador, comportando-se exatamente como um aplicativo nativo da Play Store / App Store, funcionando inclusive **offline**!

---

## Como Trazer Suas Notas do PC para o Celular

Criamos um sincronizador direto via Wi-Fi:
1. No ROMUS Mobile no seu celular, toque no botão flutuante **(+)** no canto inferior direito.
2. Toque em **"📥 Baixar Notas do Computador (Sync Wi-Fi)"**.
3. O celular conectará diretamente ao servidor do seu computador e baixará todas as notas, whiteboards, flashcards e anexos direto para o banco de dados do celular.
4. Alternativamente, você pode usar **"💾 Exportar Backup das Notas"** e **"📂 Importar Backup"** para transferir arquivos de backup em formato JSON/ZIP quando quiser.

---

## Gestos e Controles no Celular

| Gesto / Ação | O que faz no Celular |
| :--- | :--- |
| **Pinça com 2 dedos (*Pinch-to-zoom*)** | Aproxima ou afasta o Whiteboard suavemente a 60 fps. |
| **Arrastar com 1 dedo no espaço vazio** | Movimenta a câmera pelo quadro infinito (*pan*). |
| **Duplo toque no texto de um cartão** | Abre o editor diretamente dentro do cartão para alteração rápida. |
| **Toque longo (segurar 0.5s)** | Abre o menu contextual com opções daquele nó ou do quadro. |
| **Barra Inferior (Dock)** | Alterna rapidamente entre **Quadro**, **Nota**, **Revisão FSRS**, **Busca** e **Menu/Arquivos**. |

---

## Como Gerar um APK Instalável para Android (Opcional via Capacitor)

Se você preferir gerar um arquivo `.apk` para instalar diretamente no Android:
1. Instale o Capacitor na pasta:
   ```bash
   npm install @capacitor/core @capacitor/cli @capacitor/android
   ```
2. Inicialize o projeto apontando para a pasta `mobile/dist`:
   ```bash
   npx cap add android
   npx cap sync
   npx cap open android
   ```
3. O Android Studio abrirá o projeto pronto. Basta clicar em **Build > Build Bundle(s) / APK(s) > Build APK(s)** para gerar seu instalador `.apk`.
