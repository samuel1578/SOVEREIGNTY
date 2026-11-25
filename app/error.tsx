'use client'
import Image from 'next/image'
import {Action} from '@/components/editorial'
export default function ErrorPage({reset}:{reset:()=>void}){return <section className="section welcome"><Image className="mark mark-light" src="/brand/rts-mark-light.png" alt="" width={70} height={65} sizes="70px"/><Image className="mark mark-dark" src="/brand/rts-mark-dark.png" alt="" width={70} height={65} sizes="70px"/><h1>Something went wrong on our side.</h1><p>Please take a breath and try again in a moment.</p><div className="actions"><button className="pill" onClick={reset}>Try again</button><Action quiet href="/">Go home</Action></div></section>}
