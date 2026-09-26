import type { BrowserContext } from '@playwright/test';
import { toAlbumResponse, type MockAlbum, type MockAsset, type MockUser } from '../generators/data.js';
import { buildAssetDetail, buildBucketPayload, buildBucketsPayload, installThumbnailMock } from './timeline.js';

export interface PublicShareMockOptions {
  key: string;
  owner: MockUser;
  album: MockAlbum;
  assets: MockAsset[];
  password?: string;
  allowDownload?: boolean;
  allowUpload?: boolean;
}

export interface PublicShareMockHandle {
  loginPasswords: string[];
}

export async function installPublicShareMock(
  context: BrowserContext,
  options: PublicShareMockOptions,
): Promise<PublicShareMockHandle> {
  const { key, owner, album, assets } = options;
  const ownerId = owner.id;
  let unlocked = !options.password;
  const loginPasswords: string[] = [];

  const sharedLink = () => ({
    id: '00000000-0000-4000-8000-d00000000001',
    key,
    type: 'ALBUM',
    album: toAlbumResponse({ ...album, assetCount: assets.length }, owner),
    assets: assets.map((asset) => buildAssetDetail(asset, ownerId)),
    allowDownload: options.allowDownload ?? true,
    allowUpload: options.allowUpload ?? false,
    createdAt: '2026-01-01T00:00:00.000Z',
    description: null,
    expiresAt: null,
    password: options.password ?? null,
    showMetadata: true,
    slug: null,
    userId: ownerId,
  });

  await context.route(/\/api\/shared-links\/me(\?|$)/, (route) => {
    if (!unlocked) {
      return route.fulfill({
        status: 401,
        contentType: 'application/json',
        json: { message: 'Password required', statusCode: 401 },
      });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', json: sharedLink() });
  });

  await context.route(/\/api\/shared-links\/login(\?|$)/, (route) => {
    if (route.request().method() !== 'POST') {
      return route.fallback();
    }
    const body = route.request().postDataJSON() as { password: string };
    loginPasswords.push(body.password);
    if (options.password && body.password !== options.password) {
      return route.fulfill({
        status: 401,
        contentType: 'application/json',
        json: { message: 'Wrong password', statusCode: 401 },
      });
    }
    unlocked = true;
    return route.fulfill({ status: 201, contentType: 'application/json', json: sharedLink() });
  });

  await context.route(/\/api\/timeline\/buckets(\?|$)/, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', json: buildBucketsPayload(assets) }),
  );

  await context.route(/\/api\/timeline\/bucket(\?|$)/, (route) => {
    const url = new URL(route.request().url());
    const timeBucket = url.searchParams.get('timeBucket') ?? '';
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: buildBucketPayload(assets, timeBucket, ownerId),
    });
  });

  await installThumbnailMock(context);

  await context.route(/\/api\/assets\/[^/]+$/, (route) => {
    if (route.request().method() !== 'GET') {
      return route.fallback();
    }
    const id = route.request().url().split('/').pop()!.split('?')[0];
    const asset = assets.find((a) => a.id === id);
    if (!asset) {
      return route.fulfill({ status: 404, contentType: 'application/json', json: { message: 'Not found' } });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', json: buildAssetDetail(asset, ownerId) });
  });

  return { loginPasswords };
}
