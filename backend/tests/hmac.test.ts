import { generateHMACSignature, createFASE3Headers } from '../src/utils/hmac';

describe('HMAC Utils', () => {
  const apiKey = 'd24191ed291a92838f584dff4082c13f4f0d368614786f825bb7fcfcba8577e9';

  it('should generate valid HMAC-SHA256 signature', () => {
    const timestamp = '1696000000000';
    const payload = { ip: '192.168.1.1' };

    const signature = generateHMACSignature(timestamp, JSON.stringify(payload), apiKey);

    expect(signature).toMatch(/^[a-f0-9]{64}$/); // SHA256 hex
  });

  it('should produce same signature for same input', () => {
    const sig1 = generateHMACSignature('123', 'payload', apiKey);
    const sig2 = generateHMACSignature('123', 'payload', apiKey);

    expect(sig1).toBe(sig2);
  });

  it('should produce different signatures for different payloads', () => {
    const sig1 = generateHMACSignature('123', 'payload1', apiKey);
    const sig2 = generateHMACSignature('123', 'payload2', apiKey);

    expect(sig1).not.toBe(sig2);
  });

  it('should create FASE3 headers with timestamp and signature', () => {
    const payload = { ip: '192.168.1.1' };

    const headers = createFASE3Headers(payload, apiKey);

    expect(headers['x-timestamp']).toBeDefined();
    expect(headers['x-signature']).toBeDefined();
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['x-signature']).toMatch(/^[a-f0-9]{64}$/);
  });
});
