const {test}=require('node:test');
const assert=require('node:assert/strict');
const V=require('../video.js');
test('separa seis cenas sem perder descrições em múltiplas linhas',()=>{
 const text=Array.from({length:6},(_,i)=>`${i+1}. Cena ${i+1}\nDetalhe`).join('\n\n');
 const scenes=V.scenesFrom(text);assert.equal(scenes.length,6);assert.equal(scenes[5],'Cena 6\nDetalhe');
});
test('servidor exige HTTPS e não aceita credenciais ou caminhos',()=>{
 assert.equal(V.serverURL('https://studio.onrender.com'),'https://studio.onrender.com');
 for(const url of ['http://studio.test','https://user:pass@studio.test','https://studio.test/path','https://studio.test/?token=secret'])assert.throws(()=>V.serverURL(url));
});
test('cliente inicia trabalho e baixa MP4 sem senha em URL ou corpo',async()=>{
 const result=await V.api('https://studio.test','/jobs','test-password',{method:'POST',body:'{}'},async(url,options)=>{
 assert.equal(options.headers.Authorization,'Bearer test-password');assert.ok(!url.includes('test-password'));assert.equal(options.body,'{}');return new Response('{"id":"job"}',{status:202});});assert.equal(result.id,'job');
 const blob=await V.api('https://studio.test','/jobs/job/download','test-password',{},async()=>new Response('mock-mp4',{headers:{'Content-Type':'video/mp4'}}));assert.equal(await blob.text(),'mock-mp4');
 await assert.rejects(()=>V.api('https://studio.test','/jobs','x',{},async()=>new Response('{"error":"Senha incorreta"}',{status:401})),/Senha/);
 await assert.rejects(()=>V.api('https://studio.test','/jobs','x',{},async()=>{throw new TypeError('network');}),/não será reenviada/);
});
