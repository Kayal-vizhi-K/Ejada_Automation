import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export interface CustomerInfo {
  firstName: string;
  lastName: string;
  postalCode: string;
}

export class CheckoutInformationPage extends BasePage {
  protected readonly path = '/checkout-step-one.html';

  private readonly title: Locator;
  private readonly firstName: Locator;
  private readonly lastName: Locator;
  private readonly postalCode: Locator;
  private readonly continueButton: Locator;
  private readonly error: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.getByTestId('title');
    this.firstName = page.getByTestId('firstName');
    this.lastName = page.getByTestId('lastName');
    this.postalCode = page.getByTestId('postalCode');
    this.continueButton = page.getByTestId('continue');
    this.error = page.getByTestId('error');
  }

  async expectLoaded(): Promise<void> {
    await expect(this.title).toHaveText('Checkout: Your Information');
  }

  async fillAndContinue(info: Partial<CustomerInfo>): Promise<void> {
    await this.firstName.fill(info.firstName ?? '');
    await this.lastName.fill(info.lastName ?? '');
    await this.postalCode.fill(info.postalCode ?? '');
    await this.continueButton.click();
  }

  async expectError(message: string): Promise<void> {
    await expect(this.error).toHaveText(message);
  }
}
