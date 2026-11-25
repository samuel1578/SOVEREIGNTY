import 'server-only'
import {result,session,identity,staff,secure,mfaEnrolled,setCookie} from './store'
import {REVIEW} from '../config'
import type {Identity,Role} from '../types'
// Review mode only (D4) — sets the mock identity cookie. Never available when REVIEW is off.
export const switchIdentity=(id:Identity)=>result(()=>{if(!REVIEW)return false;setCookie('rts-review',id);setCookie('rts-mfa','',0);return true})
// TODO(backend): Supabase Auth — resolve the verified session.
export const getSession=()=>result(session)
// TODO(backend): Supabase Auth — send the single-use sign-in link.
export const sendMagicLink=(email:string,next?:string)=>result(()=>{if(!/^\S+@\S+\.\S+$/.test(email))throw Error('Please enter a valid email address.');if(email==='error@test.com')throw Error('Too many attempts. Please wait a minute and try again.');void next;return true})
// TODO(backend): Supabase Auth — start the Google redirect.
export const signInWithGoogle=(next?:string)=>result(()=>{void next;throw Error("Google sign-in didn't complete. Please try again.")})
// TODO(backend): Supabase Auth — revoke the current session.
export const signOut=()=>result(()=>{setCookie('rts-review','',0);setCookie('rts-mfa','',0)})
// TODO(backend): server-only — enforce role and MFA checks on every operation.
export const requireRole=(roles:Role[])=>result(()=>roles.includes(session()?.role||'visitor'))
// TODO(backend): Supabase Auth — inspect verified enrolment and assurance.
export const getMfaStatus=()=>result(()=>({enrolled:mfaEnrolled(),verified:secure()}))
// TODO(backend): Supabase Auth — verify TOTP; six digits are accepted only in review mode.
export const verifyMfa=(code:string)=>result(()=>{if(!REVIEW||!staff()||!/^\d{6}$/.test(code))throw Error("That code didn't work. Codes change every 30 seconds — try the latest one.");setCookie('rts-mfa',identity());setCookie(`rts-enrolled-${identity()}`,'1');return true})
