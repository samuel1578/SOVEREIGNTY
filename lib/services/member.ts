import 'server-only'
import {result,store,identity,session,progressFor,setCookie} from './store'
import {summarise} from './courses'
import type {OwnedTier,ContinueListening} from '../types'
const owned=(tierId:string)=>!!store.access[identity()]?.includes(tierId)
// TODO(backend): Supabase — join active entitlements to tiers, with lesson progress per tier.
export const getLibrary=()=>result(():OwnedTier[]=>store.tiers.filter(t=>owned(t.id)).map(t=>{
  const published=store.lessons.filter(l=>l.tierId===t.id&&l.status==='published')
  const key=(id:string)=>`${identity()}:${id}`
  const total=published.reduce((n,l)=>n+l.durationSeconds,0)
  const heard=published.reduce((n,l)=>n+(store.completed[key(l.id)]?l.durationSeconds:Math.min(l.durationSeconds,store.progress[key(l.id)]||0)),0)
  return {...summarise(store,t),publishedCount:published.length,completedCount:published.filter(l=>store.completed[key(l.id)]).length,percent:total?Math.round(heard/total*100):0}
}))
// TODO(backend): Supabase — latest in-progress lesson across owned tiers.
export const getContinueListening=()=>result(():ContinueListening|null=>{
  const l=store.lessons.find(l=>l.status==='published'&&owned(l.tierId)&&(store.progress[`${identity()}:${l.id}`]||0)>0&&!store.completed[`${identity()}:${l.id}`])
  const t=l&&store.tiers.find(t=>t.id===l.tierId)
  return l&&t?{lessonTitle:l.title,lessonSlug:l.slug,tierKey:t.key,tierName:t.name,positionSeconds:store.progress[`${identity()}:${l.id}`]||0,durationSeconds:l.durationSeconds}:null
})
// TODO(backend): Supabase — query non-revoked entitlement for this member.
export const getEntitlement=(id:string)=>result(()=>owned(id))
// TODO(backend): Supabase — get resume position.
export const getProgress=(id:string)=>result(()=>progressFor(id))
// TODO(backend): Supabase — upsert member-scoped progress (also reached via `navigator.sendBeacon` on pagehide).
export const saveProgress=(id:string,pos:number,complete:boolean)=>result(()=>{if(!session()||!Number.isFinite(pos))return;const k=`${identity()}:${id}`;store.progress[k]=Math.max(0,pos);if(complete)store.completed[k]=true})
// TODO(backend): Supabase — read immutable purchase history.
export const listPurchases=()=>result(()=>store.purchaseHistory[identity()]||[])
// TODO(backend): Supabase — update own profile only.
export const updateProfile=(name:string)=>result(()=>{const p=session();if(!p||!name.trim())throw Error('Please sign in to continue.');p.name=name.trim().slice(0,120);return p})
// TODO(backend): server-only — anonymise purchases and erase account data.
export const deleteAccount=()=>result(()=>{const id=identity();store.access[id]=[];Object.keys(store.progress).filter(k=>k.startsWith(id+':')).forEach(k=>{delete store.progress[k];delete store.completed[k]});store.people=store.people.filter(p=>p.id!==id);setCookie('rts-review','',0);setCookie('rts-mfa','',0)})
