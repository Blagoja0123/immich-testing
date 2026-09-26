import type { Page } from '@playwright/test';

export class SharedLinkPage {
  constructor(private readonly page: Page) {}

  async goto(key: string) {
    await this.page.goto(`/share/${key}`);
  }

  get passwordHeading() {
    return this.page.getByText('Password Required', { exact: true });
  }

  get passwordInput() {
    return this.page.getByPlaceholder('Password', { exact: true });
  }

  get submitButton() {
    return this.page.getByRole('button', { name: 'Submit', exact: true });
  }

  albumTitle(name: string) {
    return this.page.getByText(name, { exact: true });
  }

  async submitPassword(password: string) {
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
