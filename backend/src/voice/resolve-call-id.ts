export function resolveCallIdFromCustomParameters(
  customParameters: Record<string, string> | undefined,
): string | undefined {
  if (!customParameters) {
    return undefined;
  }

  const candidates = [
    customParameters.callId,
    customParameters.call_id,
    customParameters.CustomField,
    customParameters.customfield,
    customParameters.custom_field,
  ];

  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
}
