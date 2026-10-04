import {describe,it,expect} from 'vitest'
import {assess,fixtures,interval,original,initial,createReview,parseState,snapshot} from './domain'
import {read,commit,KEY} from './storage'
describe('review rules',()=>{
 it('matches independent fixture arithmetic within 0.00001 percentage points',()=>{
  expect(interval(3000,5000,3400,5000).lower).toBeCloseTo(6.124944715481708,5)
  expect(interval(3000,5000,3400,5000).upper).toBeCloseTo(9.875055284518305,5)
  expect(interval(100,5000,110,5000).upper).toBeCloseTo(0.7620520004412401,5)
  expect(interval(100,5000,250,5000).lower).toBeCloseTo(2.2819869639066437,5)
 })
 it('only balanced fixture satisfies original proceed',()=>expect(fixtures.map(e=>assess(e).eligible)).toEqual([true,false,false,false,false]))
 it('suppresses small cells and records quality defects',()=>{
  expect(assess(fixtures[2]).guardrail.lower).toBeNull()
  expect(assess(fixtures[3]).issues).toContain('Assignment is imbalanced')
  expect(assess(fixtures[4]).issues).toContain('Exposure records are incomplete')
 })
 it('a post-result relaxed rule cannot create original eligibility',()=>{
  const r={...original,id:'EV-R2',kind:'post-result' as const,guardrail:20,reason:'Explore a relaxed threshold after seeing harm'}
  expect(assess(fixtures[1],r).eligible).toBe(true)
  expect(()=>createReview(initial(),fixtures[1],r,'proceed','Long justified reviewer rationale',['guardrail'])).toThrow()
 })
 it('preserves exact snapshots and rejects tampered evidence',()=>{
  const s=initial();s.reviews.push(createReview(s,fixtures[0],original,'proceed','The primary and guardrail satisfy original rules',['primary','guardrail']))
  expect(parseState(JSON.stringify(s))).toEqual(s)
  s.reviews[0].snapshot.evidence.b.complete=4999
  expect(parseState(JSON.stringify(s))).toBeNull()
 })
 it('snapshot is independent from later edits',()=>{
  const r={...original};const snap=snapshot(fixtures[0],r);r.primary=19;expect(snap.activeRule.primary).toBe(2)
 })
})
describe('storage binding',()=>{
 it('never writes after an unavailable read even when writes work',()=>{
  let writes=0;const storage={getItem(){throw Error('unavailable')},setItem(){writes++}}
  expect(commit(read(storage),initial(),storage).kind).toBe('conflict');expect(writes).toBe(0)
 })
 it('rejects changed bytes and preserves invalid records',()=>{
  let raw='broken';let writes=0;const storage={getItem:()=>raw,setItem(){writes++}}
  const bound=read(storage);expect(bound.state).toBeNull();raw='changed';expect(commit(bound,initial(),storage).kind).toBe('conflict');expect(writes).toBe(0)
 })
 it('returns in-memory outcome on failed write',()=>{
  const storage={getItem:()=>null,setItem(){throw Error('quota')}}
  expect(commit(read(storage),initial(),storage).kind).toBe('memory');expect(KEY).toBe('experiment-verdict:v1')
 })
})
