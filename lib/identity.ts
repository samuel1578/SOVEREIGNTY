import type {Identity} from './types'
/** Fixed review identities plus mock sign-ups (`u-…`, created by the onboarding flow). */
export const REVIEW_IDENTITIES=['visitor','member','empty','assistant','owner'] as const
export function parseIdentity(v?:string|null):Identity{
  if(!v)return 'visitor'
  if((REVIEW_IDENTITIES as readonly string[]).includes(v))return v as Identity
  return /^u-[a-z0-9]{8,36}$/.test(v)?v as Identity:'visitor'
}
/** Any signed-in non-staff identity, including mock sign-ups. */
export const isMemberIdentity=(id:Identity)=>id==='member'||id==='empty'||id.startsWith('u-')
