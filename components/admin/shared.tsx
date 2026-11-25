'use client'
import {createContext,useContext,useState,useRef,Children,cloneElement,isValidElement,type ReactNode,type ReactElement} from 'react'
import useSWR from 'swr'
import {useRouter} from 'next/navigation'
import {ScanQrCode} from 'lucide-react'
import {getMfaStatus,verifyMfa} from '@/app/actions/auth'
import type {getWorkspace} from '@/app/actions/admin'
import {read} from '@/lib/client'
import {useRole} from '../shell'
import {Failure,SkeletonText} from '../states'
import {Action} from '../editorial'
import type {Result} from '@/lib/types'
export type Data=Extract<Awaited<ReturnType<typeof getWorkspace>>,{ok:true}>['data']
export type Run=(fn:()=>Promise<Result<unknown>>,message?:string)=>Promise<boolean>
export const AdminContext=createContext<{d:Data;owner:boolean;run:Run;confirm:(title:string,label:string,fn:()=>Promise<unknown>)=>void}>(null!)
export const useAdmin=()=>useContext(AdminContext)
export const values=(form:HTMLFormElement)=>Object.fromEntries(Array.from(new FormData(form)).map(([k,v])=>[k,String(v)]))
export function Field({label,value='',type='text',required=false,wide=false}:{label:string;value?:string;type?:string;required?:boolean;wide?:boolean}){return <label>{label}{type==='area'?<textarea name={label} defaultValue={value} required={required} className={wide?'measure':undefined}/>:<input name={label} type={type} step={type==='number'?'0.01':undefined} min={type==='number'?0:undefined} defaultValue={value} required={required}/>}</label>}
/** F-030 — price input with a visible `£` prefix (A05, A08). Stored as pence by the caller. */
export function MoneyField({label,value}:{label:string;value?:string}){return <label>{label}<span className="money"><span aria-hidden>£</span><input name={label} type="number" min="0.01" step="0.01" inputMode="decimal" placeholder="[PRICE]" defaultValue={value}/></span></label>}
/** F-026 — tables become labelled cards below 768 px (no horizontal scroll at 360 px). */
export function Table({cols,children}:{cols:string[];children:ReactNode}){
  const rows=Children.toArray(children).map(tr=>isValidElement(tr)?cloneElement(tr as ReactElement<{children?:ReactNode}>,undefined,Children.toArray((tr as ReactElement<{children?:ReactNode}>).props.children).map((td,i)=>isValidElement(td)?cloneElement(td as ReactElement<Record<string,unknown>>,{'data-label':cols[i]||undefined}):td)):tr)
  return <div className="table-wrap"><table className="cards"><thead><tr>{cols.map((s,i)=><th key={i}>{s}</th>)}</tr></thead><tbody>{rows}</tbody></table></div>
}
export const statuses:Record<string,string>={draft:'Draft',published:'Published',archived:'Archived',processing:'Processing',approved:'Approved',failed:'Failed — retry',none:'—'}
export const ts=(s:string)=>s==='draft'?'Ready to review':statuses[s]
export function Security(){
  const role=useRole(),router=useRouter(),[code,C]=useState<string[]>(Array(6).fill('')),[msg,M]=useState(''),refs=useRef<(HTMLInputElement|null)[]>([])
  const staff=role==='owner'||role==='assistant'
  const {data,error,mutate}=useSWR(staff?['mfa',role]:null,()=>read(getMfaStatus()))
  if(!staff)return <div className="welcome section"><h2>This area is for the Reset to Sovereignty team only.</h2><Action href="/">Go to the website</Action></div>
  if(error)return <Failure retry={mutate}/>
  if(!data)return <div className="auth-surface"><div className="auth panel"><SkeletonText lines={4}/></div></div>
  const enrolled=data.enrolled
  return <div className="auth-surface"><div className="auth panel"><h1>{enrolled?'Enter your security code':'Protect your admin access'}</h1><p>{enrolled?'Open your authenticator app and enter the 6-digit code.':'Scan this code with an authenticator app (such as Google Authenticator or 1Password), then enter the 6-digit code.'}</p>{!enrolled&&<div className="qr" aria-label="6-digit code"><ScanQrCode size={70} strokeWidth={1}/></div>}
    <form onSubmit={async e=>{e.preventDefault();const r=await verifyMfa(code.join(''));if(r.ok){await mutate();window.dispatchEvent(new Event('rts-mfa'));const next=new URLSearchParams(location.search).get('next');router.push(next&&/^\/admin(?:\/[a-z0-9-]+)*$/.test(next)?next:'/admin')}else M(r.error)}}>
      <label id="otp-label">6-digit code</label>
      <div className="otp" role="group" aria-labelledby="otp-label">{code.map((v,i)=><input key={i} aria-label={`6-digit code ${i+1}`} value={v} inputMode="numeric" autoComplete={i===0?'one-time-code':'off'} ref={el=>{refs.current[i]=el}} onChange={e=>{const s=e.target.value.replace(/\D/g,'');const n=[...code];n[i]=s.slice(-1);C(n);if(s)refs.current[i+1]?.focus()}} onKeyDown={e=>{if(e.key==='Backspace'&&!v)refs.current[i-1]?.focus()}} onPaste={e=>{e.preventDefault();const n=e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6).padEnd(6,' ').split('').map(x=>x.trim());C(n);refs.current[5]?.focus()}}/>)}</div>
      <button className="pill">{enrolled?'Verify':'Turn on protection'}</button><span role="alert">{msg}</span>
    </form></div></div>
}
