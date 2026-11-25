'use client'
import {useEffect,useRef,useState} from 'react'
export function Contents({items}:{items:{id:string;title:string}[]}){const [current,S]=useState(items[0]?.id);useEffect(()=>{const observer=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting)S(e.target.id)},{rootMargin:'-12% 0px -55% 0px'});items.forEach(i=>{const el=document.getElementById(i.id);if(el)observer.observe(el)});return()=>observer.disconnect()},[items]);return <nav aria-label="Contents">{items.map(i=><a key={i.id} aria-current={i.id===current?'location':undefined} href={'#'+i.id}>{i.title}</a>)}</nav>}

/** Thin reading-progress line for long reads (D21). Decorative; the contents list carries position for assistive tech. */
export function ReadingProgress(){
  const bar=useRef<HTMLSpanElement>(null)
  useEffect(()=>{
    let frame=0
    const tick=()=>{frame=0;const el=bar.current,article=el?.parentElement?.nextElementSibling;if(!el||!article)return
      const r=article.getBoundingClientRect(),p=Math.min(1,Math.max(0,-r.top/Math.max(1,r.height-innerHeight)));el.style.transform=`scaleX(${p})`}
    const on=()=>{if(!frame)frame=requestAnimationFrame(tick)}
    tick();addEventListener('scroll',on,{passive:true});addEventListener('resize',on)
    return()=>{removeEventListener('scroll',on);removeEventListener('resize',on);if(frame)cancelAnimationFrame(frame)}
  },[])
  return <div className="read-progress" aria-hidden><span ref={bar}/></div>
}
