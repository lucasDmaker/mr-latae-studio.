(function(root){
  'use strict';
  const URL='https://mr-latae-api.18-lukas-daniel031099.workers.dev/';
  async function generate(input, token, fetcher=fetch) {
    if (!token) throw new Error('Informe a senha de acesso para usar Gemini.');
    try {
      const response=await fetcher(URL,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify(input),signal:AbortSignal.timeout(50000)});
      let data; try { data=await response.json(); } catch { throw new Error('A API retornou uma resposta inválida. Use o gerador local.'); }
      if (!response.ok) throw new Error(typeof data.error==='string' ? data.error : 'API indisponível. Use o gerador local.');
      const keys=['titles','hooks','script','scenes','caption','hashtags'];
      if (!data.content || !keys.every(k=>typeof data.content[k]==='string' && data.content[k].trim() && data.content[k].length<=24000)) throw new Error('Conteúdo incompleto. Use o gerador local.');
      return Object.fromEntries(keys.map(k=>[k,data.content[k]]));
    } catch(error) {
      if (error.name==='TimeoutError' || error.name==='AbortError') throw new Error('A API demorou a responder. Use o gerador local ou tente mais tarde.');
      if (error instanceof TypeError) throw new Error('Não foi possível conectar à API. Confira a internet ou use o gerador local.');
      throw error;
    }
  }
  if(typeof module!=='undefined' && module.exports) module.exports={generate}; else root.Gemini={generate};
})(globalThis);
