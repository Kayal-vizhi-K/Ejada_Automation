export interface Product {
  name: string;
  price: string;
}

export const products = {
  backpack: { name: 'Sauce Labs Backpack', price: '29.99' },
  bikeLight: { name: 'Sauce Labs Bike Light', price: '9.99' },
} satisfies Record<string, Product>;

export const checkoutCustomer = {
  firstName: 'Jane',
  lastName: 'Doe',
  postalCode: '600053',
} as const;
