'use server'
// D6 — Server Action wrappers. Same names and signatures as lib/services/audio; the service
// runs inside the request context (identity, MFA, ?mockError) and re-checks permissions itself.
// TODO(backend): server-only — validate inputs with zod at this boundary before calling Supabase.
import * as svc from '@/lib/services/audio'
import {withRequest} from '@/lib/services/request'

export async function listCategories(...args:Parameters<typeof svc.listCategories>){return withRequest(()=>svc.listCategories(...args))}
export async function listAudio(...args:Parameters<typeof svc.listAudio>){return withRequest(()=>svc.listAudio(...args))}
export async function getAudio(...args:Parameters<typeof svc.getAudio>){return withRequest(()=>svc.getAudio(...args))}
export async function getPlaybackUrl(...args:Parameters<typeof svc.getPlaybackUrl>){return withRequest(()=>svc.getPlaybackUrl(...args))}
