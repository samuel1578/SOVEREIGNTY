'use client'
import {useEffect,useRef,useState} from 'react'
import Link from 'next/link'
import {sendContactMessage} from '@/app/actions/contact'
import {TOPICS,MESSAGE_MAX,validateContact,type ContactField,type ContactInput} from '@/lib/contact'
import {text} from '@/lib/editorial'
import {Copy} from './editorial'
import Image from 'next/image'
import {Mail} from 'lucide-react'
import {pageArt} from '@/lib/home-media'

// D14 — P15 Contact. Copy: docs/content.md §9 (draft, awaiting client approval).
type Errors=Partial<Record<ContactField,string>>
const ORDER:ContactField[]=['name','email','topic','message']
const [privacyBefore,privacyAfter='']=text(579).split('Privacy Policy')

export function Contact(){
  const [sent,setSent]=useState(false),[busy,setBusy]=useState(false),[errors,setErrors]=useState<Errors>({}),[failed,setFailed]=useState(false),[chars,setChars]=useState(0)
  const form=useRef<HTMLFormElement>(null),done=useRef<HTMLHeadingElement>(null)
  useEffect(()=>{if(sent)done.current?.focus()},[sent])

  async function submit(el:HTMLFormElement){
    const f=new FormData(el),input:ContactInput={name:String(f.get('name')||''),email:String(f.get('email')||''),topic:String(f.get('topic')||''),message:String(f.get('message')||''),website:String(f.get('website')||'')}
    const local=validateContact(input)
    setFailed(false);setErrors(local)
    if(Object.keys(local).length){focusFirst(el,local);return}
    setBusy(true)
    const r=await sendContactMessage(input)
    setBusy(false)
    if(r.ok){el.reset();setChars(0);setSent(true);return}
    if(r.fieldErrors){setErrors(r.fieldErrors);focusFirst(el,r.fieldErrors)}else setFailed(true)
  }

  const describe=(k:ContactField)=>errors[k]?`contact-${k}-error`:undefined
  const error=(k:ContactField)=>errors[k]&&<p className="field-error" id={`contact-${k}-error`}>{errors[k]}</p>

  // D21 — split layout: a calm photo with the direct email and care note, the form beside it.
  return <section className="contact-split">
      <div className="contact-photo">
        <div className="contact-photo-bg"><Image src={pageArt.contact.src} alt={pageArt.contact.alt} fill priority sizes="(max-width:1023px) 100vw, 42vw"/></div>
        <small className="eyebrow">Contact</small><h1>{text(572)}</h1><p>{text(573)}</p>
        <div className="contact-meta"><p><Mail size={18} aria-hidden/><span><Copy s={text(591)}/></span></p><p className="fine">{text(592)}</p></div>
      </div>
      <div className="contact-card">
        {sent?<div className="contact-done" role="status">
          <h2 ref={done} tabIndex={-1}>{text(588)}</h2>
          <p><Copy s={text(589)}/></p>
          <button type="button" className="outline" onClick={()=>setSent(false)}>{text(590)}</button>
        </div>:<form ref={form} noValidate aria-busy={busy} onSubmit={e=>{e.preventDefault();void submit(e.currentTarget)}}>
          <label>{text(574)}<input name="name" autoComplete="name" required maxLength={120} aria-invalid={!!errors.name} aria-describedby={describe('name')}/>{error('name')}</label>
          <label>{text(575)}<input name="email" type="email" autoComplete="email" inputMode="email" required maxLength={254} aria-invalid={!!errors.email} aria-describedby={describe('email')}/>{error('email')}</label>
          <fieldset className="topic-options" aria-invalid={!!errors.topic} aria-describedby={describe('topic')}>
            <legend>{text(576)}</legend>
            {TOPICS.map(t=><label key={t}><input type="radio" name="topic" value={t} required/>{t}</label>)}
            {error('topic')}
          </fieldset>
          <label>{text(578)}<textarea name="message" required maxLength={MESSAGE_MAX} rows={8} aria-invalid={!!errors.message} aria-describedby={describe('message')} onInput={e=>setChars(e.currentTarget.value.length)}/><span className="char-count" aria-hidden>{chars} / {MESSAGE_MAX}</span>{error('message')}</label>
          {/* Spam trap: hidden from people and assistive technology; bots fill it in. */}
          <div className="hp" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off"/></label></div>
          <p className="fine">{privacyBefore}<Link href="/privacy">Privacy Policy</Link>{privacyAfter}</p>
          <div className="actions"><button className="pill" disabled={busy}>{busy?text(581):text(580)}</button></div>
          {failed&&<p role="alert" className="field-error">{text(587)}</p>}
        </form>}
      </div>
    </section>
}

function focusFirst(el:HTMLFormElement,errors:Errors){
  const k=ORDER.find(x=>errors[x])
  if(k)el.querySelector<HTMLElement>(`[name="${k}"]`)?.focus()
}
