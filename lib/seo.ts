import type {Metadata} from 'next'
import {brand} from './editorial'
// F-015 — one shape for every page: canonical, OpenGraph and Twitter, resolved against metadataBase.
export const DEFAULT_IMAGE={url:'/media/hero-poster.jpg',width:1280,height:720,alt:'Opening film: hands lift a dark visor from a face as a noisy neon city dissolves into quiet starlit space'}
export function seo({title,description,path,image,noindex=false}:{title:string;description?:string;path:string;image?:string;noindex?:boolean}):Metadata{
  const images=image?[{url:image}]:[DEFAULT_IMAGE]
  return {
    title:{absolute:title},description,
    alternates:{canonical:path},
    openGraph:{title,description,url:path,siteName:brand,locale:'en_GB',type:'website',images},
    twitter:{card:'summary_large_image',title,description,images:images.map(i=>i.url)},
    robots:noindex?{index:false,follow:false}:undefined,
  }
}
