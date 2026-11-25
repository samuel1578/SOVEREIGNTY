'use server'
// D6 — Server Action wrappers. Same names and signatures as lib/services/member; the service
// runs inside the request context (identity, MFA, ?mockError) and re-checks permissions itself.
// TODO(backend): server-only — validate inputs with zod at this boundary before calling Supabase.
import * as svc from '@/lib/services/member'
import {withRequest} from '@/lib/services/request'

export async function getLibrary(...args:Parameters<typeof svc.getLibrary>){return withRequest(()=>svc.getLibrary(...args))}
export async function getContinueListening(...args:Parameters<typeof svc.getContinueListening>){return withRequest(()=>svc.getContinueListening(...args))}
export async function getEntitlement(...args:Parameters<typeof svc.getEntitlement>){return withRequest(()=>svc.getEntitlement(...args))}
export async function getProgress(...args:Parameters<typeof svc.getProgress>){return withRequest(()=>svc.getProgress(...args))}
export async function saveProgress(...args:Parameters<typeof svc.saveProgress>){return withRequest(()=>svc.saveProgress(...args))}
export async function listPurchases(...args:Parameters<typeof svc.listPurchases>){return withRequest(()=>svc.listPurchases(...args))}
export async function updateProfile(...args:Parameters<typeof svc.updateProfile>){return withRequest(()=>svc.updateProfile(...args))}
export async function deleteAccount(...args:Parameters<typeof svc.deleteAccount>){return withRequest(()=>svc.deleteAccount(...args))}
