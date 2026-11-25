'use client'
import {useState,useEffect,type ReactNode} from 'react'
import Link from 'next/link'
import {useRouter,useSearchParams} from 'next/navigation'
import Image from 'next/image'
import {Button} from './ui/button'
import {sendMagicLink,signInWithGoogle} from '@/app/actions/auth'
import {Copy} from './editorial'
import {text} from '@/lib/editorial'
import {pageArt} from '@/lib/home-media'

/** D21 — split screen: a calm photo with her line on one side, the form on the other (a short photo band on phones). */
export function AuthLayout({children}:{children:ReactNode}){
  return <div className="auth-photo-split">
    <div className="auth-photo" aria-hidden>
      <Image src={pageArt.auth.src} alt="" fill priority sizes="(max-width:1023px) 100vw, 52vw"/>
      <Image className="auth-photo-logo" src="/brand/rts-logo-dark.png" alt="" width={1600} height={507} sizes="220px"/>
      <blockquote>&ldquo;You are not the avatar.&rdquo;</blockquote><small>Unplug. Remember. Return.</small>
    </div>
    <section className="auth">
      <Image className="mark mark-light" src="/brand/rts-mark-light.png" alt="" width={44} height={41} sizes="44px"/><Image className="mark mark-dark" src="/brand/rts-mark-dark.png" alt="" width={44} height={41} sizes="44px"/>
      {children}
    </section>
  </div>
}

export function SignIn(){
  const q=useSearchParams(),router=useRouter(),sent=q.get('sent')==='1',tier=q.get('intent')?.match(/^buy:tier-([123])$/)?.[1]
  // F-032 — the email survives a reload of the check-your-email state via `?email=`.
  const [email,setEmail]=useState(q.get('email')||''),[msg,setMsg]=useState(''),[busy,setBusy]=useState(false)
  const [until,setUntil]=useState(()=>sent?Date.now()+60000:0),[now,setNow]=useState(()=>Date.now())
  const left=Math.max(0,Math.ceil((until-now)/1000))
  useEffect(()=>{if(!sent||!left)return;const id=setInterval(()=>setNow(Date.now()),300);return()=>clearInterval(id)},[sent,left])
  async function submit(){
    setBusy(true);setMsg('')
    const r=await sendMagicLink(email,q.get('next')||undefined)
    setBusy(false)
    if(!r.ok){setMsg(r.error);return}
    setUntil(Date.now()+60000);setNow(Date.now())
    const n=new URLSearchParams(q);n.set('sent','1');n.set('email',email);router.replace('/sign-in?'+n)
  }
  return <AuthLayout>
    <h1>{sent?'Check your email':'Sign in'}</h1>
    <p>{sent?<>We&apos;ve sent a sign-in link to <strong><Copy s={email||'[email]'}/></strong>. It works once and expires soon.</>:text(320)}</p>
    {sent?<>
      <button className="textlink" onClick={()=>{const n=new URLSearchParams(q);n.delete('sent');n.delete('email');router.replace('/sign-in?'+n);setMsg('')}}>Use a different email</button>
      <button disabled={left>0||busy||!email} className="pill" onClick={submit}>{left?`Resend in ${left}s`:'Resend link'}</button>
    </>:<>
      {tier&&<p>Sign in to buy Tier {tier}. It only takes a moment.</p>}
      <form noValidate onSubmit={e=>{e.preventDefault();void submit()}}><label>Email address<input type="email" autoComplete="email" required value={email} placeholder="you@example.com" onChange={e=>setEmail(e.target.value)}/></label><Button disabled={busy} aria-busy={busy} type="submit">Send my sign-in link</Button></form>
      <div className="divider">or</div>
      <button className="outline" onClick={async()=>{const r=await signInWithGoogle();if(!r.ok)setMsg(r.error)}}>Continue with Google</button>
      <p className="fine"><Copy s={text(325)}/></p>
      <p className="fine">New here? <Link href={'/sign-up'+(q.toString()?'?'+q:'')}>Create an account</Link></p>
    </>}
    {(msg||q.get('expired')==='1')&&<p role="alert">{msg||'That link has expired or was already used. Request a new one below.'}</p>}
  </AuthLayout>
}
