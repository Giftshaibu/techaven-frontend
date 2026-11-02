import {afterEach,describe,expect,it,vi} from 'vitest';
import server from './server';
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();});
describe('container runtime forwarding',()=>{
 it('answers health without loading commerce or SSR',async()=>{
  const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher);const r=await server.fetch(new Request('http://store/healthz'),{},{});
  expect(r.status).toBe(200);expect(await r.text()).toBe('ok');expect(fetcher).not.toHaveBeenCalled();
 });
 it('uses runtime commerce host and preserves method/body, cookies and query',async()=>{
  vi.stubEnv('TECHAVEN_API_URL','http://commerce:8000');const response=new Response('saved',{status:201,headers:{'set-cookie':'session=abc; HttpOnly; Path=/api','content-encoding':'gzip','content-length':'999'}});
  const fetcher=vi.fn().mockResolvedValue(response);vi.stubGlobal('fetch',fetcher);
  const r=await server.fetch(new Request('http://store/api/cart?a=1',{method:'POST',headers:{cookie:'old=1','content-type':'application/json'},body:'{"quantity":1}'}),{},{});
  expect(fetcher.mock.calls[0][0]).toBe('http://commerce:8000/api/cart?a=1');const options=fetcher.mock.calls[0][1];expect(options.method).toBe('POST');expect(new TextDecoder().decode(options.body)).toBe('{"quantity":1}');expect(options.headers.get('cookie')).toBe('old=1');
  expect(r.status).toBe(201);expect(r.headers.get('set-cookie')).toContain('session=abc');expect(r.headers.has('content-encoding')).toBe(false);expect(r.headers.get('cache-control')).toBe('no-store');
 });
 it('removes only the CMS forwarding prefix and uses its separate runtime host',async()=>{
  vi.stubEnv('PROMOTIONS_API_URL','http://cms:1337');const fetcher=vi.fn().mockResolvedValue(new Response('{}'));vi.stubGlobal('fetch',fetcher);
  await server.fetch(new Request('http://store/cms/api/promotions/active?placement=home_hero'),{},{});
  expect(fetcher.mock.calls[0][0]).toBe('http://cms:1337/api/promotions/active?placement=home_hero');
 });
});
