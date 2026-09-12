import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
const origin=process.env.STUDIO_TEST_ORIGIN||'http://localhost:5173';
if(!/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin))throw Error('Tests are local-only.');
const email='seedy@sites.test',password='Local-test-'+crypto.randomUUID(),nextPassword='Changed-'+crypto.randomUUID();
let count=0;const check=(label,fn)=>{fn();console.log('PASS '+label);count++;};
async function call(action,data={},cookie='',extra={}){const r=await fetch(origin+'/api/auth/'+action,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{}),...extra},body:JSON.stringify(data)});const raw=await r.text();let body;try{body=JSON.parse(raw);}catch{body={error:raw};}return {status:r.status,body,cookie:r.headers.get('set-cookie')};}
let r=await fetch(origin);const html=await r.text();check('Anonymous root displays ECOJOI login',()=>{assert.equal(r.status,200);assert(html.includes('Bem-vindo ao Studio'));});
r=await call('activate',{password});check('Anonymous activation blocked',()=>assert.equal(r.status,403));
r=await call('login',{email,password},'',{Origin:'https://other.invalid'});check('Cross-origin login blocked',()=>assert.equal(r.status,403));
r=await call('activate',{password},'__sites_local_auth=1');check('Verified local owner activation',()=>assert.equal(r.status,201,JSON.stringify(r.body)));
check('Session cookie is secure and HTTP-only',()=>{assert(r.cookie.includes('HttpOnly'));assert(r.cookie.includes('Secure'));assert(r.cookie.includes('SameSite=Lax'));});
let cookie=r.cookie.split(';')[0];
r=await call('activate',{password},'__sites_local_auth=1');check('Owner cannot be registered twice',()=>assert.equal(r.status,409));
let response=await fetch(origin+'/api/studio/designs',{headers:{Cookie:'__sites_local_auth=1'}});check('Old platform session alone no longer opens designs',()=>assert.equal(response.status,401));
response=await fetch(origin+'/api/studio/designs',{headers:{Cookie:cookie}});check('New login opens owner designs',()=>assert.equal(response.status,200));
const integration=spawnSync(process.execPath,['tests/integration.mjs'],{stdio:'inherit',env:{...process.env,STUDIO_TEST_ORIGIN:origin,STUDIO_TEST_COOKIE:cookie}});assert.equal(integration.status,0);
r=await call('password',{password:nextPassword,currentPassword:'incorrect-password'},cookie);check('Password change requires old password',()=>assert.equal(r.status,401));
r=await call('password',{password:nextPassword,currentPassword:password},cookie);check('Password change succeeds',()=>assert.equal(r.status,200));const fresh=r.cookie.split(';')[0];
response=await fetch(origin+'/api/studio/designs',{headers:{Cookie:cookie}});check('Password change invalidates old sessions',()=>assert.equal(response.status,401));
r=await call('login',{email,password});check('Old password rejected',()=>assert.equal(r.status,401));
r=await call('login',{email,password:nextPassword});check('New password works',()=>assert.equal(r.status,200));cookie=r.cookie.split(';')[0];
r=await call('logout',{},cookie);check('Logout clears cookie',()=>{assert.equal(r.status,200);assert(r.cookie.includes('Max-Age=0'));});
response=await fetch(origin+'/api/studio/designs',{headers:{Cookie:cookie}});check('Logged-out session rejected',()=>assert.equal(response.status,401));
response=await fetch(origin+'/api/studio/designs',{headers:{Cookie:'__Host-ecojoi_session='+'0'.repeat(64)}});check('Forged session rejected',()=>assert.equal(response.status,401));
let limited=false;for(let i=0;i<12;i++){r=await call('login',{email:'missing@sites.test',password:'incorrect-password'});if(r.status===429){limited=true;break;}}
check('Repeated attempts rate-limited',()=>assert(limited));
console.log(`${count} authentication checks passed plus integration suite.`);
