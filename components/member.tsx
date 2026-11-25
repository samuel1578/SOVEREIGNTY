'use client'
import useSWR,{mutate as refresh} from 'swr'
import {useState,useEffect,type ReactNode} from 'react'
import {useRouter,useSearchParams} from 'next/navigation'
import Link from 'next/link'
import {read} from '@/lib/client'
import {getSession,signOut} from '@/app/actions/auth'
import {getLibrary,getEntitlement,getProgress,listPurchases,updateProfile,deleteAccount,getContinueListening} from '@/app/actions/member'
import {listAudio} from '@/app/actions/audio'
import type {ContinueListening} from '@/lib/types'
import {listTiers,getLesson,listLessons,getTier,listModules} from '@/app/actions/courses'
import {price} from '@/lib/editorial'
import {clock,formatDuration,isComplete} from '@/lib/format'
import {useRole} from './shell'
import {Copy,Action,Intro,Section} from './editorial'
import {SignedOut,Failure,Dialog,Missing,SkeletonPage,SkeletonCard,SkeletonText} from './states'
import {TierCard,Transcript,HeroPlayer,LessonDot,useTierProgress,lessonTrack,Rail,ArtCard,NextLine,NextLessonCard} from './catalog'
import Image from 'next/image'
import {Check,Play} from 'lucide-react'
import {tierArt,libraryHero,libraryWelcome} from '@/lib/home-media'
import {usePlayer} from './player'
import {useMedia,useThemePreference,useTextSize,TEXT_SIZES,type Theme,type TextSize} from './hooks'
import {Avatar,PhotoPicker} from './profile'
import {updateAvatar} from '@/app/actions/onboarding'

/** First name, unless the name is still a `[PLACEHOLDER]`. */
const firstName=(name?:string)=>!name?'there':name.startsWith('[')?name:name.split(' ')[0]
/** Preferred name from onboarding, else first name. */
const greet=(s?:{name:string;onboarding?:{preferredName?:string}}|null)=>s?.onboarding?.preferredName||firstName(s?.name)

/** Greeting by time of day (client clock). */
const partOfDay=()=>{const h=new Date().getHours();return h<12?'morning':h<18?'afternoon':'evening'}

/** Large "Continue your practice" card (D19). Resume plays from the saved spot and opens the full player. */
function ContinueCard({resume,theme}:{resume:ContinueListening;theme:string}){
  const p=usePlayer(),{data:l}=useSWR(['continue-lesson',resume.tierKey,resume.lessonSlug],()=>read(getLesson(resume.tierKey,resume.lessonSlug)))
  const left=Math.max(0,resume.durationSeconds-resume.positionSeconds),pct=resume.durationSeconds?Math.min(100,resume.positionSeconds/resume.durationSeconds*100):0
  const art=tierArt[resume.tierKey]
  return <section className="continue-card" data-tier={theme} aria-labelledby="continue-h">
    <div className="continue-art"><Image src={art.src} alt="" fill sizes="(max-width:767px) 100vw, 55vw"/><span className="continue-orb" aria-hidden><i/></span></div>
    <div className="continue-text">
      <small className="eyebrow">Continue your practice</small>
      <h2 id="continue-h"><Copy s={resume.lessonTitle}/></h2>
      <p className="continue-meta"><Copy s={resume.tierName}/></p>
      <span className="tier-bar" role="progressbar" aria-label="Lesson progress" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}><i style={{width:pct+'%'}}/></span>
      <p className="continue-meta">{clock(left)} left</p>
      <div className="actions">
        <button className="pill" disabled={!l} onClick={()=>{if(!l)return;p.play(lessonTrack(l,{name:resume.tierName,key:resume.tierKey}),resume.positionSeconds);p.expand()}}><Play size={16}/>Resume</button>
        <Link className="hero-link" href={`/courses/${resume.tierKey}/learn/${resume.lessonSlug}`}>Open the lesson</Link>
      </div>
    </div>
  </section>
}

export function Library(){
  const role=useRole(),{data,error,mutate}=useSWR(role==='visitor'?null:['library',role],()=>Promise.all([read(getSession()),read(getLibrary()),read(listTiers()),read(getContinueListening()),read(listAudio({}))]))
  if(role==='visitor')return <SignedOut/>
  if(error)return <Failure retry={mutate}/>
  if(!data)return <SkeletonPage cards={3}/>
  const [s,owned,tiers,resume,audio]=data
  const others=tiers.filter(t=>!owned.some(o=>o.id===t.id))
  const completed=owned.reduce((n,t)=>n+t.completedCount,0),toGo=owned.reduce((n,t)=>n+Math.max(0,t.publishedCount-t.completedCount),0)
  const resumeTheme=resume&&(owned.find(t=>t.key===resume.tierKey)?.theme||'brown')
  return <>
    <section className="photo-hero dash-hero">
      <div className="photo-hero-bg"><Image src={libraryHero.src} alt={libraryHero.alt} fill priority sizes="100vw"/></div>
      <div className="wrap photo-hero-in dash-hero-in">
        <Avatar src={s?.avatarUrl} name={s?.name} size={88} label={s?.avatarUrl?'Your profile photo':undefined}/>
        <div><small className="eyebrow">My library</small><h1><Copy s={`Good ${partOfDay()}, ${greet(s)}.`}/></h1>
          <p>{owned.length?'Welcome back. Your next lesson is waiting whenever you are.':'Welcome. This is your quiet corner, and it fills up as you listen.'}</p>
          {!s?.avatarUrl&&<Link className="hero-link" href="/account#profile">Add a profile photo</Link>}</div>
      </div>
    </section>
    {owned.length?<>
      {resume&&<div className="wrap dash-block"><ContinueCard resume={resume} theme={resumeTheme||'brown'}/></div>}
      <div className="wrap dash-block"><div className="dash-stats">
        <div><small>Lessons completed</small><b>{completed}</b><small>across your tiers</small></div>
        <div><small>Lessons to go</small><b>{toGo}</b><small>at your own pace</small></div>
        <div><small>Your tiers</small><b>{owned.length}</b><small>yours for life</small></div>
      </div></div>
      <div className="surface"><section className="wrap section">
        <div className="dash-head"><h2>My tiers</h2><Link className="textlink" href="/courses">View all courses</Link></div>
        <div className="grid3 door-grid">{owned.map(t=><TierCard key={t.key} tier={t} owned extra={<NextLine tierKey={t.key}/>}/>)}{others.map(t=><TierCard key={t.id} tier={t}/>)}</div>
      </section></div>
      <Rail title="Next up" href="/listen">
        {owned.map(t=><NextLessonCard key={t.key} tier={t}/>)}
        {audio.slice(0,4).map(a=><ArtCard key={a.id} a={a}/>)}
      </Rail>
      <div className="dash-gap"/>
    </>:<>
      <div className="wrap dash-block">
        <div className="welcome-card"><div className="welcome-img"><Image src={libraryWelcome.src} alt={libraryWelcome.alt} fill sizes="(max-width:767px) 100vw, 50vw"/></div>
          <div className="welcome-text"><small className="eyebrow">Your library is empty, for now</small><h2>Begin with a few minutes of quiet.</h2><p>Start with the free audio, or choose a course tier when you&apos;re ready.</p>
            <div className="actions"><Action href="/listen">Start listening — free</Action><Action quiet href="/courses">View the tiers</Action></div></div></div>
        <ol className="welcome-steps">{[['Listen free','Press play on any free session. No cost.'],['Choose a tier','Pay once, keep it for life.'],['Come back anytime','Your place is saved here, on any device.']].map(([h,b],i)=><li key={h}><small className="eyebrow">0{i+1}</small><h3>{h}</h3><p>{b}</p></li>)}</ol>
      </div>
      <div className="surface"><Section title="Explore the tiers"><div className="grid3 door-grid">{tiers.map(t=><TierCard key={t.id} tier={t}/>)}</div></Section></div>
    </>}
  </>
}

function Sheet({title,children}:{title:string;children:ReactNode}){
  const desktop=useMedia('(min-width: 768px)',true),[sheetOpen,setSheetOpen]=useState(false)
  return <details className="panel sheet" open={desktop||sheetOpen} onToggle={e=>{if(!desktop)setSheetOpen(e.currentTarget.open)}}><summary onClick={e=>{if(desktop)e.preventDefault()}}><h3>{title}</h3></summary><div className="sheet-body">{children}</div></details>
}

export function Learn({id,slug}:{id:string;slug:string}){
  const role=useRole(),p=usePlayer(),[dismiss,setDismiss]=useState(false)
  const {data,error,mutate}=useSWR(['learn',id,slug,role],()=>Promise.all([read(getTier(id)),read(getLesson(id,slug)),read(listLessons(id)),role==='visitor'?Promise.resolve(false):read(getEntitlement(id)),read(listModules(id))]))
  const l=data?.[1],lessons=data?.[2]||[],owned=!!data?.[3]
  const prog=useSWR(l&&role!=='visitor'?['progress',role,l.id]:null,()=>read(getProgress(l!.id)))
  const all=useTierProgress(id,lessons.map(x=>x.id),owned)
  if(error)return <Failure retry={mutate}/>
  if(!data)return <SkeletonPage player/>
  const [t,,,,mods]=data
  if(!t||!l)return <Missing/>
  if(!owned&&!l.isPreview)return <><Intro title={`This lesson is for ${t.label} members.`} body={`Buy ${t.label} once and keep every lesson for life.`}/><Section><Action href={'/courses/'+id}><Copy s={`Buy ${t.label} — ${price(t.pricePence)}`}/></Action></Section></>
  const track=lessonTrack(l,t),art=tierArt[t.key]
  const active=p.track?.id===l.id,pos=prog.data?.positionSeconds||0
  const done=!!prog.data?.completedAt||active&&isComplete(p.pos,p.duration)
  const n=lessons.findIndex(x=>x.id===l.id),next=lessons.slice(n+1).find(x=>x.status==='published')
  const published=lessons.filter(x=>x.status==='published')
  // Current lesson counts as complete as soon as it finishes, before the saved progress refreshes.
  const isDone=(x:{id:string})=>x.id===l.id?done:!!all?.[lessons.findIndex(y=>y.id===x.id)]?.completedAt
  const doneCount=published.filter(isDone).length
  return <>
    <div className="learn-head" data-tier={t.theme}><div className="wrap">
      <nav className="crumb" aria-label="Breadcrumb"><Link href={'/courses/'+id}><Copy s={t.name}/></Link> › <Copy s={l.moduleTitle||'[Module title]'}/></nav>
      <h1><Copy s={l.title}/></h1>
      <p className="learn-meta"><span>Lesson {n+1} of {lessons.length}</span><span>{formatDuration(l.durationSeconds)}</span></p>
      {owned&&<div className="learn-bar"><span>Tier progress</span><span className="tier-bar" role="progressbar" aria-label="Tier progress" aria-valuenow={doneCount} aria-valuemin={0} aria-valuemax={published.length}><i style={{width:`${published.length?doneCount/published.length*100:0}%`}}/></span><span>{doneCount} / {published.length}</span></div>}
    </div></div>
    <div className="wrap section learn-grid"><div>
      {l.status!=='published'?<h3>Coming soon</h3>:<>
        <div className="stage">
          <div className="stage-bg"><Image src={art.src} alt={art.alt} fill priority sizes="(max-width:1023px) 100vw, 66vw"/></div>
          {prog.isLoading&&<SkeletonText lines={1}/>}
          {pos>10&&!dismiss&&!done&&!active&&<div className="stage-resume"><span>Pick up where you left off at {clock(pos)}?</span><div className="actions">{['Resume','Start from the beginning'].map((v,i)=><button key={v} className={i?'hero-link':'pill'} onClick={()=>{setDismiss(true);p.play(track,i?0:pos)}}>{v}</button>)}</div></div>}
          <HeroPlayer t={track}/>
        </div>
        {done&&<div className="lesson-done" role="status">
          <span className="lesson-done-check" aria-hidden><Check size={28}/></span>
          <div><h2>Lesson complete.</h2><p>Take a breath before the next one.</p></div>
          {next&&<div className="up-next"><span className="up-next-art"><Image src={art.src} alt="" fill sizes="88px"/></span><div><small>Next · {formatDuration(next.durationSeconds)}</small><Link href={`/courses/${id}/learn/${next.slug}`}><b><Copy s={next.title}/></b></Link></div><Link className="pill" href={`/courses/${id}/learn/${next.slug}`}>Next lesson</Link></div>}
        </div>}
        <Transcript lesson md={l.transcriptStatus==='approved'?l.transcriptMd:undefined}/>
      </>}
    </div>
    <Sheet title="In this tier">
      {owned&&<p className="fine sheet-count">{doneCount} of {published.length} complete</p>}
      {(mods.length?mods:[{id:'',title:''}]).map((m,i)=>{const ls=m.id?lessons.filter(x=>x.moduleId===m.id):lessons;return ls.length?<div key={m.id||i}>
        {m.title&&<small className="eyebrow sheet-mod"><Copy s={m.title}/></small>}
        {ls.map(x=><Link key={x.id} className="lesson-row lrow" aria-current={x.id===l.id?'page':undefined} href={`/courses/${id}/learn/${x.slug}`}>
          <LessonDot p={x.id===l.id?{positionSeconds:pos,completedAt:done?'done':null}:all?.[lessons.findIndex(y=>y.id===x.id)]} current={x.id===l.id}/>
          <Copy s={x.title}/><small>{formatDuration(x.durationSeconds)}</small></Link>)}
      </div>:null})}
    </Sheet>
    </div></>
}

const ACCOUNT_NAV=[['profile','Profile'],['purchases','Purchases'],['preferences','Preferences'],['sign-out','Sign out'],['delete','Delete account']] as const
const TEXT_LABELS:Record<TextSize,string>={standard:'Standard',large:'Large',xlarge:'Larger'}

export function Account(){
  const role=useRole(),router=useRouter(),[msg,setMsg]=useState(''),[modal,setModal]=useState(false),[confirm,setConfirm]=useState(''),[photoBusy,setPhotoBusy]=useState(false)
  const {theme,choose:chooseTheme}=useThemePreference(),{size,choose:chooseSize}=useTextSize()
  const {data,error,mutate}=useSWR(role==='visitor'?null:['account',role],()=>Promise.all([read(getSession()),read(listPurchases()),read(listTiers())]))
  if(role==='visitor')return <SignedOut/>
  if(error)return <Failure retry={mutate}/>
  if(!data)return <SkeletonPage/>
  const [s,bills,tiers]=data
  if(!s)return <SignedOut/>
  const leave=()=>{window.dispatchEvent(new Event('rts-role'));void refresh(()=>true);router.push('/')}
  const savePhoto=async(v:string|null)=>{setPhotoBusy(true);const r=await updateAvatar(v);setPhotoBusy(false);setMsg(r.ok?(v?'Photo saved.':'Photo removed.'):r.error);if(r.ok)void mutate()}
  // Purchase lines are "[Tier name] · £[amount] · [date]"; match the tier for its photo.
  const tierFor=(line:string)=>tiers.find(t=>line.startsWith(t.name)||line.includes(t.label))
  return <>
    <section className="intro"><div className="wrap"><small className="eyebrow">Account</small><h1>Your account</h1></div></section>
    <div className="wrap section account-layout">
      <nav className="account-nav" aria-label="Account sections">{ACCOUNT_NAV.map(([id,label])=><a key={id} href={'#'+id} className={id==='delete'?'danger-link':undefined}>{label}</a>)}</nav>
      <div>
        <section className="account-panel" id="profile" aria-labelledby="profile-h"><h2 id="profile-h">Profile</h2><p className="fine">How you appear around the site.</p>
          <div id="photo"><PhotoPicker value={s.avatarUrl} name={s.name} busy={photoBusy} onChange={savePhoto}/></div>
          <form key={role} className="form-stack account-form" onSubmit={async e=>{e.preventDefault();const r=await updateProfile(String(new FormData(e.currentTarget).get('name')));setMsg(r.ok?'Saved.':r.error);if(r.ok)void refresh(()=>true)}}>
            <label>Name<input name="name" defaultValue={s.name} required/></label>
            <label>Email<input readOnly value={s.email}/><small className="fine">Your sign-in email can&apos;t be changed here.</small></label>
            <button className="pill">Save changes</button><span role="status">{msg}</span>
          </form></section>
        <section className="account-panel" id="purchases" aria-labelledby="purchases-h"><h2 id="purchases-h">Purchases</h2><p className="fine">Each tier is a one-time purchase with lifetime access.</p>
          {bills.length?<ul className="purchases">{bills.map(x=>{const t=tierFor(x);return <li key={x}>
            <span className="purchase-art">{t&&<Image src={tierArt[t.key].src} alt="" fill sizes="64px"/>}</span><Copy s={x}/></li>})}</ul>:<p>No purchases yet.</p>}</section>
        <section className="account-panel" id="preferences" aria-labelledby="preferences-h"><h2 id="preferences-h">Preferences</h2><p className="fine">Saved on this device.</p>
          <div className="pref-row"><div><b>Theme</b><small>Light, dark or match your device.</small></div>
            <div className="seg" role="group" aria-label="Theme">{(['Light','Dark','System'] as Theme[]).map(v=><button key={v} aria-pressed={theme===v} onClick={()=>chooseTheme(v)}>{v}</button>)}</div></div>
          <div className="pref-row"><div><b>Text size</b><small>Makes reading pages and transcripts larger.</small></div>
            <div className="seg" role="group" aria-label="Text size">{TEXT_SIZES.map(v=><button key={v} aria-pressed={(size||'standard')===v} onClick={()=>chooseSize(v)}>{TEXT_LABELS[v]}</button>)}</div></div>
        </section>
        <section className="account-panel" id="sign-out" aria-labelledby="sign-out-h"><h2 id="sign-out-h">Sign out</h2><p className="fine">You can sign back in any time with your email.</p>
          <button className="outline" onClick={async()=>{await signOut();leave()}}>Sign out</button></section>
        <section className="account-panel danger-zone" id="delete" aria-labelledby="delete-h"><h2 id="delete-h">Delete my account</h2><p>This permanently removes your account, your progress and your access to any tiers you&apos;ve bought. Purchase records required by law are kept in anonymised form.</p>
          <button className="outline danger" onClick={()=>setModal(true)}>Delete my account</button></section>
      </div>
    </div>
    {modal&&<Dialog title="Delete my account" close={()=>setModal(false)}><label>Type DELETE to confirm<input value={confirm} onChange={e=>setConfirm(e.target.value)}/></label><button className="pill" disabled={confirm!=='DELETE'} onClick={async()=>{const r=await deleteAccount();if(r.ok)leave();else setMsg(r.error)}}>Delete permanently</button></Dialog>}
  </>
}

export function Checkout(){
  const role=useRole(),q=useSearchParams(),id=q.get('tier')||'tier-1',[late,setLate]=useState(false)
  // Polls getEntitlement every 2 s (structure M04); success is derived, "slow" after 30 s.
  const {data:ent}=useSWR(role!=='visitor'?['entitlement',role,id]:null,()=>read(getEntitlement(id)),{refreshInterval:d=>d?0:2000})
  const success=!!ent&&q.get('mock')!=='slow',state=success?'success':late?'slow':'waiting'
  useEffect(()=>{if(role==='visitor')return;const t=setTimeout(()=>setLate(true),30000);return()=>clearTimeout(t)},[role])
  if(role==='visitor')return <SignedOut/>
  const label=`Tier ${id.slice(-1)}`
  // F-018 — the slow state has body + button only (content.md M04); no invented heading.
  return <div className="section narrow" role="status" aria-live="polite">
    {state==='waiting'&&<><h1>Confirming your payment…</h1><p>This usually takes a few seconds. Please don&apos;t close this page.</p><SkeletonCard count={1}/></>}
    {state==='success'&&<><h1>Welcome, member.</h1><p>{label} is now in your library for life.</p></>}
    {state==='slow'&&<p>Your payment went through, but your access is taking longer than usual. It will appear in your library shortly — we&apos;ve also emailed your receipt.</p>}
    {state!=='waiting'&&<div className="actions">{state==='success'&&<Action href={'/courses/'+id}>Start {label}</Action>}<Action quiet href="/account/library">Go to my library</Action></div>}
  </div>
}
