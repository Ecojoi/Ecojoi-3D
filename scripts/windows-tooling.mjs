import os from 'node:os';
const original = os.userInfo;
os.userInfo = function(options){try{return original.call(os,options);}catch{return {username:process.env.USERNAME || 'ecojoi',uid:-1,gid:-1,homedir:os.homedir(),shell:null};}};
import path from 'node:path';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const toolingBin=fileURLToPath(new URL('../../tooling/bin/',import.meta.url));
if(existsSync(toolingBin))process.env.PATH=toolingBin+path.delimiter+process.env.PATH;

