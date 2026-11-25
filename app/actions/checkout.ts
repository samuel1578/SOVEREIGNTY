'use server'
// D6 — Server Action wrappers. Same names and signatures as lib/services/checkout; the service
// runs inside the request context (identity, MFA, ?mockError) and re-checks permissions itself.
// TODO(backend): server-only — validate inputs with zod at this boundary before calling Supabase.
import * as svc from '@/lib/services/checkout'
import {withRequest} from '@/lib/services/request'

export async function startCheckout(...args:Parameters<typeof svc.startCheckout>){return withRequest(()=>svc.startCheckout(...args))}
