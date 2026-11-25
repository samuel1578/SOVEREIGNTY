import source from './copy.json'
const lines: Record<string,string> = source
export const line=(n:number)=>(lines[n]||'').trim()
export const text=(n:number)=>line(n).replace(/^.*?\*\*[^*]+:\*\*\s*/, '').replace(/^> /,'').replace(/`/g,'')
// D14 — Contact joins the main navigation (header, menu and footer Explore).
export const nav=['Philosophy','Listen','Courses','Coaching','About','Contact']
export const legal=['Privacy','Terms','Disclaimer','Refunds']
export const brand='Reset to Sovereignty'
export const price=(v:number|null)=>v===null?'£[PRICE]':new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP'}).format(v/100)
export const time=(v:number)=>`${Math.floor(v/60).toString().padStart(2,'0')}:${Math.floor(v%60).toString().padStart(2,'0')}`
export const titles:Record<string,[string,string]>={philosophy:[text(148),text(149)],about:[text(200),text(201)],listen:[text(216),text(217)],coaching:[text(298),text(299)],courses:[text(248),text(249)],contact:[text(569),text(570)]}
export const legalNames:Record<string,string>={privacy:'Privacy Policy',terms:'Terms of Use',disclaimer:'Disclaimer',refunds:'Refund Policy'}
export const article=(a:number,b:number)=>Array.from({length:b-a+1},(_,i)=>line(a+i)).filter(Boolean).join('\n\n')
export const pages:Record<string,string>={home:text(90),philosophy:article(156,188),about:article(207,209),privacy:article(347,354),terms:article(357,364),disclaimer:line(367),refunds:article(370,373)}

/** Stable anchor id for a section heading (Philosophy contents ↔ Article headings). */
export const headingId=(title:string)=>'section-'+title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')
