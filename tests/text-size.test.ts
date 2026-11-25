import {describe,it,expect,beforeEach} from 'vitest'
import {renderHook,act} from '@testing-library/react'
import {isTextSize,readTextSize,useTextSize,TEXT_KEY} from '@/components/hooks'

// D13 — admin text size: unset until chosen, persisted, and applied to <html data-text>.
describe('admin text size',()=>{
  beforeEach(()=>{localStorage.clear();delete document.documentElement.dataset.text})

  it('accepts only the three sizes',()=>{
    expect(['standard','large','xlarge'].every(isTextSize)).toBe(true)
    expect(isTextSize('huge')).toBe(false)
    expect(isTextSize(null)).toBe(false)
  })

  it('is unset on a first visit, so the prompt shows',()=>{
    expect(readTextSize()).toBeNull()
    localStorage.setItem(TEXT_KEY,'nonsense')
    expect(readTextSize()).toBeNull()
  })

  it('saves the choice and applies it to the page',()=>{
    const {result}=renderHook(()=>useTextSize())
    expect(result.current.size).toBeNull()
    act(()=>result.current.choose('xlarge'))
    expect(result.current.size).toBe('xlarge')
    expect(localStorage.getItem(TEXT_KEY)).toBe('xlarge')
    expect(document.documentElement.dataset.text).toBe('xlarge')
  })
})
