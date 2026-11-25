import {saveProgress} from '@/lib/services/member'
import {withRequest} from '@/lib/services/request'

// F-023 — receives `navigator.sendBeacon` progress on pagehide (Server Actions can't be beaconed).
// TODO(backend): Supabase — upsert lesson_progress for the signed-in member (same rules as saveProgress).
export async function POST(request:Request){
  let body:unknown
  try{body=await request.json()}catch{return new Response(null,{status:400})}
  const {lessonId,positionSeconds,completed}=(body||{}) as {lessonId?:unknown;positionSeconds?:unknown;completed?:unknown}
  if(typeof lessonId!=='string'||lessonId.length>100||typeof positionSeconds!=='number'||!Number.isFinite(positionSeconds))return new Response(null,{status:400})
  const r=await withRequest(()=>saveProgress(lessonId,positionSeconds,completed===true))
  return new Response(null,{status:r.ok?204:500})
}
