import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class CheckoutOverviewPage extends BasePage {
  protected readonly path = '/checkout-step-two.html';

  private readonly title: Locator;
  private readonly itemNames: Locator;
  private readonly subtotal: Locator;
  private readonly finishButton: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.getByTestId('title');
    this.itemNames = page.getByTestId('inventory-item-name');
    this.subtotal = page.getByTestId('subtotal-label');
    this.finishButton = page.getByTestId('finish');
  }

  async expectSummary(names: string[], itemTotal: string): Promise<void> {
    await expect(this.title).toHaveText('Checkout: Overview');
    await expect(this.itemNames).toHaveText(names);
    await expect(this.subtotal).toHaveText(`Item total: $${itemTotal}`);
  }

  async finish(): Promise<void> {
    await this.finishButton.click();
  }
}
