import { test, expect, uniqueClient } from '../../src/fixtures/api.fixture';
import { BooksApiClient } from '../../src/api/BooksApiClient';
import { Book, Order } from '../../src/api/types';
import { env } from '../../src/config/env';

test.describe('Simple Books API - orders', () => {
  test('POST /orders creates an order @smoke', async ({ authBooksApi }) => {
    const res = await authBooksApi.createOrder({ bookId: 1, customerName: 'Jane Doe' });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.created).toBe(true);
    expect(body.orderId).toEqual(expect.any(String));

    await authBooksApi.deleteOrder(body.orderId); // cleanup
  });

  test('POST /orders validates the body (400)', async ({ authBooksApi }) => {
    expect((await authBooksApi.createOrder({ customerName: 'No Book' })).status()).toBe(400);
    expect((await authBooksApi.createOrder({ bookId: 1 })).status()).toBe(400);
    expect((await authBooksApi.createOrder({ bookId: 'abc', customerName: 'Bad Id' })).status()).toBe(400);
  });

  test('POST /orders rejects a book that is out of stock', async ({ booksApi, authBooksApi }) => {
    const books: Book[] = await (await booksApi.listBooks()).json();
    const unavailable = books.find((b) => !b.available);
    test.skip(!unavailable, 'No out-of-stock book is currently in the catalogue');

    const res = await authBooksApi.createOrder({ bookId: unavailable!.id, customerName: 'Late Buyer' });
    expect(res.status()).toBe(404);
  });

  test('GET /orders lists the created order', async ({ authBooksApi, order }) => {
    const res = await authBooksApi.listOrders();
    expect(res.status()).toBe(200);
    const orders: Order[] = await res.json();
    expect(orders.map((o) => o.id)).toContain(order.orderId);
  });

  test('GET /orders/:id returns the order', async ({ authBooksApi, order }) => {
    const res = await authBooksApi.getOrder(order.orderId);
    expect(res.status()).toBe(200);
    expect(await res.json()).toMatchObject({
      id: order.orderId,
      bookId: order.bookId,
      customerName: order.customerName,
    });
  });

  test('GET /orders/:id returns 404 for an unknown id', async ({ authBooksApi }) => {
    expect((await authBooksApi.getOrder('does-not-exist')).status()).toBe(404);
  });

  test('PATCH /orders/:id updates the customer name', async ({ authBooksApi, order }) => {
    const res = await authBooksApi.updateOrder(order.orderId, { customerName: 'Renamed Customer' });
    expect(res.status()).toBe(204);

    const updated: Order = await (await authBooksApi.getOrder(order.orderId)).json();
    expect(updated.customerName).toBe('Renamed Customer');
    expect(updated.bookId).toBe(order.bookId); // untouched fields are preserved
  });

  test('PATCH /orders/:id returns 404 for an unknown id', async ({ authBooksApi }) => {
    const res = await authBooksApi.updateOrder('does-not-exist', { customerName: 'Ghost' });
    expect(res.status()).toBe(404);
  });

  test('DELETE /orders/:id removes the order', async ({ authBooksApi, order }) => {
    expect((await authBooksApi.deleteOrder(order.orderId)).status()).toBe(204);
    expect((await authBooksApi.getOrder(order.orderId)).status()).toBe(404);
  });

  test('DELETE /orders/:id is not idempotent - second delete returns 404', async ({ authBooksApi, order }) => {
    expect((await authBooksApi.deleteOrder(order.orderId)).status()).toBe(204);
    expect((await authBooksApi.deleteOrder(order.orderId)).status()).toBe(404);
  });

  test("another client's token cannot read or modify the order", async ({ playwright, order }) => {
    // Register a second, independent API client
    const anon = await playwright.request.newContext({ baseURL: env.apiBaseUrl });
    const reg = await new BooksApiClient(anon).registerClient(uniqueClient('intruder'));
    expect(reg.status()).toBe(201);
    const { accessToken } = await reg.json();

    const intruderCtx = await playwright.request.newContext({
      baseURL: env.apiBaseUrl,
      extraHTTPHeaders: { Authorization: `Bearer ${accessToken}` },
    });
    const intruder = new BooksApiClient(intruderCtx);

    expect((await intruder.getOrder(order.orderId)).status()).toBe(404);
    expect((await intruder.updateOrder(order.orderId, { customerName: 'Hacked' })).status()).toBe(404);
    expect((await intruder.deleteOrder(order.orderId)).status()).toBe(404);

    await anon.dispose();
    await intruderCtx.dispose();
  });

  test.describe('full lifecycle', () => {
    test.describe.configure({ mode: 'serial' });

    test('create -> read -> update -> delete -> verify gone', async ({ authBooksApi }) => {
      let orderId = '';

      await test.step('POST creates the order', async () => {
        const res = await authBooksApi.createOrder({ bookId: 1, customerName: 'Lifecycle User' });
        expect(res.status()).toBe(201);
        orderId = (await res.json()).orderId;
      });

      await test.step('GET returns it', async () => {
        const res = await authBooksApi.getOrder(orderId);
        expect(res.status()).toBe(200);
        expect((await res.json()).customerName).toBe('Lifecycle User');
      });

      await test.step('PATCH renames it', async () => {
        expect((await authBooksApi.updateOrder(orderId, { customerName: 'Lifecycle Updated' })).status()).toBe(204);
        expect((await (await authBooksApi.getOrder(orderId)).json()).customerName).toBe('Lifecycle Updated');
      });

      await test.step('DELETE removes it', async () => {
        expect((await authBooksApi.deleteOrder(orderId)).status()).toBe(204);
        expect((await authBooksApi.getOrder(orderId)).status()).toBe(404);
      });
    });
  });
});
