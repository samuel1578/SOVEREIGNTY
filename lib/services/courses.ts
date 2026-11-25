import 'server-only'
import {result,store,identity,isSamplePrice,type Store} from './store'
import type {Tier,TierSummary} from '../types'
export const summarise=(s:Store,t:Tier):TierSummary=>{const ls=s.lessons.filter(l=>l.tierId===t.id);return {...t,lessonCount:ls.length,totalSeconds:ls.reduce((n,l)=>n+l.durationSeconds,0),samplePrice:isSamplePrice(t.id,t.pricePence)}}
// TODO(backend): Supabase — public tier catalogue with lesson counts.
export const listTiers=()=>result(()=>store.tiers.map(t=>summarise(store,t)))
// TODO(backend): Supabase — fetch tier by key.
export const getTier=(key:string)=>result(()=>{const t=store.tiers.find(t=>t.key===key);return t?summarise(store,t):undefined})
// TODO(backend): Supabase — ordered module outlines.
export const listModules=(id:string)=>result(()=>store.modules.filter(m=>m.tierId===id).sort((a,b)=>a.sortOrder-b.sortOrder))
// TODO(backend): Supabase — expose outline metadata, never unreleased transcript bodies.
export const listLessons=(id:string)=>result(()=>store.lessons.filter(l=>l.tierId===id).sort((a,b)=>a.sortOrder-b.sortOrder).map(l=>({...l,transcriptMd:undefined})))
// TODO(backend): Supabase RLS — fetch lesson details after entitlement check.
export const getLesson=(key:string,slug:string)=>result(()=>{const l=store.lessons.find(l=>l.tierId===key&&l.slug===slug);return l?{...l,moduleTitle:store.modules.find(m=>m.id===l.moduleId)?.title||'',transcriptMd:l.status==='published'&&l.transcriptStatus==='approved'&&(l.isPreview||store.access[identity()]?.includes(key))?l.transcriptMd:undefined}:null})
