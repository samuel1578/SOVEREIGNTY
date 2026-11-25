'use client'
import {createContext,useContext,useEffect,useRef,useState,Suspense,type ReactNode} from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {usePathname,useRouter} from 'next/navigation'
import {ChevronDown,Menu,UserRound,SlidersHorizontal,Sun,Moon} from 'lucide-react'
import {brand,nav,legal,text} from '@/lib/editorial'
import {ScrollReset} from './scroll-reset'
import {REVIEW} from '@/lib/config'
import {useIdentity,useMedia,useThemePreference,applyTheme,type Theme} from './hooks'
import {switchIdentity} from '@/app/actions/auth'
import type {Identity,ReviewIdentity} from '@/lib/types'
import {mutate} from 'swr'
import {Copy,Wellbeing} from './editorial'
import {PlayerProvider} from './player'
import {HamburgerMenu} from './menu/hamburger-menu'

const RoleContext=createContext<Identity>('visitor');export const useRole=()=>useContext(RoleContext)
const roles:Record<ReviewIdentity,string>={visitor:'Visitor',member:'Member (owns Tier 1)',empty:'Member (no tiers)',assistant:'Assistant',owner:'Owner'}

// D5 — theme. The inline script in app/layout.tsx applies the stored choice before paint; this keeps it live.
function useTheme(){
  const {theme,choose}=useThemePreference(),systemDark=useMedia('(prefers-color-scheme: dark)')
  const dark=theme==='Dark'||theme==='System'&&systemDark
  // Reads live values (not the hydration snapshot) so the pre-paint theme is never overwritten.
  useEffect(()=>{applyTheme()},[dark,theme])
  return {theme,dark,choose}
}

/** Both logos render; CSS shows the right one per theme and over the film (no hydration flash). */
const Logo=({className='',priority=false}:{className?:string;priority?:boolean})=><span className={'logo '+className}>
  <Image className="logo-light" src="/brand/rts-logo-light.png" alt={brand} width={192} height={61} priority={priority} sizes="(max-width: 850px) 150px, 178px"/>
  <Image className="logo-dark" src="/brand/rts-logo-dark.png" alt={brand} width={192} height={61} priority={priority} sizes="(max-width: 850px) 150px, 178px"/>
</span>

type RoleProps={role:Identity}
/** Switches the mock identity on the server (D4/D6), then refreshes client state and routes sensibly. */
function useChangeRole({path}:{path:string}){
  const router=useRouter()
  return async(r:Identity)=>{
    await switchIdentity(r)
    window.dispatchEvent(new Event('rts-role'));void mutate(()=>true)
    if(r==='owner'||r==='assistant')router.push('/admin/security')
    else if(path.startsWith('/admin'))router.push(r==='visitor'?'/':'/account/library')
    else router.refresh()
  }
}

// usePathname() is runtime data on dynamic routes; Cache Components needs it inside <Suspense>.
// Static routes prerender the real header; dynamic ones stream it in after a path-less fallback.
function PathHeader(props:RoleProps&{dark:boolean;choose:(t:Theme)=>void}){const path=usePathname();return <Header {...props} path={path}/>}
function PathReview(props:RoleProps){const path=usePathname();return <Review {...props} path={path}/>}

export function Shell({children}:{children:ReactNode}){
  const {theme,dark,choose}=useTheme(),role=useIdentity()
  const header={role,dark,choose}
  return <RoleContext.Provider value={role}><PlayerProvider>
    <a href="#main" className="skip">Skip to main content</a>
    <Suspense fallback={null}><ScrollReset/></Suspense>
    <Suspense fallback={<Header {...header} path=""/>}><PathHeader {...header}/></Suspense>
    <main id="main">{children}</main>
    <footer><div className="wrap">
      <div className="footer-grid"><div><Logo className="on-dark"/><p>{text(35)}</p></div>
        {[['Explore',...nav],['Members','Sign in','My library','Account'],['Legal',...legal]].map(([title,...entries])=><div key={title}><b>{title}</b>{entries.map(n=><Link key={n} href={'/'+(n==='My library'?'account/library':n==='Sign in'?'sign-in':n.toLowerCase())}>{n}</Link>)}</div>)}
        <div><b>Contact</b><Copy s="[CONTACT EMAIL]"/><Copy s="[SOCIAL LINKS — Instagram / YouTube / other, client to confirm]"/></div>
      </div>
      <Wellbeing/>
      <div className="footer-end"><Copy s="© [YEAR] Reset to Sovereignty. All rights reserved."/><select aria-label="Light / Dark / System" value={theme} onChange={e=>choose(e.target.value as Theme)}>{['Light','Dark','System'].map(t=><option key={t}>{t}</option>)}</select></div>
    </div></footer>
    {REVIEW&&<Suspense fallback={null}><PathReview role={role}/></Suspense>}
  </PlayerProvider></RoleContext.Provider>
}

function Header({role,dark,choose,path}:RoleProps&{dark:boolean;choose:(t:Theme)=>void;path:string}){
  const router=useRouter(),change=useChangeRole({path})
  const [scroll,setScroll]=useState(false),[menu,setMenu]=useState(false),[avatar,setAvatar]=useState(false)
  const menuButton=useRef<HTMLButtonElement>(null),avatarButton=useRef<HTMLButtonElement>(null),avatarPanel=useRef<HTMLDivElement>(null)
  // Home revamp: the header stays see-through while it sits over a photo section (`[data-dark]`), solid elsewhere.
  useEffect(()=>{const fn=()=>{const h=document.querySelector('.head')?.getBoundingClientRect().bottom??96,under=document.elementFromPoint(innerWidth/2,h+2);setScroll(window.scrollY>80&&!under?.closest('[data-dark]'))};fn();window.addEventListener('scroll',fn,{passive:true});return()=>window.removeEventListener('scroll',fn)},[path])
  // Close menus on navigation (render-time reset, not an effect).
  const [seen,setSeen]=useState(path)
  if(seen!==path){setSeen(path);setMenu(false);setAvatar(false)}
  // Full-screen menu (components/menu): focus, Tab trap, Escape and scroll lock live in HamburgerMenu.
  const closeMenu=()=>{setMenu(false);menuButton.current?.focus()}
  // F-016 — avatar popover: focus first item, Escape or outside click closes, focus returns.
  useEffect(()=>{
    if(!avatar)return
    avatarPanel.current?.querySelector<HTMLElement>('a,button')?.focus()
    const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape'){setAvatar(false);avatarButton.current?.focus()}}
    const onClick=(e:MouseEvent)=>{if(!avatarPanel.current?.contains(e.target as Node)&&!avatarButton.current?.contains(e.target as Node))setAvatar(false)}
    document.addEventListener('keydown',onKey);document.addEventListener('mousedown',onClick)
    return()=>{document.removeEventListener('keydown',onKey);document.removeEventListener('mousedown',onClick)}
  },[avatar])
  const cinema=path==='/'&&!scroll&&!menu,staffRole=role==='assistant'||role==='owner'
  return <>
    <header className={'head '+(cinema?'cinema ':'')+(path==='/'?'homehead':'')}><div className="header-inner">
      <Link href="/" className="brand"><Logo priority/><Image className="compact-mark logo-light" src="/brand/rts-mark-light.png" alt={brand} width={45} height={42} sizes="45px"/><Image className="compact-mark logo-dark" src="/brand/rts-mark-dark.png" alt={brand} width={45} height={42} sizes="45px"/></Link>
      <nav className="desktop-nav" aria-label="Main">{nav.map(n=><Link key={n} aria-current={path.startsWith('/'+n.toLowerCase())?'page':undefined} className={[path.startsWith('/'+n.toLowerCase())?'current':'',n==='Contact'?'nav-contact':''].filter(Boolean).join(' ')||undefined} href={'/'+n.toLowerCase()}>{n}</Link>)}</nav>
      <div className="head-right">
        <button className="icon theme-toggle" aria-label={dark?'Switch to light mode':'Switch to dark mode'} onClick={()=>choose(dark?'Light':'Dark')}>{dark?<Sun/>:<Moon/>}</button>
        {role==='visitor'?<><Link className="signin signin-visitor" href="/sign-in"><UserRound size={15}/>Sign in</Link><Link className="signup" href="/sign-up">Sign up</Link></>:<>
          <Link className="signin" href={staffRole?'/admin':'/account/library'}>{staffRole?'Dashboard':'My library'}</Link>
          <button ref={avatarButton} className="icon" onClick={()=>setAvatar(!avatar)} aria-label="Account" aria-expanded={avatar} aria-controls="profile-menu" aria-haspopup="true"><UserRound/></button>
          {avatar&&<div ref={avatarPanel} id="profile-menu" className="popover profile"><Link href="/account">Account</Link><button onClick={()=>{void change('visitor').then(()=>router.push('/'))}}>Sign out</button></div>}
        </>}
        <button ref={menuButton} className="mobile-button icon menu-trigger" aria-expanded={menu} aria-controls="site-menu" aria-haspopup="dialog" aria-label="Open menu" onClick={()=>setMenu(true)}><Menu/></button>
      </div>
    </div></header>
    <HamburgerMenu open={menu} onClose={closeMenu} onNavigate={()=>setMenu(false)} role={role} path={path} dark={dark} onTheme={()=>choose(dark?'Light':'Dark')} onSignOut={()=>{setMenu(false);void change('visitor').then(()=>router.push('/'))}}/>
  </>
}

function Review({role,path}:RoleProps&{path:string}){
  const [rev,setRev]=useState(false),change=useChangeRole({path}),[seen,setSeen]=useState(path)
  if(seen!==path){setSeen(path);setRev(false)}
  useEffect(()=>{if(!rev)return;const f=(e:KeyboardEvent)=>{if(e.key==='Escape')setRev(false)};document.addEventListener('keydown',f);return()=>document.removeEventListener('keydown',f)},[rev])
  return <div className="review">{rev&&<div className="popover" id="review-menu">{Object.entries(roles).map(([k,v])=><button key={k} aria-pressed={role===k} onClick={()=>{setRev(false);void change(k as Identity)}}>{v}</button>)}</div>}<button className="review-toggle" aria-expanded={rev} aria-controls="review-menu" onClick={()=>setRev(!rev)}><SlidersHorizontal size={13}/>{(roles[role as ReviewIdentity]??'Member (new)').split(' (')[0]}<ChevronDown size={12}/></button></div>
}
