import Link from 'next/link'
import {ArrowUpRight,ArrowRight} from 'lucide-react'
import {Children,isValidElement,type ReactNode} from 'react'
import ReactMarkdown,{type Components} from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import {headingId} from '@/lib/editorial'
export function Copy({s}:{s:string}){return <>{s.split(/(\[[^\]]+\]\(\/[^)]*\)|\[[^\]]+\]|\*\*[^*]+\*\*|\*[^*]+\*)/g).map((v,i)=>{const l=v.match(/^\[(.+?)\]\((\/[^)]*)\)$/);return l?<Link key={i} href={l[2]}>{l[1]}</Link>:v.startsWith('[')?<span key={i} className="placeholder">{v}</span>:v.startsWith('**')?<b key={i}>{v.slice(2,-2)}</b>:v.startsWith('*')?<em key={i}>{v.slice(1,-1)}</em>:v})}</>}
// D9 — sanitised Markdown (react-markdown + rehype-sanitize). Raw HTML is never rendered.
const textOf=(n:ReactNode):string=>typeof n==='string'||typeof n==='number'?String(n):Array.isArray(n)?n.map(textOf).join(''):isValidElement<{children?:ReactNode}>(n)?textOf(n.props.children):''
/** Keeps the `[PLACEHOLDER]` dashed-pill rule inside Markdown text. */
const pills=(children:ReactNode):ReactNode=>Children.map(children,c=>typeof c==='string'?c.split(/(\[[^\]]+\])/g).map((v,i)=>/^\[[^\]]+\]$/.test(v)?<span key={i} className="placeholder">{v}</span>:v):c)
const md:Components={
  p:({children})=><p>{pills(children)}</p>,li:({children})=><li>{pills(children)}</li>,strong:({children})=><b>{pills(children)}</b>,em:({children})=><em>{pills(children)}</em>,
  blockquote:({children})=><blockquote>{children}</blockquote>,
  h1:({children})=><h2 id={headingId(textOf(children))}>{children}</h2>,h2:({children})=><h2 id={headingId(textOf(children))}>{children}</h2>,
  h3:({children})=><h3>{children}</h3>,h4:({children})=><h2 id={headingId(textOf(children))}>{children}</h2>,
  a:({href='',children})=>href.startsWith('/')&&!href.startsWith('//')?<Link href={href}>{children}</Link>:<a href={href} target="_blank" rel="noopener noreferrer">{children}</a>,
}
const MD=({src}:{src:string})=><ReactMarkdown rehypePlugins={[rehypeSanitize]} components={md}>{src}</ReactMarkdown>
export function Article({value}:{value:string}){
  // The Avatar / Core Awareness pair renders as a two-column comparison (structure P02).
  const lines=value.split('\n'),i=lines.findIndex(l=>l.startsWith('- **The Avatar')),j=i<0?-1:lines.findIndex((l,k)=>k>i&&l.startsWith('- **Core Awareness'))
  if(i<0||j<0)return <article className="prose"><MD src={value}/></article>
  return <article className="prose"><MD src={lines.slice(0,i).join('\n')}/><div className="grid2 comparison">{[lines[i],lines[j]].map(s=><div className="panel" key={s}><MD src={s.slice(2)}/></div>)}</div><MD src={lines.slice(j+1).join('\n')}/></article>
}
export function Action({href,children,quiet=false}:{href:string;children:ReactNode;quiet?:boolean}){return <Link className={quiet?'textlink':'pill'} href={href}>{children}{quiet?<ArrowUpRight size={16}/>:<ArrowRight size={17}/>}</Link>}
export function Intro({label,title,body,children}:{label?:string;title:string;body?:string;children?:ReactNode}){return <section className="intro"><div className="wrap">{label&&<small className="eyebrow">{label}</small>}<h1><Copy s={title}/></h1>{body&&<p><Copy s={body}/></p>}{children}</div></section>}
export function Section({eyebrow,title,body,children}:{eyebrow?:string;title?:string;body?:string;children?:ReactNode}){return <section className="section wrap">{eyebrow&&<small className="eyebrow">{eyebrow}</small>}{title&&<h2>{title}</h2>}{body&&<p className="lead">{body}</p>}{children}</section>}
export const Wellbeing=()=> <p className="fine">Reset to Sovereignty supports your wellbeing. It is not medical or psychological treatment. <Link href="/disclaimer">Read the disclaimer</Link>.</p>
export const Refund=()=> <p className="fine">Each tier is a one-time purchase in GBP with lifetime access. Purchases are non-refundable. <Link href="/refunds">See our refund policy</Link>.</p>
export const Upsell=()=> <div className="band"><Section title="Ready to go deeper?" body="The course tiers take you further, lesson by lesson."><Action href="/courses">View the tiers</Action></Section></div>
