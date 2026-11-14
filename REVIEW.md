# Revisão — Mr. Latae Studio

## Mudança proposta

Cria um site estático em português para transformar um tema em um plano editável de Reels ou Shorts. Inclui três títulos, três ganchos, roteiro dividido em introdução, desenvolvimento e encerramento, seis cenas com tempos, legenda, hashtags, checklist, histórico local, cópia e exportação TXT.

Os modelos são locais, sem IA generativa ou dependências externas. As explicações factuais são espaços de preenchimento identificados para pesquisa. A interface informa que a duração precisa ser conferida com leitura cronometrada.

## Validação executada

- `node tests/core.test.js`: seis testes aprovados, incluindo todas as 24 combinações de nicho/formato/duração.
- `node --check core.js` e `node --check app.js`: sintaxe válida.
- Chromium automatizado com Playwright já disponível no ambiente, sem instalar pacotes: geração, edição, persistência após recarga, checklist, download TXT, exclusão e tema contendo HTML exibido como texto.
- Layout sem transbordamento horizontal em 390 e 1440 pixels. Nenhum erro JavaScript durante o fluxo.

O Playwright foi usado apenas na verificação do ambiente e não é dependência do projeto. A cópia via permissão de clipboard e a experiência em um aparelho Android físico ainda precisam de conferência manual.

## Como revisar

1. Abra `index.html` ou sirva os arquivos em HTTP local.
2. Gere um projeto com um dos exemplos do README.
3. Revise os avisos, edite os textos e marque tarefas.
4. Recarregue e abra o projeto no histórico; confira as alterações.
5. Exporte em TXT e verifique acentos, conteúdo e tarefas.
6. Confira o fluxo em Chrome para Android, incluindo permissões de cópia e download.

## Entrega ao GitHub

O diretório fornecido não contém um repositório Git válido (`git status` informa “not a git repository”). Portanto, não foram criados commit, branch ou pull request. Os sete arquivos do projeto estão preparados para inclusão em uma branch do repositório correto. Nenhum site foi publicado e nenhum envio remoto foi realizado.

Título sugerido para o pull request: **Cria Mr. Latae Studio com modelos locais para Reels e Shorts**.

Descrição sugerida: Implementa planejamento editável de vídeos curtos com checklist e histórico local, cópia e exportação TXT. Interface responsiva em português, sem dependências ou IA generativa, com instruções de verificação factual. Validação: seis testes nativos do Node.js e fluxo automatizado no Chromium em telas de celular e desktop.
