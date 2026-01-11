import { describe, it, expect } from 'vitest';
import { webhookUtils } from './webhooks.js';

describe('webhookUtils', () => {
  const secret = 'whsec_test123';
  const payload = JSON.stringify({ event: 'ticket.created', data: { id: 'tkt_123' } });

  describe('generateSignature', () => {
    it('should generate a signature in the correct format', () => {
      const signature = webhookUtils.generateSignature(payload, secret);
      expect(signature).toMatch(/^sha256=[a-f0-9]{64}$/);
    });

    it('should generate consistent signatures for the same input', () => {
      const sig1 = webhookUtils.generateSignature(payload, secret);
      const sig2 = webhookUtils.generateSignature(payload, secret);
      expect(sig1).toBe(sig2);
    });

    it('should generate different signatures for different payloads', () => {
      const sig1 = webhookUtils.generateSignature('payload1', secret);
      const sig2 = webhookUtils.generateSignature('payload2', secret);
      expect(sig1).not.toBe(sig2);
    });

    it('should generate different signatures for different secrets', () => {
      const sig1 = webhookUtils.generateSignature(payload, 'secret1');
      const sig2 = webhookUtils.generateSignature(payload, 'secret2');
      expect(sig1).not.toBe(sig2);
    });
  });

  describe('verifySignature', () => {
    it('should return true for valid signatures', () => {
      const signature = webhookUtils.generateSignature(payload, secret);
      const isValid = webhookUtils.verifySignature(payload, signature, secret);
      expect(isValid).toBe(true);
    });

    it('should return false for invalid signatures', () => {
      const signature = 'sha256=invalid_signature_here';
      const isValid = webhookUtils.verifySignature(payload, signature, secret);
      expect(isValid).toBe(false);
    });

    it('should return false for wrong secret', () => {
      const signature = webhookUtils.generateSignature(payload, secret);
      const isValid = webhookUtils.verifySignature(payload, signature, 'wrong_secret');
      expect(isValid).toBe(false);
    });

    it('should return false for tampered payload', () => {
      const signature = webhookUtils.generateSignature(payload, secret);
      const tamperedPayload = JSON.stringify({ event: 'ticket.deleted', data: { id: 'tkt_123' } });
      const isValid = webhookUtils.verifySignature(tamperedPayload, signature, secret);
      expect(isValid).toBe(false);
    });

    it('should return false for empty signature', () => {
      const isValid = webhookUtils.verifySignature(payload, '', secret);
      expect(isValid).toBe(false);
    });

    it('should return false for empty secret', () => {
      const signature = webhookUtils.generateSignature(payload, secret);
      const isValid = webhookUtils.verifySignature(payload, signature, '');
      expect(isValid).toBe(false);
    });

    it('should return false for malformed signature format', () => {
      expect(webhookUtils.verifySignature(payload, 'invalid', secret)).toBe(false);
      expect(webhookUtils.verifySignature(payload, 'md5=abc123', secret)).toBe(false);
      expect(webhookUtils.verifySignature(payload, 'sha256=', secret)).toBe(false);
    });

    it('should return false for non-hex signature', () => {
      const isValid = webhookUtils.verifySignature(payload, 'sha256=notahexstring!', secret);
      expect(isValid).toBe(false);
    });
  });
});
