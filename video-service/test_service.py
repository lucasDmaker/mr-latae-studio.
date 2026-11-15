import base64
import importlib.util
import json
import os
from pathlib import Path
import struct
import subprocess
import tempfile
import threading
import unittest
from unittest.mock import patch
import urllib.error
import urllib.request
import wave
from http.server import ThreadingHTTPServer
from PIL import Image

spec=importlib.util.spec_from_file_location('service',Path(__file__).with_name('service.py'))
s=importlib.util.module_from_spec(spec);spec.loader.exec_module(s)
BRIEF={'theme':'Tema de teste','script':'Este vídeo de teste usa imagens locais e áudio simulado. Nenhuma chamada externa foi feita para produzir este arquivo de demonstração.','scenes':['Cena de teste']*6,'duration':30}

class ServiceTests(unittest.TestCase):
    def test_validate(self):
        self.assertEqual(s.validate(BRIEF),BRIEF)
        for change in ({'duration':True},{'duration':31},{'script':''},{'scenes':['x']*5},{'theme':'x'*181}):
            with self.assertRaises(s.VideoError):s.validate({**BRIEF,**change})

    def test_ai_adapters_without_network(self):
        with tempfile.TemporaryDirectory() as tmp:
            tmp=Path(tmp)
            import io
            image=io.BytesIO();Image.new('RGB',(20,30),'blue').save(image,format='PNG')
            with patch.object(s,'gemini',return_value=[{'inlineData':{'mimeType':'image/png','data':base64.b64encode(image.getvalue()).decode()}}]):
                s.create_image('teste',tmp/'image.png');self.assertTrue((tmp/'image.png').exists())
            with patch.object(s,'gemini',return_value=[{'inlineData':{'mimeType':'audio/L16;codec=pcm;rate=24000','data':base64.b64encode(b'\0\0'*24000).decode()}}]):
                s.create_voice('teste',tmp/'voice.wav')
                with wave.open(str(tmp/'voice.wav')) as audio:self.assertEqual(audio.getnframes(),24000)
            with patch.object(s,'gemini',return_value=[]):
                with self.assertRaises(s.VideoError):s.create_voice('teste',tmp/'bad.wav')
        with patch.dict(os.environ,{'GEMINI_API_KEY':'fake-test'}),patch.object(s.urllib.request,'urlopen',side_effect=urllib.error.HTTPError('https://example.test',429,'quota',{},None)):
            with self.assertRaisesRegex(s.VideoError,'Cota'):s.gemini('test-model',{})

    def test_http_auth_cors_validation_and_job(self):
        server=ThreadingHTTPServer(('127.0.0.1',0),s.Handler)
        threading.Thread(target=server.serve_forever,daemon=True).start()
        def req(path='/jobs',data=BRIEF,token='test-password',origin=s.ORIGIN):
            request=urllib.request.Request(f'http://127.0.0.1:{server.server_port}'+path,data=json.dumps(data).encode() if data is not None else None,headers={'Origin':origin,'Authorization':'Bearer '+token,'Content-Type':'application/json'})
            try:return urllib.request.urlopen(request)
            except urllib.error.HTTPError as error:return error
        with tempfile.TemporaryDirectory() as tmp,patch.object(s,'DATA',Path(tmp)),patch.dict(os.environ,{'GEMINI_API_KEY':'fake','APP_ACCESS_TOKEN':'test-password'}),patch.object(s,'process'):
            s.JOBS.clear()
            self.assertEqual(req(token='wrong').code,401)
            self.assertEqual(req('/jobs/latest',data=None,token='wrong').code,401)
            self.assertIsNone(json.load(req('/jobs/latest',data=None))['job'])
            denied=req(origin='https://evil.test');self.assertEqual(denied.code,403);self.assertIsNone(denied.headers.get('Access-Control-Allow-Origin'))
            self.assertEqual(req(data={**BRIEF,'duration':12}).code,400)
            response=req();self.assertEqual(response.code,202);job_id=json.load(response)['id']
            self.assertEqual(req().code,409)
            latest=json.load(req('/jobs/latest',data=None))['job']
            self.assertEqual(latest['id'],job_id)
            self.assertEqual(latest['status'],'queued')
            self.assertNotIn('script',latest)
            response=req('/jobs/'+job_id,data=None);self.assertEqual(json.load(response)['status'],'queued')
            s.JOBS[job_id]['status']='done'
            folder=Path(tmp)/job_id;folder.mkdir();(folder/'video.mp4').write_bytes(b'fake-mp4')
            response=req('/jobs/'+job_id+'/download',data=None);self.assertEqual(response.read(),b'fake-mp4')
            s.JOBS.clear()
            for _ in range(2):s.reserve()
            with self.assertRaisesRegex(s.VideoError,'três vídeos'):s.reserve()
        server.shutdown();server.server_close()

    def test_actual_mp4_assembly_with_synthetic_assets(self):
        # FFmpeg real, seis imagens artificiais e PCM silencioso. Zero chamadas à IA.
        with tempfile.TemporaryDirectory() as tmp:
            folder=Path(tmp)
            for i in range(6):Image.new('RGB',(720,1280),(30+i*30,40,100)).save(folder/f'image-{i}.png')
            with wave.open(str(folder/'voice.wav'),'wb') as audio:
                audio.setnchannels(1);audio.setsampwidth(2);audio.setframerate(24000);audio.writeframes(b'\0\0'*24000*30)
            s.assemble_in_directory(BRIEF,folder)
            result=subprocess.run(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(folder/'video.mp4')],check=True,capture_output=True,text=True)
            metadata=json.loads(result.stdout);video=next(x for x in metadata['streams'] if x['codec_type']=='video')
            self.assertEqual((video['width'],video['height']),(720,1280))
            self.assertTrue(any(x['codec_type']=='audio' for x in metadata['streams']))
            self.assertAlmostEqual(float(metadata['format']['duration']),30,delta=.2)
            print('MP4 real validado: 720x1280, 30 segundos, vídeo H.264 e áudio AAC; imagens e áudio sintéticos.')

if __name__=='__main__':unittest.main()
