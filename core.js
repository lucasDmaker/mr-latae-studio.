(function (root) {
  'use strict';
  const KEY = 'mr-latae-studio-v1';
  const niches = { animais: ['Animais', '#Animais #MundoAnimal', 'Use imagens respeitosas; não provoque nem coloque animais em risco.'], mecanica: ['Mecânica', '#Mecanica #Oficina', 'Confira o manual e consulte um profissional. Não execute procedimentos perigosos para gravar.'], curiosidades: ['Curiosidades', '#Curiosidades #Aprender', 'Confira fontes confiáveis e diferencie hipótese de fato.'], outros: ['Outros', '#Conteudo #Criatividade', 'Pesquise o assunto e registre as fontes utilizadas.'] };
  const tasks = ['Pesquisar e verificar as informações', 'Revisar e personalizar o roteiro', 'Separar imagens e conferir direitos de uso', 'Gravar a narração e as cenas', 'Editar, legendar e revisar o vídeo', 'Publicar e acompanhar os resultados'];
  const fields = { titles: '3 opções de título', hooks: '3 opções de gancho', script: 'Roteiro', scenes: '6 sugestões de cenas', caption: 'Legenda', hashtags: 'Hashtags' };
  function generate(input, variant = Math.floor(Math.random() * 3)) {
    const theme = String(input.theme || '').trim();
    if (!theme || theme.length > 180) throw new Error('Digite um tema de 1 a 180 caracteres.');
    if (!Object.hasOwn(niches, input.niche) || !['Reels', 'Shorts'].includes(input.format) || ![30,45,60].includes(Number(input.duration))) throw new Error('Selecione um nicho, formato e duração válidos.');
    const duration = Number(input.duration), intro = Math.round(duration * .2), end = duration - Math.round(duration * .15);
    const angles = ['Um olhar mais atento', 'Do básico ao detalhe', 'Uma pergunta para começar'];
    const v = ((Number(variant) || 0) % 3 + 3) % 3;
    const openings = [`Você já parou para observar: ${theme}?`, `Vamos olhar de perto para este tema: ${theme}.`, `O que você gostaria de entender sobre ${theme}?`];
    const middles = ['Apresente uma observação e explique seu contexto.', 'Comece por uma pergunta frequente e desenvolva uma resposta.', 'Compare uma impressão inicial com o que as fontes consultadas mostram.'];
    return { id: globalThis.crypto?.randomUUID?.() || `projeto-${Date.now()}-${Math.random().toString(36).slice(2)}`, createdAt: new Date().toISOString(), theme, niche: input.niche, format: input.format, duration, checklist: tasks.map(() => false), content: {
      titles: [`${theme}: por onde começar?`, `${angles[v]} sobre ${theme}`, `Vamos entender ${theme}?`].map((s,i)=>`${i+1}. ${s}`).join('\n'),
      hooks: [openings[v], `Uma pergunta rápida: o que você sabe sobre ${theme}?`, `Antes de falar de ${theme}, vale conferir este ponto: [inserir informação verificada].`].map((s,i)=>`${i+1}. ${s}`).join('\n'),
      script: `INTRODUÇÃO · 0–${intro}s\n${openings[v]} [Escolha um gancho e apresente a pergunta central.]\n\nDESENVOLVIMENTO · ${intro}–${end}s\n${middles[v]} [PESQUISAR: inserir explicação confirmada e fonte.] Mostre [exemplo verificável relacionado ao tema]. ${duration >= 45 ? 'Acrescente [um detalhe confirmado e sua fonte]. ' : ''}${duration === 60 ? 'Explique [um limite ou contexto importante, com fonte]. ' : ''}\n\nENCERRAMENTO · ${end}–${duration}s\n[Resuma a ideia verificada em uma frase.] Qual parte de ${theme} você quer explorar depois? ${input.format === 'Reels' ? 'Salve este Reels para consultar depois.' : 'Inscreva-se para acompanhar os próximos Shorts.'}\n\nANTES DE GRAVAR\n${niches[input.niche][2]} Leia em voz alta e ajuste para ${duration} segundos; este modelo não garante o tempo de fala.`,
      scenes: Array.from({length:6},(_,i)=>{const ideas=[`Plano de abertura relacionado a ${theme}; exiba a pergunta central.`, 'Apresente o contexto com uma imagem de sua autoria ou licenciada.', 'Mostre um detalhe que ilustre a explicação já verificada.', 'Use texto curto na tela para destacar [ponto confirmado].', 'Mostre [exemplo verificado] e indique a fonte na tela.', 'Retome a pergunta inicial e mostre a chamada para ação.'];return `${i+1}. ${Math.round(i*duration/6)}–${Math.round((i+1)*duration/6)}s · ${ideas[i]}`;}).join('\n\n'),
      caption: `Vamos conversar sobre ${theme}?\n\n[Escreva aqui um resumo com informações verificadas.]\nFontes: [inserir referências consultadas].\n\nQual é a sua dúvida sobre o assunto? Conte nos comentários.\n\n${niches[input.niche][2]}`,
      hashtags: `${niches[input.niche][1]} ${input.format === 'Reels' ? '#Reels #InstagramReels' : '#Shorts #YouTubeShorts'} #MrLataeStudio\n[Adicione hashtags específicas e relevantes após revisar o tema.]`
    }};
  }
  function valid(p) { return p && typeof p.id === 'string' && typeof p.theme === 'string' && p.theme.length <= 180 && Object.hasOwn(niches,p.niche) && ['Reels','Shorts'].includes(p.format) && [30,45,60].includes(p.duration) && typeof p.createdAt === 'string' && !Number.isNaN(Date.parse(p.createdAt)) && p.content && Object.keys(fields).every(k=>typeof p.content[k]==='string') && Array.isArray(p.checklist) && p.checklist.length===tasks.length && p.checklist.every(x=>typeof x==='boolean'); }
  function read(storage) { const raw = storage.getItem(KEY); if (!raw) return []; const data=JSON.parse(raw); if(!Array.isArray(data)) throw new Error('Histórico inválido.'); return data.filter(valid).slice(0,50); }
  function save(storage, projects) { storage.setItem(KEY, JSON.stringify(projects.slice(0,50))); }
  function toText(p) { return `MR. LATAE STUDIO\n${p.theme}\n${niches[p.niche][0]} · ${p.format} · ${p.duration}s\n\n${p.source === 'gemini' ? 'GERADO COM GEMINI — REVISE OS FATOS' : 'MODELO LOCAL — SEM IA GENERATIVA'}\nPesquise e verifique os fatos. Substitua os trechos entre colchetes.\n\n` + Object.entries(fields).map(([k,label])=>`${label.toUpperCase()}\n${p.content[k]}`).join('\n\n') + '\n\nCHECKLIST\n' + tasks.map((task,i)=>`[${p.checklist[i]?'x':' '}] ${task}`).join('\n'); }
  const api={KEY,niches,tasks,fields,generate,valid,read,save,toText};
  if(typeof module !== 'undefined' && module.exports) module.exports=api; else root.Studio=api;
})(globalThis);
