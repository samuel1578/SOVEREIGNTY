'use client'
import {useEffect,useLayoutEffect,useRef} from 'react'
import {usePathname} from 'next/navigation'

// D15 — every link to a new page opens at the top (the hero), not wherever the last page was scrolled.
// Next 16 only scrolls far enough to bring the new segment into view, and the site's
// `scroll-behavior:smooth` let that scroll be cut short while the page streamed in.
// Left alone on purpose: back/forward (the browser restores the old position) and links with a #hash.
export function ScrollReset(){
  const path=usePathname(),first=useRef(true),history=useRef(false)
  useEffect(()=>{const f=()=>{history.current=true};window.addEventListener('popstate',f);return()=>window.removeEventListener('popstate',f)},[])
  useLayoutEffect(()=>{
    if(first.current){first.current=false;return}
    if(history.current){history.current=false;return}
    if(window.location.hash)return
    window.scrollTo({top:0,left:0,behavior:'instant'})
  },[path])
  return null
}
