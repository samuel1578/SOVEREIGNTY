import {describe,it,expect} from 'vitest'
import {clock,formatDuration,isoDuration,formatHours,isComplete} from '@/lib/format'

describe('F-006 — formatDuration and friends', ()=>{
  it('formats meta-line durations in minutes', ()=>{
    expect(formatDuration(60)).toBe('1 min')
    expect(formatDuration(720)).toBe('12 min')
    expect(formatDuration(30)).toBe('1 min')
    expect(formatDuration(0)).toBe('0 min')
    expect(formatDuration(5430)).toBe('91 min')
    expect(formatDuration(Number.NaN)).toBe('0 min')
  })
  it('formats clocks', ()=>{
    expect(clock(0)).toBe('00:00')
    expect(clock(65.9)).toBe('01:05')
    expect(clock(3725)).toBe('1:02:05')
  })
  it('builds ISO 8601 durations for JSON-LD', ()=>{
    expect(isoDuration(60)).toBe('PT1M')
    expect(isoDuration(750)).toBe('PT12M30S')
    expect(isoDuration(3600)).toBe('PT1H')
    expect(isoDuration(0)).toBe('PT0S')
  })
  it('formats hours of audio', ()=>{
    expect(formatHours(5400)).toBe('1.5')
    expect(formatHours(240)).toBe('0.1')
  })
  it('completes at 90 % of the real duration', ()=>{
    expect(isComplete(53,60)).toBe(false)
    expect(isComplete(54,60)).toBe(true)
    expect(isComplete(647,720)).toBe(false)
    expect(isComplete(648,720)).toBe(true)
    expect(isComplete(10,0)).toBe(false)
  })
})
