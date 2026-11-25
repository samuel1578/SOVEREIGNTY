import 'server-only'
import {store,result,guard,log,identity} from './store'
import {pages} from '../editorial'
import {validateUpload,type UploadFile} from '../upload'
import type {AudioItem,ContentStatus,Tier,Lesson,CourseModule,AudioCategory} from '../types'
import type {PageCopy} from './pages'
// TODO(backend): Supabase — restrict each query to the staff role and verified MFA session.
export const getWorkspace=()=>result(()=>{guard();const owner=identity()==='owner';return {audio:store.audio,categories:store.categories,tiers:store.tiers,modules:store.modules,lessons:store.lessons,people:store.people.filter(p=>owner||p.role==='member'),access:store.access,progress:store.progress,pages:owner?store.pages:{} as typeof store.pages,settings:owner?store.settings:{},coaching:store.coaching,messages:store.messages,activity:owner?store.activity:store.activity.filter(a=>!['Price','Access','Team'].includes(a.action)),me:store.people.find(p=>p.id===identity())?.name||''}})
// TODO(backend): R2 — issue scoped single-use upload URLs after file validation (`POST /api/uploads/presign`).
// D6 — receives the file's name/type/size only; bytes go straight to R2, never through this action.
export const requestUpload=(file:UploadFile)=>result(()=>{guard();const error=validateUpload(file);if(error)throw Error(error);return {uploadUrl:'',key:crypto.randomUUID()}})
// TODO(backend): server-only — verify the uploaded object (HEAD), read its duration and queue transcription.
export const confirmUpload=(key:string,meta:{title:string;durationSeconds?:number})=>result(()=>{guard();const a:AudioItem={id:key,slug:key,categoryId:store.categories[0].id,title:meta.title,description:'[Short description — client]',durationSeconds:Math.max(0,Math.round(meta.durationSeconds||0)),status:'draft',transcriptStatus:'processing',sortOrder:store.audio.length};store.audio.push(a);log('Uploaded',a.title);return a.id})
// TODO(backend): Supabase — update editable fields only; publish state is never changed here (D3).
export const saveAudio=(id:string,input:Partial<Pick<AudioItem,'title'|'description'|'categoryId'|'coverAlt'|'coverUrl'>>)=>result(()=>{guard();const a=store.audio.find(a=>a.id===id);if(!a)throw Error('No audio yet. Upload your first audio to get started.');const {title,description,categoryId,coverAlt,coverUrl}=input;Object.assign(a,Object.fromEntries(Object.entries({title,description,categoryId,coverAlt,coverUrl}).filter(([,v])=>v!==undefined)));log('Saved',a.title)})
// TODO(backend): Supabase — create and order categories.
export const saveCategory=(input:AudioCategory)=>result(()=>{guard();const c=store.categories.find(c=>c.id===input.id);if(c)Object.assign(c,input);else store.categories.push(input);log('Saved',input.title)})
// TODO(backend): Supabase — create and order course modules.
export const saveModule=(input:CourseModule)=>result(()=>{guard();const m=store.modules.find(x=>x.id===input.id);if(m)Object.assign(m,{...input,status:m.status});else store.modules.push(input);log('Saved',input.title)})
// TODO(backend): Supabase — save lesson fields; existing publish state is preserved, new lessons start as draft (D3).
export const saveLesson=(input:Lesson)=>result(()=>{guard();const l=store.lessons.find(x=>x.id===input.id);if(l)Object.assign(l,{...input,status:l.status});else store.lessons.push({...input,status:'draft'});log('Saved',input.title)})
// TODO(backend): Supabase — owner-only publish/archive and validate release requirements.
export const setStatus=(id:string,status:ContentStatus)=>result(()=>{guard(true);const a=store.audio.find(x=>x.id===id)||store.lessons.find(x=>x.id===id);if(!a)throw Error('Nothing here yet.');if(status==='published'&&(!a.title||a.transcriptStatus!=='approved'))throw Error('A lesson needs a title, audio and an approved transcript before it can be published.');a.status=status;log(status,a.title)})
// TODO(backend): Supabase/R2 — remove audio metadata and file together.
export const removeAudio=(id:string)=>result(()=>{guard(true);store.audio=store.audio.filter(a=>a.id!==id);log('Delete permanently',id)})
// TODO(backend): Supabase — save draft text without publishing it.
export const saveTranscript=(id:string,md:string)=>result(()=>{guard();const a=store.audio.find(a=>a.id===id)||store.lessons.find(l=>l.id===id);if(a){a.transcriptMd=md;a.transcriptStatus='draft'}log('Save draft',id)})
// TODO(backend): Supabase — approve reviewed text; owner or assistant (PRD BR-14, D2).
export const approveTranscript=(id:string,md:string)=>result(()=>{guard();if(!md.trim())throw Error('Ready to review');const a=store.audio.find(a=>a.id===id)||store.lessons.find(l=>l.id===id);if(a){a.transcriptMd=md;a.transcriptStatus='approved'}log('approved a transcript',id)})
// TODO(backend): transcription provider — create a new review-only draft.
export const regenerateTranscript=(id:string)=>result(()=>{guard();const a=store.audio.find(a=>a.id===id)||store.lessons.find(l=>l.id===id);if(a){a.transcriptStatus='processing';setTimeout(()=>{a.transcriptStatus='draft'},1200)}log('Regenerate',id)})
// TODO(backend): Supabase — store pence, leaving past purchase amounts unchanged.
export const setTierPrice=(tierId:string,pricePence:number|null,fields:Partial<Pick<Tier,'name'|'tagline'|'descriptionMd'>>={})=>result(()=>{guard(true);if(pricePence!==null&&(!Number.isSafeInteger(pricePence)||pricePence<1))throw Error('Set a price and publish at least one lesson before this tier can go live.');const t=store.tiers.find(t=>t.id===tierId);if(!t)throw Error('Nothing here yet.');Object.assign(t,fields,{pricePence});log('Price',t.label)})
// TODO(backend): Supabase — record audited manual grant.
export const grantAccess=(memberId:string,tierId:string)=>result(()=>{guard(true);store.access[memberId]=Array.from(new Set([...(store.access[memberId]||[]),tierId]));log('Access',tierId)})
// TODO(backend): Supabase — revoke access without removing purchase history.
export const removeAccess=(memberId:string,tierId:string)=>result(()=>{guard(true);store.access[memberId]=(store.access[memberId]||[]).filter(t=>t!==tierId);log('Access',tierId)})
// TODO(backend): Supabase — searchable member directory.
export const listMembers=(query:string)=>result(()=>{guard();return store.people.filter(p=>p.role==='member'&&(p.name+p.email).toLowerCase().includes(query.toLowerCase()))})
// TODO(backend): Supabase Auth — invite assistant by email, require TOTP enrolment.
export const inviteAssistant=(name:string,email:string)=>result(()=>{guard(true);if(store.people.some(p=>p.email===email))throw Error('Email');store.people.push({id:crypto.randomUUID(),name,email,role:'assistant',joinedAt:new Date().toISOString().slice(0,10)});log('Team',name)})
// TODO(backend): Supabase — revoke assistant role and sessions.
export const removeStaff=(id:string)=>result(()=>{guard(true);store.people=store.people.filter(p=>!(p.role==='assistant'&&p.id===id));log('Team',id)})
// TODO(backend): Supabase — filtered paginated audit events.
export const listActivity=(filters:{who?:string;what?:string}={})=>result(()=>{guard(true);return store.activity.filter(a=>(!filters.who||a.actorName===filters.who)&&(!filters.what||a.action===filters.what))})
// TODO(backend): Supabase — aggregate role-safe dashboard metrics.
export const getDashboardStats=()=>result(()=>{guard();return {Members:store.people.filter(p=>p.role==='member').length,'New messages':store.messages.filter(m=>m.status==='new').length,...(identity()==='owner'?{'Tier purchases (30 days)':1}:{}),'Free audio plays (30 days)':0,'Transcripts to review':store.audio.filter(a=>a.transcriptStatus==='draft').length}})
// TODO(backend): Supabase — publish edited page; the action revalidates the `pages` tag (D7).
export const savePage=(slug:string,input:PageCopy)=>result(()=>{guard(true);if(!Object.hasOwn(pages,slug))throw Error('Nothing here yet.');if(Object.values(input).some(v=>typeof v!=='string'||v.length>50000))throw Error('Content');store.pages[slug]={title:input.title,body:input.body,seoTitle:input.seoTitle,seoDescription:input.seoDescription};log('Save and publish',slug)})
// TODO(backend): Supabase — update owner-managed site configuration.
export const saveSiteSettings=(input:Record<string,string>)=>result(()=>{guard(true);store.settings={...input};log('Saved','Site settings')})
// TODO(backend): Supabase — persist stable ordering transactionally.
export const reorder=(kind:'audio'|'modules'|'lessons',from:string,to:string)=>result(()=>{guard();const rows=store[kind] as {id:string;sortOrder:number}[];const a=rows.findIndex(x=>x.id===from),b=rows.findIndex(x=>x.id===to);if(a<0||b<0)return;rows.splice(b,0,...rows.splice(a,1));rows.forEach((r,i)=>r.sortOrder=i);log('Order',from)})
