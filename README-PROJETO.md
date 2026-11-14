# Mr. Latae Studio

Aplicativo em português para preparar Instagram Reels e YouTube Shorts. HTML, CSS e JavaScript puro, sem instalação, frameworks, fontes externas, serviços pagos ou chamadas de IA. `index.html` está na raiz e os caminhos são relativos, compatíveis com GitHub Pages em subdiretórios.

## Como usar

1. Abra `index.html` no navegador ou acesse o endereço do site estático. No Android, prefira o endereço HTTPS no Chrome.
2. Digite o tema, selecione animais, mecânica, curiosidades ou outros, escolha Reels ou Shorts e 30, 45 ou 60 segundos.
3. Toque em **GERAR CONTEÚDO**. Cada geração cria um novo projeto com três títulos, três ganchos, roteiro, seis cenas, legenda e hashtags. Há três variações locais de abordagem, escolhidas aleatoriamente; elas podem se repetir.
4. Edite os campos diretamente. Substitua todos os trechos entre colchetes e pesquise informações em fontes confiáveis. Não há pesquisa automática, fatos científicos prontos nem garantia de duração: ensaie e cronometre a narração.
5. Marque as tarefas de produção. Alterações e checklist são salvos automaticamente no histórico.
6. Use **Copiar**, **Copiar tudo** ou **↓ TXT**. A cópia automática depende da permissão do navegador e geralmente de HTTPS. Se ela não funcionar, selecione o campo e use o menu Copiar do celular ou exporte em TXT.
7. Toque no nome de um projeto recente para reabri-lo. **Excluir** pede confirmação antes de removê-lo.

Sem projeto aberto, o checklist fica desativado. O formulário configura a próxima geração; para mudar os metadados de um projeto, gere um novo conteúdo.

## Exemplos de temas

- Animais: “Por que os gatos amassam pãozinho?” — pesquise a explicação em fontes veterinárias antes de preencher o roteiro.
- Mecânica: “Como consultar a pressão recomendada dos pneus?” — consulte o manual do veículo; não invente uma pressão universal.
- Curiosidades: “Como conferir a origem de uma foto viral?”
- Outros: “Meu processo para organizar a bancada de trabalho”.

## Personalizar os modelos

Em `core.js`, edite `openings`, `middles`, `angles` e o objeto `content` da função `generate`. O objeto `niches` contém orientações e hashtags por nicho; `tasks` contém as seis tarefas. Os textos gerados também são editáveis pela interface, sem alterar código.

## Dados e limites

O histórico usa a chave `mr-latae-studio-v1` do `localStorage` e mantém os 50 projetos mais recentes. Não há login, sincronização, rastreamento ou envio de dados. Limpar os dados do navegador, mudar de endereço/origem ou usar navegação privada pode remover ou separar o histórico. Exporte em TXT como cópia de segurança. Se o armazenamento estiver bloqueado ou cheio, um aviso orientará a exportação; o projeto atual continua editável durante a sessão. Exportações TXT são para consulta e não podem ser reimportadas nesta versão.

## Testes sem instalar pacotes

Com Node.js 18 ou superior já disponível:

```sh
node tests/core.test.js
node --check core.js
node --check app.js
```

São seis testes que cobrem as 24 combinações de opções, tempos das cenas, variações, validação de entradas, texto potencialmente malicioso tratado como texto, persistência de edições e checklist, histórico inválido, falha de armazenamento, limite de projetos e exportação.

Verificação manual no Android: gerar, editar, marcar tarefas, recarregar, reabrir o projeto, copiar, exportar e excluir. Confira ausência de rolagem horizontal e navegação por teclado em telas maiores. O aplicativo não precisa de Node.js para funcionar.

## Revisar e disponibilizar no GitHub Pages

Nenhuma publicação automática é configurada. Revise estes arquivos em uma branch e abra um pull request no seu repositório. Após aprovação, se desejar publicar, escolha a branch e a pasta raiz em **Settings → Pages → Deploy from a branch**. Não é necessário um processo de build.

Arquivos:

- `index.html`: estrutura acessível, formulário, resultados, checklist e histórico.
- `styles.css`: tema escuro com azul e adaptação para celular.
- `core.js`: modelos locais, validação, armazenamento e exportação textual.
- `app.js`: interação com a interface, edição, cópia e download.
- `tests/core.test.js`: testes com ferramentas nativas do Node.js.
- `REVIEW.md`: resumo e roteiro de revisão.

Para servir localmente, opcionalmente use `python3 -m http.server 8000` e abra `http://localhost:8000`. Não há instalação de dependências.
