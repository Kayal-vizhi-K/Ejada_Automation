import { test } from '../../src/fixtures/ui.fixture';
import { loginErrors, PASSWORD, users } from '../../src/data/users';

test.describe('SauceDemo - login', () => {
  test.describe('successful login', () => {
    test('standard user can log in @smoke', async ({ loginPage, inventoryPage }) => {
      await loginPage.login(users.standard);
      await inventoryPage.expectLoaded();
    });

    // These users are valid and must be able to log in (their *behaviour* afterwards differs)
    for (const [label, creds] of Object.entries({
      problem: users.problem,
      performanceGlitch: users.performanceGlitch,
      error: users.error,
      visual: users.visual,
    })) {
      test(`${label} user can log in`, async ({ loginPage, inventoryPage }) => {
        test.slow(label === 'performanceGlitch', 'performance_glitch_user is intentionally slow');
        await loginPage.login(creds);
        await inventoryPage.expectLoaded();
      });
    }
  });

  test('locked out user is rejected @smoke', async ({ loginPage }) => {
    await loginPage.login(users.lockedOut);
    await loginPage.expectError(loginErrors.lockedOut);
  });

  test.describe('invalid credentials', () => {
    const cases = [
      { title: 'wrong password', username: users.standard.username, password: 'wrong_password', error: loginErrors.mismatch },
      { title: 'unknown user', username: 'no_such_user', password: PASSWORD, error: loginErrors.mismatch },
      { title: 'username is case sensitive', username: 'Standard_User', password: PASSWORD, error: loginErrors.mismatch },
      { title: 'password is case sensitive', username: users.standard.username, password: 'SECRET_SAUCE', error: loginErrors.mismatch },
      { title: 'whitespace around username', username: ' standard_user ', password: PASSWORD, error: loginErrors.mismatch },
      { title: 'SQL-injection style input', username: "' OR '1'='1", password: "' OR '1'='1", error: loginErrors.mismatch },
      { title: 'empty username', username: '', password: PASSWORD, error: loginErrors.usernameRequired },
      { title: 'empty password', username: users.standard.username, password: '', error: loginErrors.passwordRequired },
      { title: 'both fields empty', username: '', password: '', error: loginErrors.usernameRequired },
    ];

    for (const { title, username, password, error } of cases) {
      test(title, async ({ loginPage }) => {
        await loginPage.login({ username, password });
        await loginPage.expectError(error);
        await loginPage.expectFieldsMarkedInvalid();
      });
    }
  });

  test('error message can be dismissed', async ({ loginPage }) => {
    await loginPage.login({ username: '', password: '' });
    await loginPage.expectError(loginErrors.usernameRequired);
    await loginPage.dismissError();
    await loginPage.expectNoError();
  });

  test('inventory cannot be opened without logging in', async ({ loginPage, inventoryPage }) => {
    await inventoryPage.open();
    await loginPage.expectLoaded();
    await loginPage.expectError(loginErrors.notLoggedIn);
  });

  test('user can log out', async ({ loggedInInventoryPage, loginPage }) => {
    await loggedInInventoryPage.logout();
    await loginPage.expectLoaded();
  });
});
