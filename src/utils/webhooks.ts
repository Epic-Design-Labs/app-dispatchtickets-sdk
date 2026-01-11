import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Webhook signature verification utilities
 */
export const webhookUtils = {
  /**
   * Verify a webhook signature
   *
   * @param payload - The raw request body as a string
   * @param signature - The X-Dispatch-Signature header value
   * @param secret - Your webhook secret
   * @returns true if the signature is valid
   *
   * @example
   * ```typescript
   * import { DispatchTickets } from '@dispatchtickets/sdk';
   *
   * app.post('/webhooks', (req, res) => {
   *   const signature = req.headers['x-dispatch-signature'];
   *   const isValid = DispatchTickets.webhooks.verifySignature(
   *     req.rawBody,
   *     signature,
   *     process.env.WEBHOOK_SECRET
   *   );
   *
   *   if (!isValid) {
   *     return res.status(401).send('Invalid signature');
   *   }
   *
   *   // Process webhook...
   * });
   * ```
   */
  verifySignature(payload: string, signature: string, secret: string): boolean {
    if (!signature || !secret) {
      return false;
    }

    // Signature format: sha256=<hex>
    const parts = signature.split('=');
    if (parts.length !== 2 || parts[0] !== 'sha256') {
      return false;
    }

    const receivedSignature = parts[1];
    const expectedSignature = createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    try {
      const receivedBuffer = Buffer.from(receivedSignature, 'hex');
      const expectedBuffer = Buffer.from(expectedSignature, 'hex');

      if (receivedBuffer.length !== expectedBuffer.length) {
        return false;
      }

      return timingSafeEqual(receivedBuffer, expectedBuffer);
    } catch {
      return false;
    }
  },

  /**
   * Generate a signature for testing purposes
   *
   * @param payload - The payload to sign
   * @param secret - The secret to sign with
   * @returns The signature in the format sha256=<hex>
   */
  generateSignature(payload: string, secret: string): string {
    const signature = createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    return `sha256=${signature}`;
  },
};
