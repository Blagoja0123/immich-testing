import { expect, test } from '../fixtures/test.js';
import { createAsset, createUser } from '../generators/data.js';
import { installTimelineMock } from '../mocks/timeline.js';
import { TimelinePage } from '../pages/TimelinePage.js';

test.describe('Timeline & Asset Viewer', () => {
  test('TL-01: the timeline renders uploaded assets as thumbnails', async ({ page, mockedApp }) => {
    await mockedApp.loginAs();
    const assets = [createAsset({ localDateTime: '2026-02-10T10:00:00.000Z' })];
    await installTimelineMock(mockedApp.context, assets);

    const timeline = new TimelinePage(page);
    await timeline.goto();

    await expect(timeline.thumbnail(assets[0].id)).toBeVisible();
  });

  test('TL-02: clicking a thumbnail opens item in the viewer', async ({ page, mockedApp }) => {
    await mockedApp.loginAs();
    const assets = [
      createAsset({ localDateTime: '2026-02-10T10:00:00.000Z' }),
      createAsset({ localDateTime: '2026-02-05T10:00:00.000Z' }),
    ];
    await installTimelineMock(mockedApp.context, assets);

    const timeline = new TimelinePage(page);
    await timeline.goto();
    await timeline.openAsset(assets[1].id);

    await expect(page).toHaveURL(new RegExp(`/photos/${assets[1].id}`));
  });

  test('TL-03: ArrowRight moves the viewer to the next item', async ({ page, mockedApp }) => {
    await mockedApp.loginAs();
    const assets = [
      createAsset({ localDateTime: '2026-02-10T10:00:00.000Z' }),
      createAsset({ localDateTime: '2026-02-05T10:00:00.000Z' }),
      createAsset({ localDateTime: '2026-02-01T10:00:00.000Z' }),
    ];
    await installTimelineMock(mockedApp.context, assets);

    const timeline = new TimelinePage(page);
    await page.goto(`/photos/${assets[0].id}`);
    await timeline.waitForViewerReady();

    await page.keyboard.press('ArrowRight');

    await expect(page).toHaveURL(new RegExp(`/photos/${assets[1].id}`));
  });

  test('TL-04: Escape closes the viewer and returns to the grid', async ({ page, mockedApp }) => {
    await mockedApp.loginAs();
    const assets = [createAsset({ localDateTime: '2026-02-10T10:00:00.000Z' })];
    await installTimelineMock(mockedApp.context, assets);

    const timeline = new TimelinePage(page);
    await page.goto(`/photos/${assets[0].id}`);
    await timeline.waitForViewerReady();

    await page.keyboard.press('Escape');

    await expect(timeline.viewer).toBeHidden();
    await expect(page).toHaveURL(/\/photos(\?|$)/);
  });

  test('TL-06 [edge: previous]: ArrowLeft moves the viewer to the previous item', async ({ page, mockedApp }) => {
    await mockedApp.loginAs();
    const assets = [
      createAsset({ localDateTime: '2026-02-10T10:00:00.000Z' }),
      createAsset({ localDateTime: '2026-02-05T10:00:00.000Z' }),
      createAsset({ localDateTime: '2026-02-01T10:00:00.000Z' }),
    ];
    await installTimelineMock(mockedApp.context, assets);

    const timeline = new TimelinePage(page);
    await page.goto(`/photos/${assets[1].id}`);
    await timeline.waitForViewerReady();

    await page.keyboard.press('ArrowLeft');

    await expect(page).toHaveURL(new RegExp(`/photos/${assets[0].id}`));
  });

  test('TL-07 [boundary: no outgoing "next" edge]: the last item has no next-item affordance', async ({
    page,
    mockedApp,
  }) => {
    await mockedApp.loginAs();
    const assets = [
      createAsset({ localDateTime: '2026-02-10T10:00:00.000Z' }),
      createAsset({ localDateTime: '2026-02-05T10:00:00.000Z' }),
    ];
    await installTimelineMock(mockedApp.context, assets);

    const timeline = new TimelinePage(page);
    await page.goto(`/photos/${assets[1].id}`);
    await timeline.waitForViewerReady();

    await expect(timeline.nextAssetButton).toHaveCount(0);
    // The edge itself is absent too, not just the affordance: the key does nothing.
    await page.keyboard.press('ArrowRight');
    await expect(page).toHaveURL(new RegExp(`/photos/${assets[1].id}`));
  });

  test('TL-08 [boundary: no outgoing "previous" edge]: the first item has no previous-item affordance', async ({
    page,
    mockedApp,
  }) => {
    await mockedApp.loginAs();
    const assets = [
      createAsset({ localDateTime: '2026-02-10T10:00:00.000Z' }),
      createAsset({ localDateTime: '2026-02-05T10:00:00.000Z' }),
    ];
    await installTimelineMock(mockedApp.context, assets);

    const timeline = new TimelinePage(page);
    await page.goto(`/photos/${assets[0].id}`);
    await timeline.waitForViewerReady();

    await expect(timeline.previousAssetButton).toHaveCount(0);
    await page.keyboard.press('ArrowLeft');
    await expect(page).toHaveURL(new RegExp(`/photos/${assets[0].id}`));
  });

  test('TL-05: selecting an item and marking it as favorite updates its thumbnail', async ({ page, mockedApp }) => {
    const user = await mockedApp.loginAs();
    const assets = [createAsset({ localDateTime: '2026-02-10T10:00:00.000Z', isFavorite: false })];
    await installTimelineMock(mockedApp.context, assets, { ownerId: user.id });

    const timeline = new TimelinePage(page);
    await timeline.goto();

    await expect(timeline.favoriteIcon(assets[0].id)).toHaveCount(0);

    await timeline.selectAsset(assets[0].id);
    const [request] = await Promise.all([
      page.waitForRequest((r) => r.url().includes('/api/assets') && r.method() === 'PUT'),
      timeline.favoriteButton.click(),
    ]);

    expect(request.postDataJSON()).toMatchObject({ ids: [assets[0].id], isFavorite: true });
    await expect(timeline.favoriteIcon(assets[0].id)).toHaveCount(1);
  });

  test('TL-09: archiving a selected asset removes it from the timeline', async ({ page, mockedApp }) => {
    const user = await mockedApp.loginAs();
    const assets = [createAsset({ localDateTime: '2026-02-10T10:00:00.000Z' })];
    await installTimelineMock(mockedApp.context, assets, { ownerId: user.id });

    const timeline = new TimelinePage(page);
    await timeline.goto();
    await timeline.selectAsset(assets[0].id);

    const [request] = await Promise.all([
      page.waitForRequest((r) => r.url().includes('/api/assets') && r.method() === 'PUT'),
      timeline.archiveSelected(),
    ]);

    expect(request.postDataJSON()).toMatchObject({ ids: [assets[0].id], visibility: 'archive' });
    await expect(timeline.thumbnail(assets[0].id)).toHaveCount(0);
  });

  test('TL-10: deleting a selected asset removes it from the timeline', async ({ page, mockedApp }) => {
    const user = await mockedApp.loginAs();
    const asset = createAsset({ localDateTime: '2026-02-10T10:00:00.000Z' });
    await installTimelineMock(mockedApp.context, [asset], { ownerId: user.id });

    const timeline = new TimelinePage(page);
    await timeline.goto();
    await timeline.selectAsset(asset.id);

    const [request] = await Promise.all([
      page.waitForRequest((r) => r.url().includes('/api/assets') && r.method() === 'DELETE'),
      timeline.deleteSelected(),
    ]);

    expect(request.postDataJSON()).toMatchObject({ ids: [asset.id], force: false });
    await expect(timeline.thumbnail(asset.id)).toHaveCount(0);
  });

  test('TL-11: select-all selects every asset and unselect-all clears the selection', async ({ page, mockedApp }) => {
    const user = await mockedApp.loginAs();
    const assets = [
      createAsset({ localDateTime: '2026-02-10T10:00:00.000Z' }),
      createAsset({ localDateTime: '2026-02-05T10:00:00.000Z' }),
    ];
    await installTimelineMock(mockedApp.context, assets, { ownerId: user.id });

    const timeline = new TimelinePage(page);
    await timeline.goto();
    await timeline.selectAsset(assets[0].id);

    await timeline.selectAllButton.click();
    await expect(timeline.selectCheckbox(assets[0].id)).toBeChecked();
    await expect(timeline.selectCheckbox(assets[1].id)).toBeChecked();

    await timeline.unselectAllButton.click();
    await expect(timeline.selectAllButton).toHaveCount(0);
  });

  test('TL-12: the Favorite action is hidden when the selection includes an asset you do not own', async ({
    page,
    mockedApp,
  }) => {
    const user = await mockedApp.loginAs();
    const foreignOwner = createUser();
    const assets = [createAsset({ localDateTime: '2026-02-10T10:00:00.000Z', ownerId: foreignOwner.id })];
    await installTimelineMock(mockedApp.context, assets, { ownerId: user.id });

    const timeline = new TimelinePage(page);
    await timeline.goto();
    await timeline.selectAsset(assets[0].id);

    await expect(timeline.selectAllButton).toBeVisible();
    await expect(timeline.favoriteButton).toHaveCount(0);
  });
});
