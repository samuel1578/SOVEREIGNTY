import 'server-only'
import {result,store,secure,identity} from './store'
// TODO(backend): Supabase — select published ordered categories.
export const listCategories=()=>result(()=>store.categories.filter(c=>c.status==='published').sort((a,b)=>a.sortOrder-b.sortOrder))
// TODO(backend): Supabase — filter public rows and strip unapproved transcripts.
export const listAudio=({categorySlug,includeDrafts=false}:{categorySlug?:string;includeDrafts?:boolean}={})=>result(()=>store.audio
  .filter(a=>(a.status==='published'||includeDrafts&&secure())&&(!categorySlug||store.categories.find(c=>c.id===a.categoryId)?.slug===categorySlug))
  .sort((a,b)=>a.sortOrder-b.sortOrder)
  .map(a=>({...a,transcriptMd:a.transcriptStatus==='approved'||includeDrafts&&secure()?a.transcriptMd:undefined})))
// TODO(backend): Supabase — public session by slug.
export const getAudio=(slug:string)=>result(()=>{const a=store.audio.find(a=>a.slug===slug&&a.status==='published');return a?{...a,transcriptMd:a.transcriptStatus==='approved'?a.transcriptMd:undefined}:null})
// TODO(backend): server-only — authorise media and issue an expiring R2 URL (`/api/audio/url`).
export const getPlaybackUrl=({kind,id}:{kind:'audio'|'lesson';id:string})=>result(()=>{const a=kind==='audio'?store.audio.find(x=>x.id===id):store.lessons.find(x=>x.id===id);if(!a||(!secure()&&(a.status!=='published'||('isPreview' in a&&!a.isPreview&&!store.access[identity()]?.includes(a.tierId)))))throw Error('Members only');return '/media/sample-audio.mp3'})
