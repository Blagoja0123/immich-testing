import type { Page } from '@playwright/test';

export class TimelinePage {
  constructor(private readonly page: Page) {}

  get grid() {
    return this.page.locator('#asset-grid');
  }

  get viewer() {
    return this.page.locator('#immich-asset-viewer');
  }

  get favoriteButton() {
    return this.page.getByLabel('Favorite', { exact: true });
  }

  get removeFromFavoritesButton() {
    return this.page.getByLabel('Remove from favorites', { exact: true });
  }

  get closeViewerButton() {
    return this.page.getByLabel('Go back', { exact: true });
  }

  /** NavigationArea's own affordance — absent entirely at the end of the asset sequence. */
  get nextAssetButton() {
    return this.page.getByLabel('View next asset', { exact: true });
  }

  /** NavigationArea's own affordance — absent entirely at the start of the asset sequence. */
  get previousAssetButton() {
    return this.page.getByLabel('View previous asset', { exact: true });
  }

  async goto() {
    await this.page.goto('/photos');
    await this.grid.waitFor();
  }

  thumbnail(assetId: string) {
    return this.page.locator(`[data-thumbnail-focus-container][data-asset="${assetId}"]`);
  }

  favoriteIcon(assetId: string) {
    return this.thumbnail(assetId).locator('[data-icon-favorite]');
  }

  selectCheckbox(assetId: string) {
    return this.thumbnail(assetId).locator('button[role="checkbox"]');
  }

  async openAsset(assetId: string) {
    await this.thumbnail(assetId).click();
    await this.waitForViewerReady();
  }

  /**
   * Waits for the viewer's image to actually be on screen. Needed before any
   * keyboard shortcut (ArrowRight/Escape/...): the viewer container mounts
   * before AssetViewer finishes prefetching neighbor asset data, and a key
   * sent too early is a no-op even though #immich-asset-viewer already exists.
   */
  async waitForViewerReady() {
    await this.viewer.locator('img, video').first().waitFor();
  }

  /** Hovers to reveal the per-thumbnail checkbox, then selects it (multi-select mode). */
  async selectAsset(assetId: string) {
    await this.thumbnail(assetId).hover();
    await this.selectCheckbox(assetId).click();
  }
}
