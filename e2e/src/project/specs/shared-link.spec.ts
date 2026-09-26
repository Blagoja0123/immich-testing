import { test, expect } from '../fixtures/test.js';
import { installPublicShareMock } from '../mocks/shared-link.js';
import { createAlbum, createAsset, createUser } from '../generators/data.js';
import { SharedLinkPage } from '../pages/SharedLinkPage.js';
import { TimelinePage } from '../pages/TimelinePage.js';

test.describe('Public shared link', () => {
  test('SHL-01: an album shared link renders its album and assets to an unauthenticated visitor', async ({
    page,
    mockedApp,
  }) => {
    const owner = createUser();
    const album = createAlbum({ albumName: 'Public Album' });
    const asset = createAsset({ localDateTime: '2026-02-10T10:00:00.000Z' });
    await installPublicShareMock(mockedApp.context, { key: 'open-key', owner, album, assets: [asset] });

    const share = new SharedLinkPage(page);
    const timeline = new TimelinePage(page);
    await share.goto('open-key');

    await expect(share.albumTitle('Public Album')).toBeVisible();
    await expect(timeline.thumbnail(asset.id)).toBeVisible();
  });

  test('SHL-02: a password-protected link reveals its content after the correct password', async ({
    page,
    mockedApp,
  }) => {
    const owner = createUser();
    const album = createAlbum({ albumName: 'Secret Album' });
    const asset = createAsset({ localDateTime: '2026-02-10T10:00:00.000Z' });
    const share = await installPublicShareMock(mockedApp.context, {
      key: 'locked-key',
      owner,
      album,
      assets: [asset],
      password: 'letmein',
    });

    const sharePage = new SharedLinkPage(page);
    await sharePage.goto('locked-key');
    await expect(sharePage.passwordHeading).toBeVisible();

    await sharePage.submitPassword('letmein');

    await expect(sharePage.albumTitle('Secret Album')).toBeVisible();
    expect(share.loginPasswords).toEqual(['letmein']);
  });

  test('SHL-03: a wrong password keeps the content gated', async ({ page, mockedApp }) => {
    const owner = createUser();
    const album = createAlbum({ albumName: 'Secret Album' });
    const asset = createAsset({ localDateTime: '2026-02-10T10:00:00.000Z' });
    await installPublicShareMock(mockedApp.context, {
      key: 'locked-key-2',
      owner,
      album,
      assets: [asset],
      password: 'letmein',
    });

    const sharePage = new SharedLinkPage(page);
    await sharePage.goto('locked-key-2');
    await expect(sharePage.passwordHeading).toBeVisible();

    await sharePage.submitPassword('wrong-password');

    await expect(sharePage.passwordHeading).toBeVisible();
    await expect(sharePage.albumTitle('Secret Album')).toHaveCount(0);
  });
});
