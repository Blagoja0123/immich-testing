import type { BrowserContext } from '@playwright/test';
import type { MockAsset } from '../generators/data.js';

function toAssetResponse(asset: MockAsset, ownerId: string) {
  return {
    id: asset.id,
    originalFileName: asset.originalFileName,
    type: asset.type,
    isFavorite: asset.isFavorite,
    visibility: asset.isArchived ? 'archive' : 'timeline',
    localDateTime: asset.localDateTime,
    fileCreatedAt: asset.localDateTime,
    fileModifiedAt: asset.localDateTime,
    ownerId,
    exifInfo: {},
    tags: [],
  };
}


export async function installSearchMock(context: BrowserContext, results: MockAsset[], ownerId: string) {
  await context.route(/\/api\/search\/metadata$/, (route) => {
    if (route.request().method() !== 'POST') {
      return route.fallback();
    }
    const items = results.map((asset) => toAssetResponse(asset, ownerId));
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: {
        albums: { total: 0, count: 0, items: [], facets: [] },
        assets: { total: items.length, count: items.length, items, facets: [], nextPage: null },
      },
    });
  });
}
