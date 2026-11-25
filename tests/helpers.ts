import {runWith} from '@/lib/services/store'
import type {Identity} from '@/lib/types'
// Runs a service call inside a mock request context (D6), with MFA verified for staff.
export function as<T>(id:Identity,fn:()=>Promise<T>):Promise<T>{
  const cookies:Record<string,string>={'rts-review':id}
  if(id==='owner'||id==='assistant')cookies['rts-mfa']=id
  return runWith({cookies,mockError:false,writes:[]},fn)
}
