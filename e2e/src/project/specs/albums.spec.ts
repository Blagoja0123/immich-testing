import { test, expect } from '../fixtures/test.js';
import { installAlbumsMock, installSharedLinkMock } from '../mocks/albums.js';
import { installAlbumAssetsMock } from '../mocks/album-assets.js';
import { installTimelineMock } from '../mocks/timeline.js';
import { createAlbum, createAsset } from '../generators/data.js';
import { AlbumsPage, AlbumDetailPage } from '../pages/AlbumPage.js';
import { TimelinePage } from '../pages/TimelinePage.js';

test.describe('Albums', () => {
  test('AB-01: the albums page lists an existing album', async ({ page, mockedApp }) => {
    const user = await mockedApp.loginAs();
    const album = createAlbum({ albumName: 'Summer Trip' });
    await installAlbumsMock(mockedApp.context, { owner: user, albums: [album] });

    const albums = new AlbumsPage(page);
    await albums.goto();

    await expect(page.getByTestId('album-name').getByText('Summer Trip')).toBeVisible();
  });

  test('AB-02: creating an album redirects to the detail page', async ({ page, mockedApp }) => {
    const user = await mockedApp.loginAs();
    await installAlbumsMock(mockedApp.context, { owner: user, albums: [] });

    const albums = new AlbumsPage(page);
    await albums.goto();
    await albums.createAlbumButton.click();

    await expect(page).toHaveURL(/\/albums\/[^/]+$/);
    const detail = new AlbumDetailPage(page);
    await expect(detail.titleInput).toBeVisible();
  });

  test('AB-03: renaming an album shows up in the new title', async ({ page, mockedApp }) => {
    const user = await mockedApp.loginAs();
    const album = createAlbum({ albumName: 'Untitled' });
    await installAlbumsMock(mockedApp.context, { owner: user, albums: [album] });
    await installTimelineMock(mockedApp.context, []);

    const detail = new AlbumDetailPage(page);
    await detail.goto(album.id);
    await expect(detail.titleInput).toHaveValue('Untitled');

    await detail.renameTo('Renamed Album');

    await page.reload();
    await expect(detail.titleInput).toHaveValue('Renamed Album');
  });

  async function openShareModal(detail: AlbumDetailPage, timeline: TimelinePage, assetId: string) {
    await timeline.selectAsset(assetId);
    await detail.shareButton.click();
  }

  test('AB-04 [BASE]: sharing with no option changes uses the modal\'s own defaults', async ({ page, mockedApp }) => {
    const user = await mockedApp.loginAs();
    const album = createAlbum({ albumName: 'Shared Album' });
    const asset = createAsset({ localDateTime: '2026-02-10T10:00:00.000Z' });
    await installAlbumsMock(mockedApp.context, { owner: user, albums: [album] });
    await installTimelineMock(mockedApp.context, [asset], { ownerId: user.id });
    const sharedLinkRequests = await installSharedLinkMock(mockedApp.context);

    const detail = new AlbumDetailPage(page);
    const timeline = new TimelinePage(page);
    await detail.goto(album.id);
    await openShareModal(detail, timeline, asset.id);
    await detail.createLinkButton.click();

    await expect.poll(() => sharedLinkRequests.length).toBe(1);
    expect(sharedLinkRequests[0]).toMatchObject({
      assetIds: [asset.id],
      allowDownload: true,
      allowUpload: false,
      password: '',
      expiresAt: null,
    });
  });

  test('AB-05 [C1=false]: turning off "allow download" is reflected in the request', async ({ page, mockedApp }) => {
    const user = await mockedApp.loginAs();
    const album = createAlbum({ albumName: 'Shared Album' });
    const asset = createAsset({ localDateTime: '2026-02-10T10:00:00.000Z' });
    await installAlbumsMock(mockedApp.context, { owner: user, albums: [album] });
    await installTimelineMock(mockedApp.context, [asset], { ownerId: user.id });
    const sharedLinkRequests = await installSharedLinkMock(mockedApp.context);

    const detail = new AlbumDetailPage(page);
    const timeline = new TimelinePage(page);
    await detail.goto(album.id);
    await openShareModal(detail, timeline, asset.id);
    await detail.shareAllowDownloadSwitch.click();
    await detail.createLinkButton.click();

    await expect.poll(() => sharedLinkRequests.length).toBe(1);
    expect(sharedLinkRequests[0]).toMatchObject({ allowDownload: false });
  });

  test('AB-06 [C2=true]: turning on "allow upload" is reflected in the request', async ({ page, mockedApp }) => {
    const user = await mockedApp.loginAs();
    const album = createAlbum({ albumName: 'Shared Album' });
    const asset = createAsset({ localDateTime: '2026-02-10T10:00:00.000Z' });
    await installAlbumsMock(mockedApp.context, { owner: user, albums: [album] });
    await installTimelineMock(mockedApp.context, [asset], { ownerId: user.id });
    const sharedLinkRequests = await installSharedLinkMock(mockedApp.context);

    const detail = new AlbumDetailPage(page);
    const timeline = new TimelinePage(page);
    await detail.goto(album.id);
    await openShareModal(detail, timeline, asset.id);
    await detail.shareAllowUploadSwitch.click();
    await detail.createLinkButton.click();

    await expect.poll(() => sharedLinkRequests.length).toBe(1);
    expect(sharedLinkRequests[0]).toMatchObject({ allowUpload: true });
  });

  test('AB-07 [C3=set]: setting a password is reflected in the request', async ({ page, mockedApp }) => {
    const user = await mockedApp.loginAs();
    const album = createAlbum({ albumName: 'Shared Album' });
    const asset = createAsset({ localDateTime: '2026-02-10T10:00:00.000Z' });
    await installAlbumsMock(mockedApp.context, { owner: user, albums: [album] });
    await installTimelineMock(mockedApp.context, [asset], { ownerId: user.id });
    const sharedLinkRequests = await installSharedLinkMock(mockedApp.context);

    const detail = new AlbumDetailPage(page);
    const timeline = new TimelinePage(page);
    await detail.goto(album.id);
    await openShareModal(detail, timeline, asset.id);
    await detail.sharePasswordInput.fill('correct-horse-battery-staple');
    await detail.createLinkButton.click();

    await expect.poll(() => sharedLinkRequests.length).toBe(1);
    expect(sharedLinkRequests[0]).toMatchObject({ password: 'correct-horse-battery-staple' });
  });

  test('AB-08 [C4=set]: setting an expiry is reflected in the request', async ({ page, mockedApp }) => {
    const user = await mockedApp.loginAs();
    const album = createAlbum({ albumName: 'Shared Album' });
    const asset = createAsset({ localDateTime: '2026-02-10T10:00:00.000Z' });
    await installAlbumsMock(mockedApp.context, { owner: user, albums: [album] });
    await installTimelineMock(mockedApp.context, [asset], { ownerId: user.id });
    const sharedLinkRequests = await installSharedLinkMock(mockedApp.context);

    const detail = new AlbumDetailPage(page);
    const timeline = new TimelinePage(page);
    await detail.goto(album.id);
    await openShareModal(detail, timeline, asset.id);
    await detail.shareExpiryFirstPresetButton.click();
    await detail.createLinkButton.click();

    await expect.poll(() => sharedLinkRequests.length).toBe(1);
    expect(sharedLinkRequests[0].expiresAt).not.toBeNull();
  });

  test('AB-09: adding a library asset to an album sends the request and shows it in the grid', async ({
    page,
    mockedApp,
  }) => {
    const user = await mockedApp.loginAs();
    const album = createAlbum({ albumName: 'Holiday' });
    const candidate = createAsset({ localDateTime: '2026-02-10T10:00:00.000Z' });
    const albumAssets = await installAlbumAssetsMock(mockedApp.context, {
      owner: user,
      album,
      initialAssets: [],
      library: [candidate],
    });

    const detail = new AlbumDetailPage(page);
    const timeline = new TimelinePage(page);
    await detail.goto(album.id);

    await detail.selectPhotosButton.click();
    await expect(timeline.thumbnail(candidate.id)).toBeVisible();

    await timeline.selectAsset(candidate.id);
    await detail.addAssetsButton.click();

    await expect.poll(() => albumAssets.addRequests.length).toBe(1);
    expect(albumAssets.addRequests[0]).toEqual([candidate.id]);

    await expect(timeline.thumbnail(candidate.id)).toBeVisible();
  });

  test('AB-10: removing an asset from an album sends the request and drops it from the grid', async ({
    page,
    mockedApp,
  }) => {
    const user = await mockedApp.loginAs();
    const album = createAlbum({ albumName: 'Holiday' });
    const kept = createAsset({ localDateTime: '2026-02-10T10:00:00.000Z' });
    const removed = createAsset({ localDateTime: '2026-02-05T10:00:00.000Z' });
    const albumAssets = await installAlbumAssetsMock(mockedApp.context, {
      owner: user,
      album,
      initialAssets: [kept, removed],
    });

    const detail = new AlbumDetailPage(page);
    const timeline = new TimelinePage(page);
    await detail.goto(album.id);
    await expect(timeline.thumbnail(kept.id)).toBeVisible();
    await expect(timeline.thumbnail(removed.id)).toBeVisible();

    await timeline.selectAsset(removed.id);
    await detail.removeSelectedFromAlbum();

    await expect.poll(() => albumAssets.removeRequests.length).toBe(1);
    expect(albumAssets.removeRequests[0]).toEqual([removed.id]);

    await expect(timeline.thumbnail(removed.id)).toHaveCount(0);
    await expect(timeline.thumbnail(kept.id)).toBeVisible();
  });
});
