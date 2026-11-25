'use server'
// D6 — Server Action wrappers. Same names and signatures as lib/services/auth; the service
// runs inside the request context (identity, MFA, ?mockError) and re-checks permissions itself.
// TODO(backend): server-only — validate inputs with zod at this boundary before calling Supabase.
import * as svc from '@/lib/services/auth'
import {withRequest} from '@/lib/services/request'

export async function switchIdentity(...args:Parameters<typeof svc.switchIdentity>){return withRequest(()=>svc.switchIdentity(...args))}
export async function getSession(...args:Parameters<typeof svc.getSession>){return withRequest(()=>svc.getSession(...args))}
export async function sendMagicLink(...args:Parameters<typeof svc.sendMagicLink>){return withRequest(()=>svc.sendMagicLink(...args))}
export async function signInWithGoogle(...args:Parameters<typeof svc.signInWithGoogle>){return withRequest(()=>svc.signInWithGoogle(...args))}
export async function signOut(...args:Parameters<typeof svc.signOut>){return withRequest(()=>svc.signOut(...args))}
export async function requireRole(...args:Parameters<typeof svc.requireRole>){return withRequest(()=>svc.requireRole(...args))}
export async function getMfaStatus(...args:Parameters<typeof svc.getMfaStatus>){return withRequest(()=>svc.getMfaStatus(...args))}
export async function verifyMfa(...args:Parameters<typeof svc.verifyMfa>){return withRequest(()=>svc.verifyMfa(...args))}
