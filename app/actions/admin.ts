'use server'
// D6 — Server Action wrappers. Same names and signatures as lib/services/admin; the service
// runs inside the request context (identity, MFA, ?mockError) and re-checks permissions itself.
// TODO(backend): server-only — validate inputs with zod at this boundary before calling Supabase.
import {updateTag} from 'next/cache'
import * as svc from '@/lib/services/admin'
import {withRequest} from '@/lib/services/request'
import type {Result} from '@/lib/types'
// D7 — read-your-own-writes: expire the public cache tags touched by a successful save.
async function expire<T>(p:Promise<Result<T>>,tags:string[]){const r=await p;if(r.ok)tags.forEach(t=>updateTag(t));return r}

export async function getWorkspace(...args:Parameters<typeof svc.getWorkspace>){return withRequest(()=>svc.getWorkspace(...args))}
export async function requestUpload(...args:Parameters<typeof svc.requestUpload>){return withRequest(()=>svc.requestUpload(...args))}
export async function confirmUpload(...args:Parameters<typeof svc.confirmUpload>){return expire(withRequest(()=>svc.confirmUpload(...args)),["audio"])}
export async function saveAudio(...args:Parameters<typeof svc.saveAudio>){return expire(withRequest(()=>svc.saveAudio(...args)),["audio"])}
export async function saveCategory(...args:Parameters<typeof svc.saveCategory>){return expire(withRequest(()=>svc.saveCategory(...args)),["audio"])}
export async function saveModule(...args:Parameters<typeof svc.saveModule>){return expire(withRequest(()=>svc.saveModule(...args)),["tiers"])}
export async function saveLesson(...args:Parameters<typeof svc.saveLesson>){return expire(withRequest(()=>svc.saveLesson(...args)),["tiers"])}
export async function setStatus(...args:Parameters<typeof svc.setStatus>){return expire(withRequest(()=>svc.setStatus(...args)),["audio","tiers"])}
export async function removeAudio(...args:Parameters<typeof svc.removeAudio>){return expire(withRequest(()=>svc.removeAudio(...args)),["audio"])}
export async function saveTranscript(...args:Parameters<typeof svc.saveTranscript>){return expire(withRequest(()=>svc.saveTranscript(...args)),["audio","tiers"])}
export async function approveTranscript(...args:Parameters<typeof svc.approveTranscript>){return expire(withRequest(()=>svc.approveTranscript(...args)),["audio","tiers"])}
export async function regenerateTranscript(...args:Parameters<typeof svc.regenerateTranscript>){return expire(withRequest(()=>svc.regenerateTranscript(...args)),["audio","tiers"])}
export async function setTierPrice(...args:Parameters<typeof svc.setTierPrice>){return expire(withRequest(()=>svc.setTierPrice(...args)),["tiers"])}
export async function grantAccess(...args:Parameters<typeof svc.grantAccess>){return withRequest(()=>svc.grantAccess(...args))}
export async function removeAccess(...args:Parameters<typeof svc.removeAccess>){return withRequest(()=>svc.removeAccess(...args))}
export async function listMembers(...args:Parameters<typeof svc.listMembers>){return withRequest(()=>svc.listMembers(...args))}
export async function inviteAssistant(...args:Parameters<typeof svc.inviteAssistant>){return withRequest(()=>svc.inviteAssistant(...args))}
export async function removeStaff(...args:Parameters<typeof svc.removeStaff>){return withRequest(()=>svc.removeStaff(...args))}
export async function listActivity(...args:Parameters<typeof svc.listActivity>){return withRequest(()=>svc.listActivity(...args))}
export async function getDashboardStats(...args:Parameters<typeof svc.getDashboardStats>){return withRequest(()=>svc.getDashboardStats(...args))}
export async function savePage(...args:Parameters<typeof svc.savePage>){return expire(withRequest(()=>svc.savePage(...args)),["pages"])}
export async function saveSiteSettings(...args:Parameters<typeof svc.saveSiteSettings>){return expire(withRequest(()=>svc.saveSiteSettings(...args)),["settings"])}
export async function reorder(...args:Parameters<typeof svc.reorder>){return expire(withRequest(()=>svc.reorder(...args)),["audio","tiers"])}
