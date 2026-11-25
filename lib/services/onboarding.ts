import 'server-only'
import {result,store,session,setCookie} from './store'
import type {OnboardingAnswers,MemberProfile} from '../types'
import {REVIEW} from '../config'
import {AGE_RANGES,REASONS,PRACTICE,HEARD_FROM} from '../onboarding'

export type SignUpInput={name:string;email:string;terms:boolean;answers:OnboardingAnswers;avatarUrl?:string}
const clip=(v:unknown,n:number)=>typeof v==='string'?v.trim().slice(0,n)||undefined:undefined
const pick=(v:unknown,list:string[])=>typeof v==='string'&&list.includes(v)?v:undefined
/** Accepts only small image data URLs (the browser resizes to 320 px before upload). */
export function checkAvatar(v?:string|null){
  if(!v)return undefined
  if(!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(v)||v.length>400_000)throw Error('That photo could not be used. Please choose a JPG, PNG or WebP image.')
  return v
}

// TODO(backend): Supabase Auth — signUp/signInWithOtp with the answers in user metadata; a trigger
// writes the profile row. Payment (Stripe Checkout) can follow verification via `?intent=buy:tier-n`.
export const startSignUp=(input:SignUpInput)=>result(()=>{
  const name=clip(input.name,120),email=clip(input.email,254)?.toLowerCase()
  if(!name)throw Error('Please enter your name.')
  if(!email||!/^\S+@\S+\.\S+$/.test(email))throw Error('Please enter a valid email address.')
  if(!input.terms)throw Error('Please agree to the Terms and Privacy Policy to continue.')
  if(store.people.some(p=>p.email.toLowerCase()===email))throw Error('An account with this email already exists. Sign in instead.')
  const a=input.answers||{} as OnboardingAnswers
  const answers:OnboardingAnswers={
    preferredName:clip(a.preferredName,60),country:clip(a.country,80),ageRange:pick(a.ageRange,AGE_RANGES),
    reasons:Array.isArray(a.reasons)?a.reasons.filter(r=>REASONS.includes(r)):[],
    practice:pick(a.practice,PRACTICE),heardFrom:pick(a.heardFrom,HEARD_FROM),notes:clip(a.notes,500),marketing:!!a.marketing,
  }
  const token=crypto.randomUUID().replace(/-/g,'')
  store.pending??={}
  // Drop any earlier unconfirmed sign-up for the same email.
  for(const [k,p] of Object.entries(store.pending))if(p.email===email)delete store.pending[k]
  store.pending[token]={id:'u-'+token.slice(0,12),name,email,role:'member',joinedAt:new Date().toISOString().slice(0,10),avatarUrl:checkAvatar(input.avatarUrl),onboarding:answers}
  // Mock: no email is sent. In review mode the token is returned so the reviewer can "open the link".
  return {email,token:REVIEW?token:undefined}
})

// TODO(backend): Supabase Auth — verifyOtp(token_hash) from /auth/confirm; the session cookie replaces this.
export const confirmSignUp=(token:string)=>result(()=>{
  const p:MemberProfile|undefined=store.pending?.[token]
  if(!REVIEW||!p)throw Error('That link has expired or was already used. Please sign up again.')
  delete store.pending[token]
  if(!store.people.some(x=>x.email===p.email))store.people.push(p)
  store.access[p.id]??=[]
  setCookie('rts-review',p.id);setCookie('rts-mfa','',0)
  return {id:p.id}
})

// TODO(backend): Supabase Storage — upload to `avatars/{uid}` and save the public URL on the profile.
export const updateAvatar=(dataUrl:string|null)=>result(()=>{const p=session();if(!p)throw Error('Please sign in to continue.');p.avatarUrl=checkAvatar(dataUrl);return p.avatarUrl||null})
