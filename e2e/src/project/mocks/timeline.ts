import type { BrowserContext } from '@playwright/test';
import type { MockAsset } from '../generators/data.js';

const PLACEHOLDER_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);

export async function installEmptyTimelineMock(context: BrowserContext) {
  await context.route(/\/api\/timeline\/buckets(\?|$)/, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', json: [] }),
  );
}

function bucketKeyFor(isoDate: string): string {
  const d = new Date(isoDate);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-01T00:00:00.000Z`;
}


export async function installTimelineMock(
  context: BrowserContext,
  assets: MockAsset[],
  options: { ownerId?: string } = {},
) {
  const ownerId = options.ownerId ?? 'owner-1';

  await context.route(/\/api\/timeline\/buckets(\?|$)/, (route) => {
    const counts = new Map<string, number>();
    for (const asset of assets) {
      const key = bucketKeyFor(asset.localDateTime);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const buckets = [...counts.entries()]
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .map(([timeBucket, count]) => ({ timeBucket, count }));

    return route.fulfill({ status: 200, contentType: 'application/json', json: buckets });
  });

  await context.route(/\/api\/timeline\/bucket(\?|$)/, (route) => {
    const url = new URL(route.request().url());
    const timeBucket = url.searchParams.get('timeBucket');
    const bucketAssets = assets.filter((asset) => bucketKeyFor(asset.localDateTime) === timeBucket);

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: {
        id: bucketAssets.map((a) => a.id),
        ownerId: bucketAssets.map(() => ownerId),
        isFavorite: bucketAssets.map((a) => a.isFavorite),
        isImage: bucketAssets.map((a) => a.type === 'IMAGE'),
        isTrashed: bucketAssets.map(() => false),
        visibility: bucketAssets.map((a) => (a.isArchived ? 'archive' : 'timeline')),
        thumbhash: bucketAssets.map(() => null),
        duration: bucketAssets.map(() => null),
        ratio: bucketAssets.map(() => 1),
        createdAt: bucketAssets.map((a) => a.localDateTime),
        fileCreatedAt: bucketAssets.map((a) => a.localDateTime),
        localOffsetHours: bucketAssets.map(() => 0),
        livePhotoVideoId: bucketAssets.map(() => null),
        projectionType: bucketAssets.map(() => null),
        stack: bucketAssets.map(() => null),
      },
    });
  });

  await context.route('**/api/assets/*/thumbnail*', (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: PLACEHOLDER_PNG }),
  );

  await context.route(/\/api\/assets\/[^/]+$/, (route) => {
    if (route.request().method() !== 'GET') {
      return route.fallback();
    }
    const id = route.request().url().split('/').pop()!.split('?')[0];
    const asset = assets.find((a) => a.id === id);
    if (!asset) {
      return route.fulfill({ status: 404, contentType: 'application/json', json: { message: 'Not found' } });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: {
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
      },
    });
  });

  await context.route('**/api/assets', async (route) => {
    if (route.request().method() !== 'PUT') {
      return route.fallback();
    }
    const body = route.request().postDataJSON() as { ids: string[]; isFavorite?: boolean; visibility?: string };
    for (const asset of assets) {
      if (!body.ids.includes(asset.id)) continue;
      if (body.isFavorite !== undefined) asset.isFavorite = body.isFavorite;
      if (body.visibility !== undefined) asset.isArchived = body.visibility === 'archive';
    }
    return route.fulfill({ status: 200, contentType: 'application/json', json: {} });
  });
}
