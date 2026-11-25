'use client'
import {createContext,useContext,useState,useRef,useEffect,useCallback,type ReactNode,type KeyboardEvent,type CSSProperties} from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {Play,Pause,ChevronUp,ChevronDown,X,Rewind,FastForward,RotateCcw,RotateCw,Volume2,VolumeX} from 'lucide-react'
import {saveProgress} from '@/app/actions/member'
import {clock,isComplete} from '@/lib/format'
import {audioArt} from '@/lib/home-media'
import {Copy} from './editorial'
import type {Result} from '@/lib/types'

/** `duration` comes from the item's `durationSeconds`; the element's real duration wins once known (F-006).
 *  `cover` and `href` feed the now-playing view (artwork, link to details and transcript). */
export type Track={id:string;title:string;group:string;kind:'audio'|'lesson';duration:number;getSourceUrl:()=>Promise<Result<string>>;cover?:string;href?:string}
/** Sleep timer: minutes chosen and the time (ms) playback pauses. */
type Sleep={min:number;at:number}|null
export type Player={track:Track|null;playing:boolean;pos:number;duration:number;play:(t:Track,start?:number)=>void;seek:(p:number)=>void;skip:(d:number)=>void;toggle:()=>void;stop:()=>void;speed:number;rate:(n:number)=>void;volume:number;muted:boolean;setVolume:(v:number)=>void;toggleMute:()=>void;error:string;sleep:Sleep;setSleep:(min:number)=>void;expand:()=>void}
const C=createContext<Player>(null!);export const usePlayer=()=>useContext(C)
const FAILED="This audio didn't start. Tap play to try again."

export function PlayerProvider({children}:{children:ReactNode}){
  const ref=useRef<HTMLAudioElement>(null),active=useRef<Track|null>(null),retried=useRef(false),last=useRef(0)
  const [track,setTrack]=useState<Track|null>(null),[playing,setPlaying]=useState(false),[pos,setPos]=useState(0),[known,setKnown]=useState(0)
  const [speed,setSpeed]=useState(1),[volume,setVol]=useState(1),[muted,setMuted]=useState(false),[error,setError]=useState(''),[open,setOpen]=useState(false),[sleep,setSleepState]=useState<Sleep>(null)
  const opener=useRef<HTMLButtonElement>(null)
  const duration=known||track?.duration||0
  // Sleep timer: pause when the chosen time is up.
  useEffect(()=>{if(!sleep)return;const id=setTimeout(()=>{ref.current?.pause();setSleepState(null)},Math.max(0,sleep.at-Date.now()));return()=>clearTimeout(id)},[sleep])
  const close=()=>{setOpen(false);requestAnimationFrame(()=>opener.current?.focus())}

  const total=useCallback(()=>{const a=ref.current;return a&&Number.isFinite(a.duration)&&a.duration>0?a.duration:active.current?.duration||0},[])
  // F-023 — progress for lessons: every 15 s while playing, on pause, on seek end, on ended and on pagehide.
  const save=useCallback((beacon=false)=>{
    const t=active.current,a=ref.current
    if(t?.kind!=='lesson'||!a)return
    const at=a.ended?total():a.currentTime,done=a.ended||isComplete(at,total())
    // TODO(backend): Supabase — same upsert as saveProgress; the beacon survives page unload.
    if(beacon&&navigator.sendBeacon)navigator.sendBeacon('/api/progress',new Blob([JSON.stringify({lessonId:t.id,positionSeconds:at,completed:done})],{type:'application/json'}))
    else void saveProgress(t.id,at,done)
  },[total])
  useEffect(()=>{const f=()=>save(true);window.addEventListener('pagehide',f);return()=>window.removeEventListener('pagehide',f)},[save])

  function seek(p:number){const a=ref.current;if(!a)return;a.currentTime=Math.min(total()||p,Math.max(0,p));setPos(a.currentTime)}
  function toggle(){const a=ref.current;if(!a||!active.current)return;if(!a.paused)a.pause();else a.play().catch(()=>setError(FAILED))}
  async function play(t:Track,start?:number){
    if(active.current?.id===t.id&&start===undefined){toggle();return}
    if(active.current?.id===t.id&&start!==undefined){seek(start);if(ref.current?.paused)toggle();return}
    save();ref.current?.pause();active.current=t;setTrack(t);setError('');setKnown(0);setPos(start||0);retried.current=false
    const r=await t.getSourceUrl()
    if(active.current!==t)return
    if(!r.ok){setError(r.error);return}
    const a=ref.current!;a.src=r.data;a.playbackRate=speed;a.volume=volume;a.muted=muted;a.currentTime=start||0;last.current=start||0
    await a.play().catch(()=>setError(FAILED))
    if('mediaSession' in navigator)navigator.mediaSession.metadata=new MediaMetadata({title:t.title,artist:t.group,album:'Reset to Sovereignty'})
  }
  function stop(){save();ref.current?.pause();active.current=null;setTrack(null);setPos(0);setKnown(0);setOpen(false);setSleepState(null)}
  useEffect(()=>{const f=()=>stop();window.addEventListener('rts-role',f);return()=>window.removeEventListener('rts-role',f)})
  function setVolume(v:number){const n=Math.min(1,Math.max(0,v));setVol(n);if(ref.current){ref.current.volume=n;if(n>0&&ref.current.muted){ref.current.muted=false;setMuted(false)}}}
  function toggleMute(){const m=!muted;setMuted(m);if(ref.current)ref.current.muted=m}

  const player:Player={track,playing,pos,duration,play,seek,skip:d=>seek((ref.current?.currentTime||0)+d),toggle,stop,speed,rate:n=>{setSpeed(n);if(ref.current)ref.current.playbackRate=n},volume,muted,setVolume,toggleMute,error,
    sleep,setSleep:min=>setSleepState(min>0?{min,at:Date.now()+min*60_000}:null),expand:()=>setOpen(true)}
  return <C.Provider value={player}>{children}
    <audio ref={ref} controlsList="nodownload" onContextMenu={e=>e.preventDefault()}
      onLoadedMetadata={e=>{const d=e.currentTarget.duration;if(Number.isFinite(d)&&d>0)setKnown(d)}}
      onPlay={()=>setPlaying(true)} onPause={()=>{setPlaying(false);if(!ref.current?.ended)save()}} onEnded={()=>{setPlaying(false);save()}} onSeeked={()=>save()}
      onTimeUpdate={e=>{const p=e.currentTarget.currentTime;setPos(p);if(Math.abs(last.current-p)>=15){last.current=p;save()}}}
      onError={async()=>{const t=active.current;if(t&&!retried.current){retried.current=true;const r=await t.getSourceUrl();if(r.ok&&active.current===t){const a=ref.current!;a.src=r.data;a.currentTime=pos;a.play().catch(()=>setError(FAILED));return}}setError(FAILED)}}/>
    {track&&<aside className="mini" aria-label="Player" onKeyDown={e=>keys(e,player)} onKeyUp={blockSpace}>
      <span className="mini-prog" aria-hidden style={{transform:`scaleX(${duration?Math.min(1,pos/duration):0})`}}/>
      <div className="row">
        <button className="mini-open" onClick={()=>setOpen(true)} aria-label={`Open the full player for ${track.title}`} tabIndex={-1}>
          <Image className="mini-art" src={track.cover||audioArt[0]} alt="" width={44} height={44}/>
          <span className="mini-text"><strong><Copy s={track.title}/></strong><small><Copy s={track.group}/></small></span>
        </button>
        <button className="icon" aria-label={playing?'Pause':'Play'} onClick={toggle}>{playing?<Pause/>:<Play/>}</button>
        <input aria-label="Progress" type="range" min={0} max={Math.max(1,Math.round(duration))} step={1} value={Math.floor(pos)} onChange={e=>seek(+e.target.value)}/>
        <span className="mini-time">{clock(pos)} / {clock(duration)}</span>
        <MuteButton/>
        <button ref={opener} className="icon" aria-label="Open full player" aria-haspopup="dialog" aria-expanded={open} onClick={()=>setOpen(true)}><ChevronUp/></button>
        <button className="icon" aria-label="Close player" onClick={stop}><X/></button>
      </div>
      <span role="alert">{error}</span>
    </aside>}
    {track&&open&&<NowPlaying close={close}/>}
  </C.Provider>
}

/** Now playing (option B, immersive): artwork fills the view and drifts slowly, with a breathing orb.
 *  Full screen on phones, a large centred panel on laptops. Static under reduced motion. */
function NowPlaying({close}:{close:()=>void}){
  const p=usePlayer(),t=p.track!,panel=useRef<HTMLDivElement>(null),first=useRef<HTMLButtonElement>(null)
  const [left,setLeft]=useState(0)
  useEffect(()=>{first.current?.focus();const html=document.documentElement,was=html.style.overflow;html.style.overflow='hidden';return()=>{html.style.overflow=was}},[])
  // Minutes left on the sleep timer, refreshed every 15 s.
  useEffect(()=>{if(!p.sleep)return;const at=p.sleep.at,f=()=>setLeft(Math.max(1,Math.ceil((at-Date.now())/60_000)));f();const id=setInterval(f,15_000);return()=>clearInterval(id)},[p.sleep])
  const onKey=(e:KeyboardEvent<HTMLDivElement>)=>{
    if(e.key==='Escape'){e.preventDefault();close();return}
    if(e.key==='Tab'){const f=[...(panel.current?.querySelectorAll<HTMLElement>('button,a[href],input,select')||[])];const a=f[0],z=f[f.length-1]
      if(e.shiftKey&&document.activeElement===a){e.preventDefault();z?.focus()}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a?.focus()};return}
    keys(e,p)
  }
  return <div className="np" role="dialog" aria-modal="true" aria-label="Now playing" onKeyDown={onKey} onKeyUp={blockSpace}>
    <div className="np-backdrop" onClick={close} aria-hidden/>
    <div className="np-panel" ref={panel}>
      <div className="np-bg" aria-hidden><Image src={t.cover||audioArt[0]} alt="" fill sizes="(max-width:767px) 100vw, 960px"/></div>
      <div className="np-top"><button ref={first} className="icon" aria-label="Close full player" onClick={close}><ChevronDown/></button><b>Now playing</b><span className="icon" aria-hidden/></div>
      <div className="np-orb" aria-hidden><i/></div><p className="np-orb-l" aria-hidden>Breathe with it</p>
      <div className="np-info"><h2><Copy s={t.title}/></h2><small><Copy s={t.group}/></small></div>
      <input className="np-range" aria-label="Progress" type="range" min={0} max={Math.max(1,Math.round(p.duration))} step={1} value={Math.floor(p.pos)} onChange={e=>p.seek(+e.target.value)} style={{'--fill':`${p.duration?Math.min(100,p.pos/p.duration*100):0}%`} as CSSProperties}/>
      <div className="np-time"><span>{clock(p.pos)}</span><span>−{clock(Math.max(0,p.duration-p.pos))}</span></div>
      <div className="np-ctrls">
        <button className="np-skip" aria-label="Back 15 seconds" onClick={()=>p.skip(-15)}><RotateCcw/><small aria-hidden>15</small></button>
        <button className="np-play" aria-label={p.playing?'Pause':'Play'} onClick={p.toggle}>{p.playing?<Pause/>:<Play/>}</button>
        <button className="np-skip" aria-label="Forward 15 seconds" onClick={()=>p.skip(15)}><RotateCw/><small aria-hidden>15</small></button>
      </div>
      <div className="np-extra">
        <label><span className="sr-only">Playback speed</span><select value={p.speed} onChange={e=>p.rate(+e.target.value)}>{[0.75,1,1.25,1.5,2].map(n=><option key={n} value={n}>{n}× speed</option>)}</select></label>
        <label><span className="sr-only">Sleep timer</span><select value={p.sleep?.min||0} onChange={e=>p.setSleep(+e.target.value)}><option value={0}>Sleep timer: off</option>{[5,10,15,30,45,60].map(n=><option key={n} value={n}>Stop after {n} min</option>)}</select></label>
        {t.href&&<Link href={t.href} onClick={close}>Details and transcript</Link>}
      </div>
      <p className="np-status" role="status">{p.sleep?`Pausing in about ${left} min.`:''}</p>
      <span role="alert">{p.error}</span>
    </div>
  </div>
}

/** C-04 — shortcuts only while focus is inside a player (no global keydown handler). */
export function keys(e:KeyboardEvent,p:Player){
  const el=e.target as HTMLElement
  if(el.tagName==='SELECT'||el.tagName==='TEXTAREA'||(el.tagName==='INPUT'&&(el as HTMLInputElement).type!=='range')||!p.track)return
  const step={' ':0,ArrowLeft:-15,ArrowRight:15}[e.key as ' '|'ArrowLeft'|'ArrowRight']
  if(e.key===' '){e.preventDefault();p.toggle()}
  else if(step){e.preventDefault();p.skip(step)}
  else if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();p.setVolume(Math.round((p.volume+(e.key==='ArrowUp'?.1:-.1))*10)/10)}
}

// Space is handled on keydown; stop the native keyup "click" so a focused button doesn't toggle twice.
export const blockSpace=(e:KeyboardEvent)=>{if(e.key===' '&&(e.target as HTMLElement).tagName==='BUTTON')e.preventDefault()}
function MuteButton(){const p=usePlayer();return <button className="icon" aria-label="Mute" aria-pressed={p.muted} onClick={p.toggleMute}>{p.muted||p.volume===0?<VolumeX/>:<Volume2/>}</button>}

export function Controls({t}:{t:Track}){
  const p=usePlayer(),active=p.track?.id===t.id
  const total=active?p.duration:t.duration,at=active?p.pos:0
  return <div className="controls" onContextMenu={e=>e.preventDefault()} onKeyDown={e=>{if(active)keys(e,p)}} onKeyUp={e=>{if(active)blockSpace(e)}}>
    <div className="row">
      <button className="round solid" aria-label={`${active&&p.playing?'Pause':'Play'} ${t.title}`} onClick={()=>p.play(t)}>{active&&p.playing?<Pause/>:<Play/>}</button>
      <button className="icon" disabled={!active} aria-label="Back 15 seconds" onClick={()=>p.skip(-15)}><Rewind/></button>
      <input aria-label="Progress" type="range" min={0} max={Math.max(1,Math.round(total))} step={1} value={Math.floor(at)} onChange={e=>active?p.seek(+e.target.value):p.play(t,+e.target.value)}/>
      <button className="icon" disabled={!active} aria-label="Forward 15 seconds" onClick={()=>p.skip(15)}><FastForward/></button>
      <small className="time">{clock(at)} / {clock(total)}</small>
      <select aria-label="Playback speed" value={p.speed} onChange={e=>p.rate(+e.target.value)}>{[0.75,1,1.25,1.5,2].map(n=><option key={n} value={n}>{n}×</option>)}</select>
      <span className="volume"><MuteButton/><input aria-label="Volume" type="range" min={0} max={1} step={0.05} value={p.muted?0:p.volume} onChange={e=>p.setVolume(+e.target.value)}/></span>
    </div>
    <p className="fine">Audio streams here and can&apos;t be downloaded.</p>
  </div>
}
