# Gemini no Mr. Latae Studio

Esta alteração não publica o aplicativo nem o Worker automaticamente. Não crie novas chaves. Use os dois Secrets que você já cadastrou: `GEMINI_API_KEY` e `APP_ACCESS_TOKEN`.

## Publicar o Worker pelo Android

1. No Chrome do celular, abra `https://dash.cloudflare.com` e entre na sua conta. Se os botões ficarem escondidos, abra o menu ⋮ do Chrome e marque **Para computador**. Você pode girar o celular na horizontal.
2. Entre em **Workers & Pages** (pode aparecer dentro de **Compute**). Toque no Worker **mr-latae-api**. Confira o endereço `mr-latae-api.18-lukas-daniel031099.workers.dev` para não alterar outro serviço.
3. Em **Settings → Variables and Secrets**, confira somente os nomes `GEMINI_API_KEY` e `APP_ACCESS_TOKEN`. Não copie nem compartilhe os valores. O código usa esses Secrets no servidor; não é necessário cadastrá-los no GitHub.
4. Nesta branch/PR do GitHub, abra o arquivo **cloudflare-worker.js**. Toque em **Raw** (arquivo bruto) ou no botão de copiar. Copie TODO o conteúdo, do primeiro comentário até o último `};`. Se estiver usando seleção de texto no Android, pressione o texto e escolha **Selecionar tudo → Copiar**.
5. Volte ao Worker na Cloudflare e toque em **Edit code / Editar código**. Antes de substituir, guarde uma cópia do código antigo em um local privado para poder voltar atrás. No editor do arquivo principal (geralmente `worker.js`), selecione todo o código antigo e cole o conteúdo de `cloudflare-worker.js`. O arquivo usa o formato de módulo, com `export default`.
6. Confira se o início e o final foram colados. Toque em **Deploy / Implantar** e confirme a publicação quando estiver pronto. Este é o passo que coloca o novo Worker no ar. A interface pode mudar de idioma ou posição.
7. Não use o painel de teste com a senha em um endereço ou parâmetro de URL. O Worker só aceita a origem do site. Abrir o endereço do Worker diretamente pode mostrar “Origem não autorizada”; isso é esperado.

## Disponibilizar o aplicativo

Revise o Pull Request antes de fazer o merge. Ao integrar à branch configurada no GitHub Pages, o GitHub poderá publicar o site automaticamente conforme a configuração atual do seu repositório. O Worker é publicado separadamente pelos passos acima. Nenhuma dessas publicações foi executada pelo assistente.

Depois das duas publicações:

1. Abra `https://lucasdmaker.github.io/mr-latae-studio./` e recarregue a página.
2. Preencha tema, nicho, plataforma e duração normalmente.
3. Em **Como gerar?**, selecione **Gemini**.
4. No campo de senha, digite o valor que você já escolheu para `APP_ACCESS_TOKEN`. É a senha de acesso ao seu Worker, não a chave da Gemini. Não envie essa senha para o GitHub ou para o chat.
5. Toque em **GERAR CONTEÚDO**. Uma geração bem-sucedida faz uma chamada real e pode consumir a cota da sua conta Google. Faça esse teste somente quando desejar.
6. Se a API falhar, o aviso permanece visível e oferece **Gerar com modelo local**. Não há troca automática silenciosa. Histórico, edição, checklist, cópia e TXT continuam disponíveis.

A senha fica no campo da página em memória; não vai para localStorage, sessionStorage, histórico, exportação ou URL. Ela é apagada ao sair da página. O navegador ou gerenciadores de senha externos ainda podem oferecer preenchimento próprio. O tema e as opções são enviados ao Worker e à Google somente ao escolher Gemini. O conteúdo gerado continua salvo no histórico local como antes.

## Modelo, cota e proteção

O código solicita exatamente `gemini-3.5-flash-lite`. A disponibilidade desse identificador e de uma cota gratuita depende da API e da sua conta Google. Os testes simulados não confirmam disponibilidade real. Se aparecer “modelo não disponível”, confira os modelos disponíveis no Google AI Studio/documentação oficial. Não substituímos o modelo por outro sem avisar. Uma eventual troca exige alterar a constante `MODEL` no Worker e publicar novamente.

O Worker aceita apenas POST JSON de até 4 KB, tema de até 180 caracteres e opções conhecidas. Ele exige `Authorization: Bearer ...`, mantém a chave Gemini no servidor, restringe CORS a `https://lucasdmaker.github.io`, limita o tempo da chamada e valida o conteúdo recebido. Essa origem inclui outros projetos do mesmo usuário no GitHub Pages, pois CORS não separa caminhos. CORS não substitui a senha e não impede chamadas feitas fora de navegadores por quem conhece a senha.

Há limite básico de **5 tentativas autenticadas por minuto por instância do Worker**, compartilhadas entre os usuários. Reinicializações ou múltiplas instâncias podem permitir mais chamadas; ele não é um contador global persistente nem uma garantia contra cobranças. Não há cadastro ou banco de dados adicional obrigatório. Para proteção adicional, o código aceita um binding opcional de Rate Limiting chamado `RATE_LIMITER`, se disponível na sua conta; configure sua política na Cloudflare. Mesmo esse serviço tem escopo definido pela Cloudflare e não substitui limites de uso/cobrança da Google. Configure as cotas adequadas na sua conta Google antes de compartilhar a senha. O código não promete uso gratuito.

Erros de senha, excesso de chamadas, cota Gemini (429), modelo inexistente (404), falhas de conexão e respostas incompletas recebem mensagens em português. Nenhum corpo de erro da Google, senha ou chave é retornado ao aplicativo ou registrado pelo código. O histórico continua sendo texto editável: revise fatos e cronometre a narração, mesmo com IA.

## Testes sem créditos

Na raiz do repositório, com Node.js 18 ou superior:

```sh
node --test tests/*.test.js
node --check app.js
node --check gemini.js
node --check cloudflare-worker.js
```

Os testes substituem as chamadas externas por respostas simuladas e usam credenciais fictícias. Cobrem o gerador anterior, CORS, senha, métodos HTTP, tamanho/validação do JSON, respostas estruturadas, erros Gemini, limite, binding opcional e falhas do cliente. Não publicam nada e não acessam a API real. A verificação visual no Android e a disponibilidade real do modelo ainda precisam ser verificadas após a publicação manual.
