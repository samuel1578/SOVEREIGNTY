import type {AudioCategory,AudioItem,Tier,CourseModule,Lesson,MemberProfile,TranscriptStatus} from '../types'
// SAMPLE — catalogue fixtures; no client media or personal information.
export const categories:AudioCategory[]=[1,2].map(n=>({id:`c${n}`,slug:`category-${n}`,title:`[Category ${n}]`,description:'[Category description — client writes in admin]',sortOrder:n,status:'published'}))
// SAMPLE — the trial audio matches the 60 s sample file; drafts use varied lengths to exercise duration rendering.
const audioSeconds=[60,720,540,1260,300,900]
export const audio:AudioItem[]=Array.from({length:6},(_,i)=>({id:`a${i+1}`,slug:i?`audio-${i+1}`:'trial-audio',categoryId:categories[i%2].id,title:i?`[Audio title ${i+1}]`:'[Audio title]',description:'[Short description — client]',durationSeconds:audioSeconds[i],transcriptStatus:(['approved','draft','processing','failed','none','draft'] as TranscriptStatus[])[i],transcriptMd:'[Transcript]',status:i?'draft':'published',sortOrder:i}))
// SAMPLE
export const tiers:Tier[]=[1,2,3].map((n,i)=>({id:`tier-${n}`,key:`tier-${n}` as Tier['key'],theme:(['brown','white','blue'] as const)[i],label:`Tier ${n}`,name:`[TIER ${n} NAME]`,tagline:`[TIER ${n} ONE-LINER]`,descriptionMd:`[TIER ${n} DESCRIPTION]`,pricePence:null,currency:'GBP',status:'draft'}))
// SAMPLE — review-only price (D4). Applied only when NEXT_PUBLIC_REVIEW=1; launch prices stay null.
export const reviewPrices:Record<string,number>={'tier-1':4900}
// SAMPLE
export const modules:CourseModule[]=[1,2].map(n=>({id:`m${n}`,tierId:'tier-1',title:`[Module ${n} title]`,sortOrder:n,status:'published'}))
// SAMPLE — trial lesson matches the 60 s sample file.
const lessonSeconds=[60,900,1200,780]
export const lessons:Lesson[]=[0,1,2,3].map(i=>({id:`l${i+1}`,slug:i?`lesson-${i+1}`:'trial-lesson',tierId:'tier-1',moduleId:i<2?'m1':'m2',title:i?'Coming soon':'[Lesson title]',summary:'[Summary]',durationSeconds:lessonSeconds[i],isPreview:!i,status:i?'draft':'published',transcriptStatus:i?'none':'approved',transcriptMd:i?undefined:'[Transcript]',sortOrder:i}))
// SAMPLE — names are placeholders (F-018); no invented personal data.
export const people:MemberProfile[]=['member','empty','assistant','owner'].map((id,i)=>({id,name:['[Member name]','[Member name]','[Assistant name]','[Owner name]'][i],email:`${id}@example.com`,role:(['member','member','assistant','owner'] as const)[i],joinedAt:'2026-11-19'}))
