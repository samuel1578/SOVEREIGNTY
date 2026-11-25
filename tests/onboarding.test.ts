import {describe,it,expect} from 'vitest'
import {as} from './helpers'
import {runWith,store} from '@/lib/services/store'
import * as onboarding from '@/lib/services/onboarding'
import * as member from '@/lib/services/member'
import {parseIdentity} from '@/lib/identity'

const answers={preferredName:'Sam',country:'Ghana',ageRange:'25–34',reasons:['Wanting more calm and clarity','not-an-option'],practice:'New to it',heardFrom:'Instagram',notes:'Hello',marketing:true}

describe('mock sign-up (onboarding)', ()=>{
  it('validates the account step', async()=>{
    expect((await as('visitor',()=>onboarding.startSignUp({name:'',email:'a@b.co',terms:true,answers}))).ok).toBe(false)
    expect((await as('visitor',()=>onboarding.startSignUp({name:'Sam',email:'nope',terms:true,answers}))).ok).toBe(false)
    expect((await as('visitor',()=>onboarding.startSignUp({name:'Sam',email:'a@b.co',terms:false,answers}))).ok).toBe(false)
    expect((await as('visitor',()=>onboarding.startSignUp({name:'Sam',email:'member@example.com',terms:true,answers}))).ok).toBe(false)
  })
  it('rejects non-image avatars', async()=>{
    const r=await as('visitor',()=>onboarding.startSignUp({name:'Sam',email:'x@y.co',terms:true,answers,avatarUrl:'data:text/html;base64,PGI+'}))
    expect(r.ok).toBe(false)
  })
  it('creates a member with answers after confirmation and signs them in', async()=>{
    const r=await as('visitor',()=>onboarding.startSignUp({name:'Sam Example',email:'Sam@Example.org',terms:true,answers,avatarUrl:'data:image/jpeg;base64,AAAA'}))
    if(!r.ok)throw Error(r.error)
    expect(store.people.some(p=>p.email==='sam@example.org')).toBe(false)
    const ctx={cookies:{} as Record<string,string>,mockError:false,writes:[]}
    const c=await runWith(ctx,()=>onboarding.confirmSignUp(r.data.token!))
    if(!c.ok)throw Error(c.error)
    const p=store.people.find(p=>p.email==='sam@example.org')!
    expect(p.role).toBe('member')
    expect(p.avatarUrl).toBe('data:image/jpeg;base64,AAAA')
    expect(p.onboarding?.reasons).toEqual(['Wanting more calm and clarity'])
    expect(ctx.cookies['rts-review']).toBe(p.id)
    expect(parseIdentity(p.id)).toBe(p.id)
    // Token is single-use.
    expect((await as('visitor',()=>onboarding.confirmSignUp(r.data.token!))).ok).toBe(false)
    // New member starts with an empty library and can change their photo.
    expect(await as(p.id as `u-${string}`,()=>member.getLibrary())).toEqual({ok:true,data:[]})
    expect((await as(p.id as `u-${string}`,()=>onboarding.updateAvatar(null))).ok).toBe(true)
    expect(p.avatarUrl).toBeUndefined()
  })
  it('refuses avatar changes when signed out', async()=>{
    expect((await as('visitor',()=>onboarding.updateAvatar(null))).ok).toBe(false)
  })
  it('ignores malformed identity cookies', ()=>{
    expect(parseIdentity('u-../../x')).toBe('visitor')
    expect(parseIdentity('admin')).toBe('visitor')
  })
})
