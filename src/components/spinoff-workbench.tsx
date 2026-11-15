'use client';

import { useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { knowledgeBase as kb } from '@/lib/knowledge-base';
import type { Medium, SceneInputs, SceneKind } from './spinoff-three-runtime';

function StudioScene({kind,value,medium='dust'}:{kind:SceneKind;value:number;medium?:Medium}){
 const canvas=useRef<HTMLCanvasElement>(null),inputs=useRef<SceneInputs>({value,medium,paused:false,yaw:0});
 const [paused,setPaused]=useState(false),[state,setState]=useState<'loading'|'ready'|'fallback'>('loading');
 const drag=useRef<{x:number;yaw:number}|null>(null);
 useEffect(()=>{inputs.current.value=value;inputs.current.medium=medium;inputs.current.paused=paused},[value,medium,paused]);
 useEffect(()=>{let cancelled=false,dispose:(()=>void)|undefined;import('./spinoff-three-runtime').then(({mountSpinoffScene})=>{if(cancelled||!canvas.current)return;let failed=false;dispose=mountSpinoffScene(canvas.current,kind,()=>inputs.current,()=>{failed=true;setState('fallback')});if(!failed)setState('ready')}).catch(()=>{if(!cancelled)setState('fallback')});return()=>{cancelled=true;dispose?.()}},[kind]);
 const label=kind==='mist'?'Water-mist nozzle and spray':kind==='detector'?`${medium} particles in a multi-angle optical detector`:`Steel and composite cylinders at ${value.toFixed(1)} liters capacity`;
 return <figure className="spinoff-studio" data-scene-kind={kind} data-render-state={state}>
  <div className="studio-viewport"><canvas ref={canvas} role="img" aria-label={`Interactive 3D illustration: ${label}`} onPointerDown={e=>{drag.current={x:e.clientX,yaw:inputs.current.yaw};e.currentTarget.setPointerCapture(e.pointerId)}} onPointerMove={e=>{if(drag.current)inputs.current.yaw=Math.max(-.8,Math.min(.8,drag.current.yaw+(e.clientX-drag.current.x)*.006))}} onPointerUp={()=>{drag.current=null}} onPointerCancel={()=>{drag.current=null}}/>
   {state==='loading'&&<div className="studio-loading" role="status">Loading 3D view…</div>}
   {state==='fallback'&&<div className="studio-fallback"><strong>3D view unavailable</strong><p>Your browser cannot display this scene. The controls, readings and specifications below remain available.</p></div>}
   <span className="studio-label">{kind==='mist'?`${value.toFixed(0)} µm droplets`:kind==='detector'?`${medium.charAt(0).toUpperCase()+medium.slice(1)} · 650 nm`:`${value.toFixed(1)} L water capacity`}</span>
   {kind==='cylinders'&&<div className="studio-legend"><span>Steel · 2216 psi</span><span>Composite · 4500 psi</span></div>}
  </div>
  <figcaption aria-label="3D view controls"><div><button className="icon-button" title="Reset view" aria-label={`Reset ${kind} view`} onClick={()=>{inputs.current.yaw=0}}><RotateCcw size={14}/></button><button className="icon-button" title={paused?'Resume animation':'Pause animation'} aria-label={`${paused?'Resume':'Pause'} ${kind} animation`} aria-pressed={paused} onClick={()=>setPaused(!paused)}>{paused?<Play size={14}/>:<Pause size={14}/>}</button></div></figcaption>
 </figure>;
}

export function SpinoffWorkbench({labelFor,formatValue}:{labelFor:(key:string)=>string;formatValue:(value:unknown)=>string}){
 const [diameter,setDiameter]=useState(46),[medium,setMedium]=useState<Medium>('dust'),[capacity,setCapacity]=useState(6.8);
 const titles=['Fine water mist','Particle discrimination','Breathing-air cylinders'];
 return <div className="spinoff-workbench"><div className="workbench-intro"><h2>Explore the technology</h2><p>Adjust each control to see its mechanism and compare the reported engineering specifications.</p></div><div className="spinoff-grid spinoff-cards">{kb.earth_spinoffs.map((record,index)=><article className="panel spinoff-card" key={record.id}>
  <header className="spinoff-card-heading"><h3>{titles[index]}</h3><p>{record.summary}</p></header>
  <StudioScene kind={index===0?'mist':index===1?'detector':'cylinders'} value={index===0?diameter:capacity} medium={medium}/>
  <div className="spinoff-control-area">{index===0?<label className="workbench-range"><span>Droplet diameter<output>{diameter} <small>µm</small></output></span><input aria-label="Characteristic droplet diameter" type="range" min={15} max={80} value={diameter} onChange={e=>setDiameter(+e.target.value)}/><span className="workbench-range-limits">15 µm<span>80 µm</span></span></label>:index===1?<fieldset className="medium-selector"><legend>Particle population</legend><div className="segmented">{(['dust','smoke','mist'] as const).map(value=><button key={value} aria-pressed={medium===value} className={medium===value?'active':''} onClick={()=>setMedium(value)}>{value.charAt(0).toUpperCase()+value.slice(1)}</button>)}</div></fieldset>:<label className="workbench-range"><span>Cylinder water capacity<output>{capacity.toFixed(1)} <small>L</small></output></span><input aria-label="Cylinder water capacity" type="range" min={3} max={12} step={.1} value={capacity} onChange={e=>setCapacity(+e.target.value)}/><span className="workbench-range-limits">3 L<span>12 L</span></span></label>}</div>
  <section className="workbench-reading" aria-label={`${titles[index]} calculated reading`} aria-live="polite">{index===0?<><span>Surface area per unit volume</span><output>{(6/(diameter*1e-6)).toLocaleString('en-US',{maximumFractionDigits:0})} <small>m⁻¹</small></output><span className="reading-formula">6 / droplet diameter</span></>:index===1?<><span>Depolarization ratio</span><output>{medium==='dust'?'0.20':medium==='smoke'?'0.00':'Angle-dependent'}</output><span className="reading-formula">{medium==='dust'?'Dust scattering':medium==='smoke'?'Spherical smoke scattering':'Mist scattering varies with angle'}</span></>:<><span>Ideal free-air volume</span><div className="air-volume-comparison"><div><span>Composite · 4500 psi</span><output>{(capacity*4500/14.7).toLocaleString('en-US',{maximumFractionDigits:0})}<small> L</small></output></div><div><span>Steel · 2216 psi</span><output>{(capacity*2216/14.7).toLocaleString('en-US',{maximumFractionDigits:0})}<small> L</small></output></div></div></>}</section>
  <p className="workbench-explanation">{index===0?'Spray shown at an enlarged scale.':index===1?'Compare particle appearance and scattering at 90° and 145°. This view is not a calibrated detector.':'Ideal free-air volume assumes equal temperature. Reserve and breathing demand affect actual service duration.'}</p>
  <section className="workbench-specifications"><h4>Reported specifications</h4><dl>{Object.entries(record.parameters).filter(([key])=>!['d10_um','d20_um','d30_um','d32_um','legacy_steel_pressure_psi','composite_pressure_psi'].includes(key)).map(([key,value])=><div key={key} className={formatValue(value).length>32?'wide-specification':undefined}><dt>{labelFor(key)}</dt><dd>{formatValue(value)}</dd></div>)}</dl><details className="technology-context"><summary>Technology &amp; context</summary><h5>{record.title}</h5><p>{record.summary}</p></details></section>
 </article>)}</div></div>;
}
