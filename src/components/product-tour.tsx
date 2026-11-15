'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';

export const TOUR_STORAGE_KEY = 'pyrozero-tour-v1';
export type TourTab = 'explorer' | 'simulation' | 'forensics' | 'copilot';
const steps: Array<{title:string;body:string;tab:TourTab;target:string;section?:'spinoffs'}> = [
  {title:'Choose your mission',body:'Start with ISS, Moon, Mars or an EVA suit. The same mission conditions carry into the evidence ranking and flammability lab.',tab:'explorer',target:'.mission-ribbon'},
  {title:'Find the relevant research',body:'The first three investigations are ranked for your mission. Search the whole catalogue or show more. Ranking priorities explain what affects the fit score; it is not a safety rating.',tab:'explorer',target:'.mission-evidence-panel'},
  {title:'See why gravity matters',body:'Compare the flame, burn specimen and oxygen boundary. Choose a material above the results. On a phone, open Atmosphere only when you want to customize the preset.',tab:'simulation',target:'.simulation-views'},
  {title:'Learn from reported incidents',body:'Explore Apollo and Mir records, inspect the event anchors, and load a bounded scenario into the lab. Source links preserve the original context.',tab:'forensics',target:'.forensics-grid'},
  {title:'Explore the technology',body:'Change droplet size, compare dust, smoke and mist, or adjust cylinder capacity. Each control updates its model and calculated reading.',tab:'forensics',section:'spinoffs',target:'.spinoff-workbench'},
  {title:'Ask a question and trace the answer',body:'Choose a starter question or write your own. Answers include sources and an evidence map. AI settings can add a generated explanation using your API key.',tab:'copilot',target:'.advisor-composer'},
];

export function ProductTour({onClose,onNavigate,scenarioActive=false}:{onClose:()=>void;onNavigate:(tab:TourTab,section?:'spinoffs')=>void;scenarioActive?:boolean}) {
  const [step,setStep]=useState(-1);
  const panel=useRef<HTMLDivElement>(null);
  const welcome=step<0;
  useEffect(()=>{const previous=document.activeElement as HTMLElement|null;return()=>{if(previous?.isConnected)previous.focus({preventScroll:true})}},[]);
  useEffect(()=>{
    const close=(event:KeyboardEvent)=>{
      if(event.key==='Escape'){event.preventDefault();onClose()}
      if(event.key==='Tab'&&welcome){const controls=Array.from(panel.current?.querySelectorAll<HTMLButtonElement>('button')??[]);const first=controls[0],last=controls.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}}
    };
    document.addEventListener('keydown',close);
    const previousOverflow=document.body.style.overflow;
    if(welcome)document.body.style.overflow='hidden';
    return()=>{document.removeEventListener('keydown',close);document.body.style.overflow=previousOverflow};
  },[welcome,onClose]);
  useEffect(()=>{
    if(step>=0)onNavigate(steps[step].tab,steps[step].section);
    let target:HTMLElement|null=null;
    const timer=window.setTimeout(()=>{
      panel.current?.querySelector<HTMLElement>('h2')?.focus({preventScroll:true});
      if(step<0)return;
      target=document.querySelector<HTMLElement>(scenarioActive&&step===0?'.scenario-banner':steps[step].target);
      target?.classList.add('tour-target');
      if(target)window.scrollTo({top:Math.max(0,target.getBoundingClientRect().top+window.scrollY-24),behavior:window.matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});
    },100);
    return()=>{clearTimeout(timer);target?.classList.remove('tour-target')};
  },[step,onNavigate,scenarioActive]);
  return <div className={welcome?'product-tour-welcome':'product-tour-active'}>
    <div ref={panel} className="product-tour-panel" role="dialog" aria-modal={welcome?true:undefined} aria-labelledby="product-tour-title" aria-describedby="product-tour-copy" data-tour-step={step}>
      <button className="icon-button tour-close" onClick={onClose} aria-label="Close tour"><X size={18}/></button>
      {welcome?<>
        <h2 id="product-tour-title" tabIndex={-1}>Explore spacecraft fire research</h2>
        <p id="product-tour-copy">Compare NASA evidence, explore mission conditions and trace a safety question to its sources.</p>
        <p className="tour-duration">A one-minute tour of the four workspaces. You can skip at any time.</p>
        <div className="tour-actions"><button className="quiet" onClick={onClose}>Skip tour</button><button className="primary" onClick={()=>setStep(0)}>Start tour<ArrowRight size={15}/></button></div>
        <p className="tour-replay-note">Replay any time from Tools → Tour.</p>
      </>:<>
        <div className="tour-progress" aria-label={`Step ${step+1} of ${steps.length}`}><span>Step {step+1} of {steps.length}</span><div>{steps.map((item,index)=><button key={item.title} aria-label={`Tour step ${index+1}: ${item.title}`} aria-current={step===index?'step':undefined} onClick={()=>setStep(index)}/>)}</div></div>
        <h2 id="product-tour-title" tabIndex={-1}>{scenarioActive&&step===0?'Review the active scenario':steps[step].title}</h2>
        <p id="product-tour-copy">{scenarioActive&&step===0?'You are reviewing a bounded historical scenario. Exit scenario restores your previous mission and material and makes the four mission presets available again.':steps[step].body}</p>
        <div className="tour-actions"><button className="quiet" onClick={onClose}>Skip</button><div><button className="outline" aria-label="Previous tour step" onClick={()=>setStep(step-1)}><ArrowLeft size={15}/></button><button className="primary" onClick={()=>step===steps.length-1?onClose():setStep(step+1)}>{step===steps.length-1?'Finish tour':'Next'}<ArrowRight size={15}/></button></div></div>
      </>}
    </div>
  </div>;
}
