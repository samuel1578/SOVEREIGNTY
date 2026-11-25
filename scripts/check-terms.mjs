import {readdir,readFile} from 'node:fs/promises'
async function check(dir){for(const e of await readdir(dir,{withFileTypes:true})){const path=`${dir}/${e.name}`;if(e.isDirectory())await check(path);else if(/student/i.test(await readFile(path,'utf8')))throw Error(`Terminology violation: ${path}`)}}
await Promise.all(['app','components','lib'].map(check));console.log('Terminology check passed.')
