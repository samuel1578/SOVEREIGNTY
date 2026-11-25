'use client'
import {useState} from 'react'
import Link from 'next/link'
import {useAdmin,values,Field,MoneyField,statuses} from './shared'
import * as api from '@/app/actions/admin'
import {validateUpload} from '@/lib/upload'
import {formatDuration} from '@/lib/format'
import {Copy} from '../editorial'
import {Dialog} from '../states'
import {fileDuration} from './audio'
import {price} from '@/lib/editorial'
import type {ContentStatus} from '@/lib/types'

export function CourseAdmin({id='tier-1'}:{id?:string}){
  const {d,run,owner,confirm}=useAdmin(),[edit,E]=useState(''),[mid,M]=useState(''),[err,setErr]=useState('')
  const mods=d.modules.filter(m=>m.tierId===id).sort((a,b)=>a.sortOrder-b.sortOrder),lesson=d.lessons.find(l=>l.id===edit)
  async function submit(form:HTMLFormElement){
    const v=values(form)
    if(edit==='module'){await run(()=>api.saveModule({id:crypto.randomUUID(),tierId:id,title:v.Title,description:v.Description,sortOrder:+v.Order,status:'draft'}));E('');return}
    const f=(form.elements.namedItem('file') as HTMLInputElement).files?.[0]
    if(f){const bad=validateUpload(f);if(bad){setErr(bad);return}if(!(await run(()=>api.requestUpload({name:f.name,type:f.type,size:f.size}))))return}
    const seconds=f?Math.round(await fileDuration(f)):lesson?.durationSeconds||0
    const k=lesson?.id||crypto.randomUUID()
    // D3 — status is never part of a save; owners change it with setStatus below.
    const saved=await run(()=>api.saveLesson({id:k,slug:lesson?.slug||k,tierId:id,moduleId:mid,title:v.Title,summary:v.Summary,durationSeconds:seconds,isPreview:v.preview==='on',transcriptStatus:f?'processing':lesson?.transcriptStatus||'none',transcriptMd:lesson?.transcriptMd,status:lesson?.status||'draft',sortOrder:lesson?.sortOrder??d.lessons.length}))
    if(saved&&owner&&lesson&&v.Status&&v.Status!==lesson.status)await run(()=>api.setStatus(lesson.id,v.Status as ContentStatus))
    if(saved)E('')
  }
  return <><div className="filters" role="tablist" aria-label="Tiers">{d.tiers.map(t=><Link role="tab" aria-selected={t.id===id} className="outline" key={t.id} href={'/admin/courses/'+t.id}>{t.label}</Link>)}<button onClick={()=>E('module')}>Add module</button></div>
    {!mods.length&&<p>This tier has no lessons yet. Add a module, then your first lesson.</p>}
    {mods.map(m=><details open key={m.id} draggable onDragStart={e=>e.dataTransfer.setData('text/plain',m.id)} onDragOver={e=>e.preventDefault()} onDrop={e=>run(()=>api.reorder('modules',e.dataTransfer.getData('text/plain'),m.id))}><summary><Copy s={m.title}/></summary>
      {d.lessons.filter(l=>l.moduleId===m.id).sort((a,b)=>a.sortOrder-b.sortOrder).map(l=><div key={l.id} className="lesson-row" draggable onDragStart={e=>{e.stopPropagation();e.dataTransfer.setData('text/plain',l.id)}} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.stopPropagation();void run(()=>api.reorder('lessons',e.dataTransfer.getData('text/plain'),l.id))}}><button className="textlink" onClick={()=>{M(m.id);E(l.id);setErr('')}}><Copy s={l.title}/></button><small>{formatDuration(l.durationSeconds)} · {l.isPreview?'Free preview':'Members only'} · {statuses[l.status]}</small></div>)}
      <button className="outline" onClick={()=>{M(m.id);E('lesson');setErr('')}}>Add lesson</button></details>)}
    <p className="fine">Drag to reorder</p>
    {edit&&<Dialog title={edit==='module'?'Add module':lesson?.title||'Add lesson'} close={()=>E('')}>
      <form className="form-stack" onSubmit={e=>{e.preventDefault();void submit(e.currentTarget)}}>
        <Field label="Title" value={lesson?.title} required/>
        {edit==='module'?<><Field label="Description" type="area"/><Field label="Order" type="number" value={String(mods.length+1)}/></>:<>
          <Field label="Summary" type="area" value={lesson?.summary}/>
          <label>Audio file<input name="file" type="file" accept=".mp3,.m4a,audio/mpeg,audio/mp4,audio/x-m4a"/></label>
          <label><input type="checkbox" name="preview" defaultChecked={lesson?.isPreview}/> Let visitors hear this lesson for free</label>
          {lesson&&<Link href={'/admin/transcripts/'+lesson.id}>Transcript</Link>}
          {/* F-020 — Status is visible while editing; only the owner can change it. */}
          <label>Status{owner&&lesson?<select name="Status" defaultValue={lesson.status}>{(['draft','published','archived'] as const).map(s=><option key={s} value={s}>{statuses[s]}</option>)}</select>:<input readOnly value={statuses[lesson?.status||'draft']}/>}</label>
          <p className="fine">A lesson needs a title, audio and an approved transcript before it can be published.</p>
        </>}
        {err&&<p role="alert">{err}</p>}
        <button className="pill">Save draft</button>
      </form>
      {lesson&&owner&&lesson.status!=='published'&&<button className="outline" onClick={()=>{E('');confirm('Publish','Publish',()=>run(()=>api.setStatus(lesson.id,'published')))}}>Publish</button>}
    </Dialog>}</>
}

export function TierAdmin(){
  const {d,run,confirm}=useAdmin()
  return <><p>Tier 1 uses the brown theme, Tier 2 white, Tier 3 blue.</p>{d.tiers.map(t=><section key={t.id} className="panel"><div data-tier={t.theme} className="swatch"><h3>{t.label}</h3></div>
    <form className="form-stack" onSubmit={e=>{e.preventDefault();const v=values(e.currentTarget),p=v['Price (GBP)']?Math.round(Number(v['Price (GBP)'])*100):null;const save=()=>run(()=>api.setTierPrice(t.id,p,{name:v.Name,tagline:v['One-line description'],descriptionMd:v['Full description']}));if(p!==t.pricePence)confirm(`Change the price of ${t.label} to ${price(p)}? This applies to new purchases only. Existing members keep their access.`,'Save',save);else void save()}}>
      <Field label="Name" value={t.name} required/><Field label="One-line description" value={t.tagline}/><Field label="Full description" value={t.descriptionMd} type="area"/>
      <MoneyField label="Price (GBP)" value={t.pricePence===null?'':String(t.pricePence/100)}/>
      <button className="pill">Save</button>
    </form></section>)}<p>Set a price and publish at least one lesson before this tier can go live.</p></>
}
