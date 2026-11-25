'use client'
import {useState,useEffect,type ReactNode} from 'react'
import Link from 'next/link'
import {useRouter} from 'next/navigation'
import useSWR,{mutate as invalidate} from 'swr'
import {getWorkspace,getDashboardStats} from '@/app/actions/admin'
import {read,clientSecure,clientIdentity} from '@/lib/client'
import {useRole} from '../shell'
import {Failure,Dialog,Missing,SkeletonRow} from '../states'
import {Action,Copy} from '../editorial'
import {AdminContext,Security,type Run} from './shared'
import {AudioAdmin,Transcripts} from './audio'
import {CourseAdmin,TierAdmin} from './courses'
import {Members,Team,Activity} from './people'
import {Pages,Settings} from './settings'
import {TextSizePrompt,TextSizeButton} from './text-size'
import {Messages} from './messages'
import {useTextSize} from '../hooks'
import {Avatar} from '../profile'
import {Dashboard} from './dashboard'
import {LayoutDashboard,MessagesSquare,AudioLines,Layers3,FileText,Coins,PanelsTopLeft,Users,CalendarDays,UserCog,Settings as SettingsIcon,History} from 'lucide-react'
const sections:Record<string,string>={'':'Dashboard',messages:'Messages',audio:'Free audio',courses:'Courses',transcripts:'Transcripts',tiers:'Tiers & prices',members:'Members',pages:'Pages',coaching:'Coaching settings',settings:'Site settings',team:'Team',activity:'Activity'}
const assistantAreas=['','messages','audio','courses','transcripts','members','coaching']
// D20 — the menu is grouped, with an icon per area.
const groups:[string,string[]][]=[['Overview',['','messages']],['Content',['audio','courses','transcripts','tiers','pages']],['People',['members','coaching','team']],['Site',['settings','activity']]]
const icons:Record<string,typeof LayoutDashboard>={'':LayoutDashboard,messages:MessagesSquare,audio:AudioLines,courses:Layers3,transcripts:FileText,tiers:Coins,pages:PanelsTopLeft,members:Users,coaching:CalendarDays,team:UserCog,settings:SettingsIcon,activity:History}

export function Workspace({parts}:{parts:string[]}){
  const [area='',item]=parts,role=useRole(),router=useRouter(),owner=role==='owner',staff=owner||role==='assistant'
  const {size}=useTextSize(),[askSize,setAskSize]=useState(false)
  const [ok,setOk]=useState(false),[msg,M]=useState(''),[busy,B]=useState(false),[confirm,C]=useState<{title:string;label:string;fn:()=>Promise<unknown>}|null>(null)
  useEffect(()=>{const f=()=>setOk(clientSecure());f();window.addEventListener('rts-mfa',f);return()=>window.removeEventListener('rts-mfa',f)},[role])
  const allowed=owner||assistantAreas.includes(area)
  const {data,error,mutate}=useSWR(staff&&ok&&allowed&&area!=='security'?['admin-data',role,area,item]:null,()=>Promise.all([read(getWorkspace()),read(getDashboardStats())]))
  // UX only — proxy.ts (D8) is the request-time gate and every action re-checks role + MFA.
  useEffect(()=>{if(role===clientIdentity()&&area!=='security'&&(!staff||!clientSecure()))router.replace('/admin/security?next='+encodeURIComponent(location.pathname))},[role,area,staff,router])
  if(area==='security'||!staff||!ok)return <Security/>
  if(!allowed)return <div className="welcome section"><h2>This area is for the Reset to Sovereignty team only.</h2><Action href="/admin">Dashboard</Action></div>
  if(!(area in sections))return <Missing/>
  // D14 — new-message count beside Messages in the admin menu.
  const unread=data?.[0].messages.filter(m=>m.status==='new').length??0
  const me=data?.[0].me
  const shell=(body:ReactNode)=><div className="admin-layout"><aside className="admin-side">
    {me&&<div className="admin-me"><Avatar name={me} size={40}/><div><b><Copy s={me}/></b><small>{owner?'Owner':'Assistant'}</small></div></div>}
    <nav aria-label="Admin">{groups.map(([g,keys])=>{const ks=keys.filter(k=>owner||assistantAreas.includes(k));return ks.length?<div className="admin-group" key={g}><small className="admin-group-label">{g}</small>
      {ks.map(k=>{const I=icons[k];return <Link aria-current={area===k?'page':undefined} className={area===k?'current':''} href={k?'/admin/'+k:'/admin'} key={k}><I aria-hidden/>{sections[k]}{k==='messages'&&unread>0&&<span className="nav-count" aria-label={`${unread} new`}>{unread}</span>}</Link>})}</div>:null})}
      <TextSizeButton open={()=>setAskSize(true)}/></nav></aside><section className="admin-main">{body}</section></div>
  if(error)return shell(<Failure retry={mutate}/>)
  if(!data)return shell(<><small className="eyebrow">{owner?'Owner':'Assistant'} · {sections[area]}</small><SkeletonRow rows={6}/></>)
  const [d,stats]=data
  const run:Run=async(fn,m='Saved.')=>{B(true);const r=await fn();B(false);M(r.ok?m:r.error);if(r.ok)await invalidate(()=>true);return r.ok}
  // F-018 — greeting uses the signed-in staff member's name.
  const h=new Date().getHours(),greeting=`Good ${h<12?'morning':h<18?'afternoon':'evening'}, ${d.me||'[name]'}.`
  return <AdminContext.Provider value={{d,owner,run,confirm:(title,label,fn)=>C({title,label,fn})}}>
    {shell(<>{area!==''&&<><small className="eyebrow">{owner?'Owner':'Assistant'} · {sections[area]}</small><h1>{sections[area]}</h1></>}
      <div key={area+'-'+item}>{area===''?<Dashboard stats={stats as Record<string,number>} greeting={greeting}/>:area==='messages'?<Messages id={item}/>:area==='audio'?<AudioAdmin id={item}/>:area==='courses'?<CourseAdmin id={item}/>:area==='transcripts'?<Transcripts id={item}/>:area==='tiers'?<TierAdmin/>:area==='members'?<Members/>:area==='team'?<Team/>:area==='activity'?<Activity/>:area==='pages'?<Pages slug={item}/>:<Settings coaching={area==='coaching'}/>}</div>
      <p className="status" role="status">{busy?'Saving…':msg}</p></>)}
    {/* D13 — ask once, on the first admin visit; the sidebar control reopens it. */}
    {(askSize||size===null)&&<TextSizePrompt close={()=>setAskSize(false)}/>}
    {confirm&&<Dialog title={confirm.title} close={()=>C(null)}><button className="pill" onClick={()=>{const f=confirm.fn;C(null);void f()}}>{confirm.label}</button></Dialog>}
  </AdminContext.Provider>
}
