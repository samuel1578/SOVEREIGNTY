'use client'
import useSWR from 'swr'
import Image from 'next/image'
import {CalendarDays,Clock,PoundSterling,MapPin,RotateCcw} from 'lucide-react'
import {read} from '@/lib/client'
import {getCoachingSettings} from '@/app/actions/coaching'
import {Copy,Wellbeing} from './editorial'
import {price,text} from '@/lib/editorial'
import {pageArt} from '@/lib/home-media'
import {Failure,SkeletonPage} from './states'
// TODO(backend): Cal.com embed (@calcom/embed-react) with its live booking link.
// F-017 — the fallback is always available: the configured Cal.com link, else the default booking page.
// TODO(backend): Cal.com — NEXT_PUBLIC_CAL_LINK is the default event when the CMS has no link.
const BOOKING_FALLBACK=process.env.NEXT_PUBLIC_CAL_LINK||''
const isCal=(u:string)=>/^https:\/\/cal\.com\//.test(u)
function CoachingEmbed({calLink}:{calLink:string}){const href=isCal(calLink)?calLink:isCal(BOOKING_FALLBACK)?BOOKING_FALLBACK:'';return <div className="calendar"><CalendarDays size={36} aria-hidden/><p>Live calendar will appear here.</p><p className="fine">The calendar didn&apos;t load. Open the booking page in a new tab.</p>{href?<a className="pill" href={href} target="_blank" rel="noopener noreferrer">Open booking page</a>:<button className="pill" disabled title="[BOOKING LINK — client to confirm]">Open booking page</button>}</div>}

/** Coaching (D21): warm split hero with her portrait, session details as cards, three steps, then booking. */
export function Coaching(){
  const {data,error,mutate}=useSWR('coaching',()=>read(getCoachingSettings()))
  if(error)return <Failure retry={mutate}/>
  if(!data)return <SkeletonPage/>
  const details:[typeof Clock,string,string][]=[[Clock,'Length',data.sessionLength],[PoundSterling,'Price',data.pricePence===null?'£[SESSION PRICE]':price(data.pricePence)],[MapPin,'Where',data.location],[RotateCcw,'Cancellation',data.cancellationPolicy]]
  return <>
    <section className="coach-hero" data-tier="brown">
      <div className="wrap coach-hero-in">
        <div className="coach-hero-text"><small className="eyebrow">1:1 coaching</small><h1>{text(135)}</h1><p><Copy s={data.introMd}/></p><a className="pill" href="#book">Choose a time</a></div>
        <div className="coach-portrait"><Image src={pageArt.coaching.src} alt={pageArt.coaching.alt} fill priority sizes="(max-width:1023px) 100vw, 45vw"/></div>
      </div>
    </section>
    <div className="wrap coach-details">{details.map(([I,k,v])=><div key={k}><I aria-hidden/><small>{k}</small><b><Copy s={v}/></b></div>)}</div>
    <section className="wrap section how-steps" aria-label="How booking works">{[['Choose a time','Times show in your own time zone.'],['Pay securely','In GBP, when you book.'],['Meet','Confirmation and reminders by email.']].map(([h,b],i)=><div className="step" key={h}><span className="step-n" aria-hidden>{i+1}</span><h3>{h}</h3><p>{b}</p></div>)}</section>
    <div className="surface"><section className="wrap section coach-book" id="book">
      <div><small className="eyebrow">Booking</small><h2>Choose a time</h2><p>{text(309)}</p><Wellbeing/></div>
      <CoachingEmbed calLink={data.calLink}/>
    </section></div>
  </>
}
