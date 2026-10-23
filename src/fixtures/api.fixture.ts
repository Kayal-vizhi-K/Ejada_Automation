import { test as base, expect } from '@playwright/test';
import { randomUUID } from 'crypto';
import { BooksApiClient } from '../api/BooksApiClient';
import { env } from '../config/env';

export interface CreatedOrder {
  orderId: string;
  bookId: number;
  customerName: string;
}

export const uniqueClient = (tag = 'pw') => ({
  clientName: `${tag}-${randomUUID().slice(0, 8)}`,
  clientEmail: `${tag}-${randomUUID()}@example.com`,
});

type WorkerFixtures = {
  /** One registered API client (and token) per worker - keeps parallel runs isolated */
  accessToken: string;
};

type TestFixtures = {
  /** Unauthenticated client */
  booksApi: BooksApiClient;
  /** Client sending `Authorization: Bearer <token>` */
  authBooksApi: BooksApiClient;
  /** An order created for the test and deleted afterwards */
  order: CreatedOrder;
};

export const test = base.extend<TestFixtures, WorkerFixtures>({
  accessToken: [
    async ({ playwright }, use) => {
      const ctx = await playwright.request.newContext({ baseURL: env.apiBaseUrl });
      const res = await new BooksApiClient(ctx).registerClient(uniqueClient('worker'));
      expect(res.status(), 'API client registration').toBe(201);
      const { accessToken } = await res.json();
      await use(accessToken);
      await ctx.dispose();
    },
    { scope: 'worker' },
  ],

  booksApi: async ({ request }, use) => use(new BooksApiClient(request)),

  authBooksApi: async ({ playwright, accessToken }, use) => {
    const ctx = await playwright.request.newContext({
      baseURL: env.apiBaseUrl,
      extraHTTPHeaders: { Authorization: `Bearer ${accessToken}` },
    });
    await use(new BooksApiClient(ctx));
    await ctx.dispose();
  },

  order: async ({ authBooksApi }, use) => {
    const customerName = `Order Owner ${randomUUID().slice(0, 6)}`;
    const bookId = 1;
    const res = await authBooksApi.createOrder({ bookId, customerName });
    expect(res.status(), 'order setup').toBe(201);
    const { orderId } = await res.json();

    await use({ orderId, bookId, customerName });

    await authBooksApi.deleteOrder(orderId); // cleanup; 404 if the test already deleted it is fine
  },
});

export { expect } from '@playwright/test';
