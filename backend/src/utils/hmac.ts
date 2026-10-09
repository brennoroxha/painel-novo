import * as crypto from 'crypto';

export function generateHMACSignature(
  timestamp: string,
  payload: string,
  apiKey: string
): string {
  const message = `${timestamp}|${payload}`;
  return crypto
    .createHmac('sha256', apiKey)
    .update(message)
    .digest('hex');
}

export function createFASE3Headers(payload: any, apiKey: string) {
  const timestamp = Date.now().toString();
  const payloadString = JSON.stringify(payload);
  const signature = generateHMACSignature(timestamp, payloadString, apiKey);

  return {
    'x-timestamp': timestamp,
    'x-signature': signature,
    'Content-Type': 'application/json'
  };
}
