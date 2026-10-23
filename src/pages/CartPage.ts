import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class CartPage extends BasePage {
  protected readonly path = '/cart.html';

  private readonly title: Locator;
  private readonly itemNames: Locator;
  private readonly checkoutButton: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.getByTestId('title');
    this.itemNames = page.getByTestId('inventory-item-name');
    this.checkoutButton = page.getByTestId('checkout');
  }

  async expectItems(names: string[]): Promise<void> {
    await expect(this.title).toHaveText('Your Cart');
    await expect(this.itemNames).toHaveText(names);
  }

  async checkout(): Promise<void> {
    await this.checkoutButton.click();
  }
}
