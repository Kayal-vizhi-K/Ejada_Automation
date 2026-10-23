export interface Book {
  id: number;
  name: string;
  type: 'fiction' | 'non-fiction';
  available: boolean;
}

export interface BookDetails extends Book {
  author: string;
  isbn: string;
  price: number;
  'current-stock': number;
}

export interface Order {
  id: string;
  bookId: number;
  customerName: string;
  quantity: number;
  timestamp: number;
  createdBy?: string;
}

export interface ApiClientRegistration {
  clientName: string;
  clientEmail: string;
}

export interface ApiError {
  error: string;
}
