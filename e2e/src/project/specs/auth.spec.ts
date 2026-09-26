import { test, expect } from '../fixtures/test.js';
import {
  installPublicConfigMock,
  installLoginMock,
  installAuthenticatedUserMocks,
  installLogoutMock,
  installExpiredSessionMocks,
} from '../mocks/auth.js';
import { createUser } from '../generators/data.js';
import { LoginPage } from '../pages/LoginPage.js';


test.describe('Auth / Login', () => {
  test('AUTH-01: renders the login form for an unauthenticated visitor', async ({ page, mockedApp }) => {
    await installPublicConfigMock(mockedApp.context);
    const login = new LoginPage(page);

    await login.goto();

    await expect(login.emailInput).toBeVisible();
    await expect(login.passwordInput).toBeVisible();
    await expect(login.submitButton).toBeVisible();
  });

  test('AUTH-02 [BASE — C1=valid, C2=correct]: valid credentials redirect to the photos timeline', async ({
    page,
    mockedApp,
  }) => {
    const user = createUser({ email: 'valid@example.com' });
    await installPublicConfigMock(mockedApp.context);
    await installLoginMock(mockedApp.context, user, { email: 'valid@example.com', password: 'correct-horse' });
    await installAuthenticatedUserMocks(mockedApp.context, user);

    const login = new LoginPage(page);
    await login.goto();
    await login.login('valid@example.com', 'correct-horse');

    await expect(page).toHaveURL(/\/photos/);
  });

  test('AUTH-03 [C2=incorrect]: wrong password is rejected with an inline error and no navigation', async ({
    page,
    mockedApp,
  }) => {
    const user = createUser({ email: 'valid@example.com' });
    await installPublicConfigMock(mockedApp.context);
    await installLoginMock(mockedApp.context, user, { email: 'valid@example.com', password: 'correct-horse' });

    const login = new LoginPage(page);
    await login.goto();
    await login.login('valid@example.com', 'wrong-password');

    await expect(login.errorAlert).toBeVisible();
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('AUTH-04 [C2=empty]: an empty password blocks submission and focuses the password field', async ({
    page,
    mockedApp,
  }) => {
    await installPublicConfigMock(mockedApp.context);
    const login = new LoginPage(page);

    await login.goto();
    await login.emailInput.fill('valid@example.com');
    await login.submitButton.click();

    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(login.passwordInput).toBeFocused();
  });

  test('AUTH-05 [C1=empty]: an empty email blocks submission and focuses the email field', async ({
    page,
    mockedApp,
  }) => {
    await installPublicConfigMock(mockedApp.context);
    const login = new LoginPage(page);

    await login.goto();
    await login.passwordInput.fill('correct-horse');
    await login.submitButton.click();

    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(login.emailInput).toBeFocused();
  });

  test('AUTH-06 [C1=malformed]: a syntactically invalid email blocks submission', async ({ page, mockedApp }) => {
    await installPublicConfigMock(mockedApp.context);
    const login = new LoginPage(page);

    await login.goto();
    await login.emailInput.fill('not-an-email');
    await login.passwordInput.fill('correct-horse');
    await login.submitButton.click();

    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(login.emailInput).toBeFocused();
  });

  test('AUTH-07: signing out returns the user to the login page', async ({ page, mockedApp }) => {
    const user = await mockedApp.loginAs(createUser({ email: 'valid@example.com' }));
    await installPublicConfigMock(mockedApp.context);
    await installLogoutMock(mockedApp.context);

    await page.goto('/photos');

    await page.getByRole('button', { name: `${user.name} (${user.email})` }).click();
    await page.getByRole('link', { name: 'Sign Out', exact: true }).click();

    const login = new LoginPage(page);
    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(login.emailInput).toBeVisible();
  });

  test('AUTH-08: an expired session on a protected route redirects to login', async ({ page, mockedApp }) => {
    await installExpiredSessionMocks(mockedApp.context);
    await installPublicConfigMock(mockedApp.context);

    await page.goto('/photos');

    const login = new LoginPage(page);
    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(login.emailInput).toBeVisible();
  });
});
