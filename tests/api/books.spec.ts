import { test, expect, uniqueClient } from '../../src/fixtures/api.fixture';
import { BooksApiClient } from '../../src/api/BooksApiClient';
import { env } from '../../src/config/env';
import { Book, BookDetails } from '../../src/api/types';

test.describe('Simple Books API - public endpoints', () => {
  test('GET /status reports OK @smoke', async ({ booksApi }) => {
    const res = await booksApi.status();
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({ status: 'OK' });
  });

  test('GET /books returns a list of books @smoke', async ({ booksApi }) => {
    const res = await booksApi.listBooks();
    expect(res.status()).toBe(200);
    const books: Book[] = await res.json();
    expect(books.length).toBeGreaterThan(0);
    for (const book of books) {
      expect(book).toMatchObject({
        id: expect.any(Number),
        name: expect.any(String),
        type: expect.stringMatching(/^(fiction|non-fiction)$/),
        available: expect.any(Boolean),
      });
    }
  });

  for (const type of ['fiction', 'non-fiction']) {
    test(`GET /books?type=${type} only returns ${type} books`, async ({ booksApi }) => {
      const res = await booksApi.listBooks({ type });
      expect(res.status()).toBe(200);
      const books: Book[] = await res.json();
      expect(books.length).toBeGreaterThan(0);
      expect(books.every((b) => b.type === type)).toBe(true);
    });
  }

  test('GET /books?limit=2 honours the limit', async ({ booksApi }) => {
    const res = await booksApi.listBooks({ limit: 2 });
    expect(res.status()).toBe(200);
    expect(await res.json()).toHaveLength(2);
  });

  test('GET /books rejects a limit above 20', async ({ booksApi }) => {
    const res = await booksApi.listBooks({ limit: 21 });
    expect(res.status()).toBe(400);
    expect((await res.json()).error).toBeTruthy();
  });

  test('GET /books rejects an unknown type', async ({ booksApi }) => {
    const res = await booksApi.listBooks({ type: 'poetry' });
    expect(res.status()).toBe(400);
  });

  test('GET /books/:id returns book details', async ({ booksApi }) => {
    const res = await booksApi.getBook(1);
    expect(res.status()).toBe(200);
    const book: BookDetails = await res.json();
    expect(book.id).toBe(1);
    expect(book.name).toEqual(expect.any(String));
    expect(book.isbn).toEqual(expect.any(String));
  });

  test('GET /books/:id returns 404 for an unknown book', async ({ booksApi }) => {
    const res = await booksApi.getBook(999999);
    expect(res.status()).toBe(404);
  });
});

test.describe('Simple Books API - authentication', () => {
  test('POST /api-clients registers a client and returns a token', async ({ booksApi }) => {
    const res = await booksApi.registerClient(uniqueClient('register'));
    expect(res.status()).toBe(201);
    expect((await res.json()).accessToken).toEqual(expect.any(String));
  });

  test('POST /api-clients rejects an already registered client (409)', async ({ booksApi }) => {
    const client = uniqueClient('dup');
    expect((await booksApi.registerClient(client)).status()).toBe(201);
    const second = await booksApi.registerClient(client);
    expect(second.status()).toBe(409);
  });

  test('POST /api-clients rejects a missing email (400)', async ({ booksApi }) => {
    const res = await booksApi.registerClient({ clientName: 'no-email' });
    expect(res.status()).toBe(400);
  });

  test('orders endpoints require a token (401)', async ({ booksApi }) => {
    expect((await booksApi.listOrders()).status()).toBe(401);
    expect((await booksApi.createOrder({ bookId: 1, customerName: 'Nobody' })).status()).toBe(401);
  });


  test('orders endpoints reject an invalid token (401)', async ({ playwright }) => {
  const ctx = await playwright.request.newContext({
    baseURL: env.apiBaseUrl,
    extraHTTPHeaders: { Authorization: 'Bearer definitely-not-a-real-token' },
  });
  const res = await new BooksApiClient(ctx).listOrders();
  expect(res.status()).toBe(401);
  await ctx.dispose();
});
});
