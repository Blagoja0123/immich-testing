import type { BrowserContext } from '@playwright/test';
import { toUuid } from '../generators/data.js';

export interface UploadMockOptions {
  duplicateFileNames?: string[];
  failUpload?: boolean;
}


export async function installUploadMock(context: BrowserContext, options: UploadMockOptions = {}) {
  const duplicateFileNames = new Set(options.duplicateFileNames ?? []);
  const uploads: number[] = [];
  let uploadCounter = 0;

  await context.route(/\/api\/assets\/bulk-upload-check$/, (route) => {
    const body = route.request().postDataJSON() as { assets: Array<{ id: string }> };
    const results = body.assets.map(({ id }) =>
      duplicateFileNames.has(id)
        ? { id, action: 'reject', reason: 'duplicate', assetId: toUuid('b', 999), isTrashed: false }
        : { id, action: 'accept' },
    );
    return route.fulfill({ status: 200, contentType: 'application/json', json: { results } });
  });

  await context.route(/\/api\/assets$/, (route) => {
    if (route.request().method() !== 'POST') {
      return route.fallback();
    }
    uploadCounter += 1;
    uploads.push(uploadCounter);
    if (options.failUpload) {
      return route.fulfill({
        status: 500,
        contentType: 'application/json',
        json: { message: 'Internal server error', statusCode: 500 },
      });
    }
    return route.fulfill({
      status: 201,
      contentType: 'application/json',
      json: { id: toUuid('b', 500 + uploadCounter), status: 'created' },
    });
  });

  return uploads;
}
