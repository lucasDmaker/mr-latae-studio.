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
      if(!response.ok)throw new Error(data.error || 'Servidor de vídeo indisponível.');
      return data;
    }catch(error){
      if(error instanceof TypeError || error.name==='TimeoutError')throw new Error('Não foi possível conectar ao servidor. Confira o endereço e aguarde a inicialização. A geração não será reenviada automaticamente.');
      throw error;
    }
  }
  if(typeof module!=='undefined' && module.exports){module.exports={scenesFrom,serverURL,api};return;}
  const $=id=>document.getElementById(id);
  let project=null, active=null, busy=false, downloadURL=null;
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
      const data=await api(job.base,`/jobs/${job.id}`,job.token);
      message(`${job.theme}: ${data.message}`);
      if(data.status==='error')throw new Error(data.message);
      if(data.status==='done'){
        active=job;$('download-video').hidden=false;return;
      }
      await new Promise(resolve=>setTimeout(resolve,5000));
    }
    throw new Error('O acompanhamento excedeu 25 minutos. O servidor pode continuar trabalhando. Não envie outra geração antes de conferir o serviço.');
  }
  document.addEventListener('DOMContentLoaded',()=>{
    $('create-video').addEventListener('click',async()=>{
      if(busy || !project)return;
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
        const data=await api(base,'/jobs',token,{method:'POST',body:JSON.stringify(snapshot)});
        if(!/^[a-f0-9]{32}$/.test(data.id))throw new Error('O servidor não retornou o identificador do vídeo.');
        await poll({base,token,id:data.id,theme:snapshot.theme});
      }catch(error){message(error.message);}
      finally{busy=false;$('create-video').disabled=false;}
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
