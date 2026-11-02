import {afterEach,expect,it,vi} from 'vitest';
import {getTechavenApiBaseUrl} from './env';
afterEach(()=>vi.unstubAllEnvs());
it('uses runtime service host for SSR and same origin in the browser',()=>{
 vi.stubEnv('SSR',true);vi.stubEnv('TECHAVEN_API_URL','http://commerce:8000/');expect(getTechavenApiBaseUrl()).toBe('http://commerce:8000');
 vi.stubEnv('SSR',false);expect(getTechavenApiBaseUrl()).toBe('');
});
