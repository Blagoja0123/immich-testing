import type { BrowserContext } from '@playwright/test';
import { toAlbumResponse, type MockAlbum, type MockAsset, type MockUser } from '../generators/data.js';
import { buildAssetDetail, buildBucketPayload, buildBucketsPayload, installThumbnailMock } from './timeline.js';

export interface AlbumAssetsMockOptions {
  owner: MockUser;
  album: MockAlbum;
  initialAssets?: MockAsset[];
  library?: MockAsset[];
}

export interface AlbumAssetsMockHandle {
  addRequests: string[][];
  removeRequests: string[][];
  currentAssetIds: () => string[];
}

export async function installAlbumAssetsMock(
  context: BrowserContext,
  options: AlbumAssetsMockOptions,
): Promise<AlbumAssetsMockHandle> {
  const { owner, album } = options;
  const ownerId = owner.id;
  const initial = options.initialAssets ?? [];
  const library = options.library ?? [];

  const memberIds = new Set(initial.map((a) => a.id));
  const byId = new Map<string, MockAsset>();
  for (const asset of [...initial, ...library]) byId.set(asset.id, asset);

  const members = () => [...memberIds].map((id) => byId.get(id)).filter((a): a is MockAsset => Boolean(a));

  const addRequests: string[][] = [];
  const removeRequests: string[][] = [];

  await context.route(/\/api\/albums\/[^/]+\/assets$/, (route) => {
    const method = route.request().method();
    const body = route.request().postDataJSON() as { ids: string[] };
    if (method === 'PUT') {
      addRequests.push(body.ids);
      for (const id of body.ids) memberIds.add(id);
    } else if (method === 'DELETE') {
      removeRequests.push(body.ids);
      for (const id of body.ids) memberIds.delete(id);
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: body.ids.map((id) => ({ id, success: true })),
    });
  });

  await context.route(/\/api\/albums\/[^/]+\/map-markers/, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', json: [] }),
  );

  await context.route(/\/api\/albums\/[^/]+$/, (route) => {
    const id = route.request().url().split('/').pop()!.split('?')[0];
    if (id !== album.id) {
      return route.fulfill({ status: 404, contentType: 'application/json', json: { message: 'Not found' } });
    }
    const current: MockAlbum = { ...album, assetCount: memberIds.size };
    return route.fulfill({ status: 200, contentType: 'application/json', json: toAlbumResponse(current, owner) });
  });

  await context.route(/\/api\/timeline\/buckets(\?|$)/, (route) => {
    const url = new URL(route.request().url());
    const assets = url.searchParams.has('albumId') ? members() : library;
    return route.fulfill({ status: 200, contentType: 'application/json', json: buildBucketsPayload(assets) });
  });

  await context.route(/\/api\/timeline\/bucket(\?|$)/, (route) => {
    const url = new URL(route.request().url());
    const assets = url.searchParams.has('albumId') ? members() : library;
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
    const asset = byId.get(id);
    if (!asset) {
      return route.fulfill({ status: 404, contentType: 'application/json', json: { message: 'Not found' } });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', json: buildAssetDetail(asset, ownerId) });
  });

  return { addRequests, removeRequests, currentAssetIds: () => [...memberIds] };
}
