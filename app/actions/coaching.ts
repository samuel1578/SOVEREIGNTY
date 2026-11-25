'use server'
// D6 — Server Action wrappers. Same names and signatures as lib/services/coaching; the service
// runs inside the request context (identity, MFA, ?mockError) and re-checks permissions itself.
// TODO(backend): server-only — validate inputs with zod at this boundary before calling Supabase.
import {updateTag} from 'next/cache'
import * as svc from '@/lib/services/coaching'
import {withRequest} from '@/lib/services/request'
import type {Result} from '@/lib/types'
// D7 — read-your-own-writes: expire the public cache tags touched by a successful save.
async function expire<T>(p:Promise<Result<T>>,tags:string[]){const r=await p;if(r.ok)tags.forEach(t=>updateTag(t));return r}

export async function getCoachingSettings(...args:Parameters<typeof svc.getCoachingSettings>){return withRequest(()=>svc.getCoachingSettings(...args))}
export async function saveCoachingSettings(...args:Parameters<typeof svc.saveCoachingSettings>){return expire(withRequest(()=>svc.saveCoachingSettings(...args)),["settings"])}
