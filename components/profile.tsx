'use client'
/* eslint-disable @next/next/no-img-element -- avatars are small data URLs (mock); next/image adds nothing here */
import {useRef,useState} from 'react'
import {Camera} from 'lucide-react'

const initials=(name?:string)=>!name||name.startsWith('[')?'':name.trim().split(/\s+/).slice(0,2).map(w=>w[0]?.toUpperCase()).join('')

/** Round profile photo, or initials when there is none. Decorative unless `label` is given. */
export function Avatar({src,name,size=56,label}:{src?:string|null;name?:string;size?:number;label?:string}){
  return <span className="avatar" style={{width:size,height:size,fontSize:Math.round(size*.36)}} role={label?'img':undefined} aria-label={label} aria-hidden={label?undefined:true}>
    {src?<img src={src} alt="" width={size} height={size}/>:initials(name)||<Camera size={Math.round(size*.4)} aria-hidden/>}
  </span>
}

/** Reads an image file and returns a centre-cropped square JPEG data URL (320 px). */
async function toSquare(file:File,px=320){
  const url=URL.createObjectURL(file)
  try{
    const img=await new Promise<HTMLImageElement>((ok,fail)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=fail;i.src=url})
    const s=Math.min(img.naturalWidth,img.naturalHeight),c=document.createElement('canvas');c.width=c.height=px
    c.getContext('2d')!.drawImage(img,(img.naturalWidth-s)/2,(img.naturalHeight-s)/2,s,s,0,0,px,px)
    return c.toDataURL('image/jpeg',.85)
  }finally{URL.revokeObjectURL(url)}
}

/** Choose / change / remove a profile photo. `onChange` receives a data URL or null. */
export function PhotoPicker({value,name,onChange,busy=false}:{value?:string|null;name?:string;onChange:(v:string|null)=>void|Promise<void>;busy?:boolean}){
  const input=useRef<HTMLInputElement>(null),[msg,setMsg]=useState('')
  async function pick(f?:File){
    setMsg('')
    if(!f)return
    if(!/^image\/(jpeg|png|webp)$/.test(f.type)){setMsg('Please choose a JPG, PNG or WebP image.');return}
    if(f.size>8*1024*1024){setMsg('That photo is over 8 MB. Please choose a smaller one.');return}
    try{await onChange(await toSquare(f))}catch{setMsg('That photo could not be used. Please try another.')}
  }
  return <div className="photo-picker">
    <Avatar src={value} name={name} size={88}/>
    <div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={e=>{void pick(e.target.files?.[0]);e.target.value=''}}/>
      <div className="actions"><button type="button" className="outline" disabled={busy} onClick={()=>input.current?.click()}>{value?'Change photo':'Choose a photo'}</button>{value&&<button type="button" className="textlink" disabled={busy} onClick={()=>void onChange(null)}>Remove photo</button>}</div>
      <p className="fine">JPG, PNG or WebP. We&apos;ll crop it to a square.</p>
      {msg&&<p role="alert">{msg}</p>}
    </div>
  </div>
}
