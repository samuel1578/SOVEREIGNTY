'use client'
import {Suspense,type ReactNode} from 'react'
import {useRouter,useSearchParams} from 'next/navigation'
import {Failure} from './states'
export function FailureScreen(){const r=useRouter();return <section className="section narrow mock-failure"><Failure retry={()=>r.refresh()}/></section>}
// D7 — `?mockError=1` on prerendered pages: the content stays static; this probe swaps in the error state client-side.
function Probe(){const q=useSearchParams();return q.get('mockError')==='1'?<FailureScreen/>:null}
export function MockErrorGate({children}:{children:ReactNode}){return <><Suspense fallback={null}><Probe/></Suspense><div className="page-body">{children}</div></>}
