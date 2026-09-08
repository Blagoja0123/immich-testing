import type { BrowserContext } from '@playwright/test';
import { nextSharedLinkId, toAlbumResponse, toUuid, type MockAlbum, type MockUser } from '../generators/data.js';

export interface AlbumsMockOptions {
  owner: MockUser;
  albums?: MockAlbum[];
}


export async function installAlbumsMock(context: BrowserContext, options: AlbumsMockOptions) {
  const albums = options.albums ?? [];
  const { owner } = options;

  await context.route(/\/api\/albums(\?|$)/, (route) => {
    if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON() as { albumName: string };
      const album: MockAlbum = { id: toUuid('c', albums.length + 1), albumName: body.albumName || 'Untitled', assetCount: 0 };
      albums.push(album);
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        json: toAlbumResponse(album, owner),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: albums.map((a) => toAlbumResponse(a, owner)),
    });
  });

  await context.route(/\/api\/albums\/[^/]+$/, (route) => {
    const id = route.request().url().split('/').pop()!.split('?')[0];
    const album = albums.find((a) => a.id === id);
    if (!album) {
      return route.fulfill({ status: 404, contentType: 'application/json', json: { message: 'Not found' } });
    }

    if (route.request().method() === 'PATCH') {
      const body = route.request().postDataJSON() as { albumName?: string };
      if (body.albumName !== undefined) album.albumName = body.albumName;
      return route.fulfill({ status: 200, contentType: 'application/json', json: toAlbumResponse(album, owner) });
    }

    return route.fulfill({ status: 200, contentType: 'application/json', json: toAlbumResponse(album, owner) });
  });

  await context.route(/\/api\/albums\/[^/]+\/assets$/, (route) => {
    const id = route.request().url().split('/').at(-2)!;
    const album = albums.find((a) => a.id === id);
    const body = route.request().postDataJSON() as { ids: string[] };
    if (album) {
      album.assetCount += body.ids.length;
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: body.ids.map((assetId) => ({ id: assetId, success: true })),
    });
  });

  await context.route(/\/api\/albums\/[^/]+\/map-markers/, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', json: [] }),
  );
}

export async function installSharedLinkMock(context: BrowserContext) {
  const requests: Array<Record<string, unknown>> = [];

  await context.route(/\/api\/shared-links$/, (route) => {
    if (route.request().method() !== 'POST') {
      return route.fallback();
    }
    const body = route.request().postDataJSON() as Record<string, unknown>;
    requests.push(body);
    const id = nextSharedLinkId();
    return route.fulfill({
      status: 201,
      contentType: 'application/json',
      json: {
        id,
        key: 'mock-key',
        type: body.type,
        albumId: body.albumId ?? null,
        description: body.description ?? null,
        password: body.password || null,
        allowUpload: body.allowUpload ?? false,
        allowDownload: body.allowDownload ?? true,
        showMetadata: body.showMetadata ?? true,
        expiresAt: body.expiresAt ?? null,
        slug: body.slug || null,
        createdAt: '2026-01-01T00:00:00.000Z',
        userId: 'owner-1',
        assets: [],
      },
    });
  });

  await context.route(/\/api\/shared-links\/[^/]+$/, (route) => {
    if (route.request().method() !== 'GET') {
      return route.fallback();
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: {
        id: route.request().url().split('/').pop(),
        key: 'mock-key',
        type: 'ALBUM',
        description: null,
        password: null,
        allowUpload: false,
        allowDownload: true,
        showMetadata: true,
        expiresAt: null,
        slug: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        userId: 'owner-1',
        assets: [],
      },
    });
  });

  return requests;
}
