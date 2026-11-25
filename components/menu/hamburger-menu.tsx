'use client'
import {useEffect,useRef,useState,type CSSProperties} from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {ArrowUpRight,ArrowRight,X,UserRound,Sun,Moon,LogOut} from 'lucide-react'
import {brand,nav} from '@/lib/editorial'
import {useMedia} from '../hooks'
import type {Identity} from '@/lib/types'
import {SovereigntySymbol} from './sovereignty-symbol'
import './menu.css'

const CLOSE_MS=480
const stagger=(i:number)=>({'--i':i} as CSSProperties)

type MenuProps={
  open:boolean
  /** Close and return focus to the trigger (Escape, close button). */
  onClose:()=>void
  /** Close after following a link (focus moves to the new page). */
  onNavigate:()=>void
  role:Identity; path:string; dark:boolean
  onTheme:()=>void
  onSignOut:()=>void
}

/** Keeps the overlay mounted for its closing animation; `phase` drives the CSS. */
function usePresence(open:boolean){
  const reduce=useMedia('(prefers-reduced-motion: reduce)')
  const [shown,setShown]=useState(open)
  if(open&&!shown)setShown(true)
  useEffect(()=>{if(open||!shown)return;const t=setTimeout(()=>setShown(false),reduce?0:CLOSE_MS);return()=>clearTimeout(t)},[open,shown,reduce])
  return shown
}

/** Background scroll lock (with scrollbar compensation), focus-in, Tab trap and Escape. */
function useDialogBehaviour(open:boolean,panel:React.RefObject<HTMLDivElement|null>,onClose:()=>void){
  const close=useRef(onClose)
  useEffect(()=>{close.current=onClose})
  useEffect(()=>{
    if(!open)return
    const html=document.documentElement,body=document.body,gap=window.innerWidth-html.clientWidth
    const prev={overflow:html.style.overflow,pad:body.style.paddingRight}
    html.style.overflow='hidden';if(gap>0)body.style.paddingRight=gap+'px'
    const el=panel.current
    el?.querySelector<HTMLElement>('.hm-nav a')?.focus({preventScroll:true})
    function onKey(e:KeyboardEvent){
      if(e.key==='Escape'){e.preventDefault();close.current();return}
      if(e.key!=='Tab'||!el)return
      const items=Array.from(el.querySelectorAll<HTMLElement>('a[href],button:not([disabled])'))
      if(!items.length)return
      const i=items.indexOf(document.activeElement as HTMLElement)
      e.preventDefault();items[(i+(e.shiftKey?-1:1)+items.length)%items.length].focus()
    }
    document.addEventListener('keydown',onKey)
    return()=>{document.removeEventListener('keydown',onKey);html.style.overflow=prev.overflow;body.style.paddingRight=prev.pad}
  },[open,panel])
}

export function HamburgerMenu(props:MenuProps){
  const {open,onClose}=props,panel=useRef<HTMLDivElement>(null),shown=usePresence(open)
  useDialogBehaviour(open,panel,onClose)
  if(!shown)return null
  const visitor=props.role==='visitor'
  return <div ref={panel} id="site-menu" className="hmenu" data-state={open?'open':'closed'} role="dialog" aria-modal="true" aria-label="Menu">
    <div className="hm-inner">
      <MenuHeader onClose={onClose} onNavigate={props.onNavigate}/>
      <div className="hm-body">
        <SovereigntySymbol className="hm-symbol"/>
        <NavigationLinks path={props.path} onNavigate={props.onNavigate}/>
      </div>
      <div className={'hm-foot'+(visitor?'':' hm-foot-member')}>
        <AccountActions {...props}/>
        {visitor&&<SignupCTA onNavigate={props.onNavigate}/>}
      </div>
    </div>
  </div>
}

export function MenuHeader({onClose,onNavigate}:{onClose:()=>void;onNavigate:()=>void}){
  return <div className="hm-top">
    <Link href="/" className="hm-logo" onClick={onNavigate} aria-label={`${brand} — home`}>
      <Image className="logo-light" src="/brand/rts-logo-light.png" alt="" width={1600} height={507} sizes="(min-width: 1024px) 320px, 200px"/>
      <Image className="logo-dark" src="/brand/rts-logo-dark.png" alt="" width={1600} height={507} sizes="(min-width: 1024px) 320px, 200px"/>
    </Link>
    <button type="button" className="hm-close" onClick={onClose} aria-label="Close menu"><span className="hm-close-label" aria-hidden>Close</span><X aria-hidden/></button>
  </div>
}

export function NavigationLinks({path,onNavigate}:{path:string;onNavigate:()=>void}){
  return <nav className="hm-nav" aria-label="Main"><ol>
    {nav.map((n,i)=>{const href='/'+n.toLowerCase(),current=path===href||path.startsWith(href+'/')
      return <li key={n} style={stagger(i)}><Link href={href} aria-current={current?'page':undefined} onClick={onNavigate}>
        <span className="hm-num" aria-hidden>{String(i+1).padStart(2,'0')}</span>
        <span className="hm-label">{n}</span>
        <ArrowUpRight className="hm-arrow" aria-hidden/>
      </Link></li>})}
  </ol></nav>
}

export function AccountActions({role,dark,onTheme,onSignOut,onNavigate}:MenuProps){
  const staff=role==='owner'||role==='assistant'
  return <div className="hm-utility">
    {role==='visitor'
      ?<Link className="hm-util" href="/sign-in" onClick={onNavigate}><UserRound aria-hidden/>Sign in</Link>
      :<>
        <Link className="hm-util" href={staff?'/admin':'/account/library'} onClick={onNavigate}><UserRound aria-hidden/>{staff?'Dashboard':'My library'}</Link>
        <Link className="hm-util" href="/account" onClick={onNavigate}>Account</Link>
        <button type="button" className="hm-util" onClick={onSignOut}><LogOut aria-hidden/>Sign out</button>
      </>}
    <button type="button" className="hm-util" onClick={onTheme} aria-label={dark?'Switch to light mode':'Switch to dark mode'}>{dark?<Sun aria-hidden/>:<Moon aria-hidden/>}{dark?'Light mode':'Dark mode'}</button>
  </div>
}

export function SignupCTA({onNavigate}:{onNavigate:()=>void}){
  return <Link className="hm-cta" href="/sign-up" onClick={onNavigate}>
    <span className="hm-cta-text">Begin your journey.</span>
    <span className="hm-cta-action">Sign up<ArrowRight aria-hidden/></span>
  </Link>
}
