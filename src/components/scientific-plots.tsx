"use client";

import { useId, useMemo, useState } from "react";
import type { SimulationInput, SimulationResult } from "@/lib/pyrozero-engine";

const ink = "var(--plot-axis)";
const blue = "var(--blue)";
const mono = "var(--font-geist-mono, 'JetBrains Mono'), ui-monospace, monospace";
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

interface PlotProps { result: SimulationResult; input: SimulationInput }

function UnresolvedScientificPanel({title,body}:{title:string;body:string}) {
  return <div role="status" style={{minHeight:255,display:"flex",flexDirection:"column",justifyContent:"center",padding:"24px 20px",boxSizing:"border-box",border:"1px dashed var(--border)",borderRadius:5,background:"var(--surface-alt)",color:ink}}>
    <span style={{fontFamily:mono,fontSize:10,color:"var(--amber)",marginBottom:12}}>UNRESOLVED · SOURCE PARAMETERS REQUIRED</span>
    <strong style={{fontSize:16,fontWeight:500,color:"var(--plot-label)",lineHeight:1.5,marginBottom:12}}>{title}</strong>
    <span style={{fontSize:12,lineHeight:1.8}}>{body}</span>
  </div>;
}

/** Directly plots the sampled LOC equation. Markers use the engine's computed mixed velocity. */
export function CheckMarkPlot({ result, input }: PlotProps) {
  const uid = useId().replace(/:/g, "");
  if (!result.locPredictionAvailable || result.locCurvePoints.length === 0) return <UnresolvedScientificPanel title="A measured point cannot determine a flammability curve." body="The supplied report omits this material’s trough, quench increment, quench velocity, optimum velocity and blowoff slope. PyroZero preserves reported limits in the evidence library and withholds a predictive curve until those coefficients are supplied."/>;
  const W = 1150, H = 300, l = 53, r = 24, t = 42, b = 90;
  const points = result.locCurvePoints;
  const exceedsPureOxygen = result.limitingOxygenConcentrationPct > 100;
  const locLabel = exceedsPureOxygen ? ">100% O₂ (Non-Combustible in Pure O₂)" : `${result.limitingOxygenConcentrationPct.toFixed(2)}% LOC`;
  const extent = [...points.map(p => p.locPct), input.oxygenPct, result.limitingOxygenConcentrationPct, result.earthReferenceLocPct].map(v => Math.min(100, v));
  const lo = Math.max(0, Math.floor((Math.min(...extent) - 5) / 5) * 5);
  const hi = Math.min(100, Math.max(lo + 20, Math.ceil((Math.max(...extent) + 5) / 5) * 5));
  const x = (v: number) => l + v / 50 * (W - l - r);
  const y = (v: number) => H - b - (v - lo) / (hi - lo) * (H - t - b);
  const path = points.map((p, i) => `${i ? "L" : "M"}${x(p.vEff).toFixed(2)},${y(p.locPct).toFixed(2)}`).join(" ");
  const currentX = x(clamp(result.mixedConvectionVelocityCms, 0, 50));
  const currentY = y(Math.min(100, result.limitingOxygenConcentrationPct));
  const currentOnPlot = result.mixedConvectionVelocityCms <= 50;
  const trough = points.reduce((a,b)=>a.locPct < b.locPct ? a : b);
  const earth = result.gravityMarkers.find(m => m.gravityG === 1);
  const tickStep = Math.max(5, Math.ceil((hi - lo) / 5 / 5) * 5);
  const yTicks = Array.from({length: Math.floor((hi - lo) / tickStep) + 1}, (_, i) => lo + i * tickStep);
  return <div className="loc-chart"><div className="loc-readings"><div><span className="loc-reading-key"/>Mission LOC<strong>{exceedsPureOxygen?">100% O₂":`${result.limitingOxygenConcentrationPct.toFixed(2)}% O₂`}</strong></div><div><span className="loc-reading-key cabin"/>Cabin oxygen<strong>{input.oxygenPct.toFixed(1)}% O₂</strong></div></div>{!currentOnPlot&&<p className="loc-off-plot">Mission flow exceeds the plotted range of 50 cm/s.</p>}<div className="scientific-plot-scroll" tabIndex={0} aria-label="Flammability plot; scroll horizontally on small screens to inspect every axis"><svg className="scientific-loc" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Limiting oxygen concentration ${locLabel} at mixed flow ${result.mixedConvectionVelocityCms.toFixed(2)} centimeters per second. Cabin oxygen is ${input.oxygenPct} percent.`} style={{width:"100%",display:"block",overflow:"visible"}}>
    <defs>
      <linearGradient id={`${uid}-fill`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#1a8cff" stopOpacity=".18"/><stop offset="1" stopColor="#1a8cff" stopOpacity=".015"/></linearGradient>
      <clipPath id={`${uid}-clip`}><rect x={l} y={t} width={W-l-r} height={H-t-b}/></clipPath>
    </defs>
    <g fontFamily={mono} fontSize="18" fill={ink}>
      <rect x={l} y={t} width={x(5)-l} height={H-t-b} fill="#38bdf8" opacity=".035"/>
      <rect x={x(Math.max(5,trough.vEff-4))} y={t} width={x(Math.min(50,trough.vEff+4))-x(Math.max(5,trough.vEff-4))} height={H-t-b} fill="#1a8cff" opacity=".05"/>
      <rect x={x(25)} y={t} width={x(50)-x(25)} height={H-t-b} fill="var(--amber)" opacity=".025"/>
      {yTicks.map(v=><g key={v}><line x1={l} x2={W-r} y1={y(v)} y2={y(v)} stroke="var(--plot-grid)" strokeDasharray="3 5"/><text x={l-10} y={y(v)+3} textAnchor="end">{v}</text></g>)}
      {[0,10,20,30,40,50].map(v=><g key={v}><line x1={x(v)} x2={x(v)} y1={t} y2={H-b} stroke="var(--plot-grid)"/><text x={x(v)} y={H-b+20} textAnchor="middle">{v}</text></g>)}
      <text x={l} y="17" fill="var(--plot-label)" fontSize="18">O₂ concentration (%)</text>
      {result.negativeOxygenMarginPct>.05&&<text x={W-r} y="17" textAnchor="end" fill="var(--amber)">NOMS {result.negativeOxygenMarginPct.toFixed(2)}% O₂</text>}
      <text x={(l+W-r)/2} y={H-35} textAnchor="middle">Mixed convection Uₘ · cm/s</text>
      <text x={l+7} y={t+16} fontSize="18" fill="var(--plot-axis)">Quench</text>
      <text x={x(Math.max(16,trough.vEff))} y={t+16} fontSize="18" fill="var(--plot-axis)" textAnchor="middle">LOC trough</text>
      <text x={x(33)} y={t+16} fontSize="18" fill="var(--plot-axis)">Blowoff</text>
    </g>
    <g clipPath={`url(#${uid}-clip)`}>
      <path d={`${path} L${x(50)},${H-b} L${x(0)},${H-b} Z`} fill={`url(#${uid}-fill)`}/>
      <line x1={l} x2={W-r} y1={y(input.oxygenPct)} y2={y(input.oxygenPct)} stroke="var(--amber)" strokeOpacity=".7" strokeDasharray="5 5"/>
      {hi===100&&<line x1={l} x2={W-r} y1={y(100)} y2={y(100)} stroke="var(--amber)" strokeDasharray="6 4"><title>Pure oxygen bound · 100% O₂</title></line>}
      <path d={path} fill="none" stroke={blue} strokeWidth="2.5" strokeLinejoin="round"/>
      {result.gravityMarkers.filter(m=>m.vEff<=50).map((m,i)=><g key={m.label}><title>{m.label}: LOC {m.locPct.toFixed(2)}% O₂ at {m.vEff.toFixed(1)} cm/s</title>
        <line x1={x(m.vEff)} y1={y(m.locPct)+6} x2={x(m.vEff)} y2={H-b} stroke={i===1?"var(--amber)":"#657387"} strokeOpacity=".45" strokeDasharray="2 4"/>
        <circle cx={x(m.vEff)} cy={y(m.locPct)} r="4" fill="var(--surface)" stroke={i===1?"var(--amber)":"#7a8ba4"} strokeWidth="1.5"/>
      </g>)}
      {currentOnPlot&&<><line x1={currentX} x2={currentX} y1={t} y2={H-b} stroke={blue} strokeDasharray="3 4" opacity=".55"/><circle cx={currentX} cy={currentY} r="11" fill={blue} opacity=".12"/><circle cx={currentX} cy={currentY} r="5" fill={blue} stroke="#d7f2ff" strokeWidth="1.5"/></>}
      {earth && result.negativeOxygenMarginPct > .05 && <g stroke="var(--amber)" strokeWidth="1.5"><path d={`M${W-r-13},${y(result.earthReferenceLocPct)} h7 M${W-r-10},${y(result.earthReferenceLocPct)} V${currentY} M${W-r-13},${currentY} h7`} fill="none"/></g>}
    </g>

  </svg></div><div className="loc-gravity-legend" aria-label="Gravity reference markers">{result.gravityMarkers.map((marker,index)=><div key={marker.label}><b><i style={{background:index===1?'var(--amber)':'var(--plot-axis)'}}/>{marker.label}</b><span>LOC {marker.locPct>100?">100":marker.locPct.toFixed(2)}% O₂</span><small>Uₘ {marker.vEff.toFixed(1)} cm/s{marker.vEff>50?" · off plot":""}</small></div>)}</div>{exceedsPureOxygen&&<p className="pure-oxygen-boundary" style={{fontSize:13,lineHeight:1.5,margin:"4px 0",color:"var(--secondary)"}}><strong>{locLabel}</strong> · Model threshold exceeds the physical oxygen-fraction limit; curve clipped at 100%. This is a model result, not a pure-oxygen test certification.</p>}</div>;
}

/** Schematic morphology, driven by the computed aspect ratio and soot index. */
export function FlameMorphology({ result, input, paused = false }: PlotProps & { paused?: boolean }) {
  const uid=useId().replace(/:/g, "");
  if (!result.predictionAvailable) {
    const vmax=Math.max(25,result.mixedConvectionVelocityCms),scale=150/vmax;
    const fx=68+input.forcedFlowCms*scale,by=228-result.buoyantVelocityCms*scale;
    return <svg viewBox="0 0 320 320" role="img" aria-label={`Computed convection vector decomposition. Forced flow ${input.forcedFlowCms.toFixed(2)} centimeters per second. Buoyant flow ${result.buoyantVelocityCms.toFixed(2)} centimeters per second. Mixed velocity ${result.mixedConvectionVelocityCms.toFixed(2)} centimeters per second. Flame morphology unresolved.`} style={{width:"100%",display:"block"}}>
      <defs><marker id={`${uid}-force`} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7Z" fill="#38bdf8"/></marker><marker id={`${uid}-buoyancy`} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7Z" fill="#10b981"/></marker><marker id={`${uid}-mixed`} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7Z" fill="var(--plot-label)"/></marker></defs>
      <g stroke="var(--plot-grid)" strokeWidth=".7">{[68,108,148,188,228,268].map(v=><line key={`x${v}`} x1={v} y1="53" x2={v} y2="240"/>)}{[68,108,148,188,228].map(v=><line key={`y${v}`} x1="50" y1={v} x2="285" y2={v}/>)}</g>
      <g fill="none"><line x1="68" y1="228" x2={fx} y2="228" stroke="#38bdf8" strokeWidth="2" markerEnd={`url(#${uid}-force)`}/><line x1="68" y1="228" x2="68" y2={by} stroke="#10b981" strokeWidth="2" markerEnd={`url(#${uid}-buoyancy)`}/><path d={`M${fx} 228V${by}H68`} stroke="#52647c" strokeDasharray="4 5"/><line x1="68" y1="228" x2={fx} y2={by} stroke="var(--plot-label)" strokeWidth="1.8" markerEnd={`url(#${uid}-mixed)`}/></g>
      <circle cx="68" cy="228" r="3" fill="#f1f5f9"/>
      <g fontFamily={mono} fontSize="22" fill={ink}><text x="22" y="20" fill="var(--plot-label)">Convection decomposition</text><text x="22" y="39" fill="var(--plot-axis)" fontSize="22">Uₘ = √(Vforced² + Vbuoyant²)</text><text x="22" y="266" fill="#38bdf8">Forced {input.forcedFlowCms.toFixed(2)} cm/s</text><text x="298" y="266" textAnchor="end" fill="#10b981">Buoyant {result.buoyantVelocityCms.toFixed(2)}</text><text x="22" y="287" fill="var(--plot-label)">Mixed {result.mixedConvectionVelocityCms.toFixed(2)} cm/s</text><text x="22" y="312" fill="var(--amber)" fontSize="22">Flame shape / soot model: unresolved</text></g>
    </svg>;
  }
  const active=result.flameSpreadRateMms > 0;
  const soot=clamp(result.colorSootIndex,0,1);
  const aspect=Math.max(1,result.flameAspectRatio);
  const rx=active?Math.min(57,88/aspect):26;
  const ry=active?rx*aspect:26;
  const cy=171-ry*.35;
  const lean=clamp(input.forcedFlowCms*.23,0,15);
  const body=`M${160-rx},${cy+ry*.24} C${160-rx-8},${cy-ry*.20} ${160-rx*.50+lean},${cy-ry*.92} ${160+lean},${cy-ry} C${160+rx*.60+lean},${cy-ry*.65} ${160+rx+8},${cy+ry*.25} ${160+rx},${cy+ry*.48} C${160+rx*.60},${cy+ry} ${160-rx*.67},${cy+ry} ${160-rx},${cy+ry*.24} Z`;
  return <svg viewBox="0 0 320 300" role="img" aria-label={active?`Flame morphology schematic. Aspect ratio ${aspect.toFixed(2)}, soot index ${soot.toFixed(2)}.`:"No sustained propagation predicted at this atmosphere."} style={{width:"100%",display:"block",maxHeight:230}}>
    <defs>
      <radialGradient id={`${uid}-halo`}><stop stopColor="#1a8cff" stopOpacity=".15"/><stop offset="1" stopColor="#1a8cff" stopOpacity="0"/></radialGradient>
      <radialGradient id={`${uid}-flame`} cx="50%" cy="65%" r="70%"><stop stopColor={soot>=.6?"#fff3b0":"#d6f8ff"}/><stop offset=".3" stopColor={soot>=.6?"#ffd257":"#4fd3ff"}/><stop offset=".65" stopColor={result.flameColor} stopOpacity=".85"/><stop offset="1" stopColor={soot>=.6?"#d73e19":"#1463e8"} stopOpacity=".1"/></radialGradient>
      <marker id={`${uid}-arrow`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="none" stroke="var(--plot-axis)"/></marker>
    </defs>
    <style>{`.pz-flow-${uid}{stroke-dasharray:5 8;animation:pz-flow-${uid} 1.8s linear infinite;animation-play-state:${paused?"paused":"running"}}@keyframes pz-flow-${uid}{to{stroke-dashoffset:-26}}@media(prefers-reduced-motion:reduce){.pz-flow-${uid}{animation:none}}`}</style>
    <g stroke="var(--plot-grid)" strokeWidth=".7">{[40,80,120,160,200,240,280].map(v=><line key={`x${v}`} x1={v} y1="28" x2={v} y2="255"/>)}{[55,95,135,175,215,255].map(v=><line key={`y${v}`} x1="22" y1={v} x2="298" y2={v}/>)}</g>
    <ellipse cx="160" cy="150" rx="119" ry="119" fill={`url(#${uid}-halo)`}/>
    <g fill="none" stroke="var(--plot-axis)" strokeWidth="1.2" markerEnd={`url(#${uid}-arrow)`}>{[71,113,155,197,239].map((v,i)=><path key={v} className={`pz-flow-${uid}`} d={`M22,${v+7} C55,${v+7} 55,${v-2} 80,${v-2}`} opacity={.4+Math.min(input.forcedFlowCms/65,.6)} style={{animationDelay:`${-i*.2}s`}}/>)}</g>
    <g fill="none" stroke="var(--plot-axis)" strokeWidth="1.2" markerEnd={`url(#${uid}-arrow)`}>{[250,276].map((v,i)=><path key={v} className={`pz-flow-${uid}`} d={`M${v},${221-i*20}V${167-i*20}`} opacity={result.buoyantVelocityCms>0?.75:0} style={{animationDelay:`${-i*.4}s`}}/>)}</g>
    {active?<g>
      {aspect<=1.05?<><ellipse cx="160" cy={cy} rx={rx} ry={ry} fill="none" stroke="#42adff" strokeWidth="8" opacity=".11"/><ellipse cx="160" cy={cy} rx={rx} ry={ry} fill={`url(#${uid}-flame)`} stroke="#66ddff" strokeOpacity=".65" strokeWidth=".8"/></>:<><path d={body} fill="none" stroke="#42adff" strokeWidth="8" opacity=".11"/><path d={body} fill={`url(#${uid}-flame)`} stroke={soot>=.6?"#ffbd55":"#66ddff"} strokeOpacity=".65" strokeWidth=".8"/></>}
      <ellipse cx="160" cy={cy+ry*.37} rx={rx*.41} ry={ry*.37} fill={soot>=.6?"#3a190f":"#0e2955"} opacity=".55"/>
      <ellipse cx="160" cy={cy+ry*.53} rx={rx*.20} ry={ry*.21} fill="#f1fbff" opacity=".45"/>
      <path d={`M${160-rx-15},${cy+ry*.05}h-24`} stroke="var(--plot-axis)" strokeWidth=".7"/>
      <text x={160-rx-42} y={cy+ry*.05-5} textAnchor="end" fill="var(--plot-label)" fontSize="22" fontFamily={mono}>CH*</text>
    </g>:<g><circle cx="160" cy="153" r="44" stroke="var(--border)" strokeDasharray="3 5" fill="var(--surface-alt)"/><text x="160" y="146" fill="var(--secondary)" textAnchor="middle" fontSize="22">No sustained</text><text x="160" y="174" fill="var(--secondary)" textAnchor="middle" fontSize="22">propagation</text></g>}
    <g fontFamily={mono} fontSize="22" fill={ink}><text x="160" y="24" textAnchor="middle">g_eff {result.effectiveGravityG.toFixed(3)}</text><text x="22" y="279"><title>AR · flame height divided by flame width</title>AR {result.flameAspectRatio.toFixed(2)}</text><text x="298" y="279" textAnchor="end"><title>CSI · Color/Soot Index, from 0 to 1</title>CSI {soot.toFixed(2)}</text></g>
    <line x1="145" x2="175" y1="242" y2="242" stroke="#b2c2d5"/><line x1="145" x2="145" y1="239" y2="245" stroke="#b2c2d5"/><line x1="175" x2="175" y1="239" y2="245" stroke="#b2c2d5"/>
  </svg>;
}

export function SpecimenCard({ result }: {result:SimulationResult}) {
  const uid=useId().replace(/:/g, "");
  if (!result.predictionAvailable) return <div><svg className="specimen-geometry" viewBox="0 0 270 330" role="img" aria-label="Test specimen geometry: 30 centimeters by 6.5 centimeters. Screening threshold at 15 centimeters. Burn front and material verdict unresolved." style={{width:"100%",display:"block"}}><g fontFamily={mono} fontSize="22" fill={ink}><rect x="101" y="33" width="47" height="216" fill="var(--surface-alt)" stroke="var(--plot-axis)" strokeDasharray="4 3"/><rect x="96" y="26" width="57" height="11" rx="2" fill="#334155"/><path d="M83 33h-8v216h8 M101 260v5h47v-5" stroke="var(--plot-axis)" fill="none"/><text x="65" y="143" transform="rotate(-90 65 143)" textAnchor="middle">30.0 cm</text><text x="124" y="305" textAnchor="middle">6.5 cm</text><line x1="89" x2="209" y1="141" y2="141" stroke="var(--amber)" strokeDasharray="4 4"/><text x="159" y="131" fill="var(--amber)">15.0 cm</text><text x="159" y="155" fontSize="22">Test 1 limit</text><text x="124" y="211" textAnchor="middle" fill="var(--plot-axis)" fontSize="22">No burn</text><text x="124" y="224" textAnchor="middle" fill="var(--plot-axis)" fontSize="22">prediction</text></g></svg><div style={{borderTop:"1px solid var(--plot-grid)",paddingTop:12,color:ink,fontSize:11,lineHeight:1.7}}><span style={{display:"block",color:"var(--amber)",fontFamily:mono,fontSize:10,marginBottom:6}}>UNRESOLVED · SPREAD CLOSURE REQUIRED</span>The supplied report provides no complete spread equation or observation duration. Burn front and NASA-STD-6001B Test 1 verdict require additional evidence.</div></div>;
  const burn=clamp(result.predictedBurnLengthCm,0,30);
  const yBurn=249-burn/30*216;
  const color=result.status==="PASS"?"#10b981":result.status==="FAIL"?"#ef4444":"var(--amber)";
  return <div style={{minWidth:0}}>
    <svg className="specimen-geometry" viewBox="0 0 270 330" role="img" aria-label={`30 by 6.5 centimeter test specimen. Predicted burn length ${burn.toFixed(1)} centimeters. ${result.status}. The screening limit is 15 centimeters.`} style={{width:"100%",display:"block",maxHeight:210}}>
      <defs><pattern id={`${uid}-weave`} width="5" height="5" patternUnits="userSpaceOnUse"><path d="M0 0h5M0 0v5" stroke="#ffffff" strokeOpacity=".075" strokeWidth=".6"/></pattern><linearGradient id={`${uid}-char`} x1="0" y1="1" x2="0" y2="0"><stop stopColor="#161518"/><stop offset=".75" stopColor="#37211b"/><stop offset="1" stopColor="#d06b2b"/></linearGradient></defs>
      <g fontFamily={mono} fontSize="22" fill={ink}>
        <path d="M83 33h-8v216h8" stroke="var(--plot-axis)" fill="none"/><text x="65" y="143" transform="rotate(-90 65 143)" textAnchor="middle">30.0 cm</text>
        <rect x="101" y="33" width="47" height="216" rx="1" fill="#d7d3c9" fillOpacity=".45" stroke="#989793"/>
        <rect x="101" y="33" width="47" height="216" fill={`url(#${uid}-weave)`}/>
        <rect x="101" y={yBurn} width="47" height={249-yBurn} fill={`url(#${uid}-char)`} style={{transition:"y .3s ease,height .3s ease"}}/>
        {burn>0&&<path d={`M101 ${yBurn+1}l6 -3 8 3 7 -2 7 2 7 -3 12 2`} fill="none" stroke="#ff943e" strokeWidth="2" style={{transition:"d .3s ease"}}/>}
        <rect x="96" y="26" width="57" height="11" rx="2" fill="#334155" stroke="#56667d"/>
        <circle cx="124" cy="31" r="2" fill="var(--plot-axis)"/>
        <path d="M101 260v5h47v-5" fill="none" stroke="var(--plot-axis)"/><text x="124" y="305" textAnchor="middle">6.5 cm</text>
        <line x1="89" x2="209" y1="141" y2="141" stroke="var(--amber)" strokeDasharray="4 4"/>
        <text x="159" y="131" fill="var(--amber)">15.0 cm</text>
        <line x1="151" x2="181" y1={yBurn} y2={yBurn} stroke={color}/>
        <text x="265" textAnchor="end" y={clamp(yBurn+3,43,244)} fill={color}>{burn.toFixed(1)} cm</text>
      </g>
    </svg>
    <div className="specimen-prescription" style={{fontSize:13,lineHeight:1.5,color:ink,borderTop:"1px solid var(--plot-grid)",paddingTop:12}}><span style={{display:"block",fontFamily:mono,fontSize:12.5,fontWeight:600,color:"var(--plot-label)",marginBottom:5}}>JSC 29353D · SCREENING PRESCRIPTION</span><p style={{margin:"0 0 4px"}}>{result.status==="PASS" ? "Model screen passes for this envelope." : result.status==="FAIL" ? "Propagation or debris criteria exceeded; evaluate barriers or material replacement." : "1g screening is non-conservative; evaluate barriers or fire breaks."}</p><details><summary style={{cursor:"pointer",fontWeight:600}}>Read countermeasure prescription</summary><p>{result.jsc29353dPrescription}</p></details></div>
  </div>;
}

export interface VisualGraphNode {id:string;label:string;type:string;description:string;sourceIds:string[]}
export interface VisualGraphEdge {id:string;source:string;target:string;type:string}
const nodeColors:Record<string,string>={Investigation:"var(--blue)",FuelMaterial:"var(--amber)",AtmosphericCondition:"var(--green)",HistoricalFailure:"var(--red)",Countermeasure:"var(--plot-axis)",EarthApplication:"#0d9488"};

export function KnowledgeGraph({nodes,edges,highlightedIds=[],onSelect,showLabels=false}:{nodes:VisualGraphNode[];edges:VisualGraphEdge[];highlightedIds?:string[];onSelect?:(node:VisualGraphNode)=>void;showLabels?:boolean}) {
  const uid=useId().replace(/:/g, "");
  const [selected,setSelected]=useState<string|null>(null);
  const [hovered,setHovered]=useState<string|null>(null);
  const [focused,setFocused]=useState<string|null>(null);
  const [offsets,setOffsets]=useState<Record<string,{x:number;y:number}>>({});
  const [drag,setDrag]=useState<string|null>(null);
  const [zoom,setZoom]=useState(1);
  const positions=useMemo(()=>{
    const n=nodes.length;
    const pos=nodes.map((node,i)=>({id:node.id,x:370+Math.cos(i*2.399963)*Math.sqrt((i+.5)/Math.max(n,1))*270,y:235+Math.sin(i*2.399963)*Math.sqrt((i+.5)/Math.max(n,1))*170}));
    const map=new Map(pos.map(p=>[p.id,p]));
    for(let iteration=0;iteration<180;iteration++) {
      const forces=pos.map(p=>({x:(370-p.x)*.045,y:(235-p.y)*.10}));
      for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){
        const dx=pos[i].x-pos[j].x,dy=pos[i].y-pos[j].y,d2=Math.max(dx*dx+dy*dy,40),f=70/d2;
        forces[i].x+=dx*f;forces[i].y+=dy*f;forces[j].x-=dx*f;forces[j].y-=dy*f;
      }
      for(const edge of edges){const a=map.get(edge.source),b=map.get(edge.target);if(!a||!b)continue;const dx=b.x-a.x,dy=b.y-a.y,d=Math.max(1,Math.hypot(dx,dy)),f=(d-70)*.035;const ai=pos.indexOf(a),bi=pos.indexOf(b);forces[ai].x+=dx/d*f;forces[ai].y+=dy/d*f;forces[bi].x-=dx/d*f;forces[bi].y-=dy/d*f;}
      pos.forEach((p,i)=>{p.x=clamp(p.x+clamp(forces[i].x,-8,8),57,683);p.y=clamp(p.y+clamp(forces[i].y,-8,8),38,427);});
    }
    return Object.fromEntries(pos.map(p=>[p.id,p]));
  },[nodes,edges]);
  const neighbors=new Set(selected?[selected,...edges.flatMap(e=>e.source===selected?[e.target]:e.target===selected?[e.source]:[])]:[]);
  const highlighted=new Set(highlightedIds);
  const at=(id:string)=>offsets[id]??positions[id];
  const choose=(node:VisualGraphNode)=>{setSelected(node.id);onSelect?.(node);};
  const inspected=nodes.find(node=>node.id===(hovered??focused??selected));
  return <div style={{position:"relative",minWidth:0}}>
    <style>{`.pz-graph-node-${uid}:focus-visible > circle{stroke:var(--plot-label);stroke-width:2}`}</style>
    <div style={{position:"absolute",right:12,top:10,display:"flex",gap:5,zIndex:1}}>
      <button type="button" aria-label="Zoom out knowledge graph" onClick={()=>setZoom(v=>Math.max(.7,v-.15))} style={{width:34,height:34,border:"1px solid var(--border)",background:"var(--surface)",borderRadius:5,color:ink}}>−</button>
      <button type="button" aria-label="Zoom in knowledge graph" onClick={()=>setZoom(v=>Math.min(1.8,v+.15))} style={{width:34,height:34,border:"1px solid var(--border)",background:"var(--surface)",borderRadius:5,color:ink}}>+</button>
    </div>
    <svg viewBox="0 0 740 470" role="group" aria-label="Interactive combustion knowledge graph. Select a node to inspect its evidence and highlight neighboring entities. Drag nodes to rearrange." style={{width:"100%",display:"block",touchAction:"none"}} onPointerMove={e=>{if(!drag)return;const rect=e.currentTarget.getBoundingClientRect();const x=(e.clientX-rect.left)/rect.width*740,y=(e.clientY-rect.top)/rect.height*470;setOffsets(v=>({...v,[drag]:{x:clamp((x-370)/zoom+370,30,710),y:clamp((y-235)/zoom+235,25,445)}}));}} onPointerUp={()=>setDrag(null)} onPointerCancel={()=>setDrag(null)}>
      <defs><pattern id={`${uid}-dots`} width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".7" fill="var(--plot-dot)"/></pattern><marker id={`${uid}-directed`} markerWidth="5" markerHeight="5" refX="18" refY="2.5" orient="auto"><path d="M0 0L5 2.5L0 5" fill="var(--plot-axis)"/></marker></defs>
      <rect width="740" height="470" fill={`url(#${uid}-dots)`}/>
      <g transform={`translate(370,235) scale(${zoom}) translate(-370,-235)`}>
        {edges.map(edge=>{const a=at(edge.source),b=at(edge.target);if(!a||!b)return null;const hot=highlighted.has(edge.source)&&highlighted.has(edge.target)||selected&&(edge.source===selected||edge.target===selected);return <line key={edge.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={hot?"#38bdf8":"var(--border)"} strokeWidth={hot?1.5:.7} opacity={hot ? .8 : selected ? .16 : .42} markerEnd={`url(#${uid}-directed)`}/>;})}
        {nodes.map(node=>{const p=at(node.id);if(!p)return null;const color=nodeColors[node.type.replace(/^:/,"")]??blue,hot=highlighted.has(node.id)||neighbors.has(node.id),isSelected=selected===node.id;return <g key={node.id} className={`pz-graph-node-${uid}`} transform={`translate(${p.x},${p.y})`} tabIndex={0} role="button" aria-label={`${node.label}, ${node.type}. Inspect evidence.`} onClick={()=>choose(node)} onPointerEnter={()=>setHovered(node.id)} onPointerLeave={()=>setHovered(null)} onFocus={()=>setFocused(node.id)} onBlur={()=>setFocused(null)} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();choose(node);}}} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);setDrag(node.id);}} style={{cursor:drag===node.id?"grabbing":"grab",outline:"none"}} opacity={!selected||hot?1:.3}>
          <title>{node.label}: {node.description}</title>
          {(hot||isSelected)&&<circle r={isSelected?17:12} fill={color} opacity=".12"/>}
          <circle r={node.type.replace(/^:/,"")==="Investigation"?7:5.5} fill={color} stroke={isSelected?"#fff":"var(--surface)"} strokeWidth={isSelected?1.5:2}/>
          <circle r="24" fill="transparent"/>
          {showLabels&&(isSelected||hovered===node.id||focused===node.id)&&<text x="11" y="4" fontSize="23" fontWeight="600" fill="var(--plot-label)" paintOrder="stroke" stroke="var(--surface)" strokeWidth="4" strokeLinejoin="round" style={{pointerEvents:"none"}}>{node.label.length>20?`${node.label.slice(0,18)}…`:node.label}</text>}
        </g>;})}
      </g>
      {inspected&&<g style={{pointerEvents:"none"}}><rect x="12" y="12" width="390" height="30" rx="5" fill="var(--surface)" stroke="var(--border)"/><text x="23" y="32" fill="var(--plot-label)" fontSize="22" fontFamily={mono}>{inspected.label.length>43?`${inspected.label.slice(0,41)}…`:inspected.label}</text></g>}
      <text x="17" y="449" fill="var(--plot-axis)" fontSize="13" fontFamily={mono}>Drag nodes · select to trace evidence</text>
    </svg>
    {showLabels&&<div className="graph-evidence-index" aria-label="Active query evidence nodes">{nodes.map(node=><button key={node.id} type="button" aria-pressed={selected===node.id} onClick={()=>choose(node)}><i style={{background:nodeColors[node.type.replace(/^:/,"")]??blue}}/><span>{node.label}</span></button>)}</div>}
    <div className="graph-node-picker"><label htmlFor={`${uid}-node`}>Inspect graph node</label><select id={`${uid}-node`} value={selected??""} onChange={event=>{const node=nodes.find(item=>item.id===event.target.value);if(node)choose(node);}}><option value="" disabled>Select any node to inspect its evidence</option>{Array.from(new Set(nodes.map(node=>node.type))).map(type=><optgroup label={type.replace(/([a-z])([A-Z])/g,"$1 $2")} key={type}>{nodes.filter(node=>node.type===type).map(node=><option key={node.id} value={node.id}>{node.label} · {node.id}</option>)}</optgroup>)}</select><p>{selected?nodes.find(node=>node.id===selected)?.label:"Select a node to inspect its evidence and connected entities."}</p></div>
  </div>;
}
