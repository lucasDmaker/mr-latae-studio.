# Do roteiro ao MP4 — guia pelo celular

## O que está pronto no código

O botão **CRIAR VÍDEO COM IA** envia o roteiro revisado e seis descrições a um servidor de montagem. A Gemini cria uma narração em português e seis imagens. O FFmpeg aplica movimento suave às imagens e monta um MP4 vertical **720 × 1280**, H.264, áudio AAC, de **30, 45 ou 60 segundos**, com legendas. Não há gravação de pessoas nem filmagem real: são imagens geradas com movimento.

O aplicativo, o gerador local e o Worker de roteiros continuam funcionando. **Você não precisa substituir novamente o código do Worker.** A montagem usa um serviço separado porque GitHub Pages não executa FFmpeg e um Worker comum não é um servidor de renderização.

Nenhum serviço foi contratado, nenhuma conta foi criada e nada foi publicado automaticamente. Esta alteração deve ser revisada antes do merge. As instruções abaixo são ações manuais que você executa quando quiser disponibilizar a função.

## Antes de começar: conta e custos

Você precisará de uma conta de hospedagem para executar o servidor. Este guia usa **Render**, acessível pelo navegador do Android. O arquivo `render.yaml` deixa o serviço preparado para implantação, mas não cria recursos sozinho.

Use os valores existentes de **GEMINI_API_KEY** e **APP_ACCESS_TOKEN**, inseridos somente nos campos privados do Render. Não precisa criar novas chaves. A Cloudflare não permite recuperar o valor de um Secret já salvo; use sua cópia original guardada com segurança. Não coloque os valores no GitHub nem envie ao assistente.

A chave precisa ter acesso aos modelos **gemini-2.5-flash-image** e **gemini-2.5-flash-preview-tts**. Os nomes ficam configuráveis no Render como `IMAGE_MODEL` e `VOICE_MODEL`. A conta/chave pode precisar de faturamento ou permissão para imagem e voz. A chave que funciona para roteiros não comprova acesso a esses outros modelos. A disponibilidade real não foi verificada e os testes não consumiram sua cota. Confira acesso e preços na documentação oficial: https://ai.google.dev/gemini-api/docs/pricing e https://ai.google.dev/gemini-api/docs/models.

**Cada vídeo solicita uma narração e até seis imagens**, além da geração do roteiro feita anteriormente. Há consumo mesmo quando a montagem falha ou você não baixa o vídeo. Não existe garantia de gratuidade. Não ative um plano pago se não quiser assumir o custo. O código não faz tentativas automáticas de gerar novamente.

## 1. Atualizar o aplicativo

1. Abra o Pull Request desta alteração no GitHub e revise os arquivos. Se ainda não existir, abra a comparação da branch `feat/ai-video` com `main` e toque em **Create pull request**.
2. Quando desejar atualizar seu site, toque em **Merge pull request → Confirm merge**. Isso pode iniciar a publicação do GitHub Pages conforme a configuração do seu repositório.
3. Aguarde a conclusão em **Actions** no GitHub. Abra o aplicativo e recarregue. Em um projeto aberto, abaixo dos resultados aparecerá **Criar vídeo com IA**.

## 2. Criar o servidor pelo Android

1. No Chrome, abra **https://dashboard.render.com**. Crie sua conta ou entre na existente. Se a interface não couber, ative **⋮ → Para computador** e gire o celular na horizontal.
2. Toque em **New + → Blueprint**. Conecte o GitHub e escolha **lucasDmaker/mr-latae-studio.**. Autorize somente o repositório necessário.
3. Escolha a branch **main**, após o merge acima. Se pedir o caminho do Blueprint, use **render.yaml**, na raiz.
4. Confira o serviço **mr-latae-video**. O arquivo seleciona um plano **free** e deixa implantações automáticas desligadas. Leia o resumo de custos apresentado pelo Render antes de confirmar. Se o plano gratuito não estiver disponível, pare e decida se aceita um plano pago; isso não é obrigatório para manter seu aplicativo atual funcionando.
5. Nos campos privados de ambiente solicitados, coloque os valores existentes de **GEMINI_API_KEY** e **APP_ACCESS_TOKEN**. Não use a senha da conta Google ou da Cloudflare. Não altere os modelos, a menos que sua conta exija um modelo compatível diferente.
6. Toque em **Deploy Blueprint / Apply** quando estiver de acordo. Isso cria o serviço e inicia o build do Docker. Aguarde aparecer **Live**. O download do FFmpeg e das dependências pode levar alguns minutos.
7. Abra o serviço e copie seu endereço HTTPS, parecido com **https://mr-latae-video-xxxx.onrender.com**. Use o endereço real que o Render mostrar, não esse exemplo.
8. Acrescente `/health` ao endereço para conferir: deve aparecer `{"ready": true}`. Isso verifica a configuração básica e a presença de FFmpeg, **não** testa acesso real à Gemini nem faz chamada paga.

Se a tela Blueprint não estiver disponível na sua conta, use **New + → Web Service → conectar repositório**, branch `main`, linguagem/runtime **Docker**, **Root Directory: video-service**, **Dockerfile Path: ./Dockerfile**, plano escolhido conscientemente e as quatro variáveis descritas acima. A porta vem da variável `PORT` fornecida pelo Render; não precisa configurar build ou start commands externos ao Dockerfile. Em **Settings**, desative **Auto-Deploy** para manter atualizações manuais.

## 3. Criar seu primeiro vídeo

1. Abra **https://lucasdmaker.github.io/mr-latae-studio./**. Gere um roteiro com Gemini como você já fez.
2. Revise os fatos. No bloco **Criar vídeo com IA**, cole o endereço do Render em **Endereço do seu servidor de vídeo** (somente `https://...onrender.com`, sem `/health`).
3. Digite a senha existente **APP_ACCESS_TOKEN** no campo **Senha de acesso ao servidor de vídeo**. Endereço e senha ficam apenas na memória dessa página; não são gravados no histórico ou em TXT.
4. Em **Narração do vídeo**, deixe somente as palavras que devem ser faladas. Retire instruções de edição, horários, títulos e marcadores. Sugestão: aproximadamente 60 palavras para 30 segundos, 90 para 45 e 120 para 60. A voz pode precisar de ajustes de velocidade.
5. Abra **Revisar as seis imagens**. Você pode melhorar a descrição de cada cena, sem perder o assunto do roteiro. As imagens são criadas de forma independente; continuidade visual de personagem não é garantida.
6. Marque a autorização de consumo depois de revisar. Toque em **CRIAR VÍDEO COM IA** uma vez.
7. Mantenha a página aberta e o celular ativo. A tela informa a geração da voz, das seis imagens e a montagem. Pode levar vários minutos, principalmente no plano gratuito. Fechar ou recarregar perde o acompanhamento nesta versão e não cancela o processamento nem o consumo.
8. Quando aparecer **BAIXAR MP4**, toque no botão. Confira a pasta **Downloads** do Android. O arquivo fica disponível no servidor por cerca de uma hora; reiniciar o serviço pode removê-lo antes. Assista, confira narração, imagens e legendas e só depois publique na sua rede social. O aplicativo não publica em redes sociais.

## Limites e mensagens

- **Senha incorreta:** confira o mesmo valor de APP_ACCESS_TOKEN no servidor de vídeo e no campo do aplicativo. Seu Worker de roteiros pode continuar funcionando mesmo com o Render mal configurado.
- **Modelo não disponível / Gemini recusou:** confira acesso, faturamento e nomes dos modelos no Render. Nunca cole um erro contendo dados privados em um repositório público.
- **Cota atingida:** aguarde ou confira as cotas Google. A aplicação não contrata um plano e não troca de modelo automaticamente.
- **Servidor indisponível:** confira o endereço, o status Live e se `/health` responde. Servidores gratuitos podem adormecer e demorar para iniciar.
- **Narração longa/curta:** reduza ou amplie o texto. O áudio precisa ter entre metade e o dobro da duração selecionada; fora disso, o serviço interrompe antes de gerar as imagens. A voz já solicitada pode ter consumido cota.
- **Falha de montagem / reinicialização:** o plano gratuito tem recursos limitados, pode dormir e não é uma garantia de processamento contínuo. Confira os logs do serviço (o código não registra senhas nem roteiros). Se precisar de mais recursos, a escolha de um plano pago é sua. Não reenvie uma geração sem considerar novas cobranças.

Há **um trabalho de cada vez** e **até três solicitações de vídeo por hora no servidor**, inclusive tentativas que falham. A contagem fica no disco do serviço; um disco efêmero pode ser apagado por uma nova implantação. Isso não é limite global de faturamento: configure suas cotas na Google. Execute somente uma instância e um processo desse servidor. O disco mantém temporariamente as mídias; os arquivos são excluídos quando vencidos durante próximas consultas/solicitações e na inicialização do serviço. Uma rotina externa de retenção estrita não está incluída.

As legendas são divididas em pequenos blocos e distribuídas proporcionalmente ao texto; **não têm sincronização palavra por palavra**. A voz é ajustada para caber na duração e pode soar diferente se o roteiro estiver muito longo. Não há música de fundo nesta versão.

O serviço aceita somente a origem do seu GitHub Pages no navegador e exige senha para criar, consultar ou baixar vídeos. Quem tiver a senha compartilhada poderá acessar os trabalhos dessa instalação. CORS não é autenticação. Narração e descrições são enviadas ao Google; imagens, áudio e MP4 passam pelo Render. Evite dados privados. As credenciais ficam em variáveis privadas do servidor e em memória no navegador.

## Verificação realizada e manutenção

- Testes JavaScript: `node --test tests/*.test.js`.
- Testes do servidor: instale `video-service/requirements.txt`, FFmpeg e a fonte DejaVu Sans; execute `python3 -m unittest discover -s video-service -v`.
- Os testes usam respostas de IA simuladas. Um teste monta **um MP4 real de 30 segundos** com seis imagens artificiais e áudio sintético e verifica resolução, duração e presença de áudio com FFprobe. Não consome créditos.
- O fluxo de celular também foi verificado com Chromium e respostas simuladas: geração local/Gemini, campo de senha, seis cenas, autorização, download e ausência de rolagem horizontal. Teste opcional para quem tiver Playwright e Chromium instalados: `python3 tests/video-browser.py`.
- Acesso real aos modelos e implantação na sua conta ainda precisam dos passos manuais acima. Não foi feito vídeo real usando sua chave.
- Futuras mudanças no servidor exigem **Manual Deploy** no Render. Mudanças no Worker continuam sendo publicadas separadamente na Cloudflare.
