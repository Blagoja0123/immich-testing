import type { Page } from '@playwright/test';

export class LoginPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/auth/login');
  }

  get emailInput() {
    return this.page.getByLabel('Email', { exact: true });
  }

  get passwordInput() {
    return this.page.getByLabel('Password', { exact: true });
  }

  get submitButton() {
    return this.page.getByRole('button', { name: 'Login', exact: true });
  }

  get errorAlert() {
    return this.page.getByText('Incorrect email or password');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
