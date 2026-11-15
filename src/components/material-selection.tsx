'use client';

import { useId } from 'react';
import { Layers3 } from 'lucide-react';
import { MATERIAL_PARAMS, type MaterialId } from '@/lib/pyrozero-engine';
import type { ScenarioContext } from '@/lib/simulation-session';

export function MaterialSelection({materialId,confirmed,onChange,scenario,advisor=false,disabled=false}:{materialId:MaterialId;confirmed:boolean;onChange:(id:MaterialId)=>void;scenario:ScenarioContext|null;advisor?:boolean;disabled?:boolean}) {
  const id=useId();
  return <section className="material-selection" aria-label="Material selection">
    <div className="material-selection-main"><div><label htmlFor={id}><Layers3 size={17}/>Material to evaluate</label><p id={`${id}-help`}>{advisor?'Choose here, or name a material in your question.':scenario?'Required for this bounded material screen.':'Required for material predictions.'}</p></div>
      <select id={id} className="material-select" value={confirmed?materialId:''} required={!advisor} disabled={disabled} aria-describedby={`${id}-help ${id}-status`} onChange={event=>onChange(event.target.value as MaterialId)}>
        <option value="" disabled>Choose a material…</option>
        {(Object.keys(MATERIAL_PARAMS) as MaterialId[]).map(key=><option key={key} value={key}>{MATERIAL_PARAMS[key].shortName}</option>)}
      </select>
    </div>
    <p id={`${id}-status`} className={`material-selection-status ${confirmed?'is-selected':''}`} role="status">{confirmed?`Thermally ${MATERIAL_PARAMS[materialId].isThermallyThin?'thin':'thick'} · ${scenario?'Evaluated under this scenario’s conditions.':'Kept across mission comparisons.'}`:advisor?'Evidence questions work without a material. A material screen appears only when you choose or name one.':'No material prediction has been calculated yet.'}</p>
    {scenario&&<div className="scenario-material-note"><p>{scenario.materialNote}</p>{!confirmed&&scenario.suggestedMaterial&&<button className="outline" onClick={()=>onChange(scenario.suggestedMaterial!)}>Use {MATERIAL_PARAMS[scenario.suggestedMaterial].shortName}</button>}</div>}
  </section>;
}
