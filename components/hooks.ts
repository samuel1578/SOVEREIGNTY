'use client'
import {useSyncExternalStore} from 'react'
import {clientIdentity} from '@/lib/client'
import type {Identity} from '@/lib/types'

/** Live media-query match; `fallback` is used during server rendering. */
export function useMedia(query:string,fallback=false){
  return useSyncExternalStore(
    cb=>{const m=matchMedia(query);m.addEventListener('change',cb);return()=>m.removeEventListener('change',cb)},
    ()=>matchMedia(query).matches,
    ()=>fallback,
  )
}

/** Mock review identity (D4). Updated by the `rts-role` event after the server action sets the cookie. */
export function useIdentity():Identity{
  return useSyncExternalStore(
    cb=>{window.addEventListener('rts-role',cb);return()=>window.removeEventListener('rts-role',cb)},
    clientIdentity,
    ()=>'visitor',
  )
}

// D5 — theme preference stored in localStorage; `rts-theme` event keeps every subscriber in sync.
export type Theme='Light'|'Dark'|'System'
export const THEME_KEY='rts-theme'
let memory:Theme|null=null // used only when storage is unavailable (private mode, blocked site data)
const readTheme=():Theme=>{if(memory)return memory;try{const v=localStorage.getItem(THEME_KEY);return v==='Light'||v==='Dark'?v:'System'}catch{return 'System'}}
/** Applies the live preference to <html> (same logic as the inline head script). */
export function applyTheme(){const t=readTheme(),dark=t==='Dark'||t==='System'&&matchMedia('(prefers-color-scheme: dark)').matches;const el=document.documentElement;el.dataset.mode=dark?'dark':'light';el.dataset.theme=t.toLowerCase()}
export function useThemePreference(){
  const theme=useSyncExternalStore(
    cb=>{window.addEventListener('rts-theme',cb);window.addEventListener('storage',cb);return()=>{window.removeEventListener('rts-theme',cb);window.removeEventListener('storage',cb)}},
    readTheme,
    ()=>'System' as Theme,
  )
  const choose=(t:Theme)=>{try{localStorage.setItem(THEME_KEY,t);memory=null}catch{memory=t}window.dispatchEvent(new Event('rts-theme'))}
  return {theme,choose}
}

// D13 — admin text size. Asked on the first admin visit; `null` means "not chosen yet".
// Applied to <html data-text> before paint by the inline head script in app/layout.tsx.
// TODO(backend): Supabase — also save it on the staff profile so it follows them across devices.
export const TEXT_SIZES=['standard','large','xlarge'] as const
export type TextSize=typeof TEXT_SIZES[number]
export const TEXT_KEY='rts-text'
let textMemory:TextSize|null=null
export const isTextSize=(v:unknown):v is TextSize=>TEXT_SIZES.includes(v as TextSize)
export function readTextSize():TextSize|null{if(textMemory)return textMemory;try{const v=localStorage.getItem(TEXT_KEY);return isTextSize(v)?v:null}catch{return null}}
/** Live preview without saving (the first-visit prompt calls this as options are picked). */
export const previewTextSize=(t:TextSize)=>{document.documentElement.dataset.text=t}
export function useTextSize(){
  const size=useSyncExternalStore(
    cb=>{window.addEventListener('rts-text',cb);window.addEventListener('storage',cb);return()=>{window.removeEventListener('rts-text',cb);window.removeEventListener('storage',cb)}},
    readTextSize,
    ()=>'standard' as TextSize|null,
  )
  const choose=(t:TextSize)=>{try{localStorage.setItem(TEXT_KEY,t);textMemory=null}catch{textMemory=t}previewTextSize(t);window.dispatchEvent(new Event('rts-text'))}
  return {size,choose}
}
