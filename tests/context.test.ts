import {describe,it,expect} from 'vitest'
import {as} from './helpers'
import {runWith} from '@/lib/services/store'
import * as audio from '@/lib/services/audio'
import * as admin from '@/lib/services/admin'
import * as courses from '@/lib/services/courses'
import * as auth from '@/lib/services/auth'

describe('D6 — request context', ()=>{
  it('treats calls without a context as a visitor (public cached reads)', async()=>{
    const r=await audio.listAudio({includeDrafts:true})
    expect(r.ok&&r.data.every(a=>a.status==='published')).toBe(true)
    expect((await admin.getWorkspace()).ok).toBe(false)
  })
  it('surfaces ?mockError=1 from the calling page', async()=>{
    const r=await runWith({cookies:{},mockError:true,writes:[]},()=>audio.listCategories())
    expect(r.ok).toBe(false)
  })
  it('requires MFA for staff', async()=>{
    const r=await runWith({cookies:{'rts-review':'owner'},mockError:false,writes:[]},()=>admin.getWorkspace())
    expect(r.ok).toBe(false)
    expect((await as('owner',()=>admin.getWorkspace())).ok).toBe(true)
  })
  it('queues cookie writes for verifyMfa instead of touching document.cookie', async()=>{
    const ctx={cookies:{'rts-review':'assistant'} as Record<string,string>,mockError:false,writes:[] as {name:string;value:string}[]}
    const r=await runWith(ctx,()=>auth.verifyMfa('123456'))
    expect(r.ok).toBe(true)
    expect(ctx.writes.map(w=>w.name)).toEqual(['rts-mfa','rts-enrolled-assistant'])
  })
  it('D4 — the Tier 1 review price is flagged as a sample', async()=>{
    const r=await courses.getTier('tier-1')
    expect(r.ok&&r.data?.pricePence).toBe(4900)
    expect(r.ok&&r.data?.samplePrice).toBe(true)
  })
  it('F-008 — the server action re-validates the MIME type', async()=>{
    const r=await as('assistant',()=>admin.requestUpload({name:'x.mp3',type:'text/plain',size:10}))
    expect(r.ok).toBe(false)
  })
})
