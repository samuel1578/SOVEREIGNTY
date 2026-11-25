import 'server-only'
import {AsyncLocalStorage} from 'node:async_hooks'
import * as mocks from '../mocks/catalog'
import {pages} from '../editorial'
import type {ActivityEntry,ContactMessage,Result,LessonProgress,CoachingSettings,Identity,MemberProfile} from '../types'
import {REVIEW,USE_MOCKS} from '../config'
import {parseIdentity} from '../identity'
export type {Identity}

// ---------------------------------------------------------------------------
// Request context (D6). Server actions and route handlers run their service calls inside
// `runWith(ctx, …)`; services read identity/MFA from here instead of the browser.
// Public cached reads have no context and therefore always act as a Visitor (D7).
// ---------------------------------------------------------------------------
export type CookieWrite={name:string;value:string;maxAge?:number}
export type RequestContext={cookies:Record<string,string>;mockError:boolean;writes:CookieWrite[]}
const als=new AsyncLocalStorage<RequestContext>()
export const runWith=<T,>(context:RequestContext,fn:()=>T)=>als.run(context,fn)
const ctx=()=>als.getStore()
/** Queue a cookie write; `withRequest` applies it to the response. Later reads in this request see it. */
export function setCookie(name:string,value:string,maxAge?:number){const c=ctx();if(!c)return;c.writes.push({name,value,maxAge});if(maxAge===0)delete c.cookies[name];else c.cookies[name]=value}

// ---------------------------------------------------------------------------
// Mock store — SAMPLE data held in server memory. `globalThis` keeps one instance across dev
// reloads and module graphs. It is shared by everyone using this server instance.
// TODO(backend): Supabase — replace the in-memory store with typed queries under RLS.
// ---------------------------------------------------------------------------
function createStore(){
  return {
    purchaseHistory:{member:['[TIER 1 NAME] · £[amount] · [date]']} as Record<string,string[]>,
    audio:mocks.audio.map(a=>({...a})),
    categories:mocks.categories.map(c=>({...c})),
    // D4 — review-only sample price; production keeps null.
    tiers:mocks.tiers.map(t=>({...t,pricePence:REVIEW?mocks.reviewPrices[t.id]??t.pricePence:t.pricePence})),
    modules:mocks.modules.map(m=>({...m})),
    lessons:mocks.lessons.map(l=>({...l})),
    people:mocks.people.map(p=>({...p})) as MemberProfile[],
    /** Mock sign-ups waiting for email confirmation, keyed by single-use token. */
    pending:{} as Record<string,MemberProfile>,
    access:{member:['tier-1'],empty:[]} as Record<string,string[]>,
    progress:{'member:l1':24} as Record<string,number>,
    completed:{} as Record<string,boolean>,
    pages:Object.fromEntries(Object.entries(pages).map(([slug,body])=>[slug,{body,title:'',seoTitle:'',seoDescription:''}])) as Record<string,{title:string;body:string;seoTitle:string;seoDescription:string}>,
    settings:{} as Record<string,string>,
    /** D14 — SAMPLE contact-page messages (placeholders only). */
    messages:[
      {id:'m1',name:'[Visitor name]',email:'visitor@example.com',topic:'Feedback on the site or content',message:'[Sample message — the text a visitor writes on the contact page appears here.]',status:'new',createdAt:'2026-11-22T09:30:00Z'},
      {id:'m2',name:'[Member name]',email:'member@example.com',topic:'Help with a purchase or my account',message:'[Sample message — a member asking for help with their account.]',status:'read',createdAt:'2026-11-20T16:05:00Z'},
    ] as ContactMessage[],
    activity:([['[Owner name]','published','[Audio title]'],['[Assistant name]','Save draft','[Lesson title]'],['[Owner name]','approved a transcript','[Audio title]'],['[Assistant name]','Saved','Coaching settings'],['[Owner name]','Saved','[TIER 1 NAME]']].map(([actorName,action,target],i)=>({id:`sample-${i}`,actorName,action,target,createdAt:`2026-11-19T0${8-i}:00:00Z`}))) as ActivityEntry[],
    coaching:{calLink:'',introMd:'A private conversation, just for you — to look at the simulation together and return to what is steady beneath it.',sessionLength:'[SESSION LENGTH]',pricePence:null,location:'[ONLINE VIDEO CALL / OTHER — client to confirm]',cancellationPolicy:'[CANCELLATION POLICY — client to confirm]'} as CoachingSettings,
  }
}
export type Store=ReturnType<typeof createStore>
const g=globalThis as unknown as {__rtsStore?:Store}
export const store:Store=g.__rtsStore??=createStore()
/** Review-price flag for a tier (D4) — drives the visible "Review price" badge. */
export const isSamplePrice=(tierId:string,pricePence:number|null)=>REVIEW&&pricePence!==null&&mocks.reviewPrices[tierId]===pricePence

// TODO(backend): Supabase Auth — resolve identity from the verified session, not a review cookie.
export function identity():Identity{if(!REVIEW)return 'visitor';return parseIdentity(ctx()?.cookies['rts-review'])}
export const session=()=>store.people.find(p=>p.id===identity())||null
export const staff=()=>['owner','assistant'].includes(identity())
// TODO(backend): Supabase Auth — require aal2 from the session's assurance level.
export const secure=()=>staff()&&ctx()?.cookies['rts-mfa']===identity()
export const mfaEnrolled=()=>ctx()?.cookies[`rts-enrolled-${identity()}`]==='1'
export function guard(owner=false){if(!secure()||(owner&&identity()!=='owner'))throw Error('This area is for the Reset to Sovereignty team only.')}
export function log(action:string,target:string){store.activity.unshift({id:crypto.randomUUID(),actorName:session()?.name||'',action,target,createdAt:new Date().toISOString()})}
export async function result<T>(fn:()=>T):Promise<Result<T>>{await new Promise(r=>setTimeout(r,320));try{if(!USE_MOCKS||ctx()?.mockError)throw Error("We couldn't load this right now. Check your connection and try again.");return {ok:true,data:fn()}}catch(e){return{ok:false,error:e instanceof Error?e.message:'Something went wrong on our side.'}}}
export const progressFor=(id:string):LessonProgress=>({memberId:identity(),lessonId:id,positionSeconds:store.progress[`${identity()}:${id}`]||0,completedAt:store.completed[`${identity()}:${id}`]?'2026-11-19':undefined,updatedAt:'2026-11-19'})
