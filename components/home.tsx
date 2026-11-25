import Image from 'next/image'
import {Fragment} from 'react'
import {Film} from './film'
import {Action,Copy} from './editorial'
import {ScrollStory,Words,AudioRail,TierChips} from './story'
import {text} from '@/lib/editorial'
import {homeChapters,type ImageSlot} from '@/lib/home-media'

const chapters=[{id:'top',label:'Film'},{id:'welcome',label:'Welcome'},{id:'listen-now',label:'Free audio'},{id:'philosophy',label:'The philosophy'},{id:'courses',label:'Courses'},{id:'coaching',label:'1:1 coaching'},{id:'return',label:'Unplug. Remember. Return.'}]

/** Full-screen photo chapter. Pinned while the next one slides over it. */
function Chapter({id,img,n,children}:{id:string;img:ImageSlot;n:number;children:React.ReactNode}){
  return <section className="chap reveal" id={id} data-dark aria-labelledby={id+'-h'}>
    <div className="chap-bg"><Image src={img.src} alt={img.alt} fill sizes="100vw"/></div>
    <div className="chap-text"><span className="chap-count" aria-hidden>0{n} / 03</span>{children}</div>
  </section>
}

export function Home({welcome=text(90)}:{welcome?:string}){
  return <ScrollStory chapters={chapters}>
    <div id="top" data-dark><Film/></div>

    <section id="welcome" className="story-welcome">
      {welcome.split(/\n{2,}/).map((s,i)=><Words key={i} s={s}/>)}
      <div className="actions"><Action href="/listen">Start listening — free</Action><Action quiet href="/philosophy">Read the philosophy</Action></div>
    </section>

    <section id="listen-now" className="story-listen" aria-labelledby="listen-now-h">
      <div className="wrap story-listen-top"><div><small className="eyebrow">Listen now · free</small><h2 id="listen-now-h">{text(120)}</h2><p className="lead">{text(121)}</p></div></div>
      <AudioRail/>
      <div className="wrap"><Action quiet href="/listen">See all free audio</Action></div>
    </section>

    <div className="chapters">
      <Chapter id="philosophy" img={homeChapters.philosophy} n={1}>
        <small className="eyebrow">The philosophy</small><h2 id="philosophy-h">You are not the avatar.</h2>
        <blockquote>&quot;The avatar is content. You are the context.&quot;</blockquote>
        <Action href="/philosophy">Read the full philosophy</Action>
      </Chapter>
      <Chapter id="courses" img={homeChapters.courses} n={2}>
        <small className="eyebrow">Courses</small><h2 id="courses-h">{text(128)}</h2>
        <p><Copy s={text(129)}/></p><TierChips/>
        <Action href="/courses">View the tiers</Action>
        <p className="chap-fine">Prices in GBP. Tax is calculated at checkout.</p>
      </Chapter>
      <Chapter id="coaching" img={homeChapters.coaching} n={3}>
        <small className="eyebrow">1:1 coaching</small><h2 id="coaching-h">{text(135)}</h2>
        <p><Copy s={text(136)}/></p>
        <Action href="/coaching">Book a session</Action>
      </Chapter>
    </div>

    <section id="return" className="story-close reveal">
      <h2>{['Unplug.','Remember.','Return.'].map((w,i)=><Fragment key={w}>{i>0&&' '}<span>{w}</span></Fragment>)}</h2>
      {/* Stress → calm: icons from public/icons, recoloured to the palette with CSS masks. */}
      <div className="shift" role="img" aria-label="From stress to calm">
        <div className="shift-step"><span className="ico ico-stress"/><small>Stress</small></div>
        <span className="shift-line"><i/></span>
        <div className="shift-step"><span className="ico ico-calm"/><small>Calm</small></div>
      </div>
      <p className="lead">{text(141)}</p>
      <Action href="/listen">Start listening — free</Action>
    </section>
  </ScrollStory>
}
