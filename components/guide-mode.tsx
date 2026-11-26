'use client'
import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {ArrowRight,Check} from 'lucide-react'
import type {ReviewIdentity} from '@/lib/types'
import {useChangeRole,useRole} from './shell'

/** Review only (D4): switches to a demo mode from the guide, then opens that mode's starting page. */
export function TryMode({mode,start,label}:{mode:ReviewIdentity;start:string;label:string}){
  const role=useRole(),router=useRouter(),change=useChangeRole({path:'/guide'}),[busy,setBusy]=useState(false)
  const staff=mode==='owner'||mode==='assistant'
  const go=async()=>{setBusy(true);try{await change(mode);if(!staff)router.push(start)}finally{setBusy(false)}}
  return <div className="guide-try">
    <button type="button" className="pill" onClick={()=>void go()} disabled={busy} aria-busy={busy}>{busy?'Switching…':`Try ${label}`}<ArrowRight size={16} aria-hidden/></button>
    {role===mode&&<small className="guide-current"><Check size={14} aria-hidden/>You are in this mode now</small>}
  </div>
}
