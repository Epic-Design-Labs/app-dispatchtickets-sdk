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
      expect(client.statuses).toBeDefined();
      expect(client.tags).toBeDefined();
      expect(client.customers).toBeDefined();
      expect(client.fields).toBeDefined();
      expect(client.chat).toBeDefined();
      expect(client.enrichment).toBeDefined();
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

  describe('statuses resource', () => {
    it('should list statuses for a brand', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: () =>
          Promise.resolve([
            { id: 'sts_1', key: 'open', name: 'Open', isSystem: true },
          ]),
      });
      const client = new DispatchTickets({ apiKey: 'sk_test_123', fetch: mockFetch });

      const statuses = await client.statuses.list('ws_abc');

      expect(statuses).toEqual([
        { id: 'sts_1', key: 'open', name: 'Open', isSystem: true },
      ]);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/brands/ws_abc/statuses'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should get ticket counts per status', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: () =>
          Promise.resolve([
            { id: 'sts_1', key: 'open', name: 'Open', ticketCount: 12 },
          ]),
      });
      const client = new DispatchTickets({ apiKey: 'sk_test_123', fetch: mockFetch });

      const stats = await client.statuses.getStats('ws_abc');

      expect(stats).toEqual([
        { id: 'sts_1', key: 'open', name: 'Open', ticketCount: 12 },
      ]);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/brands/ws_abc/statuses/stats'),
        expect.objectContaining({ method: 'GET' })
      );
    });
  });
  describe('chat, enrichment and presence', () => {
    function respond(body: unknown, contentType = 'application/json') {
      return vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: (h: string) => (h.toLowerCase() === 'content-type' ? contentType : null) },
        json: () => Promise.resolve(body),
      });
    }
    const call = (mockFetch: ReturnType<typeof vi.fn>) => {
      const [url, init] = mockFetch.mock.calls[0];
      return { url: String(url), method: init.method, body: init.body ? JSON.parse(init.body) : undefined };
    };

    it('gets the visitor behind a chat ticket', async () => {
      const mockFetch = respond({ present: true, verified: null, blocked: false });
      const client = new DispatchTickets({ apiKey: 'sk_test_123', fetch: mockFetch });

      const visitor = await client.chat.getVisitor('ws_abc', 'tkt_1');

      expect(visitor.present).toBe(true);
      expect(call(mockFetch)).toMatchObject({ method: 'GET' });
      expect(call(mockFetch).url).toMatch(/\/brands\/ws_abc\/tickets\/tkt_1\/chat$/);
    });

    it('mints an identity token', async () => {
      const mockFetch = respond({ token: 'tok', expiresAt: '2026-10-21T00:00:00Z' });
      const client = new DispatchTickets({ apiKey: 'sk_test_123', fetch: mockFetch });

      const res = await client.chat.createIdentityToken('ws_abc', { userId: 'u1', email: 'a@b.co' });

      expect(res.token).toBe('tok');
      expect(call(mockFetch)).toMatchObject({ method: 'POST', body: { userId: 'u1', email: 'a@b.co' } });
      expect(call(mockFetch).url).toMatch(/\/brands\/ws_abc\/chat\/identity-token$/);
    });

    it('returns null when no enrichment endpoint is set up (empty body)', async () => {
      const mockFetch = respond(undefined, '');
      const client = new DispatchTickets({ apiKey: 'sk_test_123', fetch: mockFetch });

      expect(await client.enrichment.get('ws_abc')).toBeNull();
    });

    it('upserts, tests and refreshes enrichment', async () => {
      const mockFetch = respond({ ok: true, durationMs: 5, warnings: [] });
      const client = new DispatchTickets({ apiKey: 'sk_test_123', fetch: mockFetch });

      await client.enrichment.upsert('ws_abc', { url: 'https://x.co/ctx', events: ['ticket.created'] });
      await client.enrichment.test('ws_abc');
      await client.enrichment.refresh('ws_abc', 'tkt_1');

      const calls = mockFetch.mock.calls.map(([url, init]) => [init.method, String(url).replace(/^.*\/v1/, '')]);
      expect(calls).toEqual([
        ['PUT', '/brands/ws_abc/enrichment'],
        ['POST', '/brands/ws_abc/enrichment/test'],
        ['POST', '/brands/ws_abc/tickets/tkt_1/enrichment/refresh'],
      ]);
      expect(JSON.parse(mockFetch.mock.calls[1][1].body)).toEqual({});
    });

    it('unwraps brand presence and sets it', async () => {
      const mockFetch = respond({ data: [{ memberId: 'usr_1', status: 'available' }] });
      const client = new DispatchTickets({ apiKey: 'sk_test_123', fetch: mockFetch });

      const entries = await client.brands.getPresence('ws_abc');
      expect(entries).toEqual([{ memberId: 'usr_1', status: 'available' }]);

      await client.brands.setPresence('ws_abc', { memberId: 'usr_1', status: 'away', ttlSeconds: 600 });
      const [url, init] = mockFetch.mock.calls[1];
      expect(init.method).toBe('PUT');
      expect(String(url)).toMatch(/\/brands\/ws_abc\/presence$/);
      expect(JSON.parse(init.body)).toEqual({ memberId: 'usr_1', status: 'away', ttlSeconds: 600 });
    });

    it('lists account-wide presence', async () => {
      const mockFetch = respond({ data: [{ memberId: 'usr_1', status: 'busy', brands: [] }] });
      const client = new DispatchTickets({ apiKey: 'sk_test_123', fetch: mockFetch });

      expect(await client.brands.listPresence()).toHaveLength(1);
      expect(String(mockFetch.mock.calls[0][0])).toMatch(/\/v1\/presence$/);
    });
  });
});
