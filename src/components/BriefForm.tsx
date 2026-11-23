import type { Brief } from '../domain/planning';
export function BriefForm({brief,onChange}:{brief:Brief;onChange:(b:Brief)=>void}){
 const set=<K extends keyof Brief>(key:K,value:Brief[K])=>onChange({...brief,[key]:value});
 return <section className="brief-band" aria-label="Workshop brief">
  <label>Topic<select value={brief.topic} onChange={e=>set('topic',e.target.value as Brief['topic'])}><option>Practical AI at work</option><option>Team communication</option></select></label>
  <label>Attendees<input aria-label="Attendees" type="number" min="1" max="250" value={brief.attendees} onChange={e=>set('attendees',Number(e.target.value))}/></label>
  <label>Date<input aria-label="Workshop date" type="date" value={brief.date} onChange={e=>set('date',e.target.value)}/></label>
  <label>Location<select value={brief.location} onChange={e=>set('location',e.target.value as Brief['location'])}><option>Kuala Lumpur</option><option>Petaling Jaya</option></select></label>
  <label>Budget (RM)<input aria-label="Budget in ringgit" type="number" min="1" max="1000000" step="1" value={brief.budgetMinor/100} onChange={e=>set('budgetMinor',Math.round(Number(e.target.value)*100))}/></label>
  <fieldset><legend>Requirements</legend><label className="check"><input type="checkbox" checked={brief.stepFree} onChange={e=>set('stepFree',e.target.checked)}/>Step-free access</label><label className="check"><input type="checkbox" checked={brief.projector} onChange={e=>set('projector',e.target.checked)}/>Projector</label></fieldset>
 </section>;
}
