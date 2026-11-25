'use server'
// D6 — Server Action wrappers. Same names and signatures as lib/services/contact.
import * as svc from '@/lib/services/contact'
import {withRequest} from '@/lib/services/request'

export async function sendContactMessage(...args:Parameters<typeof svc.sendContactMessage>){return withRequest(()=>svc.sendContactMessage(...args))}
export async function setMessageStatus(...args:Parameters<typeof svc.setMessageStatus>){return withRequest(()=>svc.setMessageStatus(...args))}
