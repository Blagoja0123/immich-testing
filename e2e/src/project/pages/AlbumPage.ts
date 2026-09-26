import type { Page } from '@playwright/test';

export class AlbumsPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/albums');
  }

  get createAlbumButton() {
    return this.page.getByRole('button', { name: 'Create album', exact: true });
  }

  albumCard(albumId: string) {
    return this.page.getByTestId('album-card').filter({ has: this.page.locator(`a[href="/albums/${albumId}"]`) });
  }
}

export class AlbumDetailPage {
  constructor(private readonly page: Page) {}

  async goto(albumId: string) {
    await this.page.goto(`/albums/${albumId}`);
  }

  get titleInput() {
    return this.page.getByTitle('Edit Title', { exact: true });
  }

  get shareButton() {
    return this.page.getByLabel('Share', { exact: true });
  }

  get createLinkButton() {
    return this.page.getByRole('button', { name: 'Create link', exact: true });
  }

  get sharePasswordInput() {
    return this.page.getByLabel('Password', { exact: true });
  }

  get shareAllowDownloadSwitch() {
    return this.page.getByLabel('Allow public user to download', { exact: true });
  }

  get shareAllowUploadSwitch() {
    return this.page.getByLabel('Allow public user to upload', { exact: true });
  }

  get shareExpiryNeverButton() {
    return this.page.getByRole('button', { name: 'Never', exact: true });
  }

  get shareExpiryFirstPresetButton() {
    return this.shareExpiryNeverButton.locator('xpath=following-sibling::button[1]');
  }

  get selectPhotosButton() {
    return this.page.getByRole('button', { name: 'Select photos', exact: true });
  }

  get addPhotosButton() {
    return this.page.getByLabel('Add photos', { exact: true });
  }

  get addAssetsButton() {
    return this.page.getByRole('button', { name: 'Add assets', exact: true });
  }

  get selectionMenuButton() {
    return this.page.getByRole('button', { name: 'Menu', exact: true });
  }

  get removeFromAlbumMenuOption() {
    return this.page.getByRole('menuitem', { name: 'Remove from album', exact: true });
  }

  get confirmButton() {
    return this.page.getByRole('button', { name: 'Confirm', exact: true });
  }

  get descriptionInput() {
    return this.page.getByPlaceholder('Add a description', { exact: true });
  }

  get albumOptionsMenuButton() {
    return this.page.getByRole('button', { name: 'Album options', exact: true });
  }

  get deleteAlbumMenuOption() {
    return this.page.getByRole('menuitem', { name: 'Delete album', exact: true });
  }

  async renameTo(newName: string) {
    await this.titleInput.fill(newName);
    await this.titleInput.blur();
  }

  async editDescriptionTo(description: string) {
    await this.descriptionInput.fill(description);
    await this.descriptionInput.blur();
  }

  async deleteAlbum() {
    await this.albumOptionsMenuButton.click();
    await this.deleteAlbumMenuOption.click();
    await this.confirmButton.click();
  }

  async removeSelectedFromAlbum() {
    await this.selectionMenuButton.click();
    await this.removeFromAlbumMenuOption.click();
    await this.confirmButton.click();
  }
}
