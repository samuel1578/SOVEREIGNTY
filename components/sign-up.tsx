'use client'
import {useState,useEffect,useRef} from 'react'
import Link from 'next/link'
import {useRouter,useSearchParams} from 'next/navigation'
import {mutate} from 'swr'
import {Button} from './ui/button'
import {startSignUp,confirmSignUp} from '@/app/actions/onboarding'
import {AGE_RANGES,REASONS,PRACTICE,HEARD_FROM} from '@/lib/onboarding'
import {REVIEW} from '@/lib/config'
import {safeNext} from '@/lib/redirect'
import type {OnboardingAnswers} from '@/lib/types'
import {AuthLayout} from './sign-in'
import {PhotoPicker} from './profile'

const STEPS=['Create your account','A little about you','Add a profile photo']

// Mock onboarding (no email is sent). TODO(backend): Supabase sign-up + email confirmation; Stripe
// Checkout can follow confirmation when the visitor arrived with `?intent=buy:tier-n`.
export function SignUp(){
  const q=useSearchParams(),router=useRouter(),tier=q.get('intent')?.match(/^buy:tier-([123])$/)?.[1]
  const [step,setStep]=useState(0),[msg,setMsg]=useState(''),[busy,setBusy]=useState(false)
  const [name,setName]=useState(''),[email,setEmail]=useState(''),[terms,setTerms]=useState(false)
  const [a,setA]=useState<OnboardingAnswers>({reasons:[],marketing:false}),[photo,setPhoto]=useState<string|null>(null)
  const [sent,setSent]=useState<{email:string;token?:string}|null>(null)
  // Each step (and the confirmation screen) starts at the top of the page, with focus on its heading.
  const heading=useRef<HTMLHeadingElement>(null),first=useRef(true)
  useEffect(()=>{window.scrollTo({top:0});if(first.current){first.current=false;return}heading.current?.focus({preventScroll:true})},[step,sent])
  const set=(k:keyof OnboardingAnswers)=>(e:{target:{value:string}})=>setA({...a,[k]:e.target.value||undefined})

  function next(){
    setMsg('')
    if(step===0){
      if(!name.trim())return setMsg('Please enter your name.')
      if(!/^\S+@\S+\.\S+$/.test(email))return setMsg('Please enter a valid email address.')
      if(!terms)return setMsg('Please agree to the Terms and Privacy Policy to continue.')
    }
    if(step<2){setStep(step+1);return}
    void submit()
  }
  async function submit(){
    setBusy(true)
    const r=await startSignUp({name,email,terms,answers:a,avatarUrl:photo||undefined})
    setBusy(false)
    if(!r.ok){setMsg(r.error);if(/email|name|Terms/.test(r.error))setStep(0);return}
    setSent(r.data)
  }
  async function confirm(){
    if(!sent?.token)return
    setBusy(true)
    const r=await confirmSignUp(sent.token)
    setBusy(false)
    if(!r.ok){setMsg(r.error);return}
    window.dispatchEvent(new Event('rts-role'));void mutate(()=>true)
    router.push(tier?`/courses/tier-${tier}`:safeNext(q.get('next')))
  }

  if(sent)return <AuthLayout><h1 ref={heading} tabIndex={-1}>Check your email</h1>
    <p>We&apos;ve sent a link to <strong>{sent.email}</strong>. Open it to confirm your account.</p>
    {REVIEW&&sent.token&&<div className="review-note"><p className="fine">Review mode: no email is sent. Use the button to open the confirmation link.</p><Button disabled={busy} aria-busy={busy} onClick={()=>void confirm()}>Open the confirmation link</Button></div>}
    <button className="textlink" onClick={()=>{setSent(null);setStep(0)}}>Use a different email</button>
    {msg&&<p role="alert">{msg}</p>}
  </AuthLayout>

  return <AuthLayout>
    <p className="eyebrow">Step {step+1} of {STEPS.length}</p>
    <h1 ref={heading} tabIndex={-1}>{step===0?'Sign up':STEPS[step]}</h1>
    <div className="steps" aria-hidden>{STEPS.map((s,i)=><i key={s} className={i<=step?'on':''}/>)}</div>
    {step===0&&tier&&<p>Create your account to buy Tier {tier}. It only takes a moment.</p>}
    <form noValidate className="form-stack" onSubmit={e=>{e.preventDefault();next()}}>
      {step===0&&<>
        <label>Full name<input autoComplete="name" required value={name} onChange={e=>setName(e.target.value)} maxLength={120}/></label>
        <label>Email address<input type="email" autoComplete="email" required value={email} placeholder="you@example.com" onChange={e=>setEmail(e.target.value)}/></label>
        <label className="check"><input type="checkbox" checked={terms} onChange={e=>setTerms(e.target.checked)}/><span>I agree to the <Link href="/terms" target="_blank">Terms</Link> and <Link href="/privacy" target="_blank">Privacy Policy</Link>.</span></label>
      </>}
      {step===1&&<>
        <p className="fine">These help us shape the work around you. Everything here is optional, and only the Reset to Sovereignty team can see it. Please don&apos;t share medical information.</p>
        <label>What should we call you?<input autoComplete="nickname" value={a.preferredName||''} onChange={set('preferredName')} maxLength={60}/></label>
        <label>Where are you based?<input autoComplete="country-name" placeholder="Country" value={a.country||''} onChange={set('country')} maxLength={80}/></label>
        <label>Age range<select value={a.ageRange||''} onChange={set('ageRange')}><option value="">Choose…</option>{AGE_RANGES.map(v=><option key={v}>{v}</option>)}</select></label>
        <fieldset className="chip-set"><legend>What brings you to Reset to Sovereignty?</legend>{REASONS.map(r=><label key={r} className="check"><input type="checkbox" checked={a.reasons.includes(r)} onChange={e=>setA({...a,reasons:e.target.checked?[...a.reasons,r]:a.reasons.filter(x=>x!==r)})}/><span>{r}</span></label>)}</fieldset>
        <fieldset className="chip-set"><legend>How familiar are you with meditation or reflective practice?</legend>{PRACTICE.map(v=><label key={v} className="check"><input type="radio" name="practice" checked={a.practice===v} onChange={()=>setA({...a,practice:v})}/><span>{v}</span></label>)}</fieldset>
        <label>How did you hear about us?<select value={a.heardFrom||''} onChange={set('heardFrom')}><option value="">Choose…</option>{HEARD_FROM.map(v=><option key={v}>{v}</option>)}</select></label>
        <label>Anything you&apos;d like us to know?<textarea rows={4} maxLength={500} value={a.notes||''} onChange={set('notes')}/></label>
        <label className="check"><input type="checkbox" checked={a.marketing} onChange={e=>setA({...a,marketing:e.target.checked})}/><span>Email me when new free audio and courses are released.</span></label>
      </>}
      {step===2&&<>
        <p className="fine">Optional. Your photo appears in your library and to the Reset to Sovereignty team.</p>
        <PhotoPicker value={photo} name={name} onChange={setPhoto}/>
      </>}
      <Button disabled={busy} aria-busy={busy} type="submit">{step<2?'Continue':'Create my account'}</Button>
      {step>0&&<div className="actions step-actions"><button type="button" className="textlink" onClick={()=>{setMsg('');setStep(step-1)}}>Back</button>{step===1&&<button type="button" className="textlink" onClick={()=>setStep(2)}>Skip this step</button>}</div>}
    </form>
    {msg&&<p role="alert">{msg}</p>}
    {step===0&&<p className="fine">Already have an account? <Link href={'/sign-in'+(q.toString()?'?'+q:'')}>Sign in</Link></p>}
  </AuthLayout>
}
