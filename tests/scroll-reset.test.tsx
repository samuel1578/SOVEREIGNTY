import {describe,it,expect,vi,beforeEach} from 'vitest'
import {render} from '@testing-library/react'

let path='/'
vi.mock('next/navigation',()=>({usePathname:()=>path}))
const {ScrollReset}=await import('@/components/scroll-reset')

// D15 — new pages open at the top; back/forward and #hash links are left alone.
describe('scroll reset on navigation',()=>{
  let scroll:ReturnType<typeof vi.fn>
  beforeEach(()=>{scroll=vi.fn();window.scrollTo=scroll as unknown as typeof window.scrollTo;path='/';history.replaceState(null,'','/')})

  it('does nothing on the first load',()=>{
    render(<ScrollReset/>)
    expect(scroll).not.toHaveBeenCalled()
  })
  it('scrolls to the top when a link opens another page',()=>{
    const {rerender}=render(<ScrollReset/>)
    path='/about';rerender(<ScrollReset/>)
    expect(scroll).toHaveBeenCalledWith({top:0,left:0,behavior:'instant'})
  })
  it('keeps the position on back/forward',()=>{
    const {rerender}=render(<ScrollReset/>)
    window.dispatchEvent(new PopStateEvent('popstate'))
    path='/listen';rerender(<ScrollReset/>)
    expect(scroll).not.toHaveBeenCalled()
  })
  it('leaves #section links to the browser',()=>{
    const {rerender}=render(<ScrollReset/>)
    history.replaceState(null,'','/philosophy#section-one')
    path='/philosophy';rerender(<ScrollReset/>)
    expect(scroll).not.toHaveBeenCalled()
  })
})
