import 'server-only'
import {result,store,guard,log} from './store'
import type {CoachingSettings} from '../types'
// TODO(backend): Supabase — read public coaching settings.
export const getCoachingSettings=()=>result(()=>({...store.coaching}))
// TODO(backend): Supabase — persist staff edits.
export const saveCoachingSettings=(input:CoachingSettings)=>result(()=>{guard();if(input.calLink&&!/^https:\/\/cal\.com\//.test(input.calLink))throw Error('Booking link (Cal.com)');store.coaching={...input};log('Saved','Coaching settings')})
