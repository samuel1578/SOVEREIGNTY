// Pure formatting helpers shared by server and client code (F-006).
const whole=(s:number)=>Math.max(0,Math.floor(Number.isFinite(s)?s:0))
/** `12:05` / `1:02:05` clock for elapsed and total time. */
export function clock(seconds:number){const s=whole(seconds),h=Math.floor(s/3600),m=Math.floor(s%3600/60),r=s%60,p=(n:number)=>String(n).padStart(2,'0');return h?`${h}:${p(m)}:${p(r)}`:`${p(m)}:${p(r)}`}
/** Meta-line duration, e.g. `12 min` (content.md P04). Anything under a minute rounds up to `1 min`. */
export function formatDuration(seconds:number){const s=whole(seconds);return `${s===0?0:Math.max(1,Math.round(s/60))} min`}
/** ISO 8601 duration for JSON-LD, e.g. `PT12M30S`. */
export function isoDuration(seconds:number){const s=whole(seconds),h=Math.floor(s/3600),m=Math.floor(s%3600/60),r=s%60;return 'PT'+(h?`${h}H`:'')+(m?`${m}M`:'')+(r||(!h&&!m)?`${r}S`:'')}
/** Total for "[Y] hours of audio", one decimal at most. */
export function formatHours(seconds:number){return new Intl.NumberFormat('en-GB',{maximumFractionDigits:1}).format(whole(seconds)/3600)}
/** Completion threshold (SRS PLY-03): ≥ 90 % of the item's duration. */
export const isComplete=(position:number,duration:number)=>duration>0&&position>=0.9*duration
