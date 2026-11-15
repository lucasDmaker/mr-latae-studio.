(function(root){
  'use strict';
  function scenesFrom(text) {
    const parts=text.split(/(?:^|\n)\s*\d+[.)]\s+/).map(s=>s.trim()).filter(Boolean);
    return parts.length===6 ? parts : Array.from({length:6},(_,i)=>parts[i] || '');
  }
  function serverURL(value) {
    const url=new URL(value.trim());
    if(url.protocol!=='https:' || url.username || url.password || url.search || url.hash || url.pathname!=='/') throw new Error('Informe somente o endereço HTTPS do seu servidor, sem caminhos ou senha.');
    return url.origin;
  }
  async function api(base,path,token,options={},fetcher=fetch) {
    try {
      const response=await fetcher(base+path,{...options,headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(60000)});
      if(response.ok && path.endsWith('/download'))return response.blob();
      let data;try{data=await response.json();}catch{throw new Error('O servidor respondeu em formato inválido. Confira o endereço.');}
      if(!response.ok){const error=new Error(data.error || 'Servidor de vídeo indisponível.');error.status=response.status;throw error;}
      return data;
    }catch(error){
      if(error instanceof TypeError || error.name==='TimeoutError'){const failure=new Error('Conexão interrompida. Use CONSULTAR VÍDEO EXISTENTE para retomar sem gerar novamente.');failure.connection=true;throw failure;}
      throw error;
    }
  }
  if(typeof module!=='undefined' && module.exports){module.exports={scenesFrom,serverURL,api};return;}
  const $=id=>document.getElementById(id);
  let project=null, active=null, busy=false, uncertain=false, downloadURL=null;
  function message(text){$('video-status').textContent=text;}
  function open(p){
    project=p;
    $('video-script').value=p.content.script;
    $('video-consent').checked=false;
    $('video-scenes').replaceChildren();
    scenesFrom(p.content.scenes).forEach((text,i)=>{
      const label=document.createElement('label');label.htmlFor=`video-scene-${i}`;label.textContent=`Imagem da cena ${i+1}`;
      const area=document.createElement('textarea');area.id=`video-scene-${i}`;area.maxLength=4000;area.rows=3;area.value=text;
      $('video-scenes').append(label,area);
    });
  }
  async function poll(job){
    const started=Date.now();
    while(Date.now()-started<25*60*1000){
      let data;
      for(let attempt=0;attempt<3;attempt++){
        try{data=await api(job.base,`/jobs/${job.id}`,job.token);break;}
        catch(error){if(!error.connection || attempt===2)throw error;message('Reconectando ao pedido existente, sem gerar novamente…');await new Promise(resolve=>setTimeout(resolve,5000));}
      }
      message(`${job.theme}: ${data.message}`);
      if(data.status==='error'){uncertain=false;throw new Error(data.message);}
      if(data.status==='done'){
        uncertain=false;active=job;$('download-video').hidden=false;return;
      }
      await new Promise(resolve=>setTimeout(resolve,5000));
    }
    throw new Error('O acompanhamento excedeu 25 minutos. O servidor pode continuar trabalhando. Não envie outra geração antes de conferir o serviço.');
  }
  document.addEventListener('DOMContentLoaded',()=>{
    $('resume-video').addEventListener('click',async()=>{
      if(busy)return;
      busy=true;$('resume-video').disabled=true;$('create-video').disabled=true;
      try{
        const base=serverURL($('video-server').value),token=$('video-password').value;
        if(!token)throw new Error('Informe a senha do servidor para consultar o vídeo existente.');
        message('Consultando o último pedido. Nenhuma geração será iniciada…');
        const data=active?.id && active.base===base ? {job:active} : await api(base,'/jobs/latest',token);
        if(!data.job){uncertain=false;active=null;message('Nenhum pedido disponível. O servidor pode ter reiniciado ou o vídeo expirou.');return;}
        if(!/^[a-f0-9]{32}$/.test(data.job.id))throw new Error('Resposta de consulta inválida. Atualize o servidor de vídeo.');
        active={base,token,id:data.job.id,theme:'Vídeo existente'};uncertain=true;
        await poll(active);
      }catch(error){message(error.message);}
      finally{busy=false;$('resume-video').disabled=false;$('create-video').disabled=uncertain;}
    });
    $('create-video').addEventListener('click',async()=>{
      if(busy || !project || uncertain)return;
      try{
        const base=serverURL($('video-server').value), token=$('video-password').value;
        if(!token)throw new Error('Informe a senha do servidor de vídeo.');
        if(!$('video-consent').checked)throw new Error('Revise a narração e marque a autorização de consumo antes de gerar.');
        const script=$('video-script').value.trim();
        if(script.length<10 || script.length>6000)throw new Error('Revise o texto da narração.');
        const scenes=Array.from({length:6},(_,i)=>$(`video-scene-${i}`).value.trim());
        if(scenes.some(s=>!s))throw new Error('Preencha as seis descrições de imagens.');
        busy=true;$('create-video').disabled=true;$('download-video').hidden=true;active=null;
        if(downloadURL){URL.revokeObjectURL(downloadURL);downloadURL=null;}
        const snapshot={theme:project.theme,script,scenes,duration:project.duration};
        message('Enviando pedido. Mantenha esta página aberta até baixar o MP4…');
        uncertain=true;active=null;
        const data=await api(base,'/jobs',token,{method:'POST',body:JSON.stringify(snapshot)});
        if(!/^[a-f0-9]{32}$/.test(data.id))throw new Error('O servidor não retornou o identificador do vídeo.');
        active={base,token,id:data.id,theme:snapshot.theme};
        await poll(active);
      }catch(error){if(error.status && error.status!==409 && error.status<500)uncertain=false;message(error.message);}
      finally{busy=false;$('create-video').disabled=uncertain;}
    });
    $('download-video').addEventListener('click',async()=>{
      if(!active)return;
      $('download-video').disabled=true;
      try{
        const blob=await api(active.base,`/jobs/${active.id}/download`,active.token);
        if(downloadURL)URL.revokeObjectURL(downloadURL);
        downloadURL=URL.createObjectURL(blob);
        const link=document.createElement('a');link.href=downloadURL;link.download='mr-latae-video.mp4';document.body.append(link);link.click();link.remove();
        message('Download solicitado. Confira a pasta Downloads. Assista e revise antes de publicar.');
      }catch(error){message(error.message);}
      finally{$('download-video').disabled=false;}
    });
    window.addEventListener('pagehide',()=>{active=null;$('video-password').value='';if(downloadURL)URL.revokeObjectURL(downloadURL);});
  });
  root.StudioVideo={open};
})(globalThis);
