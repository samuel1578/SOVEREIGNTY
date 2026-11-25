import {NextResponse,type NextRequest} from 'next/server'
import {safeNext} from '@/lib/redirect'
// D12 — email confirmation stub (token_hash + type). Redirects to a validated same-origin `next`.
// TODO(backend): Supabase — verifyOtp({type, token_hash}); on failure redirect to /sign-in?expired=1.
export function GET(request:NextRequest){
  const next=safeNext(request.nextUrl.searchParams.get('next'))
  return NextResponse.redirect(new URL(next,request.url))
}
