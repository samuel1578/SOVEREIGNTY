'use client'
import useSWR from 'swr'
import Image from 'next/image'
import Link from 'next/link'
import {useRouter,useSearchParams} from 'next/navigation'
import {useState,useRef,useEffect,type ReactNode,type CSSProperties} from 'react'
import {Headphones,Play,Pause,LockKeyhole,Check,ArrowRight,ArrowLeft,RotateCcw,RotateCw,Infinity as InfinityIcon,FileText,History} from 'lucide-react'
import {listAudio,listCategories,getPlaybackUrl} from '@/app/actions/audio'
import {getTier,listTiers,listLessons,listModules} from '@/app/actions/courses'
import {getLibrary,getEntitlement,getContinueListening,getProgress} from '@/app/actions/member'
import {startCheckout} from '@/app/actions/checkout'
import {read} from '@/lib/client'
import type {AudioItem,AudioCategory,TierSummary,OwnedTier,TierKey} from '@/lib/types'
import {coverFor,audioArt,listenUpsell,tierArt,coursesHero} from '@/lib/home-media'
import {text,line,price} from '@/lib/editorial'
import {formatDuration,formatHours,clock} from '@/lib/format'
import {Intro,Section,Copy,Action,Refund,Wellbeing,Article} from './editorial'
import {usePlayer,keys,blockSpace,type Track} from './player'
import {useRole} from './shell'
import {Failure,Missing,SkeletonCard,SkeletonPage} from './states'

export const source=(id:string,kind:'audio'|'lesson')=>()=>getPlaybackUrl({id,kind})
const plural=(n:number,word:string)=>`${n} ${word}${n===1?'':'s'}`
const DOWNLOAD_NOTE="Audio streams here and can't be downloaded."
/** D4 — visible marker so a review-only sample price is never mistaken for launch pricing. */
export const ReviewPrice=({show}:{show:boolean})=>show?<span className="badge">Review price</span>:null

export function Transcript({md,lesson=false}:{md?:string;lesson?:boolean}){const [show,S]=useState(false);return <div className="transcript"><h3>Transcript</h3><button className="textlink" aria-expanded={show} onClick={()=>S(!show)}>{show?'Hide':'Show'} transcript</button>{show&&<Article value={md||`The transcript for this ${lesson?'lesson':'audio'} is coming soon.`}/>}</div>}

type Cat={title:string;slug:string}
const audioHref=(a:AudioItem,cat?:Cat)=>cat?`/listen/${cat.slug}/${a.slug}`:'/listen'
/** Player track for a free audio item, with artwork and a link back to its page for the now-playing view. */
export const audioTrack=(a:AudioItem,cat?:Cat):Track=>({id:a.id,title:a.title,group:cat?.title||'Free audio',kind:'audio',duration:a.durationSeconds,getSourceUrl:source(a.id,'audio'),cover:coverFor(a),href:audioHref(a,cat)})

/** Artwork card (UI revamp): cover image with a play button, duration and title. Short audio (≤ 5 min) gets a square card. */
export function ArtCard({a,cat,wide=false}:{a:AudioItem;cat?:Cat;wide?:boolean}){
  const p=usePlayer(),on=p.track?.id===a.id&&p.playing,short=a.durationSeconds<=300
  return <article className={'rail-card'+(wide?' wide':short?' square':'')}>
    <div className="art">
      <Image src={coverFor(a)} alt={a.coverAlt||''} fill sizes={wide?'(max-width:767px) 85vw, 40vw':'(max-width:767px) 65vw, 24vw'}/>
      <span className="dur">{formatDuration(a.durationSeconds)}</span>
      <button className="play" aria-label={`${on?'Pause':'Play'} ${a.title}`} onClick={()=>p.play(audioTrack(a,cat))}>{on?<Pause size={18}/>:<Play size={18}/>}</button>
    </div>
    <small>{cat?<Copy s={cat.title}/>:'Free audio'}</small>
    <Link href={audioHref(a,cat)}><b><Copy s={a.title}/></b></Link>
  </article>
}

/** Sideways row with a heading, an optional "See all" link and ← → buttons on laptops. */
export function Rail({title,href,children}:{title:ReactNode;href?:string;children:ReactNode}){
  const ref=useRef<HTMLDivElement>(null),go=(d:number)=>ref.current?.scrollBy({left:d*ref.current.clientWidth*.7,behavior:'smooth'})
  return <section className="lib-row">
    <div className="wrap lib-row-head"><h2>{title}</h2>{href&&<Link className="textlink" href={href}>See all</Link>}
      <span className="lib-arrows"><button className="round-btn" aria-label="Scroll left" onClick={()=>go(-1)}><ArrowLeft size={18}/></button><button className="round-btn" aria-label="Scroll right" onClick={()=>go(1)}><ArrowRight size={18}/></button></span></div>
    <div className="rail" ref={ref}>{children}</div>
  </section>
}

/** Course link with a photo, used at the foot of the listening pages. */
function PhotoUpsell(){return <section className="wrap section"><div className="photo-upsell">
  <div className="photo-upsell-img"><Image src={listenUpsell.src} alt={listenUpsell.alt} fill sizes="(max-width:767px) 100vw, 50vw"/></div>
  <div className="photo-upsell-text"><small className="eyebrow">Courses</small><h2>Ready to go deeper?</h2><p>The course tiers take you further, lesson by lesson.</p><Action href="/courses">View the tiers</Action></div>
</div></section>}

/** Signed-in members with a lesson in progress see it first. TODO(backend): add free-audio progress here too. */
function ContinueRow(){
  const role=useRole(),{data}=useSWR(role==='visitor'?null:['continue',role],()=>read(getContinueListening()))
  if(!data)return null
  const left=Math.max(0,data.durationSeconds-data.positionSeconds),pct=data.durationSeconds?Math.round(data.positionSeconds/data.durationSeconds*100):0
  return <Rail title="Continue listening"><article className="rail-card wide">
    <Link href={`/courses/${data.tierKey}/learn/${data.lessonSlug}`} className="art" aria-label={`Resume ${data.lessonTitle}`}>
      <Image src={audioArt[1]} alt="" fill sizes="(max-width:767px) 85vw, 40vw"/><span className="dur">{formatDuration(left)} left</span><span className="play" aria-hidden><Play size={18}/></span><span className="done" aria-hidden><i style={{width:pct+'%'}}/></span>
    </Link>
    <small><Copy s={data.tierName}/></small><b><Copy s={data.lessonTitle}/></b>
  </article></Rail>
}

/** Glass player bar on the audio page hero. */
export function HeroPlayer({t}:{t:Track}){
  const p=usePlayer(),on=p.track?.id===t.id,total=on?p.duration:t.duration,at=on?p.pos:0
  return <div className="hero-player" onKeyDown={e=>{if(on)keys(e,p)}} onKeyUp={e=>{if(on)blockSpace(e)}} onContextMenu={e=>e.preventDefault()}>
    <button className="hero-play" aria-label={`${on&&p.playing?'Pause':'Play'} ${t.title}`} onClick={()=>p.play(t)}>{on&&p.playing?<Pause/>:<Play/>}</button>
    <div className="hero-scrub">
      <input aria-label="Progress" type="range" min={0} max={Math.max(1,Math.round(total))} step={1} value={Math.floor(at)} onChange={e=>on?p.seek(+e.target.value):p.play(t,+e.target.value)} style={{'--fill':`${total?Math.min(100,at/total*100):0}%`} as CSSProperties}/>
      <div className="hero-time"><span>{clock(at)}</span><span>{clock(total)}</span></div>
    </div>
    <div className="hero-extra">
      <button className="icon" disabled={!on} aria-label="Back 15 seconds" onClick={()=>p.skip(-15)}><RotateCcw/></button>
      <button className="icon" disabled={!on} aria-label="Forward 15 seconds" onClick={()=>p.skip(15)}><RotateCw/></button>
      <label><span className="sr-only">Playback speed</span><select value={p.speed} onChange={e=>p.rate(+e.target.value)}>{[0.75,1,1.25,1.5,2].map(n=><option key={n} value={n}>{n}×</option>)}</select></label>
    </div>
  </div>
}

function AudioPage({a,cat,next}:{a:AudioItem;cat:AudioCategory;next?:AudioItem}){
  const p=usePlayer(),t=audioTrack(a,cat)
  return <>
    <section className="photo-hero">
      <div className="photo-hero-bg"><Image src={coverFor(a)} alt={a.coverAlt||''} fill priority sizes="100vw"/></div>
      <div className="wrap photo-hero-in">
        <nav className="crumb" aria-label="Breadcrumb"><Link href="/listen">Free audio</Link> / <Link href={'/listen/'+cat.slug}><Copy s={cat.title}/></Link></nav>
        <h1><Copy s={a.title}/></h1><p><Copy s={a.description}/></p>
        <HeroPlayer t={t}/>
      </div>
    </section>
    <div className="wrap section audio-body">
      <aside className="audio-facts"><div><b>Length</b>{formatDuration(a.durationSeconds)}</div><div><b>Category</b><Link href={'/listen/'+cat.slug}><Copy s={cat.title}/></Link></div><p className="fine">{DOWNLOAD_NOTE}</p></aside>
      <div><Transcript md={a.transcriptMd}/>
        {next&&<div className="up-next">
          <span className="up-next-art"><Image src={coverFor(next)} alt="" fill sizes="88px"/></span>
          <div><small>Up next · {formatDuration(next.durationSeconds)}</small><Link href={audioHref(next,cat)}><b><Copy s={next.title}/></b></Link></div>
          <button className="outline compact" onClick={()=>p.play(audioTrack(next,cat))}>Play next</button>
        </div>}
        <Action quiet href="/listen">All free audio</Action>
      </div>
    </div>
    <PhotoUpsell/>
  </>
}

export function AudioLibrary({parts=[]}:{parts?:string[]}){
  const q=useSearchParams(),router=useRouter(),filter=parts[0]||q.get('category')||'',p=usePlayer()
  const {data,error,mutate}=useSWR(['audio',filter],()=>Promise.all([read(listAudio({categorySlug:filter||undefined})),read(listCategories())]))
  if(error)return <Failure retry={mutate}/>
  if(!data)return <SkeletonPage cards={parts[1]?0:6} player={!!parts[1]}/>
  const [items,cats]=data,cat=cats.find(c=>c.slug===filter),catOf=(a:AudioItem)=>cats.find(c=>c.id===a.categoryId)
  if(parts.length&&!cat)return <Missing/>
  if(parts[1]){
    const i=items.findIndex(x=>x.slug===parts[1]),a=items[i]
    if(!a)return <Missing/>
    return <AudioPage a={a} cat={cat!} next={items[i+1]}/>
  }
  const chips=<div className="wrap filters scroller lib-chips">{[{slug:'',title:'All'},...cats].map(c=><button key={c.slug} aria-pressed={filter===c.slug} onClick={()=>router.push(c.slug?`/listen?category=${c.slug}`:'/listen',{scroll:false})}><Copy s={c.title}/></button>)}</div>
  // One category (from a chip or /listen/<category>): its own heading and a wrapping grid of artwork cards.
  if(cat)return <>
    <Intro title={cat.title} body={cat.description}><Action quiet href="/listen">All free audio</Action></Intro>
    {!parts.length&&<div className="lib-chips-pad">{chips}</div>}
    <div className="wrap section">{items.length?<div className="art-grid">{items.map(a=><ArtCard key={a.id} a={a} cat={cat}/>)}</div>:<p className="panel">There&apos;s nothing in this category yet.</p>}<p className="fine">{DOWNLOAD_NOTE}</p></div>
    <PhotoUpsell/></>
  // All: featured hero, then one sideways row per category.
  const f=items[0],fc=f&&catOf(f) // TODO(backend): owner-chosen featured audio; newest for now.
  return <>
    {f?<section className="photo-hero listen-hero">
      <div className="photo-hero-bg"><Image src={coverFor(f)} alt={f.coverAlt||''} fill priority sizes="100vw"/></div>
      <div className="wrap photo-hero-in">
        <small className="eyebrow">Featured · free</small><h1><Copy s={f.title}/></h1><p><Copy s={f.description}/></p>
        <div className="actions"><button className="pill" onClick={()=>p.play(audioTrack(f,fc))}>{p.track?.id===f.id&&p.playing?<Pause size={16}/>:<Play size={16}/>} {p.track?.id===f.id&&p.playing?'Pause':'Play'} · {formatDuration(f.durationSeconds)}</button>{fc&&<Link className="hero-link" href={audioHref(f,fc)}>Details and transcript</Link>}</div>
      </div>
    </section>:<Intro title="Free audio" body={text(220)}/>}
    <div className="lib-chips-pad">{chips}</div>
    <ContinueRow/>
    {items.length?cats.map(c=>{const list=items.filter(a=>a.categoryId===c.id);return list.length?<Rail key={c.id} title={<Copy s={c.title}/>} href={'/listen/'+c.slug}>{list.map(a=><ArtCard key={a.id} a={a} cat={c}/>)}</Rail>:null}):<p className="wrap panel">{text(224)}</p>}
    <p className="wrap fine lib-note">{DOWNLOAD_NOTE}</p>
    <PhotoUpsell/></>
}

/** F-021 — labelled SVG progress ring for owned tiers. */
function Ring({percent}:{percent:number}){const r=20,c=2*Math.PI*r,p=Math.min(100,Math.max(0,percent));return <svg className="ring" width="52" height="52" viewBox="0 0 52 52" role="img" aria-label={`${p}% complete`}><circle cx="26" cy="26" r={r} fill="none" stroke="currentColor" strokeOpacity=".25" strokeWidth="4"/><circle cx="26" cy="26" r={r} fill="none" stroke="var(--tier-accent)" strokeWidth="4" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c*(1-p/100)} transform="rotate(-90 26 26)"/></svg>}

/** Tier card (UI revamp, D18): the tier's photo on top, its colour panel below. */
export function TierCard({tier,owned,extra}:{tier:TierSummary|OwnedTier;owned?:boolean;extra?:ReactNode}){
  const o='percent' in tier&&owned?tier:null,art=tierArt[tier.key]
  return <article className="tier-card tier-door" data-tier={tier.theme}>
    <div className="door-img"><Image src={art.src} alt={art.alt} fill sizes="(max-width:767px) 100vw, 33vw"/></div>
    <div className="door-body">
      <div className="row"><small className="eyebrow">{tier.label}</small><Headphones size={22} strokeWidth={1.3} aria-hidden/></div>
      <h3><Copy s={tier.name}/></h3><p><Copy s={tier.tagline}/></p>{extra}
      <div className="tier-end">
        {o?<div className="row owned"><Ring percent={o.percent}/><div><p>{o.percent}% complete</p><p>{o.completedCount} of {plural(o.publishedCount,'lesson')}</p></div></div>
          :<><p>{plural(tier.lessonCount,'lesson')}{tier.totalSeconds>0&&<> · {formatHours(tier.totalSeconds)} hrs</>}</p><b className="door-price"><Copy s={price(tier.pricePence)}/></b><ReviewPrice show={tier.samplePrice}/></>}
        <Link className="textlink door-link" href={`/courses/${tier.key}`}>{o?'Continue':`Explore ${tier.label}`}<ArrowRight size={16}/></Link>
      </div>
    </div>
  </article>
}

export function TierGrid({exclude,ownedOnly=false}:{exclude?:string;ownedOnly?:boolean}){
  const role=useRole(),{data,error,mutate}=useSWR(['tiers',role],()=>Promise.all([read(listTiers()),role==='visitor'?Promise.resolve([] as OwnedTier[]):read(getLibrary())]))
  if(error)return <Failure retry={mutate}/>
  if(!data)return <SkeletonCard count={exclude?2:3} tier/>
  const [all,library]=data
  return <div className={'grid3 door-grid'+(exclude?' two':'')}>{all.filter(t=>t.id!==exclude&&(!ownedOnly||library.some(l=>l.id===t.id))).map(t=>{const own=library.find(l=>l.id===t.id);return <TierCard key={t.id} tier={own||t} owned={!!own}/>})}</div>
}

export function Courses(){return <>
  <section className="photo-hero">
    <div className="photo-hero-bg"><Image src={coursesHero.src} alt={coursesHero.alt} fill priority sizes="100vw"/></div>
    <div className="wrap photo-hero-in"><small className="eyebrow">Courses</small><h1>{text(128)}</h1><p><Copy s={text(252)}/></p></div>
  </section>
  <div className="surface"><section className="wrap section how-steps" aria-label="How it works">{[254,255,256].map((n,i)=><div className="step" key={n}><span className="step-n" aria-hidden>{i+1}</span><h3>{line(n).split('**')[1]}</h3><p>{line(n).split('**')[2]}</p></div>)}</section></div>
  <Section><TierGrid/><Refund/></Section>
  <div className="surface"><Section title="FAQ">{[260,261,262,263,264,265].map(n=><details key={n}><summary>{line(n).split('**')[1]}</summary><p><Copy s={line(n).split('**')[2]}/></p></details>)}</Section></div>
</>}

type Progress={positionSeconds:number;completedAt?:string|null}|null|undefined
/** Lesson status dot: tick when complete, half circle when started (or current), empty otherwise. */
export function LessonDot({p,current=false}:{p:Progress;current?:boolean}){
  const done=!!p?.completedAt,started=!done&&(p?.positionSeconds||0)>0
  return <span className={'ldot'+(done?' ok':started||current?' half':'')} role="img" aria-label={done?'Completed':started?'In progress':'Not started'}>{done&&<Check size={12}/>}</span>
}
/** Per-lesson progress for a member who owns the tier. TODO(backend): one batched read per tier instead of one per lesson. */
export function useTierProgress(tierId:string,lessonIds:string[],on:boolean){
  const role=useRole()
  return useSWR(on&&lessonIds.length?['tier-progress',role,tierId,lessonIds.join()]:null,()=>Promise.all(lessonIds.map(id=>read(getProgress(id))))).data
}
export const lessonTrack=(l:{id:string;title:string;slug:string;durationSeconds:number},t:{name:string;key:TierKey}):Track=>({id:l.id,title:l.title,group:t.name,kind:'lesson',duration:l.durationSeconds,getSourceUrl:source(l.id,'lesson'),cover:tierArt[t.key].src,href:`/courses/${t.key}/learn/${l.slug}`})

export function TierLanding({id}:{id:string}){
  const role=useRole(),router=useRouter(),q=useSearchParams(),p=usePlayer(),[msg,setMsg]=useState('')
  const hero=useRef<HTMLElement>(null),[bar,setBar]=useState(false)
  const {data,error,mutate}=useSWR(['tier',id,role],()=>Promise.all([read(getTier(id)),role==='visitor'?Promise.resolve(false):read(getEntitlement(id)),read(listModules(id)),read(listLessons(id))]))
  const owned=!!data?.[1],lessons=data?.[3]||[]
  const prog=useTierProgress(id,lessons.map(l=>l.id),owned)
  // The buy bar appears once the hero (and its Buy button) has scrolled away.
  useEffect(()=>{const el=hero.current;if(!el||owned)return;const io=new IntersectionObserver(([e])=>setBar(!e.isIntersecting),{threshold:0});io.observe(el);return()=>io.disconnect()},[data,owned])
  if(error)return <Failure retry={mutate}/>
  if(!data)return <SkeletonPage/>
  const [t,,mods]=data
  if(!t)return <Missing/>
  const lesson=lessons.find(l=>l.status==='published'),total=lessons.reduce((n,l)=>n+l.durationSeconds,0),art=tierArt[t.key]
  const preview=lessons.find(l=>l.isPreview&&l.status==='published')
  const at=(l:{id:string})=>prog?.[lessons.findIndex(x=>x.id===l.id)]
  const published=lessons.filter(l=>l.status==='published'),doneCount=published.filter(l=>at(l)?.completedAt).length
  const resume=published.find(l=>!at(l)?.completedAt)||lesson
  async function buy(){
    if(owned){router.push(resume?`/courses/${id}/learn/${resume.slug}`:'/account/library');return}
    if(role==='visitor')router.push(`/sign-in?next=/courses/${id}&intent=buy:${id}`)
    else{const r=await startCheckout(id);if(r.ok)router.push(r.data.url);else setMsg(r.error)}
  }
  const canBuy=!(t.pricePence===null||!lesson),buyLabel=<Copy s={`Buy ${t.label} — ${price(t.pricePence)}`}/>
  const previewOn=!!preview&&p.track?.id===preview.id&&p.playing
  return <>
    <section className="photo-hero tier-photo" data-tint={t.theme} ref={hero}>
      <div className="photo-hero-bg"><Image src={art.src} alt={art.alt} fill priority sizes="100vw"/></div>
      <div className="wrap photo-hero-in">
        <small className="eyebrow">{t.label}</small><h1><Copy s={t.name}/></h1><p><Copy s={t.tagline}/></p>
        {t.descriptionMd&&<p className="tier-desc"><Copy s={t.descriptionMd}/></p>}
        {owned?<div className="tier-progress"><span>{doneCount} of {plural(published.length,'lesson')}</span><span className="tier-bar" role="progressbar" aria-label="Tier progress" aria-valuenow={doneCount} aria-valuemin={0} aria-valuemax={published.length}><i style={{width:`${published.length?doneCount/published.length*100:0}%`}}/></span><button className="pill" onClick={buy}>Continue<ArrowRight size={16}/></button></div>
          :<div className="tier-buy">
            <span className="tier-price"><Copy s={price(t.pricePence)}/></span><small>One-time payment · Lifetime access <ReviewPrice show={t.samplePrice}/></small>
            <button className="pill" disabled={!canBuy} title={t.pricePence===null?'Price coming soon':!lesson?'Coming soon':undefined} onClick={buy}>{buyLabel}<ArrowRight size={16}/></button>
            {preview&&<button className="hero-link" onClick={()=>p.play(lessonTrack(preview,t))}>{previewOn?<Pause size={15}/>:<Play size={15}/>}&nbsp;{previewOn?'Pause the free preview':'Listen to a free preview'}</button>}
          </div>}
        {(msg||q.get('checkout')==='cancelled')&&<p role="status">{msg||"Checkout cancelled. You haven't been charged."}</p>}
      </div>
    </section>
    <div className="tier-stats"><div className="wrap">{[[String(lessons.length),lessons.length===1?'Lesson':'Lessons'],[`${formatHours(total)} hrs`,'Of guided audio'],[String(mods.length),mods.length===1?'Module':'Modules'],['For life','Pay once, keep it']].map(([b,s])=><div key={s}><b>{b}</b><small>{s}</small></div>)}</div></div>
    <section className="wrap section journey">
      <div><small className="eyebrow">What&apos;s inside</small><h2>Your journey through {t.label}</h2><p className="lead">Work through it in order, or dip in wherever you need. Your place is saved on every device.</p></div>
      {mods.length?<ol className="mods">{mods.map((m,i)=>{const ls=lessons.filter(l=>l.moduleId===m.id),modDone=owned&&ls.length>0&&ls.every(l=>at(l)?.completedAt)
        return <li key={m.id} className={'mod'+(modDone?' done':'')}><details open={i===0}><summary><span className="mod-dot" aria-hidden>{modDone?<Check size={14}/>:i+1}</span><span className="mod-head"><span className="mod-title"><Copy s={m.title}/></span><small>{plural(ls.length,'lesson')} · {formatDuration(ls.reduce((n,l)=>n+l.durationSeconds,0))}</small></span></summary>
          {ls.map(l=>{const pv=l.isPreview&&l.status==='published',on=p.track?.id===l.id&&p.playing
            return <div className="lesson-row lrow" key={l.id}>
              {owned&&<LessonDot p={at(l)}/>}
              <Link href={`/courses/${id}/learn/${l.slug}`}><Copy s={l.title}/> <small>· {formatDuration(l.durationSeconds)}</small></Link>
              {!owned&&<small className="badge">{l.isPreview?'Free preview':'Members only'}</small>}
              {!owned&&(pv?<button className="outline compact" aria-label={`${on?'Pause':'Play'} ${l.title}`} onClick={()=>p.play(lessonTrack(l,t))}>{on?<Pause size={14}/>:<Play size={14}/>}Preview</button>:!l.isPreview&&<LockKeyhole size={16} role="img" aria-label="Locked lesson"/>)}
            </div>})}</details></li>})}</ol>:<div className="panel">Coming soon</div>}
    </section>
    <div className="surface"><section className="wrap section"><small className="eyebrow">What you get</small>
      <div className="gets">{([[InfinityIcon,'Lifetime access',`Every lesson in ${t.label}, for good.`],[FileText,'Transcripts','Read along, or read later.'],[History,'Progress saved','Pick up where you left off, on any device.']] as const).map(([I,h,b])=><div key={h}><I size={24} strokeWidth={1.4} aria-hidden/><h3>{h}</h3><p>{b}</p></div>)}</div>
      <Refund/><Wellbeing/></section></div>
    <Section title="Explore other tiers"><TierGrid exclude={id}/></Section>
    {!owned&&<div className={'buy-bar'+(bar?' show':'')} aria-hidden={!bar}><span className="buy-bar-name">{t.label} · <Copy s={t.name}/></span><b><Copy s={price(t.pricePence)}/></b><button className="pill" tabIndex={bar?0:-1} disabled={!canBuy} onClick={buy}>{buyLabel}</button></div>}
  </>
}

/** The member's next unfinished lesson in a tier they own (D19). `done` once every published lesson is complete. */
export function useNextLesson(tierKey:string){
  const {data:lessons}=useSWR(['lessons',tierKey],()=>read(listLessons(tierKey)))
  const pub=(lessons||[]).filter(l=>l.status==='published')
  const prog=useTierProgress(tierKey,pub.map(l=>l.id),pub.length>0)
  if(!lessons)return null
  if(!pub.length)return {lesson:undefined,number:0,done:false}
  if(!prog)return null
  const i=pub.findIndex((_,k)=>!prog[k]?.completedAt)
  return i<0?{lesson:undefined,number:0,done:true}:{lesson:pub[i],number:lessons.findIndex(l=>l.id===pub[i].id)+1,done:false}
}
/** "Next up" line inside an owned tier card. */
export function NextLine({tierKey}:{tierKey:TierKey}){
  const n=useNextLesson(tierKey)
  if(!n)return null
  return <p className="next-line">{n.done?'Tier complete. Revisit any lesson.':n.lesson?<>{n.number===1?'Start with':'Next up'}<b><Copy s={n.lesson.title}/></b></>:'Lessons coming soon.'}</p>
}
/** Artwork card for the member's next lesson in a tier (Next up row). */
export function NextLessonCard({tier}:{tier:{key:TierKey;name:string;label:string}}){
  const n=useNextLesson(tier.key),p=usePlayer()
  if(!n?.lesson)return null
  const l=n.lesson,on=p.track?.id===l.id&&p.playing,href=`/courses/${tier.key}/learn/${l.slug}`
  return <article className="rail-card">
    <div className="art"><Image src={tierArt[tier.key].src} alt="" fill sizes="(max-width:767px) 65vw, 24vw"/><span className="dur">{formatDuration(l.durationSeconds)}</span>
      <button className="play" aria-label={`${on?'Pause':'Play'} ${l.title}`} onClick={()=>p.play(lessonTrack(l,tier))}>{on?<Pause size={18}/>:<Play size={18}/>}</button></div>
    <small>{tier.label} · Lesson {n.number}</small>
    <Link href={href}><b><Copy s={l.title}/></b></Link>
  </article>
}
