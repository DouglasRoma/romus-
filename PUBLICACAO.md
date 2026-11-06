# Publicação e distribuição

O instalador de teste está preparado para distribuição privada. Não há submissão automática nem conta de desenvolvedor configurada neste projeto.

## Antes da versão de produção

1. Confirmar nome comercial, identidade legal do editor, contato de suporte e direitos de distribuição.
2. Completar os testes de aceitação de `VALIDACAO.md`.
3. Definir uma política de atualização, com pacotes e metadados assinados se houver atualizador próprio.
4. Publicar política de privacidade e página de suporte reais.
5. Assinar o instalador e os executáveis ou preparar a identidade de um pacote MSIX para a loja.
6. Preparar a ficha da loja, classificação etária, capturas, ícones e informações sobre dados.
7. Submeter pelo Partner Center e concluir os testes de certificação.

O ícone original está em `resources/icon.png` e `resources/icon.ico`. O identificador `com.douglas.imageatlas` é provisório; o nome de editor de um pacote MSIX precisa corresponder à identidade real da conta de publicação.

## Documentação oficial consultada

- [Segurança no Electron](https://www.electronjs.org/docs/latest/tutorial/security)
- [Caminhos de distribuição Windows](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/choose-distribution-path)
- [Requisitos de aplicativos MSI/EXE na Microsoft Store](https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msi/app-package-requirements)
- [Publicar o primeiro aplicativo Windows](https://learn.microsoft.com/windows/apps/publish/publish-first-app)

Não se deve apresentar o instalador não assinado desta prévia como um aplicativo já aprovado pela Microsoft Store.
