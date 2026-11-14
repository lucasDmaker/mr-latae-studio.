const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {generate}=require('../gemini.js');
const input={theme:'Gatos',niche:'animais',format:'Reels',duration:30};
const origin='https://lucasdmaker.github.io';
const content={titles:['a','b','c'],hooks:['a','b','c'],scenes:['a','b','c','d','e','f'],script:'Narração',caption:'Legenda',hashtags:'#Gatos'};
// Importação em memória: nenhum pacote, implantação ou chamada real à Gemini.
async function worker(){return (await import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync('cloudflare-worker.js')).toString('base64')+'#'+Math.random())).default;}
function request({method='POST',token='test-access',body=JSON.stringify(input),site=origin}={}){return new Request('https://worker.example/',{method,headers:{Origin:site,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},...(['POST','PUT'].includes(method)?{body}:{})});}
const env={GEMINI_API_KEY:'fake-key-for-tests',APP_ACCESS_TOKEN:'test-access'};
test('CORS, autenticação, métodos e entradas não chamam Gemini',async()=>{
 const w=await worker(); const original=global.fetch;global.fetch=()=>{throw Error('Chamada externa proibida');};
 try {
 assert.equal((await w.fetch(request({method:'OPTIONS',token:''}),env)).status,204);
 const denied=await w.fetch(request({site:'https://evil.example'}),env);assert.equal(denied.status,403);assert.equal(denied.headers.get('Access-Control-Allow-Origin'),null);
 assert.equal((await w.fetch(request({token:'wrong'}),env)).status,401);
 assert.equal((await w.fetch(request({method:'GET'}),env)).status,405);
 assert.equal((await w.fetch(request({body:'{'}),env)).status,400);
 assert.equal((await w.fetch(request({body:JSON.stringify({...input,duration:31})}),env)).status,400);
 assert.equal((await w.fetch(request({body:'x'.repeat(5000)}),env)).status,413);
 assert.equal((await w.fetch(request(),{})).status,503);
 }finally{global.fetch=original;}
});
test('sucesso estruturado, falhas Gemini e limite, tudo com mock',async()=>{
 const original=global.fetch;
 try {
 for(const upstream of [200,429,404,500]){
 const w=await worker(); let calls=0;
 global.fetch=async(url,options)=>{calls++;assert.match(url,/gemini-3\.5-flash-lite:generateContent$/);assert.equal(options.headers['x-goog-api-key'],env.GEMINI_API_KEY);assert.ok(!url.includes(env.GEMINI_API_KEY));return new Response(JSON.stringify({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(content)}]}}]}),{status:upstream});};
 const response=await w.fetch(request(),env);assert.equal(response.status,({200:200,429:429,404:503,500:502})[upstream]);assert.equal(calls,1);assert.equal(response.headers.get('Access-Control-Allow-Origin'),origin);
 if(upstream===200){const data=await response.json();assert.match(data.content.scenes,/6\. f/);}
 }
 const w=await worker();let calls=0;global.fetch=async()=>{calls++;return new Response('{}');};
 for(let i=0;i<5;i++)assert.equal((await w.fetch(request(),env)).status,502);
 const limited=await w.fetch(request(),env);assert.equal(limited.status,429);assert.equal(calls,5);assert.equal(limited.headers.get('Retry-After'),'60');
 const managed=await worker();assert.equal((await managed.fetch(request(),{...env,RATE_LIMITER:{limit:async()=>({success:false})}})).status,429);
 }finally{global.fetch=original;}
});
test('cliente envia senha apenas no cabeçalho e valida resultados e erros',async()=>{
 const textContent=Object.fromEntries(Object.entries(content).map(([k,v])=>[k,Array.isArray(v)?v.join('\n'):v]));
 const result=await generate(input,'session-password',async(url,options)=>{assert.equal(options.headers.Authorization,'Bearer session-password');assert.ok(!options.body.includes('session-password'));return new Response(JSON.stringify({content:textContent}));});assert.deepEqual(result,textContent);
 await assert.rejects(()=>generate(input,''),/senha/);
 await assert.rejects(()=>generate(input,'test',async()=>new Response(JSON.stringify({error:'Cota gratuita atingida'}),{status:429})),/Cota gratuita/);
 await assert.rejects(()=>generate(input,'test',async()=>new Response('{')),/inválida/);
 await assert.rejects(()=>generate(input,'test',async()=>new Response('{}')),/incompleto/);
 await assert.rejects(()=>generate(input,'test',async()=>{throw new TypeError('network');}),/conectar/);
 await assert.rejects(()=>generate(input,'test',async()=>{throw new DOMException('timeout','TimeoutError');}),/demorou/);
});
