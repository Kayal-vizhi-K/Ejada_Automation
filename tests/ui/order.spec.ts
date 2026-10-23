import { test } from '../../src/fixtures/ui.fixture';
import { checkoutCustomer, products } from '../../src/data/products';

const { backpack } = products;

test.describe('SauceDemo - product order', () => {
  test('logged-in user can order a product end to end @smoke', async ({
    loggedInInventoryPage: inventory,
    cartPage,
    checkoutInfoPage,
    checkoutOverviewPage,
    checkoutCompletePage,
  }) => {
    await test.step('Add one product to the cart', async () => {
      await inventory.addToCart(backpack.name);
      await inventory.expectCartBadge(1);
    });

    await test.step('Review the cart', async () => {
      await inventory.openCart();
      await cartPage.expectItems([backpack.name]);
    });

    await test.step('Enter checkout information', async () => {
      await cartPage.checkout();
      await checkoutInfoPage.expectLoaded();
      await checkoutInfoPage.fillAndContinue(checkoutCustomer);
    });

    await test.step('Verify the order overview', async () => {
      await checkoutOverviewPage.expectSummary([backpack.name], backpack.price);
    });

    await test.step('Finish the order', async () => {
      await checkoutOverviewPage.finish();
      await checkoutCompletePage.expectOrderConfirmed();
    });

    await test.step('Return home - cart is empty again', async () => {
      await checkoutCompletePage.backHome();
      await inventory.expectLoaded();
      await inventory.expectCartBadge(0);
    });
  });

  test('checkout requires first name', async ({
    loggedInInventoryPage: inventory,
    cartPage,
    checkoutInfoPage,
  }) => {
    await inventory.addToCart(backpack.name);
    await inventory.openCart();
    await cartPage.checkout();
    await checkoutInfoPage.fillAndContinue({ ...checkoutCustomer, firstName: '' });
    await checkoutInfoPage.expectError('Error: First Name is required');
  });

  test('product can be removed from the cart', async ({ loggedInInventoryPage: inventory }) => {
    await inventory.addToCart(backpack.name);
    await inventory.expectCartBadge(1);
    await inventory.removeFromCart(backpack.name);
    await inventory.expectCartBadge(0);
  });
});
