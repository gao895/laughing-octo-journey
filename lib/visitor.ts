'use client';

const VISITOR_KEY = 'mvg-visitor-id';
const ONBOARDED_KEY = 'mvg-onboarded';

/**
 * Anonymous visitor id kept in the browser. It is the seed of the future
 * "visitor / session" concept (multiplayer presence, avatars, chat).
 */
export function getVisitorId(): string {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return 'anonymous';
  }
}

export function hasSeenOnboarding(userId: string): boolean {
  try {
    return localStorage.getItem(`${ONBOARDED_KEY}:${userId}`) === '1';
  } catch {
    return true;
  }
}

export function markOnboardingSeen(userId: string): void {
  try {
    localStorage.setItem(`${ONBOARDED_KEY}:${userId}`, '1');
  } catch {
    // Ignore: onboarding will simply show again.
  }
}

/** Only allow in-app relative redirects (prevents open redirects via ?next=). */
export function safeNextPath(next: string | null | undefined, fallback = '/dashboard'): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.includes('\\'))
    return fallback;
  return next;
}
