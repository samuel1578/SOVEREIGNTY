'use client'
import {useEffect,useRef,useState} from 'react'
import {Volume2,VolumeX,Play,Pause,RotateCcw,ArrowDown} from 'lucide-react'
import {time} from '@/lib/editorial'

// D1 (docs/DECISIONS.md) — plays once, no loop, holds the last frame via the ended poster.
// MP4 is the main render; WebM is the fallback. Portrait sources first so `media` can pick them.
const SOURCES=[
  {src:'/media/hero-9x16.mp4',type:'video/mp4; codecs="avc1.64001F, mp4a.40.2"',media:'(orientation: portrait)'},
  {src:'/media/hero-9x16.webm',type:'video/webm; codecs="vp9, opus"',media:'(orientation: portrait)'},
  {src:'/media/hero-16x9.mp4',type:'video/mp4; codecs="avc1.64001F, mp4a.40.2"'},
  {src:'/media/hero-16x9.webm',type:'video/webm; codecs="vp9, opus"'},
]
// Portrait posters (hero-mobile-first-frame.jpg / hero-mobile-poster.jpg) are not delivered yet;
// the portrait slots reuse the landscape posters until they arrive (object-fit: cover crops them).
const POSTERS={landscape:{first:'/media/hero-first-frame.jpg',end:'/media/hero-poster.jpg'},portrait:{first:'/media/hero-first-frame.jpg',end:'/media/hero-poster.jpg'}}
const FALLBACK='A pair of hands lifts a dark visor away from a face. The noisy neon city around her dissolves, leaving a vast, quiet field of stars.'

export function Film(){
  const ref=useRef<HTMLVideoElement>(null)
  const [pos,setPos]=useState(0),[duration,setDuration]=useState(0)
  const [playing,setPlaying]=useState(false),[muted,setMuted]=useState(true),[ended,setEnded]=useState(false)
  const [reduce,setReduce]=useState(false),[portrait,setPortrait]=useState(false)
  const posters=portrait?POSTERS.portrait:POSTERS.landscape

  useEffect(()=>{
    const v=ref.current;if(!v)return
    const motion=matchMedia('(prefers-reduced-motion: reduce)'),orient=matchMedia('(orientation: portrait)')
    const sync=()=>{
      setReduce(motion.matches);setPortrait(orient.matches)
      // The autoplay attribute may already have started playback before hydration; reduced motion stops it.
      if(motion.matches&&!v.paused&&v.muted){v.pause();v.currentTime=0}
    }
    sync()
    if(v.readyState>=1&&Number.isFinite(v.duration))setDuration(v.duration)
    motion.addEventListener('change',sync);orient.addEventListener('change',sync)
    return()=>{motion.removeEventListener('change',sync);orient.removeEventListener('change',sync)}
  },[])

  async function start(){
    const v=ref.current;if(!v)return
    if(v.ended)v.currentTime=0
    setEnded(false)
    try{await v.play()}catch{setPlaying(false)}
  }
  function toggle(){
    const v=ref.current;if(!v)return
    if(!v.paused&&!v.ended){v.pause();return}
    void start()
  }
  // F-002 — restart from 0 with sound, from any state (loading, paused, ended); second press mutes.
  async function sound(){
    const v=ref.current;if(!v)return
    if(!v.muted&&!v.paused){v.muted=true;setMuted(true);return}
    v.currentTime=0;v.muted=false;setMuted(false);setEnded(false)
    try{await v.play()}catch{v.muted=true;setMuted(true);setPlaying(false)}
  }

  const showEnd=ended||(reduce&&!playing)
  const total=duration||0
  return <section className={'film'+(showEnd?' is-ended':'')+(playing?' is-playing':'')}>
    <h1 className="sr-only">Reset to Sovereignty</h1>
    <video ref={ref} aria-label="Opening film: hands lift a dark visor from a face as a noisy neon city dissolves into quiet starlit space"
      autoPlay muted playsInline preload="metadata" poster={posters.first}
      onLoadedMetadata={e=>{const d=e.currentTarget.duration;if(Number.isFinite(d))setDuration(d)}}
      onPlay={()=>{setPlaying(true);setEnded(false)}} onPause={()=>setPlaying(false)}
      onTimeUpdate={e=>setPos(e.currentTarget.currentTime)}
      onEnded={()=>{setEnded(true);setPlaying(false);setMuted(true);if(ref.current)ref.current.muted=true}}
      onVolumeChange={e=>setMuted(e.currentTarget.muted)}>
      {SOURCES.map(s=><source key={s.src} src={s.src} type={s.type} media={s.media}/>)}
      {FALLBACK}
    </video>
    {/* C-09: static poster asset (not next/image). Shown on ended, and from first paint under reduced motion via CSS. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img className="film-end" src={posters.end} alt={showEnd&&reduce?FALLBACK:''} aria-hidden={!(showEnd&&reduce)} decoding="async"/>
    <div className="film-scrim"/>
    {reduce&&!playing&&!ended&&<button className="centerplay glass" onClick={()=>void start()}><Play size={14}/>Play the film</button>}
    <div className="film-dock">
      <div className="film-track">
        <button className="round" aria-label={ended?'Watch again':playing?'Pause':'Play the film'} onClick={toggle}>{ended?<RotateCcw/>:playing?<Pause/>:<Play/>}</button>
        <span className="timecode">{time(pos)}{total>0&&<span> / {time(total)}</span>}</span>
        <span className="film-line"><i style={{width:`${total?Math.min(100,pos/total*100):0}%`}}/></span>
      </div>
      <a className="down" href="#welcome" aria-label="Welcome"><ArrowDown size={16}/></a>
      <button className="glass sound" aria-pressed={!muted} onClick={()=>void sound()}>{muted?<Volume2 size={16}/>:<VolumeX size={16}/>} {muted?'Experience it with sound':'Mute'}</button>
    </div>
  </section>
}
