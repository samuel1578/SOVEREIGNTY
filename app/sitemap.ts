import type {MetadataRoute} from 'next'
import {SITE_URL} from '@/lib/config'
import {getPublicCatalogue,getPublicTiers} from '@/lib/services/public'
// F-015 — canonical origin (never the request Host), public pages only (no /sign-in).
export default async function sitemap():Promise<MetadataRoute.Sitemap>{
  const [{audio,categories},tiers]=await Promise.all([getPublicCatalogue(),getPublicTiers()])
  const paths=['','philosophy','about','listen',...categories.map(c=>`listen/${c.slug}`),...audio.flatMap(a=>{const c=categories.find(x=>x.id===a.categoryId);return c?[`listen/${c.slug}/${a.slug}`]:[]}),'courses',...tiers.map(t=>`courses/${t.key}`),'coaching','contact','privacy','terms','disclaimer','refunds']
  return paths.map(p=>({url:`${SITE_URL}/${p}`}))
}
