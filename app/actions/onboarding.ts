'use server'
// Server Action wrappers for lib/services/onboarding (mock sign-up). Same pattern as app/actions/auth.
// TODO(backend): server-only — validate inputs with zod at this boundary before calling Supabase.
import * as svc from '@/lib/services/onboarding'
import {withRequest} from '@/lib/services/request'

export async function startSignUp(...args:Parameters<typeof svc.startSignUp>){return withRequest(()=>svc.startSignUp(...args))}
export async function confirmSignUp(...args:Parameters<typeof svc.confirmSignUp>){return withRequest(()=>svc.confirmSignUp(...args))}
export async function updateAvatar(...args:Parameters<typeof svc.updateAvatar>){return withRequest(()=>svc.updateAvatar(...args))}
