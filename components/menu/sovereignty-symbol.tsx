import Image from 'next/image'
import type {CSSProperties} from 'react'

/**
 * Signature emblem for the menu — the supplied /brand/hamburger-icon.png, kept whole.
 *
 * The PNG is RGBA with a transparent background, but its two profiles share a blended overlap band
 * and the centre circle + arcs straddle both heads, so they cannot be cut into clean layers without
 * repainting the artwork. The movement is therefore built AROUND the untouched image:
 *  - two soft colour auras (terracotta / olive) drift apart and return — the profiles "separating";
 *  - a glow expands from the artwork's centre circle (measured at 49.85% × 47.5% of the image);
 *  - ripples travel outward from that same point;
 *  - the emblem then settles into a slow breath.
 * All motion lives in menu.css; `prefers-reduced-motion` leaves the static emblem.
 */
export function SovereigntySymbol({className=''}:{className?:string}){
  return <div className={'sym '+className} aria-hidden>
    <span className="sym-aura sym-aura-l"/>
    <span className="sym-aura sym-aura-r"/>
    <span className="sym-ripples">{[0,1,2].map(i=><i key={i} style={{'--i':i} as CSSProperties}/>)}</span>
    <span className="sym-breath">
      <Image className="sym-art" src="/brand/hamburger-icon.png" alt="" width={1312} height={1199} loading="eager" sizes="(min-width: 1024px) 520px, (min-width: 768px) 40vw, 170px"/>
      <span className="sym-core"/>
    </span>
  </div>
}
