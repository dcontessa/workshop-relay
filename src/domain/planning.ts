import { z } from 'zod';

const minor = z.number().int().nonnegative().max(100_000_000);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0,10) === v, 'Invalid calendar date');
export const briefSchema = z.object({
  topic: z.enum(['Practical AI at work', 'Team communication']),
  attendees: z.number().int().min(1).max(250), date,
  location: z.enum(['Kuala Lumpur', 'Petaling Jaya']), budgetMinor: minor.refine(n=>n>0),
  stepFree: z.boolean(), projector: z.boolean(),
});
export type Brief = z.infer<typeof briefSchema>;
export const offerSchema = z.object({
  id: z.string().min(1), kind: z.enum(['trainer','venue']), title: z.string(),
  provider: z.string(), description: z.string(), capacity: z.number().int().positive(),
  dates: z.array(date).min(1), location: z.enum(['Kuala Lumpur','Petaling Jaya']),
  topics: z.array(z.string()), facilities: z.array(z.string()), currency: z.literal('MYR'),
  priceMinor: minor, feesMinor: minor, priceBasis: z.literal('whole-workshop'),
  available: z.boolean(),
}).strict();
export type Offer = z.infer<typeof offerSchema>;
export const catalogueSchema = z.object({
  schemaVersion: z.literal(1), providerId: z.string().min(1), version: z.number().int().positive(),
  fictionalFixture: z.literal(true), publishedAt: z.string().datetime(),
  validUntil: z.string().datetime(), offers: z.array(offerSchema).min(1).max(100),
}).strict().superRefine((c,ctx)=>{
  if(new Set(c.offers.map(o=>o.id)).size!==c.offers.length)ctx.addIssue({code:'custom',message:'Duplicate offer IDs'});
});
export type Catalogue = z.infer<typeof catalogueSchema>;
export type Source = { url: string; fetchedAt: string; catalogue: Catalogue };
export type Plan = { id: string; trainer: Offer; venue: Offer; totalMinor: number; briefKey: string; sourceKey: string };
export type Rejection = { id:string; title:string; reasons:string[] };
export const defaultBrief: Brief = {topic:'Practical AI at work',attendees:30,date:'2026-12-17',location:'Kuala Lumpur',budgetMinor:600_000,stepFree:true,projector:true};
export const money = (n:number) => new Intl.NumberFormat('en-MY',{style:'currency',currency:'MYR',maximumFractionDigits:n%100?2:0}).format(n/100).replace('MYR','RM').replace(/\s+/g,' ');
export const briefKey = (b:Brief) => JSON.stringify(briefSchema.parse(b));
export const sourceKey = (s:Source[]) => JSON.stringify(s.map(x=>({url:x.url,version:x.catalogue.version,data:x.catalogue})).sort((a,b)=>a.url.localeCompare(b.url)));
export function validateCatalogue(input:unknown, now=Date.now()): Catalogue {
  const c=catalogueSchema.parse(input);
  if(Date.parse(c.validUntil)<now)throw new Error('Catalogue has expired. Refresh the provider data.');
  return c;
}
export function evaluate(brief:Brief,sources:Source[]) {
  const b=briefSchema.parse(brief); const rejects:Rejection[]=[];
  const offers=sources.flatMap(s=>validateCatalogue(s.catalogue).offers);
  if(new Set(offers.map(o=>o.id)).size!==offers.length)throw new Error('Offer IDs must be unique across providers.');
  const valid=offers.filter(o=>{
    const reasons:string[]=[];
    if(!o.available)reasons.push('Unavailable in the current catalogue');
    if(!o.dates.includes(b.date))reasons.push('Not available on this date');
    if(o.capacity<b.attendees)reasons.push(`Capacity ${o.capacity} is below ${b.attendees} attendees`);
    if(o.location!==b.location)reasons.push('Different location');
    if(o.kind==='trainer'&&!o.topics.includes(b.topic))reasons.push('Does not cover this topic');
    if(o.kind==='venue'&&b.stepFree&&!o.facilities.includes('step-free'))reasons.push('Step-free access is not available');
    if(o.kind==='venue'&&b.projector&&!o.facilities.includes('projector'))reasons.push('Projector is not included');
    if(reasons.length)rejects.push({id:o.id,title:o.title,reasons});
    return reasons.length===0;
  });
  const combinations:Plan[]=[];
  for(const trainer of valid.filter(o=>o.kind==='trainer'))for(const venue of valid.filter(o=>o.kind==='venue')){
    const totalMinor=trainer.priceMinor+trainer.feesMinor+venue.priceMinor+venue.feesMinor;
    combinations.push({id:`${trainer.id}:${venue.id}`,trainer,venue,totalMinor,briefKey:briefKey(b),sourceKey:sourceKey(sources)});
  }
  combinations.sort((a,b)=>a.totalMinor-b.totalMinor||a.id.localeCompare(b.id));
  return {plans:combinations.filter(p=>p.totalMinor<=b.budgetMinor),rejects,shortfall:combinations[0]?Math.max(0,combinations[0].totalMinor-b.budgetMinor):null};
}
export type Receipt = {id:string;approvedAt:string;status:'planned_not_booked';brief:Brief;plan:Plan;sources:Source[];supersedes?:string};
export function approve(plan:Plan,brief:Brief,sources:Source[],previous?:Receipt):Receipt{
  if(plan.briefKey!==briefKey(brief)||plan.sourceKey!==sourceKey(sources))throw new Error('This proposal is stale. Review the updated plan.');
  const current=evaluate(brief,sources).plans.find(p=>p.id===plan.id);
  if(!current||current.totalMinor!==plan.totalMinor)throw new Error('This plan is no longer valid.');
  return {id:crypto.randomUUID(),approvedAt:new Date().toISOString(),status:'planned_not_booked',brief:structuredClone(brief),plan:structuredClone(current),sources:structuredClone(sources),...(previous?{supersedes:previous.id}:{})};
}
export function validateAgentSelection(ids:unknown,plans:Plan[]):Plan{
  if(!Array.isArray(ids)||ids.length!==2||ids.some(x=>typeof x!=='string'))throw new Error('Invalid agent proposal');
  const plan=plans.find(p=>ids.includes(p.trainer.id)&&ids.includes(p.venue.id));
  if(!plan)throw new Error('Agent proposal references unverified or unsuitable offers');
  return plan;
}
