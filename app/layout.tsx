import type {Metadata,Viewport} from 'next'
import {Fraunces,Jost} from 'next/font/google'
import {Shell} from '@/components/shell'
import {text,brand} from '@/lib/editorial'
import {SITE_URL,REVIEW} from '@/lib/config'
import {DEFAULT_IMAGE} from '@/lib/seo'
import {getSiteSettings} from '@/lib/services/public'
import './globals.css'
const serif=Fraunces({subsets:['latin'],weight:['400','500'],style:['normal','italic'],variable:'--display',display:'swap'})
const sans=Jost({subsets:['latin'],variable:'--body',display:'swap'})

// D5 — applies the saved theme before first paint (no flash). Mirrors applyTheme() in components/shell.tsx.
// D13 — also applies the saved admin text size (components/hooks.ts useTextSize).
const THEME_SCRIPT=`(function(){try{var t=localStorage.getItem('rts-theme');if(t!=='Light'&&t!=='Dark')t='System';var d=t==='Dark'||(t==='System'&&matchMedia('(prefers-color-scheme: dark)').matches);var e=document.documentElement;e.dataset.mode=d?'dark':'light';e.dataset.theme=t.toLowerCase();var s=localStorage.getItem('rts-text');if(s==='standard'||s==='large'||s==='xlarge')e.dataset.text=s}catch(e){}})()`

export async function generateMetadata():Promise<Metadata>{
  const s=await getSiteSettings()
  const title=s['Default SEO title']||text(78),description=s['Default SEO description']||text(79)
  return {
    metadataBase:new URL(SITE_URL),
    title,description,applicationName:brand,
    icons:{icon:'/brand/rts-favicon-512.png',apple:'/brand/rts-favicon-512.png'},
    // Review builds (preview links with mock data) are never indexed.
    ...(REVIEW?{robots:{index:false,follow:false}}:{}),
    openGraph:{siteName:brand,locale:'en_GB',type:'website',title,description,images:[DEFAULT_IMAGE]},
    twitter:{card:'summary_large_image',title,description,images:[DEFAULT_IMAGE.url]},
  }
}
export const viewport:Viewport={width:'device-width',initialScale:1,themeColor:[{media:'(prefers-color-scheme: light)',color:'#FFFFFF'},{media:'(prefers-color-scheme: dark)',color:'#14100D'}],colorScheme:'light dark'}

// D15 — data-scroll-behavior="smooth": Next 16 switches smooth scrolling off while it changes pages.
export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="en-GB" className={`${serif.variable} ${sans.variable}`} data-mode="light" data-scroll-behavior="smooth" suppressHydrationWarning>
    <head><script dangerouslySetInnerHTML={{__html:THEME_SCRIPT}}/></head>
    <body><Shell>{children}</Shell></body>
  </html>
}
