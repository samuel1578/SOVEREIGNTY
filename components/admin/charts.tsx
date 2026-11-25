'use client'
// Admin charts (UI revamp, D20). Single series each, in the brand clay colour, so no extra palette and blue stays
// interaction-only (D5). Every chart has a text summary for screen readers, a hover tooltip and a table view.
import {useId,useState} from 'react'

/** Tiny trend line for a stat tile. Decorative: the tile's number and caption carry the meaning. */
export function Sparkline({values}:{values:number[]}){
  if(values.length<2)return null
  const mx=Math.max(...values),mn=Math.min(...values),r=mx-mn||1
  const d=values.map((v,i)=>`${i?'L':'M'}${(i/(values.length-1)*100).toFixed(1)} ${(28-(v-mn)/r*24).toFixed(1)}`).join(' ')
  return <svg className="spark" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden><path className="spark-fill" d={`${d} L100 30 L0 30 Z`}/><path className="spark-line" d={d} vectorEffect="non-scaling-stroke"/></svg>
}

type Point={label:string;value:number}
/** Area chart with a crosshair and tooltip. `unit` names one value, e.g. "new members". */
export function AreaChart({data,unit,title}:{data:Point[];unit:string;title:string}){
  const [hover,setHover]=useState<number|null>(null),[table,setTable]=useState(false),id=useId()
  const W=560,H=200,L=30,R=10,T=10,B=26,top=Math.max(4,Math.ceil(Math.max(...data.map(p=>p.value),1)/4)*4)
  const x=(i:number)=>L+i*(W-L-R)/Math.max(1,data.length-1),y=(v:number)=>T+(1-v/top)*(H-T-B)
  const line=data.map((p,i)=>`${i?'L':'M'}${x(i)} ${y(p.value)}`).join(' ')
  const ticks=[0,top/4,top/2,top*3/4,top],labelAt=new Set([0,Math.round((data.length-1)/3),Math.round((data.length-1)*2/3),data.length-1])
  const total=data.reduce((n,p)=>n+p.value,0)
  const move=(e:React.PointerEvent<SVGRectElement>)=>{const b=e.currentTarget.ownerSVGElement!.getBoundingClientRect(),px=(e.clientX-b.left)/b.width*W;setHover(Math.max(0,Math.min(data.length-1,Math.round((px-L)/((W-L-R)/Math.max(1,data.length-1))))))}
  const h=hover===null?null:data[hover]
  return <div className="chart-body">
    {table?<table className="chart-table"><caption className="sr-only">{title}</caption><thead><tr><th>Week of</th><th>{unit}</th></tr></thead><tbody>{data.map(p=><tr key={p.label}><td>{p.label}</td><td>{p.value}</td></tr>)}</tbody></table>
    :<div className="chart-plot">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby={id}>
        <title id={id}>{`${title}: ${total} ${unit} over ${data.length} weeks, from ${data[0]?.label} to ${data[data.length-1]?.label}.`}</title>
        {ticks.map(t=><g key={t}><line className="chart-grid" x1={L} x2={W-R} y1={y(t)} y2={y(t)}/><text className="chart-tick" x={L-8} y={y(t)+4} textAnchor="end">{Math.round(t)}</text></g>)}
        {data.map((p,i)=>labelAt.has(i)&&<text key={p.label} className="chart-tick" x={x(i)} y={H-6} textAnchor="middle">{p.label}</text>)}
        <path className="chart-area" d={`${line} L${x(data.length-1)} ${y(0)} L${x(0)} ${y(0)} Z`}/>
        <path className="chart-line" d={line}/>
        {h&&<><line className="chart-cross" x1={x(hover!)} x2={x(hover!)} y1={T} y2={H-B}/><circle className="chart-dot" cx={x(hover!)} cy={y(h.value)} r={5}/></>}
        <rect x={L} y={T} width={W-L-R} height={H-T-B} fill="transparent" onPointerMove={move} onPointerLeave={()=>setHover(null)}/>
      </svg>
      {h&&<span className="chart-tip" style={{left:`${x(hover!)/W*100}%`,top:`${y(h.value)/H*100}%`}}>Week of {h.label} · <b>{h.value} {unit}</b></span>}
    </div>}
    <button className="textlink chart-toggle" onClick={()=>setTable(!table)}>{table?'View as chart':'View as table'}</button>
  </div>
}

/** Horizontal bars, one row per item, value labelled at the end. */
export function Bars({rows}:{rows:{label:string;value:number}[]}){
  const mx=Math.max(1,...rows.map(r=>r.value))
  return <div className="hbars">{rows.map(r=><div className="hbar" key={r.label} title={`${r.label}: ${r.value}`}><span>{r.label}</span><span className="hbar-track" aria-hidden><i style={{width:`${r.value/mx*100}%`}}/></span><b>{r.value}</b></div>)}</div>
}
