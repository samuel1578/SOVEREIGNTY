import 'server-only'
import {cookies,headers} from 'next/headers'
import {runWith,type RequestContext} from './store'
import {SITE_URL} from '../config'
// D6 — wraps every server action / route handler call: snapshots cookies, reads `?mockError=1`
// from the calling page (Referer), runs the service, then applies queued cookie writes.
// TODO(backend): server-only — replace the cookie snapshot with the Supabase server client.
export async function withRequest<T>(fn:()=>Promise<T>):Promise<T>{
  const jar=await cookies(),h=await headers()
  let mockError=false
  try{mockError=new URL(h.get('referer')||'').searchParams.get('mockError')==='1'}catch{}
  const context:RequestContext={cookies:Object.fromEntries(jar.getAll().map(c=>[c.name,c.value])),mockError,writes:[]}
  const out=await runWith(context,fn)
  for(const c of context.writes)jar.set(c.name,c.value,{path:'/',sameSite:'lax',maxAge:c.maxAge,secure:SITE_URL.startsWith('https://')})
  return out
}
