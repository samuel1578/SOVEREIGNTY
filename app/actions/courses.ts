'use server'
// D6 — Server Action wrappers. Same names and signatures as lib/services/courses; the service
// runs inside the request context (identity, MFA, ?mockError) and re-checks permissions itself.
// TODO(backend): server-only — validate inputs with zod at this boundary before calling Supabase.
import * as svc from '@/lib/services/courses'
import {withRequest} from '@/lib/services/request'

export async function listTiers(...args:Parameters<typeof svc.listTiers>){return withRequest(()=>svc.listTiers(...args))}
export async function getTier(...args:Parameters<typeof svc.getTier>){return withRequest(()=>svc.getTier(...args))}
export async function listModules(...args:Parameters<typeof svc.listModules>){return withRequest(()=>svc.listModules(...args))}
export async function listLessons(...args:Parameters<typeof svc.listLessons>){return withRequest(()=>svc.listLessons(...args))}
export async function getLesson(...args:Parameters<typeof svc.getLesson>){return withRequest(()=>svc.getLesson(...args))}
