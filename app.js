'use strict';
const $ = id => document.getElementById(id);
let projects = [], current = null, statusTimer;
function notify(message) { $('status').textContent=message; clearTimeout(statusTimer); statusTimer=setTimeout(()=>$('status').textContent='',6000); }
try { projects=Studio.read(localStorage); } catch { notify('Não foi possível ler o histórico. Os dados existentes não foram apagados. Exporte seus novos projetos em TXT.'); }
function persist() { try { Studio.save(localStorage,projects); } catch { notify('Não foi possível salvar no navegador. Exporte o projeto em TXT para guardar seu trabalho.'); } }
function updateCurrent() { if(!current) return; const index=projects.findIndex(p=>p.id===current.id); if(index<0) projects.unshift(current); else projects[index]=current; projects=projects.slice(0,50); persist(); renderHistory(); }
function renderChecklist() { $('checklist').replaceChildren(); Studio.tasks.forEach((task,i)=>{const label=document.createElement('label');label.className='task';const box=document.createElement('input');box.type='checkbox';box.checked=current?.checklist[i]||false;box.disabled=!current;box.addEventListener('change',()=>{current.checklist[i]=box.checked;updateCurrent();updateProgress();});label.append(box,document.createTextNode(task));$('checklist').append(label);});updateProgress(); }
function updateProgress() { const done=current ? current.checklist.filter(Boolean).length : 0; $('progress').value=done;$('progress-label').textContent=`${done}/6`; }
async function copy(text, editor) { try { if(!navigator.clipboard?.writeText) throw new Error(); await navigator.clipboard.writeText(text); notify('Texto copiado!'); } catch { if(editor){editor.focus();editor.select();} notify('Cópia automática indisponível. Selecione o texto e use Copiar no menu do celular, ou exporte em TXT.'); } }
function openProject(project) { current=project;$('theme').value=project.theme;$('niche').value=project.niche;document.querySelector(`input[name="format"][value="${project.format}"]`).checked=true;document.querySelector(`input[name="duration"][value="${project.duration}"]`).checked=true;updateCount();$('empty-state').hidden=true;$('result').hidden=false;$('output-badge').textContent='PRONTO PARA EDITAR';$('project-meta').textContent=`${project.source==='gemini'?'Gemini':'Local'} · ${Studio.niches[project.niche][0]} · ${project.format} · ${project.duration}s`;$('editors').replaceChildren();Object.entries(Studio.fields).forEach(([key,title])=>{const section=document.createElement('div');section.className='editor';const heading=document.createElement('div');heading.className='editor-heading';const label=document.createElement('label');label.htmlFor=`edit-${key}`;label.textContent=title;const button=document.createElement('button');button.type='button';button.textContent='Copiar';button.setAttribute('aria-label',`Copiar ${title}`);const area=document.createElement('textarea');area.id=`edit-${key}`;area.value=project.content[key];area.rows=key==='script'?13:key==='scenes'?10:5;area.addEventListener('input',()=>{current.content[key]=area.value;updateCurrent();});button.addEventListener('click',()=>copy(area.value,area));heading.append(label,button);section.append(heading,area);$('editors').append(section);});renderChecklist(); }
function renderHistory() { $('history-count').textContent=projects.length;$('history-list').replaceChildren();if(!projects.length){const p=document.createElement('p');p.className='history-empty';p.textContent='Seu estúdio está esperando a primeira ideia. Gere um conteúdo e ele aparecerá aqui, salvo automaticamente.';$('history-list').append(p);return;}projects.forEach(project=>{const row=document.createElement('div');row.className='history-item';const button=document.createElement('button');button.type='button';button.className='open';const title=document.createElement('strong');title.textContent=project.theme;const meta=document.createElement('small');meta.textContent=`${project.format} · ${project.duration}s · ${new Date(project.createdAt).toLocaleDateString('pt-BR')}`;button.append(title,meta);button.addEventListener('click',()=>{openProject(project);$('result').scrollIntoView({behavior:'smooth',block:'start'});});const remove=document.createElement('button');remove.className='delete';remove.type='button';remove.textContent='Excluir';remove.setAttribute('aria-label',`Excluir projeto ${project.theme}`);remove.addEventListener('click',()=>{if(!confirm('Excluir este projeto do histórico? Esta ação não pode ser desfeita.'))return;projects=projects.filter(p=>p.id!==project.id);if(current?.id===project.id){current=null;$('result').hidden=true;$('empty-state').hidden=false;$('output-badge').textContent='AGUARDANDO IDEIA';renderChecklist();}persist();renderHistory();notify('Projeto excluído.');});row.append(button,remove);$('history-list').append(row);}); }
function updateCount(){$('char-count').textContent=`${$('theme').value.length}/180`;}
$('theme').addEventListener('input',updateCount);
let generating=false;
$('generation-mode').addEventListener('change',()=>{ $('gemini-settings').hidden=$('generation-mode').value!=='gemini'; });
function showGenerated(project) {
  openProject(project); updateCurrent();
  if(matchMedia('(max-width: 650px)').matches) $('result').scrollIntoView({behavior:'smooth',block:'start'});
}
function brief() { const data=new FormData($('generator')); return {theme:$('theme').value,niche:$('niche').value,format:data.get('format'),duration:Number(data.get('duration'))}; }
$('local-fallback').addEventListener('click',()=>{if(generating)return;try{showGenerated(Studio.generate(brief()));$('generation-message').textContent='Conteúdo criado com modelos locais.';$('local-fallback').hidden=true;}catch(error){notify(error.message);}});
$('generator').addEventListener('submit',async event=>{
  event.preventDefault(); if(generating)return;
  const button=event.target.querySelector('[type="submit"]');
  generating=true;button.disabled=true;$('local-fallback').hidden=true;
  try {
    const input=brief(), project=Studio.generate(input);
    if($('generation-mode').value==='gemini') {
      $('generation-message').textContent='Gerando com Gemini… Aguarde.';
      project.content=await Gemini.generate(input,$('access-password').value);
      project.source='gemini';
    }
    showGenerated(project);
    $('generation-message').textContent=project.source==='gemini' ? 'Conteúdo criado com Gemini. Revise os fatos e cronometre a narração.' : 'Conteúdo criado com modelos locais. Edite antes de gravar.';
  } catch(error) { $('generation-message').textContent=error.message;$('local-fallback').hidden=false; }
  finally { generating=false;button.disabled=false; }
});
window.addEventListener('pagehide',()=>{ $('access-password').value=''; });
$('copy-all').addEventListener('click',()=>{if(current)copy(Studio.toText(current));});
$('export').addEventListener('click',()=>{if(!current)return;const blob=new Blob([Studio.toText(current)],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=`mr-latae-${current.theme.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]+/g,'-').slice(0,55)||'projeto'}.txt`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('Exportação TXT solicitada. Confira os downloads do navegador.');});
renderHistory();renderChecklist();
