'use client'
import {useState} from 'react'
import Link from 'next/link'
import {useRouter} from 'next/navigation'
import {GripVertical,Plus} from 'lucide-react'
import Image from 'next/image'
import {coverFor} from '@/lib/home-media'
import * as api from '@/app/actions/admin'
import {validateUpload,UPLOAD_ERRORS} from '@/lib/upload'
import {formatDuration} from '@/lib/format'
import {Field,Table,ts,statuses,useAdmin,values} from './shared'
import {Controls} from '../player'
import {source} from '../catalog'
import {Copy,Action} from '../editorial'
import {Missing,Dialog} from '../states'
import type {AudioItem,Lesson} from '@/lib/types'

/** Reads the real duration from the local file before upload (F-006); 0 if the browser can't tell. */
export function fileDuration(f:File){return new Promise<number>(resolve=>{const url=URL.createObjectURL(f),a=new Audio();const done=(n:number)=>{URL.revokeObjectURL(url);resolve(Number.isFinite(n)?n:0)};a.preload='metadata';a.onloadedmetadata=()=>done(a.duration);a.onerror=()=>done(0);a.src=url;setTimeout(()=>done(0),5000)})}

export function Upload({done}:{done:(id:string)=>void}){
  const [msg,M]=useState(''),[busy,B]=useState(false)
  async function load(f?:File){
    if(!f||busy)return
    // F-008 — instant feedback; the server action re-validates name, MIME type and size.
    const invalid=validateUpload(f);if(invalid){M(invalid);return}
    B(true)
    const r=await api.requestUpload({name:f.name,type:f.type,size:f.size})
    if(!r.ok){M(r.error);B(false);return}
    const seconds=await fileDuration(f)
    // TODO(backend): R2 — PUT the file to r.data.uploadUrl with progress events; abort → UPLOAD_ERRORS.stopped.
    for(const n of [0,35,70,100]){
      if(!navigator.onLine||new URLSearchParams(location.search).get('mockUpload')==='stopped'){M(UPLOAD_ERRORS.stopped);B(false);return}
      M(`Uploading… ${n}%`);await new Promise(r=>setTimeout(r,120))
    }
    const ok=await api.confirmUpload(r.data.key,{title:f.name.replace(/\.(mp3|m4a)$/i,''),durationSeconds:seconds})
    M(ok.ok?'Uploaded. Creating transcript…':ok.error);B(false);if(ok.ok)done(ok.data)
  }
  return <div className="upload" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();void load(e.dataTransfer.files[0])}}><label>Drop an MP3 or M4A here, or browse<input className="block" type="file" accept=".mp3,.m4a,audio/mpeg,audio/mp4,audio/x-m4a" disabled={busy} onChange={e=>load(e.target.files?.[0])}/></label><small>Up to 300 MB</small><span role="status">{msg}</span></div>
}

function AudioEditor({a}:{a:AudioItem}){
  const {d,owner,run,confirm}=useAdmin(),router=useRouter()
  return <div className="editor-grid">
    <form id="audio-form" className="form-stack" onSubmit={e=>{e.preventDefault();const v=values(e.currentTarget);void run(()=>api.saveAudio(a.id,{title:v.Title,categoryId:v.Category,description:v['Short description'],coverAlt:v['Alt text']}))}}>
      <Field label="Title" value={a.title} required/>
      <label>Category<select name="Category" defaultValue={a.categoryId}>{d.categories.map(c=><option value={c.id} key={c.id}>{c.title}</option>)}</select></label>
      <Field label="Short description" type="area" value={a.description}/>
      <label>Cover image (optional)<input type="file" accept="image/*" onChange={e=>{const alt=e.currentTarget.form?.elements.namedItem('Alt text') as HTMLInputElement;if(alt)alt.required=!!e.currentTarget.files?.length}}/></label>
      <Field label="Alt text" value={a.coverAlt}/>
    </form>
    <aside className="editor-side">
      <Controls t={{id:a.id,kind:'audio',title:a.title,group:'Free audio',duration:a.durationSeconds,getSourceUrl:source(a.id,'audio')}}/>
      <p><span className="badge">{statuses[a.status]}</span> · {formatDuration(a.durationSeconds)}</p>
      <Action quiet href={'/admin/transcripts/'+a.id}>Transcript · {ts(a.transcriptStatus)}</Action>
      {owner?<div className="filters">{[a.status==='published'?'Unpublish':'Publish','Archive','Delete permanently'].map(v=><button key={v} className={v==='Delete permanently'?'outline danger':'outline'} onClick={()=>confirm(v==='Archive'?'Archive this audio? It will be hidden from the site but can be restored.':v==='Delete permanently'?"This permanently deletes the audio file and its details. This can't be undone.":v,v,async()=>{if(v==='Delete permanently'){if(await run(()=>api.removeAudio(a.id)))router.push('/admin/audio')}else await run(()=>api.setStatus(a.id,v==='Publish'?'published':v==='Archive'?'archived':'draft'))})}>{v}</button>)}</div>:<p>Only the owner can publish. Your changes are saved as a draft.</p>}
    </aside>
    <div className="savebar"><button form="audio-form" className="pill">Save changes</button></div>
  </div>
}

export function AudioAdmin({id}:{id?:string}){
  const {d,run}=useAdmin(),router=useRouter(),[q,Q]=useState(''),[category,C]=useState(''),[status,S]=useState(''),[panel,P]=useState('')
  const a=d.audio.find(a=>a.id===id)
  if(id&&!a)return <Missing/>
  if(a)return <AudioEditor a={a}/>
  // D20 — a visual list: cover, status (dot + word), length and transcript state; drag the handle to reorder.
  const rows=d.audio.filter(a=>a.title.toLowerCase().includes(q.toLowerCase())&&(!category||a.categoryId===category)&&(!status||a.status===status))
  const count=(s:string)=>d.audio.filter(a=>!s||a.status===s).length
  const tone=(s:string)=>s==='published'||s==='approved'?'ok':s==='failed'?'no':s==='none'?'':'wa'
  return <>
    <div className="list-actions"><button className="outline" onClick={()=>P('categories')}>Manage categories</button><button className="pill" onClick={()=>P('upload')}><Plus size={16} aria-hidden/>Upload audio</button></div>
    <div className="filters list-filters">
      {[['','All'],['published','Published'],['draft','Drafts'],['archived','Archived']].map(([s,l])=><button key={s} aria-pressed={status===s} onClick={()=>S(s)}>{l} · {count(s)}</button>)}
      <select aria-label="Category" value={category} onChange={e=>C(e.target.value)}><option value="">All categories</option>{d.categories.map(c=><option value={c.id} key={c.id}>{c.title}</option>)}</select>
      <input className="list-search" aria-label="Search audio" placeholder="Search audio…" value={q} onChange={e=>Q(e.target.value)}/>
    </div>
    {panel&&<Dialog close={()=>P('')} title={panel==='upload'?'Upload audio':'Manage categories'}>{panel==='upload'?<Upload done={id=>{P('');router.push('/admin/audio/'+id)}}/>:<>{d.categories.map(c=><p key={c.id}><Copy s={c.title}/></p>)}<form className="form-stack" onSubmit={async e=>{e.preventDefault();const f=values(e.currentTarget),id=crypto.randomUUID();if(await run(()=>api.saveCategory({id,title:f.Title,slug:id,description:f.Description,sortOrder:d.categories.length,status:'published'})))P('')}}><Field label="Title" required/><Field label="Description"/><button className="pill">Save</button></form></>}</Dialog>}
    {rows.length?<ol className="content-list">{rows.map(a=><li key={a.id} className="content-item" draggable onDragStart={e=>e.dataTransfer.setData('text/plain',a.id)} onDragOver={e=>e.preventDefault()} onDrop={e=>run(()=>api.reorder('audio',e.dataTransfer.getData('text/plain'),a.id))}>
      <span className="content-thumb"><Image src={coverFor(a)} alt="" fill sizes="72px"/>{!a.coverUrl&&<Link href={'/admin/audio/'+a.id} className="content-addcover" title="This audio shows placeholder art until you add a cover">Add cover</Link>}</span>
      <div className="content-main"><Link href={'/admin/audio/'+a.id}><b><Copy s={a.title}/></b></Link><small><Copy s={d.categories.find(c=>c.id===a.categoryId)?.title||''}/> · {formatDuration(a.durationSeconds)}</small></div>
      <span className={'st '+tone(a.status)}>{statuses[a.status]}</span>
      <span className="content-meta">Transcript<span className={'st '+tone(a.transcriptStatus)}>{ts(a.transcriptStatus)}</span></span>
      <span className="content-grip" title="Drag to reorder"><GripVertical size={18} aria-hidden/></span>
    </li>)}</ol>:<p>{d.audio.length?'Nothing matches these filters.':'No audio yet. Upload your first audio to get started.'}</p>}
  </>
}

function Review({item}:{item:AudioItem|Lesson}){
  const {run,confirm}=useAdmin(),[md,M]=useState(item.transcriptMd||''),[saving,S]=useState('')
  const kind='moduleId' in item?'lesson':'audio'
  return <><div className="sticky-player"><Controls t={{id:item.id,kind,title:item.title,group:'Transcripts',duration:item.durationSeconds,getSourceUrl:source(item.id,kind)}}/></div>
    <label className="form-stack">Transcript<textarea className="measure" rows={18} value={md} onChange={e=>{M(e.target.value);S('Saving…')}} onBlur={async()=>{if(saving==='Saving…'){if(await run(()=>api.saveTranscript(item.id,md)))S('Saved')}}}/></label>
    <small role="status">{saving}</small>
    {/* D2 — owner and assistant can approve; publishing the audio itself stays owner-only. */}
    <div className="filters"><button onClick={()=>run(()=>api.saveTranscript(item.id,md))}>Save draft</button><button onClick={()=>confirm('Approve this transcript? It will appear on the site with this audio.','Approve and publish transcript',()=>run(()=>api.approveTranscript(item.id,md)))}>Approve and publish transcript</button><button onClick={()=>run(()=>api.regenerateTranscript(item.id))}>Regenerate</button></div>
    {item.transcriptStatus==='failed'&&<p>The transcript couldn&apos;t be created. <button className="textlink" onClick={()=>run(()=>api.regenerateTranscript(item.id))}>Try again</button></p>}</>
}

export function Transcripts({id}:{id?:string}){
  const {d}=useAdmin(),[filter,F]=useState('')
  const all=[...d.audio,...d.lessons.filter(l=>l.transcriptStatus!=='none')]
  if(id){const item=all.find(a=>a.id===id);return item?<Review item={item}/>:<Missing/>}
  const rows=all.filter(a=>!filter||a.transcriptStatus===filter)
  return <><p>Transcripts are created automatically from each audio. Read them alongside the audio, correct anything misheard, then approve. Nothing is shown on the site until you approve it.</p><div className="filters">{['','draft','approved','processing','failed'].map(s=><button key={s} aria-pressed={s===filter} onClick={()=>F(s)}>{s?(s==='failed'?'Failed':ts(s)):'All'}</button>)}</div>{rows.length?<Table cols={['Title','Status']}>{rows.map(a=><tr key={a.id}><td><Link href={'/admin/transcripts/'+a.id}><Copy s={a.title}/></Link></td><td>{ts(a.transcriptStatus)}</td></tr>)}</Table>:<p>All caught up. There are no transcripts to review.</p>}</>
}
