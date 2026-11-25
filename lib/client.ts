'use client'
// Browser-side helpers. These read non-sensitive review cookies for UI hints only;
// the server re-checks identity and MFA on every action (D6, D8).
import type {Identity,Result} from './types'
import {REVIEW} from './config'
import {parseIdentity} from './identity'
const cookie=(k:string)=>typeof document==='undefined'?undefined:document.cookie.match(new RegExp('(?:^|; )'+k+'=([^;]*)'))?.[1]
export function clientIdentity():Identity{if(!REVIEW)return 'visitor';return parseIdentity(cookie('rts-review'))}
export const clientSecure=()=>{const id=clientIdentity();return (id==='owner'||id==='assistant')&&cookie('rts-mfa')===id}
export const read=async<T,>(p:Promise<Result<T>>)=>{const r=await p;if(!r.ok)throw Error(r.error);return r.data}
