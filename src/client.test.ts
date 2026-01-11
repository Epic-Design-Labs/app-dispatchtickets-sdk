import { describe, it, expect, vi } from 'vitest';
import { DispatchTickets } from './client.js';

describe('DispatchTickets', () => {
  describe('constructor', () => {
    it('should throw if apiKey is missing', () => {
      // @ts-expect-error Testing missing required field
      expect(() => new DispatchTickets({})).toThrow('API key is required');
    });

    it('should throw if apiKey is empty string', () => {
      expect(() => new DispatchTickets({ apiKey: '' })).toThrow('API key is required');
    });

    it('should create client with valid apiKey', () => {
      const client = new DispatchTickets({ apiKey: 'sk_test_123' });
      expect(client).toBeInstanceOf(DispatchTickets);
    });

    it('should initialize all resources', () => {
      const client = new DispatchTickets({ apiKey: 'sk_test_123' });

      expect(client.accounts).toBeDefined();
      expect(client.brands).toBeDefined();
      expect(client.tickets).toBeDefined();
      expect(client.comments).toBeDefined();
      expect(client.attachments).toBeDefined();
      expect(client.webhooks).toBeDefined();
      expect(client.categories).toBeDefined();
      expect(client.tags).toBeDefined();
      expect(client.customers).toBeDefined();
      expect(client.fields).toBeDefined();
    });

    it('should use default config values', () => {
      const client = new DispatchTickets({ apiKey: 'sk_test_123' });
      // We can't directly test internal config, but we can verify it doesn't throw
      expect(client).toBeDefined();
    });

    it('should accept custom config values', () => {
      const client = new DispatchTickets({
        apiKey: 'sk_test_123',
        baseUrl: 'https://custom-api.example.com/v1',
        timeout: 60000,
        maxRetries: 5,
        debug: true,
      });
      expect(client).toBeDefined();
    });

    it('should accept custom fetch function', () => {
      const customFetch = vi.fn();
      const client = new DispatchTickets({
        apiKey: 'sk_test_123',
        fetch: customFetch,
      });
      expect(client).toBeDefined();
    });
  });

  describe('static webhooks', () => {
    it('should expose webhook utilities', () => {
      expect(DispatchTickets.webhooks).toBeDefined();
      expect(DispatchTickets.webhooks.verifySignature).toBeInstanceOf(Function);
      expect(DispatchTickets.webhooks.generateSignature).toBeInstanceOf(Function);
    });

    it('should verify signatures correctly', () => {
      const payload = '{"event":"test"}';
      const secret = 'whsec_test';
      const signature = DispatchTickets.webhooks.generateSignature(payload, secret);

      expect(DispatchTickets.webhooks.verifySignature(payload, signature, secret)).toBe(true);
      expect(DispatchTickets.webhooks.verifySignature(payload, 'sha256=wrong', secret)).toBe(false);
    });
  });

  describe('integration test', () => {
    it('should make a request with custom fetch', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve([{ id: 'br_123', name: 'Test Brand' }]),
      });

      const client = new DispatchTickets({
        apiKey: 'sk_test_123',
        fetch: mockFetch,
      });

      const brands = await client.brands.list();

      expect(brands).toEqual([{ id: 'br_123', name: 'Test Brand' }]);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/brands'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer sk_test_123',
          }),
        })
      );
    });
  });
});
