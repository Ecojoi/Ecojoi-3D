import assert from 'node:assert/strict';
const origin=process.env.STUDIO_TEST_ORIGIN||'http://localhost:5173';
if(!/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin))throw Error('Local-only test.');
const admin=process.env.STUDIO_TEST_COOKIE;if(!admin)throw Error('Admin test session required.');
let count=0;const check=(label,fn)=>{fn();count++;console.log('PASS '+label);};
async function call(path,{cookie=admin,data,headers={}}={}){
 const r=await fetch(origin+path,{method:data?'POST':'GET',headers:{Origin:origin,'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{}),...headers},body:data?JSON.stringify(data):undefined});
 const text=await r.text();let body;try{body=JSON.parse(text);}catch{body={error:text};}
 return {status:r.status,body,cookie:r.headers.get('set-cookie')?.split(';')[0]};
}
let r=await call('/api/admin/users',{cookie:''});check('Anonymous list blocked',()=>assert.equal(r.status,401));
r=await call('/api/admin/users');check('Owner can list without secrets',()=>{assert.equal(r.status,200);assert(!JSON.stringify(r.body).includes('password'));assert(r.body.some(u=>u.role==='admin'));});
const data={name:'Usuário de teste local',email:`admin-test-${crypto.randomUUID()}@example.test`,password:'Local-test-'+crypto.randomUUID()};
r=await call('/api/admin/users',{cookie:'',data});check('Anonymous creation blocked',()=>assert.equal(r.status,401));
r=await call('/api/admin/users',{data,headers:{Origin:'https://untrusted.invalid'}});check('Cross-origin creation blocked',()=>assert.equal(r.status,403));
r=await call('/api/admin/users',{data:{...data,role:'admin'}});check('Role injection rejected',()=>assert.equal(r.status,400));
r=await call('/api/admin/users',{data:{...data,password:'short'}});check('Short password rejected',()=>assert.equal(r.status,400));
r=await call('/api/admin/users',{data:{...data,email:'invalid'}});check('Invalid email rejected',()=>assert.equal(r.status,400));
r=await call('/api/admin/users',{data});check('Admin creates ordinary user',()=>{assert.equal(r.status,201);assert.equal(r.body.role,'user');assert(!('password' in r.body));});
r=await call('/api/admin/users',{data:{...data,email:data.email.toUpperCase(),password:'different-password'}});check('Duplicate normalized email cannot overwrite account',()=>assert.equal(r.status,409));
r=await call('/api/auth/login',{cookie:'',data:{email:data.email,password:data.password}});check('Created user can log in with original password',()=>assert.equal(r.status,200));const user=r.cookie;
r=await call('/api/studio/me',{cookie:user});check('User role returned by server',()=>assert.equal(r.body.role,'user'));
r=await call('/api/admin/users',{cookie:user});check('Ordinary user cannot list accounts',()=>assert.equal(r.status,403));
r=await call('/api/admin/users',{cookie:user,data:{...data,email:'other@example.test'}});check('Ordinary user cannot create accounts',()=>assert.equal(r.status,403));
r=await call('/api/admin/users',{cookie:user,headers:{'x-role':'admin','oai-authenticated-user-email':'seedy@sites.test'}});check('Forged headers do not grant administrator access',()=>assert.equal(r.status,403));
r=await call('/api/studio/designs',{cookie:user});check('New user has own empty workspace',()=>assert.deepEqual(r.body,[]));
const design=await call('/api/studio/designs',{cookie:user,data:{name:'Design local do novo usuário'}});check('New user can create own design',()=>assert.equal(design.status,201));
r=await call('/api/studio/designs/'+design.body.id);check('Design ownership remains isolated',()=>assert.equal(r.status,404));
r=await call('/api/studio/designs/'+design.body.id,{cookie:user});check('Own design reloads',()=>assert.equal(r.status,200));
r=await call('/api/auth/logout',{cookie:user,data:{}});check('New user can log out',()=>assert.equal(r.status,200));
r=await call('/api/studio/me',{cookie:user});check('Logged-out session rejected',()=>assert.equal(r.status,401));
console.log(`${count} admin and user access checks passed.`);
