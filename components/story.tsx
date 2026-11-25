'use client'
// Home scrollytelling (UI revamp, 2026-11-24). Palette stays strictly D5: photo sections carry the
// immersion; blue is still interaction-only. Everything degrades to a static page under reduced motion.
import {useEffect,useRef,useState,type ReactNode} from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import {ArrowLeft,ArrowRight} from 'lucide-react'
import {listAudio,listCategories} from '@/app/actions/audio'
import {listTiers} from '@/app/actions/courses'
import {read} from '@/lib/client'
import {price} from '@/lib/editorial'
import {Copy} from './editorial'
import {ArtCard} from './catalog'
import {SkeletonCard} from './states'

const clamp=(v:number)=>Math.min(1,Math.max(0,v))

/** Scroll driver: progress line, chapter dots, film zoom/dim, word lighting and `.reveal` → `.in`. */
export function ScrollStory({chapters,children}:{chapters:{id:string;label:string}[];children:ReactNode}){
  const root=useRef<HTMLDivElement>(null),[active,setActive]=useState(0),[light,setLight]=useState(true)
  useEffect(()=>{
    const el=root.current;if(!el)return
    const reduce=matchMedia('(prefers-reduced-motion: reduce)')
    let frame=0
    const tick=()=>{
      frame=0
      const y=scrollY,vh=innerHeight,max=document.documentElement.scrollHeight-vh,still=reduce.matches
      el.style.setProperty('--p',String(max>0?clamp(y/max):0))
      const film=el.querySelector<HTMLElement>('.film');if(film)film.style.setProperty('--h',still?'0':String(clamp(y/vh)))
      el.querySelectorAll<HTMLElement>('.story-words').forEach(p=>{
        const r=p.getBoundingClientRect(),t=still?1:clamp((vh*.85-r.top)/(r.height+vh*.35)),w=p.querySelectorAll('.w')
        w.forEach((n,i)=>n.classList.toggle('lit',i/w.length<t))
      })
      el.querySelectorAll<HTMLElement>('.chap').forEach(c=>c.style.setProperty('--c',still?'0':String(Math.max(-1,Math.min(1,-c.getBoundingClientRect().top/vh)))))
      let a=0;chapters.forEach((c,i)=>{const s=document.getElementById(c.id);if(s&&s.getBoundingClientRect().top<vh*.5)a=i});setActive(a)
      const probe=document.elementFromPoint(innerWidth-30,vh/2);setLight(!!probe?.closest('[data-dark]'))
    }
    const on=()=>{if(!frame)frame=requestAnimationFrame(tick)}
    tick();addEventListener('scroll',on,{passive:true});addEventListener('resize',on)
    const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.3})
    el.querySelectorAll('.reveal').forEach(n=>io.observe(n))
    return()=>{removeEventListener('scroll',on);removeEventListener('resize',on);io.disconnect();if(frame)cancelAnimationFrame(frame)}
  },[chapters])
  return <div className="story" ref={root}>
    <div className="story-progress" aria-hidden/>
    <nav className={'story-dots'+(light?' light':'')} aria-label="Page sections">{chapters.map((c,i)=><a key={c.id} href={'#'+c.id} aria-label={c.label} aria-current={i===active?'location':undefined}/>)}</nav>
    {children}
  </div>
}

/** Splits copy into words that light up as the paragraph scrolls past. Keeps `[PLACEHOLDER]`, links and emphasis whole. */
export function Words({s}:{s:string}){
  const parts=s.split(/(\[[^\]]+\]\(\/[^)]*\)|\[[^\]]+\]|\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean)
  let k=0
  return <p className="story-words">{parts.map(v=>/^(\[|\*)/.test(v)?<span className="w" key={k++}><Copy s={v}/>{' '}</span>:v.split(/\s+/).filter(Boolean).map(w=><span className="w" key={k++}>{w} </span>))}</p>
}

/** Sideways audio row with large artwork. Uses each audio's cover when set, else placeholder art. */
export function AudioRail(){
  const rail=useRef<HTMLDivElement>(null)
  const {data}=useSWR(['audio',''],()=>Promise.all([read(listAudio({})),read(listCategories())]))
  // Loads after ScrollStory has scanned for `.reveal`, so it watches itself.
  useEffect(()=>{const el=rail.current;if(!el)return;const io=new IntersectionObserver(([e])=>{if(e.isIntersecting){el.classList.add('in');io.disconnect()}},{threshold:.2});io.observe(el);return()=>io.disconnect()},[data])
  if(!data)return <div className="wrap"><SkeletonCard count={3}/></div>
  const [items,cats]=data
  if(!items.length)return <p className="wrap fine">New audio sessions are on their way. Check back soon.</p>
  const scroll=(d:number)=>rail.current?.scrollBy({left:d*rail.current.clientWidth*.7,behavior:'smooth'})
  return <>
    <div className="rail-nav" aria-hidden={items.length<3}><button className="round-btn" aria-label="Scroll audio left" onClick={()=>scroll(-1)}><ArrowLeft size={18}/></button><button className="round-btn" aria-label="Scroll audio right" onClick={()=>scroll(1)}><ArrowRight size={18}/></button></div>
    <div className="rail" ref={rail}>{items.slice(0,8).map((a,i)=><ArtCard key={a.id} a={a} cat={cats.find(c=>c.id===a.categoryId)} wide={i===0}/>)}</div>
  </>
}

/** Tier name + price chips for the Courses chapter. */
export function TierChips(){
  const {data}=useSWR(['tiers-chips'],()=>read(listTiers()))
  if(!data)return null
  return <div className="chips">{data.map(t=><Link key={t.id} href={`/courses/${t.key}`}><Copy s={`${t.label} · ${price(t.pricePence)}`}/></Link>)}</div>
}
