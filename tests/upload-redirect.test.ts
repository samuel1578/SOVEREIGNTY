import {describe,it,expect} from 'vitest'
import {validateUpload,UPLOAD_ERRORS,MAX_UPLOAD_BYTES} from '@/lib/upload'
import {safeNext} from '@/lib/redirect'

describe('F-008 — upload validation', ()=>{
  it('accepts MP3 and M4A with an allowed MIME type', ()=>{
    expect(validateUpload({name:'a.mp3',type:'audio/mpeg',size:1})).toBeNull()
    expect(validateUpload({name:'a.M4A',type:'audio/mp4',size:1})).toBeNull()
    expect(validateUpload({name:'a.m4a',type:'audio/x-m4a',size:1})).toBeNull()
  })
  it('rejects a renamed file whose MIME type is not allowed', ()=>{
    expect(validateUpload({name:'virus.mp3',type:'application/x-msdownload',size:1})).toBe(UPLOAD_ERRORS.type)
    expect(validateUpload({name:'a.mp3',type:'',size:1})).toBe(UPLOAD_ERRORS.type)
  })
  it('rejects the wrong extension even with an audio MIME type', ()=>{
    expect(validateUpload({name:'a.wav',type:'audio/mpeg',size:1})).toBe(UPLOAD_ERRORS.type)
  })
  it('rejects files over 300 MB', ()=>{
    expect(validateUpload({name:'a.mp3',type:'audio/mpeg',size:MAX_UPLOAD_BYTES+1})).toBe(UPLOAD_ERRORS.size)
  })
})

describe('D12 — safe post-auth redirect', ()=>{
  it('keeps same-origin relative paths', ()=>{
    expect(safeNext('/courses/tier-1?x=1#y')).toBe('/courses/tier-1?x=1#y')
    expect(safeNext('/account')).toBe('/account')
  })
  it('rejects anything that could leave the origin', ()=>{
    for(const bad of ['https://evil.test','//evil.test','/\\evil.test','\\\\evil.test','javascript:alert(1)','evil','/\tx',''])
      expect(safeNext(bad)).toBe('/account/library')
    expect(safeNext(null)).toBe('/account/library')
  })
  it('keeps encoded characters inside the path (they cannot change the origin)', ()=>{
    expect(safeNext('/%0d%0aSet-Cookie:x')).toBe('/%0d%0aSet-Cookie:x')
  })
})
