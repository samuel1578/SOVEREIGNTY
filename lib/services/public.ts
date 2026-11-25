import 'server-only'
import {cacheLife,cacheTag} from 'next/cache'
import {getPublishedPage} from './pages'
import {listAudio,listCategories} from './audio'
import {listTiers} from './courses'
import {store} from './store'
// D7 — cookie-less public reads, cached in the static shell and invalidated by tag from save actions.
// Called from Server Components, metadata, sitemap and generateStaticParams. No request context → Visitor.
// TODO(backend): Supabase — use the cookie-less anonymous client here so pages stay cacheable.

export async function getPublicPage(slug:string){
  'use cache'
  cacheLife('max');cacheTag('pages')
  return getPublishedPage(slug)
}
export async function getPublicCatalogue(){
  'use cache'
  cacheLife('max');cacheTag('audio')
  const [audio,categories]=await Promise.all([listAudio(),listCategories()])
  return {audio:audio.ok?audio.data:[],categories:categories.ok?categories.data:[]}
}
export async function getPublicTiers(){
  'use cache'
  cacheLife('max');cacheTag('tiers')
  const r=await listTiers()
  return r.ok?r.data:[]
}
export async function getSiteSettings(){
  'use cache'
  cacheLife('max');cacheTag('settings')
  return {...store.settings}
}
