import {describe,it,expect} from 'vitest'
import {as} from './helpers'
import * as admin from '@/lib/services/admin'
import {store} from '@/lib/services/store'

describe('F-003 / D2 — transcript approval', ()=>{
  it('lets an assistant approve a transcript', async()=>{
    const r=await as('assistant',()=>admin.approveTranscript('a2','Reviewed text'))
    expect(r.ok).toBe(true)
    expect(store.audio.find(a=>a.id==='a2')?.transcriptStatus).toBe('approved')
  })
  it('lets the owner approve a transcript', async()=>{
    const r=await as('owner',()=>admin.approveTranscript('a6','Reviewed text'))
    expect(r.ok).toBe(true)
  })
  it('refuses members and visitors', async()=>{
    expect((await as('member',()=>admin.approveTranscript('a2','x'))).ok).toBe(false)
    expect((await as('visitor',()=>admin.approveTranscript('a2','x'))).ok).toBe(false)
  })
  it('still refuses assistants publishing or unpublishing', async()=>{
    const r=await as('assistant',()=>admin.setStatus('a1','draft'))
    expect(r.ok).toBe(false)
    expect(store.audio.find(a=>a.id==='a1')?.status).toBe('published')
  })
})

describe('F-004 / D3 — saving never changes publish state', ()=>{
  it('keeps a published audio published when an assistant edits it', async()=>{
    const r=await as('assistant',()=>admin.saveAudio('a1',{title:'[Audio title] edited'}))
    expect(r.ok).toBe(true)
    const a=store.audio.find(a=>a.id==='a1')!
    expect(a.status).toBe('published')
    expect(a.title).toBe('[Audio title] edited')
  })
  it('keeps a published lesson published when the owner saves it', async()=>{
    const l=store.lessons.find(l=>l.id==='l1')!
    expect(l.status).toBe('published')
    const r=await as('owner',()=>admin.saveLesson({...l,title:'[Lesson title] edited',status:'draft'}))
    expect(r.ok).toBe(true)
    expect(store.lessons.find(x=>x.id==='l1')?.status).toBe('published')
  })
  it('keeps a published lesson published when an assistant saves it', async()=>{
    const l=store.lessons.find(l=>l.id==='l1')!
    await as('assistant',()=>admin.saveLesson({...l,summary:'[Summary] edited'}))
    expect(store.lessons.find(x=>x.id==='l1')?.status).toBe('published')
  })
  it('creates new lessons as drafts', async()=>{
    const l=store.lessons.find(l=>l.id==='l1')!
    await as('assistant',()=>admin.saveLesson({...l,id:'new-lesson',slug:'new-lesson',status:'published'}))
    expect(store.lessons.find(x=>x.id==='new-lesson')?.status).toBe('draft')
  })
  it('only the owner changes status through setStatus', async()=>{
    expect((await as('owner',()=>admin.setStatus('l1','draft'))).ok).toBe(true)
    expect(store.lessons.find(x=>x.id==='l1')?.status).toBe('draft')
  })
})
