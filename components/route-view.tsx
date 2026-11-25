import type {Metadata} from 'next'
import {Suspense,type ReactNode} from 'react'
import {notFound} from 'next/navigation'
import {getPublicPage,getPublicCatalogue,getPublicTiers} from '@/lib/services/public'
import {titles,legalNames,brand} from '@/lib/editorial'
import {isoDuration} from '@/lib/format'
import {seo} from '@/lib/seo'
import {AudioLibrary,Courses,TierLanding} from '@/components/catalog'
import {Reading} from '@/components/reading'
import {Coaching} from '@/components/coaching'
import {Contact} from '@/components/contact'
import {SignIn} from '@/components/sign-in'
import {SignUp} from '@/components/sign-up'
import {Library,Learn,Account,Checkout} from '@/components/member'
import {Workspace} from '@/components/admin/workspace'
import {MockErrorGate} from '@/components/retry'
import {SkeletonPage} from '@/components/states'

// D7 — public routes read only cached, cookie-less data and never touch searchParams, so they
// prerender. `?mockError=1` is handled client-side (MockErrorGate / service actions).
type RouteProps={params:Promise<Record<string,string>>}
const resolve=(pattern:string,p:Record<string,string>)=>pattern.split('/').map(s=>s.startsWith('[')?p[s.slice(1,-1)]:s)
const legal=Object.keys(legalNames)
const PARAM_ROUTES=['listen/[category]','listen/[category]/[audio]','courses/[tier]']

export function makeRoute(pattern:string){
  return {
    metadata:async(props:RouteProps)=>metadataFor(pattern,PARAM_ROUTES.includes(pattern)?resolve(pattern,await props.params):pattern.split('/')),
    Page:async(props:RouteProps)=>Page({pattern,path:pattern.includes('[')?resolve(pattern,await props.params):pattern.split('/')}),
  }
}

/** Static params for public dynamic routes (prerendered; new slugs render on demand and are cached). */
export async function staticParams(pattern:string){
  const {audio,categories}=await getPublicCatalogue()
  if(pattern==='listen/[category]')return categories.map(c=>({category:c.slug}))
  if(pattern==='listen/[category]/[audio]')return audio.map(a=>({category:categories.find(c=>c.id===a.categoryId)?.slug||'',audio:a.slug})).filter(p=>p.category)
  if(pattern==='courses/[tier]')return (await getPublicTiers()).map(t=>({tier:t.key}))
  return []
}

async function metadataFor(pattern:string,[first,sub,id]:string[]):Promise<Metadata>{
  const path='/'+pattern.split('/').map((s,i)=>[first,sub,id][i]??s).join('/')
  if(first==='listen'&&sub){
    const {audio,categories}=await getPublicCatalogue(),cat=categories.find(c=>c.slug===sub)
    if(id){const a=audio.find(x=>x.slug===id&&x.categoryId===cat?.id);return seo({title:`${a?.title||'[Audio title]'} — ${brand}`,description:a?.description,path,image:a?.coverUrl})}
    return seo({title:`${cat?.title||'[Category name]'} — ${brand}`,description:cat?.description,path})
  }
  if(first==='courses'&&sub&&!id){const t=(await getPublicTiers()).find(t=>t.key===sub);return seo({title:`${t?.name||`[TIER ${sub.slice(-1)} NAME]`} — ${brand}`,description:t?.tagline,path})}
  if(titles[first]&&!sub){
    const pub=['philosophy','about'].includes(first)?await getPublicPage(first):null
    return seo({title:(pub?.ok&&pub.data.seoTitle)||titles[first][0],description:(pub?.ok&&pub.data.seoDescription)||titles[first][1],path})
  }
  if(legal.includes(first)){const pub=await getPublicPage(first);return seo({title:(pub.ok&&pub.data.seoTitle)||`${legalNames[first]} — ${brand}`,description:(pub.ok&&pub.data.seoDescription)||undefined,path})}
  const name=first==='sign-in'?'Sign in':first==='sign-up'?'Sign up':first==='admin'?'Dashboard':first==='account'?(sub?'My library':'Account'):first==='checkout'?'Welcome, member.':brand
  return {title:{absolute:name===brand?brand:`${name} — ${brand}`},robots:{index:false,follow:false}}
}

const lazy=(node:ReactNode,fallback:ReactNode=<SkeletonPage/>)=><Suspense fallback={fallback}>{node}</Suspense>

async function Page({pattern,path}:{pattern:string;path:string[]}){
  const [area,b,c,e]=path
  if(area==='admin'){if(path.length>3||c&&!['audio','courses','pages','transcripts','messages'].includes(b))notFound();return lazy(<Workspace parts={path.slice(1)}/>)}
  if(area==='listen'&&path.length<=3){
    if(b){
      const {audio,categories}=await getPublicCatalogue(),cat=categories.find(x=>x.slug===b)
      if(!cat)notFound()
      const a=c?audio.find(x=>x.slug===c&&x.categoryId===cat.id):undefined
      if(c&&!a)notFound()
      // F-015 — AudioObject JSON-LD rendered on the server with real values.
      const ld=a&&{'@context':'https://schema.org','@type':'AudioObject',name:a.title,description:a.description,duration:isoDuration(a.durationSeconds),inLanguage:'en-GB',isAccessibleForFree:true}
      return <>{lazy(<AudioLibrary parts={path.slice(1)}/>,<SkeletonPage cards={c?0:6} player={!!c}/>)}{ld&&<script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld).replace(/</g,'\\u003c')}}/>}</>
    }
    return lazy(<AudioLibrary/>,<SkeletonPage cards={6}/>)
  }
  if(area==='courses'){
    if(!b)return <Courses/>
    if(!/^tier-[123]$/.test(b))notFound()
    if(!c)return lazy(<TierLanding id={b}/>)
    if(c==='learn'&&e&&path.length===4)return lazy(<Learn key={e} id={b} slug={e}/>,<SkeletonPage player/>)
  }
  if(area==='account'){if(path.length===1)return lazy(<Account/>);if(b==='library'&&path.length===2)return lazy(<Library/>,<SkeletonPage cards={3}/>)}
  if(area==='checkout'&&b==='success'&&path.length===2)return lazy(<Checkout/>)
  if(path.length===1){
    if(['philosophy','about',...legal].includes(area)){const r=await getPublicPage(area);return <MockErrorGate><Reading slug={area} value={r.ok?r.data.body:undefined} heading={r.ok?r.data.title:undefined}/></MockErrorGate>}
    if(area==='coaching')return <Coaching/>
    if(area==='contact')return <Contact/>
    if(area==='sign-in')return lazy(<SignIn/>)
    if(area==='sign-up')return lazy(<SignUp/>)
  }
  void pattern
  notFound()
}
