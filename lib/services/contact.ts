import 'server-only'
import {store,result,guard} from './store'
import {validateContact,type ContactInput} from '../contact'
import type {MessageStatus,Result} from '../types'

// D14 — public contact form (P15). Anyone may send; only staff can read (A12).
// TODO(backend): Supabase — insert into `contact_messages` (anon insert-only policy, staff+aal2 select/update);
// rate-limit 5/hour per hashed IP (private.rate_limits); email the owner the "New message" alert (content §10).
export async function sendContactMessage(input:ContactInput):Promise<Result<null>>{
  const fieldErrors=validateContact(input)
  const first=Object.values(fieldErrors)[0]
  if(first)return {ok:false,error:first,fieldErrors:fieldErrors as Record<string,string>}
  return result(()=>{
    // Spam trap filled in: report success so bots learn nothing, but store nothing.
    if(input.website)return null
    store.messages.unshift({id:crypto.randomUUID(),name:input.name.trim(),email:input.email.trim(),topic:input.topic,message:input.message.trim(),status:'new',createdAt:new Date().toISOString()})
    return null
  })
}

const STATUSES:MessageStatus[]=['new','read','archived']
// TODO(backend): Supabase — update status under RLS (staff + aal2).
export const setMessageStatus=(id:string,status:MessageStatus)=>result(()=>{
  guard()
  if(!STATUSES.includes(status))throw Error('Nothing here yet.')
  const m=store.messages.find(x=>x.id===id)
  if(!m)throw Error('Nothing here yet.')
  m.status=status
})
