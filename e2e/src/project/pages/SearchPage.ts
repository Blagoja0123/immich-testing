import type { Page } from '@playwright/test';

export class SearchPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/photos');
  }

  get searchInput() {
    return this.page.getByRole('combobox', { name: 'Search your photos' });
  }

  get emptyResultsMessage() {
    return this.page.getByText('No results', { exact: true });
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    await this.searchInput.press('Enter');
    await this.page.waitForURL(/\/search/);
  }
}
