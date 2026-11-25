import Image from 'next/image'
import {Intro,Article,Action,Copy,Wellbeing} from './editorial'
import {legalNames,pages,text,headingId} from '@/lib/editorial'
import {pageArt} from '@/lib/home-media'
import {Contents,ReadingProgress} from './contents'
import {REVIEW} from '@/lib/config'

/** Photo hero shared by the reading pages (D21). */
function PhotoHero({eyebrow,title,body,img}:{eyebrow:string;title:string;body?:string;img:{src:string;alt:string}}){
  return <section className="photo-hero">
    <div className="photo-hero-bg"><Image src={img.src} alt={img.alt} fill priority sizes="100vw"/></div>
    <div className="wrap photo-hero-in"><small className="eyebrow">{eyebrow}</small><h1><Copy s={title}/></h1>{body&&<p><Copy s={body}/></p>}</div>
  </section>
}

export function Reading({slug,value,heading}:{slug:string;value?:string;heading?:string}){
  const body=value??pages[slug]
  // About (D21): portrait-led split, her story beside it.
  if(slug==='about')return <section className="about-split">
    <div className="about-portrait"><Image src={pageArt.about.src} alt={pageArt.about.alt} fill priority sizes="(max-width:1023px) 100vw, 46vw"/></div>
    <div className="about-text">
      <small className="eyebrow">About</small><h1><Copy s={heading||'About'}/></h1><p className="lead"><Copy s={text(204)}/></p>
      <Article value={body}/>
      <div className="actions"><Action href="/coaching">Book a 1:1 session</Action><Action quiet href="/listen">Start listening — free</Action></div>
    </div>
  </section>
  // Philosophy (D21): a calm long-read. Her text stays verbatim; `>` lines in it render as pull-quote bands.
  if(slug==='philosophy'){
    const items=body.split(/\n+/).flatMap(s=>s.startsWith('#### ')?[{id:headingId(s.slice(5)),title:s.slice(5)}]:[])
    const minutes=Math.max(1,Math.round(body.split(/\s+/).length/220))
    return <div className="philosophy">
      <PhotoHero eyebrow="The philosophy" title={heading||text(151)} body={text(152)} img={pageArt.philosophy}/>
      <ReadingProgress/>
      <div className="wrap read-layout">
        <aside><small className="eyebrow">In this piece</small><Contents items={items}/><p className="fine read-time">About {minutes} minutes to read</p></aside>
        <div>
          <Article value={body}/>
          <section className="end-cta">
            <div className="end-cta-img"><Image src={pageArt.philosophyEnd.src} alt={pageArt.philosophyEnd.alt} fill sizes="(max-width:767px) 100vw, 30vw"/></div>
            <div className="end-cta-text"><h2>Explore the Audio Sessions</h2><div className="actions"><Action href="/listen">Start listening — free</Action><Action quiet href="/courses">View the course tiers</Action></div><Wellbeing/></div>
          </section>
        </div>
      </div>
    </div>
  }
  return <><Intro label={REVIEW?'Draft for review':undefined} title={heading||legalNames[slug]} body="Last updated: [DATE]"/><section className="section narrow"><Article value={body}/><p><Copy s="Questions? Email [CONTACT EMAIL]."/></p></section></>
}
