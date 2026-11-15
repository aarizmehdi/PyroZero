import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveDeepSeekKey, sharedAccessStatus } from '../src/lib/shared-access';
import policy from '../src/data/shared-access.json';
import { handleCopilotRequest } from '../src/lib/copilot-service';
import { GET } from '../src/app/api/copilot/route';

afterEach(()=>{vi.useRealTimers();vi.unstubAllEnvs()});
const deadline=Date.parse(policy.expiresAt);
describe('shared access expires on the server',()=>{
 it('has one fixed seven-day window',()=>{expect(Number.isFinite(deadline)).toBe(true);expect(deadline-Date.parse(policy.startedAt)).toBe(7*24*60*60*1000)});
 it('advertises access only with a configured key before the deadline',()=>{
  expect(sharedAccessStatus('private',deadline-1)).toMatchObject({sharedAvailable:true,remainingMs:1});
  expect(sharedAccessStatus('',deadline-1).sharedAvailable).toBe(false);
  expect(sharedAccessStatus('  ',deadline-1).sharedAvailable).toBe(false);
 });
 it('expires exactly at the deadline',()=>{
  expect(sharedAccessStatus('private',deadline)).toMatchObject({sharedAvailable:false,remainingMs:0});
  expect(sharedAccessStatus('private',deadline+1).sharedAvailable).toBe(false);
 });
 it('keeps visitor keys working before and after expiry',()=>{
  for(const now of [deadline-1,deadline,deadline+1])expect(resolveDeepSeekKey('shared','visitor',now)).toBe('visitor');
 });
 it('cannot use the shared key after expiry',()=>expect(resolveDeepSeekKey('shared',undefined,deadline)).toBeUndefined());
 it('does not reveal the server secret in the status endpoint',async()=>{
  vi.useFakeTimers();vi.setSystemTime(deadline-1000);vi.stubEnv('DEEPSEEK_API_KEY','private-server-placeholder');
  const response=await GET();const text=await response.text();
  expect(JSON.parse(text).sharedAvailable).toBe(true);expect(text).not.toContain('private-server-placeholder');
  expect(response.headers.get('Cache-Control')).toBe('no-store');
 });
 it('serves reference answers without contacting the provider after expiry',async()=>{
  vi.useFakeTimers();vi.setSystemTime(deadline);const fetcher=vi.fn();
  const response=await handleCopilotRequest(new Request('http://localhost/api/copilot',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:'Explain lunar gravity'})}),{env:{DEEPSEEK_API_KEY:'private-server-placeholder'},fetcher});
  const text=await response.text();expect(fetcher).not.toHaveBeenCalled();expect(text).toContain('"mode":"deterministic"');expect(text).not.toContain('private-server-placeholder');
 });
});
