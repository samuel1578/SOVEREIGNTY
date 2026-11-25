'use client'
import Image from 'next/image'
import {Button} from './ui/button'
import {Action} from './editorial'
import {useEffect,useRef,type ReactNode} from 'react'

// F-010 — skeleton primitives. Each mirrors the layout it replaces so nothing jumps on load.
// `Pending` (dots) stays only for surfaces with no known layout (route-level fallback).
const Busy=({children,className=''}:{children:ReactNode;className?:string})=><div className={'skeleton '+className} role="status" aria-busy="true"><span className="sr-only">Loading…</span>{children}</div>
export function SkeletonText({lines=3}:{lines?:number}){return <Busy className="sk-text">{Array.from({length:lines},(_,i)=><i key={i} className="sk-line" style={{width:i===lines-1?'55%':undefined}}/>)}</Busy>}
export function SkeletonCard({count=1,tier=false}:{count?:number;tier?:boolean}){return <Busy className="grid3">{Array.from({length:count},(_,i)=><div key={i} className={'panel sk-card'+(tier?' sk-tier':'')} aria-hidden>{!tier&&<i className="sk-block"/>}<i className="sk-line sk-short"/><i className="sk-line sk-title"/><i className="sk-line"/><i className="sk-line sk-short"/></div>)}</Busy>}
export function SkeletonRow({rows=5,cols=4}:{rows?:number;cols?:number}){return <Busy className="sk-rows">{Array.from({length:rows},(_,r)=><div key={r} className="sk-row" aria-hidden>{Array.from({length:cols},(_,c)=><i key={c} className="sk-line"/>)}</div>)}</Busy>}
export function SkeletonPlayer(){return <Busy className="controls sk-player"><div className="row" aria-hidden><i className="sk-dot"/><i className="sk-line"/><i className="sk-pill"/></div><i className="sk-line sk-short" aria-hidden/></Busy>}
/** Intro band + body placeholder used while a whole page's data loads. */
export function SkeletonPage({cards=0,player=false}:{cards?:number;player?:boolean}){return <><section className="intro" aria-hidden><div className="wrap"><i className="sk-line sk-short"/><i className="sk-line sk-heading"/><i className="sk-line"/></div></section><div className="section wrap">{player?<div className="narrow"><SkeletonPlayer/><SkeletonText/></div>:cards?<SkeletonCard count={cards}/>:<SkeletonText lines={5}/>}</div></>}

export function Pending(){return <div className="pending" role="status"><span className="sr-only">Loading…</span><i/><i/><i/></div>}
export function Failure({retry}:{retry:()=>void}){return <div className="panel"><p>We couldn&apos;t load this right now. Check your connection and try again.</p><Button onClick={()=>{const u=new URL(location.href);u.searchParams.delete('mockError');history.replaceState(null,'',u);retry()}}>Try again</Button></div>}
export function SignedOut(){return <section className="section narrow"><h1>Please sign in to continue.</h1><Action href="/sign-in">Sign in</Action></section>}
export function Dialog({title,children,close}:{title:string;children:ReactNode;close:()=>void}){const ref=useRef<HTMLDialogElement>(null);useEffect(()=>{ref.current?.showModal()},[]);return <dialog className="dialog" aria-label={title} ref={ref} onCancel={close}><h3>{title}</h3>{children}<button className="textlink" onClick={close}>Cancel</button></dialog>}
export function Missing(){return <section className="welcome section"><Image className="mark mark-light" src="/brand/rts-mark-light.png" width={70} height={65} sizes="70px" alt=""/><Image className="mark mark-dark" src="/brand/rts-mark-dark.png" width={70} height={65} sizes="70px" alt=""/><h1>This page has drifted out of the simulation.</h1><p>It may have moved, or the link may be wrong.</p><div className="actions"><Action href="/">Go home</Action><Action quiet href="/listen">Listen to free audio</Action></div></section>}
