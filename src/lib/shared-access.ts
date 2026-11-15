import policy from '../data/shared-access.json';

export function sharedAccessStatus(serverKey: string | undefined, now = Date.now()) {
  const expiresAt = policy.expiresAt;
  const remainingMs = Math.max(0, Date.parse(expiresAt) - now);
  return { sharedAvailable: Boolean(serverKey?.trim()) && remainingMs > 0, expiresAt, remainingMs };
}

export function resolveDeepSeekKey(serverKey: string | undefined, visitorKey?: string, now = Date.now()) {
  return visitorKey || (sharedAccessStatus(serverKey, now).sharedAvailable ? serverKey : undefined);
}
