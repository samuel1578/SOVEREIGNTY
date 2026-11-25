'use client'
// Admin dashboard (UI revamp, D20): greeting + quick actions, "Needs your attention", number tiles with trends,
// two charts, recent activity as a timeline, and content at a glance. Numbers the site can't count yet say so.
import Image from 'next/image'
import {useState} from 'react'
import Link from 'next/link'
import {Plus,MessagesSquare,FileText,CircleCheck,TriangleAlert,ArrowRight} from 'lucide-react'
import {Copy} from '../editorial'
import {useAdmin} from './shared'
import {Sparkline,AreaChart,Bars} from './charts'
import {adminHero} from '@/lib/home-media'

const DAY=86_400_000
/** Monday-start week buckets for the last `n` weeks. */
function weeks(n:number){const now=new Date(),start=new Date(now.getFullYear(),now.getMonth(),now.getDate()-((now.getDay()+6)%7));return Array.from({length:n},(_,i)=>new Date(start.getTime()-(n-1-i)*7*DAY))}
const short=(d:Date)=>d.toLocaleDateString('en-GB',{day:'numeric',month:'short'})
const dayLabel=(iso:string)=>{const d=new Date(iso),t=new Date();const diff=Math.round((new Date(t.getFullYear(),t.getMonth(),t.getDate()).getTime()-new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime())/DAY);return diff===0?'Today':diff===1?'Yesterday':d.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'})}
const initials=(name:string)=>name.replace(/[[\]]/g,'').split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase()||'·'

export function Dashboard({stats,greeting}:{stats:Record<string,number>;greeting:string}){
  const {d,owner}=useAdmin(),[now]=useState(()=>Date.now())
  const unread=d.messages.filter(m=>m.status==='new').length
  const oldest=d.messages.filter(m=>m.status==='new').map(m=>m.createdAt).sort()[0]
  const items=[...d.audio,...d.lessons],review=items.filter(x=>x.transcriptStatus==='draft').length,failed=items.filter(x=>x.transcriptStatus==='failed').length
  const waiting=(unread?1:0)+(review?1:0)+(failed?1:0)
  // Members: weekly sign-ups (chart) and running total (sparkline), from each member's join date.
  const members=d.people.filter(p=>p.role==='member'),w=weeks(12)
  const perWeek=w.map((s,i)=>({label:short(s),value:members.filter(p=>{const t=new Date(p.joinedAt).getTime();return t>=s.getTime()&&(i===w.length-1||t<w[i+1].getTime())}).length}))
  const running=w.map((s)=>members.filter(p=>new Date(p.joinedAt).getTime()<s.getTime()+7*DAY).length)
  const thisMonth=members.filter(p=>now-new Date(p.joinedAt).getTime()<30*DAY).length
  const owners=d.tiers.map(t=>({label:t.label,value:members.filter(p=>(d.access[p.id]||[]).includes(t.id)).length}))
  const pub=(xs:{status:string}[])=>xs.filter(x=>x.status==='published').length
  const tiles:[string,number|string,string,number[]?][]=[
    ['Members',stats.Members??members.length,thisMonth?`${thisMonth} new in the last 30 days`:'No new members in the last 30 days',running],
    ...(owner?[['Tier purchases (30 days)',stats['Tier purchases (30 days)']??0,'One-time purchases'] as [string,number,string]]:[]),
    ['Free audio plays (30 days)','—','Counting starts when the site goes live'],
    ['Lessons published',pub(d.lessons),`of ${d.lessons.length} in all tiers`],
  ]
  const attention:[typeof MessagesSquare,number,string,string,string,string][]=[
    [MessagesSquare,unread,'New messages',unread&&oldest?`Oldest: ${dayLabel(oldest).toLowerCase()}`:'Inbox is clear','/admin/messages','Open inbox'],
    [FileText,review,'Transcripts to review','Check them before they go public','/admin/transcripts','Review'],
    [TriangleAlert,failed,'Transcripts that failed','Retry from the transcripts list','/admin/transcripts','See which'],
  ]
  const byDay=d.activity.slice(0,6).reduce<[string,typeof d.activity][]>((g,a)=>{const k=dayLabel(a.createdAt),last=g[g.length-1];if(last&&last[0]===k)last[1].push(a);else g.push([k,[a]]);return g},[])
  return <>
    <section className="admin-hello">
      <div className="admin-hello-bg"><Image src={adminHero.src} alt={adminHero.alt} fill priority sizes="(max-width:1023px) 100vw, 75vw"/></div>
      <small className="eyebrow">{owner?'Owner':'Assistant'} · Dashboard</small>
      <h1><Copy s={greeting}/></h1>
      <p>{waiting?`${waiting} ${waiting===1?'thing needs':'things need'} you today. Everything else is running smoothly.`:'Nothing needs you right now. Everything is running smoothly.'}</p>
      <nav className="admin-quick" aria-label="Quick actions">
        <Link className="quick pri" href="/admin/audio"><Plus aria-hidden/>Upload audio</Link>
        <Link className="quick" href="/admin/courses"><Plus aria-hidden/>Add a lesson</Link>
        <Link className="quick" href="/admin/transcripts">Review transcripts</Link>
        <Link className="quick" href="/admin/coaching">Coaching settings</Link>
      </nav>
    </section>

    <h2 className="admin-sec">Needs your attention</h2>
    <div className="attn">{attention.map(([I,n,label,sub,href,cta])=><div className={'att'+(n?(I===TriangleAlert?' bad':I===FileText?' warn':''):' clear')} key={label}>
      <span className="att-ic" aria-hidden>{n?<I/>:<CircleCheck/>}</span>
      <div><b>{n}</b><span>{label}</span><small>{n?sub:'All clear'}</small></div>
      {n>0&&<Link className="textlink att-go" href={href}>{cta}</Link>}
    </div>)}</div>

    <h2 className="admin-sec">At a glance</h2>
    <div className="tiles">{tiles.map(([label,n,sub,trend])=><div className="tile" key={label}><small>{label}</small><b>{n}</b><span className="tile-sub">{sub}</span>{trend&&<Sparkline values={trend}/>}</div>)}</div>

    <div className="admin-charts">
      <section className="chart-card" aria-labelledby="chart-members"><h3 id="chart-members">New members</h3><p className="chart-sub">Sign-ups per week, last 12 weeks</p><AreaChart data={perWeek} unit="new members" title="New members per week"/></section>
      <section className="chart-card" aria-labelledby="chart-tiers"><h3 id="chart-tiers">Members per tier</h3><p className="chart-sub">Everyone who owns each tier</p><Bars rows={owners}/>
        {owner&&<p className="chart-sub chart-later">Revenue appears here once payments are live.</p>}</section>
    </div>

    <div className="admin-two">
      <section className="timeline" aria-labelledby="recent-h"><h3 id="recent-h">Recent activity</h3>
        {byDay.length?byDay.map(([day,list])=><div key={day}><small className="eyebrow tl-day">{day}</small><ol>{list.map(a=><li className="tl-ev" key={a.id}>
          <span className="tl-av" aria-hidden>{initials(a.actorName)}</span>
          <p><b><Copy s={a.actorName}/></b> {a.action.toLowerCase()} <b><Copy s={a.target}/></b></p>
          <time dateTime={a.createdAt}>{new Date(a.createdAt).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}</time>
        </li>)}</ol></div>):<p>Nothing here yet.</p>}
        {owner&&<Link className="textlink" href="/admin/activity">See all activity<ArrowRight size={16}/></Link>}
      </section>
      <section className="glance" aria-labelledby="glance-h"><h3 id="glance-h">Content at a glance</h3>
        <div className="glance-row"><span>Free audio</span><span>{d.audio.length} · <span className="st ok">{pub(d.audio)} published</span>{d.audio.length-pub(d.audio)>0&&<> · <span className="st wa">{d.audio.length-pub(d.audio)} not published</span></>}</span></div>
        <div className="glance-row"><span>Course lessons</span><span>{d.lessons.length} · <span className="st ok">{pub(d.lessons)} published</span></span></div>
        <div className="glance-row"><span>Transcripts</span><span>{review||failed?<>{review>0&&<span className="st wa">{review} to review</span>}{review>0&&failed>0&&' · '}{failed>0&&<span className="st no">{failed} failed</span>}</>:<span className="st ok">All up to date</span>}</span></div>
        <div className="glance-row"><span>Coaching</span>{d.coaching.calLink?<span className="st ok">Bookings open</span>:<span className="st wa">Booking link not set</span>}</div>
      </section>
    </div>
  </>
}
