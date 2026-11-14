from playwright.sync_api import sync_playwright
import json
import functools
from pathlib import Path
import threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
server=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(SimpleHTTPRequestHandler,directory=str(Path(__file__).resolve().parents[1])))
threading.Thread(target=server.serve_forever,daemon=True).start()
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1)
 errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
 page.goto(f'http://127.0.0.1:{server.server_port}')
 page.locator('#theme').fill('Como o camaleão muda de cor?')
 page.locator('#generator button[type=submit]').click()
 page.locator('#video-studio').wait_for(state='visible')
 assert page.locator('#video-scenes textarea').count()==6
 page.locator('#generation-mode').select_option('gemini')
 assert page.locator('#access-password').is_visible()
 page.locator('#access-password').fill('test-access')
 content={'titles':'1. Camaleões\n2. Cores\n3. Ciência','hooks':'1. Veja isso\n2. Você sabia?\n3. Por quê?','script':'Observe como as cores mudam. Este é um texto de teste para a narração.','scenes':'\n\n'.join(f'{i}. Imagem do camaleão, cena {i}.' for i in range(1,7)),'caption':'Legenda de teste','hashtags':'#camaleao'}
 page.route('https://mr-latae-api.18-lukas-daniel031099.workers.dev/',lambda route:route.fulfill(status=200,json={'content':content}))
 page.locator('#generator button[type=submit]').click()
 page.wait_for_function("document.querySelector('#project-meta').textContent.startsWith('Gemini')")
 assert page.locator('#video-script').input_value()==content['script']
 page.locator('#video-server').fill('https://mock-video.onrender.com')
 page.locator('#video-password').fill('test-access')
 requests=[]
 def mock(route):
  requests.append(route.request.url)
  assert route.request.headers['authorization']=='Bearer test-access'
  if route.request.method=='POST':
   data=route.request.post_data_json;assert len(data['scenes'])==6;assert data['script']==content['script']
   route.fulfill(status=202,json={'id':'a'*32})
  elif route.request.url.endswith('/download'):route.fulfill(status=200,content_type='video/mp4',body=b'test-mp4')
  else:route.fulfill(status=200,json={'status':'done','message':'MP4 pronto para baixar.'})
 page.route('https://mock-video.onrender.com/**',mock)
 page.locator('#create-video').click()
 assert 'autorização' in page.locator('#video-status').inner_text()
 assert len(requests)==0
 page.locator('#video-consent').check()
 page.locator('#create-video').click()
 page.locator('#download-video').wait_for(state='visible')
 with page.expect_download() as download:page.locator('#download-video').click()
 assert download.value.suggested_filename=='mr-latae-video.mp4'
 storage=page.evaluate('JSON.stringify(localStorage)')
 assert 'test-access' not in storage
 assert not page.evaluate('document.documentElement.scrollWidth>innerWidth')
 page.screenshot(path='/tmp/mr-latae-video-mobile.png',full_page=True)
 assert not errors,errors
 print('Fluxo móvel validado: geração local e Gemini simulada, seis cenas, autorização, criação, download MP4, senha fora do histórico, sem rolagem horizontal e sem erros JS.')
 browser.close()
server.shutdown();server.server_close()
