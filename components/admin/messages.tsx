'use client'
import {useEffect,useState} from 'react'
import Link from 'next/link'
import {mutate as invalidate} from 'swr'
import {setMessageStatus} from '@/app/actions/contact'
import {text} from '@/lib/editorial'
import type {ContactMessage,MessageStatus} from '@/lib/types'
import {Missing} from '../states'
import {useAdmin,Table} from './shared'

// D14 — A12 Messages (owner and assistant). Copy: docs/content.md §10 (draft).
const KEYS:MessageStatus[]=['new','read','archived']
const TABS=text(597).split(' · ')
const COLS=text(598).split(' · ')
const [MARK_READ,MARK_UNREAD]=text(601).split(' · ')
const [ARCHIVE,RESTORE]=text(602).split(' · ')
const label=(s:MessageStatus)=>TABS[KEYS.indexOf(s)]
const when=(iso:string)=>new Intl.DateTimeFormat('en-GB',{dateStyle:'medium',timeStyle:'short'}).format(new Date(iso))
const reply=(m:ContactMessage)=>`mailto:${m.email}?subject=${encodeURIComponent('Re: '+m.topic)}`

export function Messages({id}:{id?:string}){
  const {d}=useAdmin(),[tab,setTab]=useState<MessageStatus>('new')
  if(id)return <MessageDetail key={id} id={id}/>
  const rows=d.messages.filter(m=>m.status===tab)
  return <>
    <div className="filters" role="group" aria-label={text(596)}>
      {KEYS.map(k=>{const n=d.messages.filter(m=>m.status===k).length;return <button key={k} type="button" aria-pressed={tab===k} onClick={()=>setTab(k)}>{label(k)} ({n})</button>})}
    </div>
    {rows.length?<Table cols={COLS}>{rows.map(m=><tr key={m.id} className={m.status==='new'?'unread':undefined}>
      <td><Link href={'/admin/messages/'+m.id}>{m.name}</Link></td>
      <td>{m.topic}</td>
      <td>{when(m.createdAt)}</td>
      <td><span className="badge">{label(m.status)}</span></td>
    </tr>)}</Table>:<p>{text(599)}</p>}
  </>
}

function MessageDetail({id}:{id:string}){
  const {d,run}=useAdmin(),m=d.messages.find(x=>x.id===id)
  // Opening a new message marks it read; "Mark as unread" undoes it.
  useEffect(()=>{if(m?.status==='new')void setMessageStatus(m.id,'read').then(r=>{if(r.ok)void invalidate(()=>true)})},[m?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  if(!m)return <Missing/>
  return <article className="message">
    <Link className="textlink" href="/admin/messages">{text(603)}</Link>
    <h2>{m.topic}</h2>
    <dl className="message-meta">
      <div><dt>{COLS[0]}</dt><dd>{m.name} · <a href={reply(m)}>{m.email}</a></dd></div>
      <div><dt>{COLS[2]}</dt><dd>{when(m.createdAt)}</dd></div>
      <div><dt>{COLS[3]}</dt><dd><span className="badge">{label(m.status)}</span></dd></div>
    </dl>
    {/* Visitor-written text: plain text only, never the Copy/Markdown renderer. */}
    <div className="panel message-body">{m.message}</div>
    <div className="actions">
      <a className="pill" href={reply(m)}>{text(600)}</a>
      {m.status!=='archived'&&<button type="button" className="outline" onClick={()=>run(()=>setMessageStatus(m.id,m.status==='new'?'read':'new'))}>{m.status==='new'?MARK_READ:MARK_UNREAD}</button>}
      <button type="button" className="outline" onClick={()=>run(()=>setMessageStatus(m.id,m.status==='archived'?'read':'archived'))}>{m.status==='archived'?RESTORE:ARCHIVE}</button>
    </div>
  </article>
}
