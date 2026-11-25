import {NextResponse,type NextRequest} from 'next/server'
import {REVIEW} from './lib/config'
import {parseIdentity,isMemberIdentity} from './lib/identity'

// D8 — request-time gate (Next 16 `proxy`, formerly middleware). Server actions re-check role and
// MFA on every call; this only stops the staff/member shells being served to the wrong people.
// TODO(backend): Supabase — refresh the session (updateSession) and read role + aal2 from verified claims.
export function proxy(request:NextRequest){
  const {pathname}=request.nextUrl
  const id=REVIEW?parseIdentity(request.cookies.get('rts-review')?.value):'visitor'
  const staff=id==='owner'||id==='assistant'
  const to=(path:string)=>NextResponse.redirect(new URL(path,request.url))
  if(pathname==='/admin'||pathname.startsWith('/admin/')){
    if(pathname==='/admin/security')return NextResponse.next()
    if(!staff)return to('/admin/security')
    if(request.cookies.get('rts-mfa')?.value!==id)return to('/admin/security?next='+encodeURIComponent(pathname))
  }
  if((pathname==='/account'||pathname.startsWith('/account/'))&&!(isMemberIdentity(id)||staff))
    return to('/sign-in?next='+encodeURIComponent(pathname))
  return NextResponse.next()
}

export const config={matcher:['/admin','/admin/:path*','/account','/account/:path*']}
