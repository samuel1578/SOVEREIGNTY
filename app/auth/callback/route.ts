import {NextResponse,type NextRequest} from 'next/server'
import {safeNext} from '@/lib/redirect'
// D12 — OAuth / magic-link (PKCE) callback stub. Redirects to a validated same-origin `next`.
// TODO(backend): Supabase — exchange `code` for a session (exchangeCodeForSession) before redirecting;
// on failure redirect to /sign-in?expired=1.
export function GET(request:NextRequest){
  const next=safeNext(request.nextUrl.searchParams.get('next'))
  return NextResponse.redirect(new URL(next,request.url))
}
