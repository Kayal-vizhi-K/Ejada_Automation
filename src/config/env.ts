import 'dotenv/config';

export const env = {
  uiBaseUrl: process.env.UI_BASE_URL ?? 'https://www.saucedemo.com',
  apiBaseUrl: process.env.BOOKS_API_URL ?? 'https://simple-books-api.click',
} as const;
