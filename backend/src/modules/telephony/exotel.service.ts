import { env } from '../../config/env';

interface ExotelConnectResponse {
  Call?: {
    Sid?: string;
    Status?: string;
  };
}

export function isExotelConfigured(): boolean {
  return Boolean(
    env.EXOTEL_ACCOUNT_SID &&
      env.EXOTEL_API_KEY &&
      env.EXOTEL_API_TOKEN &&
      env.EXOTEL_CALLER_ID,
  );
}

export function resolveExotelFlowUrl(override?: string | null): string | undefined {
  const value = override ?? env.EXOTEL_FLOW_URL;
  return value?.trim() || undefined;
}

export function resolveExotelCallerId(override?: string | null): string | undefined {
  const value = override ?? env.EXOTEL_CALLER_ID;
  return value?.trim() || undefined;
}

export async function initiateExotelCall(params: {
  toPhone: string;
  callerId: string;
  flowUrl: string;
  customField: string;
  statusCallback?: string;
}): Promise<string> {
  const url = `https://${env.EXOTEL_API_KEY}:${env.EXOTEL_API_TOKEN}@api.exotel.com/v1/Accounts/${env.EXOTEL_ACCOUNT_SID}/Calls/connect.json`;

  const body = new URLSearchParams({
    From: params.toPhone,
    CallerId: params.callerId,
    Url: params.flowUrl,
    CallType: 'trans',
    CustomField: params.customField,
  });

  if (params.statusCallback) {
    body.set('StatusCallback', params.statusCallback);
    body.set('StatusCallbackEvents[0]', 'terminal');
    body.set('StatusCallbackEvents[1]', 'answered');
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Exotel API error (${response.status}): ${errorText}`);
  }

  const payload = (await response.json()) as ExotelConnectResponse;
  const callSid = payload.Call?.Sid;

  if (!callSid) {
    throw new Error('Exotel API response missing Call.Sid');
  }

  return callSid;
}
