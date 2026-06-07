export interface RetryPolicy {
  maxAttempts: number;
  retryDelayMinutes: number;
}

const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 3,
  retryDelayMinutes: 30,
};

export function parseRetryPolicy(raw: unknown): RetryPolicy {
  if (!raw || typeof raw !== 'object') {
    return DEFAULT_RETRY_POLICY;
  }

  const policy = raw as Record<string, unknown>;
  return {
    maxAttempts:
      typeof policy.maxAttempts === 'number' ? policy.maxAttempts : DEFAULT_RETRY_POLICY.maxAttempts,
    retryDelayMinutes:
      typeof policy.retryDelayMinutes === 'number'
        ? policy.retryDelayMinutes
        : DEFAULT_RETRY_POLICY.retryDelayMinutes,
  };
}

export function shouldRetryContact(attemptCount: number, policy: RetryPolicy): boolean {
  return attemptCount < policy.maxAttempts;
}
