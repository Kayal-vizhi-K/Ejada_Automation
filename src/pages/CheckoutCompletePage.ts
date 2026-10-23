import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class CheckoutCompletePage extends BasePage {
  protected readonly path = '/checkout-complete.html';

  private readonly header: Locator;
  private readonly text: Locator;
  private readonly backHomeButton: Locator;

  constructor(page: Page) {
    super(page);
    this.header = page.getByTestId('complete-header');
    this.text = page.getByTestId('complete-text');
    this.backHomeButton = page.getByTestId('back-to-products');
  }

  async expectOrderConfirmed(): Promise<void> {
    await expect(this.page).toHaveURL(/checkout-complete\.html/);
    await expect(this.header).toHaveText('Thank you for your order!');
    await expect(this.text).toContainText('Your order has been dispatched');
  }

  async backHome(): Promise<void> {
    await this.backHomeButton.click();
  }
}
