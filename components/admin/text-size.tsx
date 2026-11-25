'use client'
import {useEffect,useRef,useState} from 'react'
import {ALargeSmall} from 'lucide-react'
import {TEXT_SIZES,previewTextSize,useTextSize,type TextSize} from '../hooks'
import {text} from '@/lib/editorial'

// D13 — the admin text-size choice. Copy: docs/content.md §8 (lines 558–563).
const names=text(560).split(' · ')

/** First-visit prompt (and the "Text size" menu control). Picking an option previews it live. */
export function TextSizePrompt({close}:{close:()=>void}){
  const {size,choose}=useTextSize(),start:TextSize=size??'standard'
  const [pick,setPick]=useState<TextSize>(start),ref=useRef<HTMLDialogElement>(null)
  useEffect(()=>{ref.current?.showModal()},[])
  const done=(t:TextSize)=>{choose(t);ref.current?.close();close()}
  return <dialog ref={ref} className="dialog text-dialog" aria-labelledby="text-size-title" onCancel={e=>{e.preventDefault();done(start)}}>
    <h3 id="text-size-title">{text(558)}</h3>
    <p>{text(559)}</p>
    <form onSubmit={e=>{e.preventDefault();done(pick)}}>
      <fieldset className="size-options" aria-labelledby="text-size-title">
        {TEXT_SIZES.map((t,i)=><label key={t} className={'size-option size-'+t}>
          <input type="radio" name="text-size" value={t} checked={pick===t} onChange={()=>{setPick(t);previewTextSize(t)}}/>
          <span className="aa" aria-hidden>Aa</span><span>{names[i]}</span>
        </label>)}
      </fieldset>
      <p className="size-sample">{text(561)}</p>
      <div className="actions"><button className="pill">{text(562)}</button></div>
    </form>
  </dialog>
}

export function TextSizeButton({open}:{open:()=>void}){
  return <button type="button" className="text-size-button" onClick={open}><ALargeSmall aria-hidden size={20}/>{text(563)}</button>
}
