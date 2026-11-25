import {describe,it,expect} from 'vitest'
import {as} from './helpers'
import {validateContact,TOPICS} from '@/lib/contact'
import * as contact from '@/lib/services/contact'
import * as admin from '@/lib/services/admin'
import {store} from '@/lib/services/store'

const good={name:'Ada',email:'ada@example.com',topic:TOPICS[1],message:'I loved the new audio. Thank you.'}

describe('D14 — contact form validation',()=>{
  it('accepts a complete message',()=>{expect(validateContact(good)).toEqual({})})
  it('flags each missing or invalid field',()=>{
    const e=validateContact({name:' ',email:'not-an-email',topic:'Something else',message:'Hi'})
    expect(Object.keys(e).sort()).toEqual(['email','message','name','topic'])
  })
  it('rejects messages over 5,000 characters',()=>{expect(validateContact({...good,message:'x'.repeat(5001)}).message).toBeTruthy()})
  it('rejects addresses that could break a mailto link',()=>{
    expect(validateContact({...good,email:'a@b.com?cc=x@y.com'}).email).toBeTruthy()
    expect(validateContact({...good,email:'a b@example.com'}).email).toBeTruthy()
  })
})

describe('D14 — sending and reading messages',()=>{
  it('lets a visitor send a message, which arrives as new',async()=>{
    const before=store.messages.length
    const r=await as('visitor',()=>contact.sendContactMessage({...good,message:'  A message with spaces.  '}))
    expect(r.ok).toBe(true)
    expect(store.messages.length).toBe(before+1)
    expect(store.messages[0]).toMatchObject({status:'new',message:'A message with spaces.'})
  })
  it('returns field errors and stores nothing for invalid input',async()=>{
    const before=store.messages.length
    const r=await as('visitor',()=>contact.sendContactMessage({...good,email:'nope'}))
    expect(r.ok).toBe(false)
    if(!r.ok)expect(r.fieldErrors?.email).toBeTruthy()
    expect(store.messages.length).toBe(before)
  })
  it('quietly drops spam-trap submissions',async()=>{
    const before=store.messages.length
    const r=await as('visitor',()=>contact.sendContactMessage({...good,website:'http://spam.example'}))
    expect(r.ok).toBe(true)
    expect(store.messages.length).toBe(before)
  })
  it('lets owner and assistant change status, but not members or visitors',async()=>{
    const id=store.messages[0].id
    expect((await as('assistant',()=>contact.setMessageStatus(id,'read'))).ok).toBe(true)
    expect((await as('owner',()=>contact.setMessageStatus(id,'archived'))).ok).toBe(true)
    expect(store.messages[0].status).toBe('archived')
    expect((await as('member',()=>contact.setMessageStatus(id,'new'))).ok).toBe(false)
    expect((await as('visitor',()=>contact.setMessageStatus(id,'new'))).ok).toBe(false)
  })
  it('shows messages to staff only',async()=>{
    const r=await as('assistant',()=>admin.getWorkspace())
    expect(r.ok&&r.data.messages.length).toBeGreaterThan(0)
    expect((await as('member',()=>admin.getWorkspace())).ok).toBe(false)
  })
})
