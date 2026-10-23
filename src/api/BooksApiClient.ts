import { APIRequestContext, APIResponse } from '@playwright/test';
import { ApiClientRegistration } from './types';

type Id = number | string;

/**
 * Thin typed wrapper around the Simple Books API.
 * Methods return the raw APIResponse so tests decide what to assert
 * (status codes, bodies, headers) - this is important for negative tests.
 */
export class BooksApiClient {
  constructor(private readonly request: APIRequestContext) {}

  // ----- public endpoints -----
  status(): Promise<APIResponse> {
    return this.request.get('/status');
  }

  listBooks(query: { type?: string; limit?: Id } = {}): Promise<APIResponse> {
    const params: Record<string, string> = {};
    if (query.type !== undefined) params.type = query.type;
    if (query.limit !== undefined) params.limit = String(query.limit);
    return this.request.get('/books', { params });
  }

  getBook(bookId: Id): Promise<APIResponse> {
    return this.request.get(`/books/${bookId}`);
  }

  registerClient(body: Partial<ApiClientRegistration>): Promise<APIResponse> {
    return this.request.post('/api-clients/', { data: body });
  }

  // ----- authenticated endpoints (context must carry the Bearer token) -----
  createOrder(body: { bookId?: unknown; customerName?: unknown }): Promise<APIResponse> {
    return this.request.post('/orders', { data: body });
  }

  listOrders(): Promise<APIResponse> {
    return this.request.get('/orders');
  }

  getOrder(orderId: string): Promise<APIResponse> {
    return this.request.get(`/orders/${orderId}`);
  }

  updateOrder(orderId: string, body: { customerName?: string }): Promise<APIResponse> {
    return this.request.patch(`/orders/${orderId}`, { data: body });
  }

  deleteOrder(orderId: string): Promise<APIResponse> {
    return this.request.delete(`/orders/${orderId}`);
  }
}
