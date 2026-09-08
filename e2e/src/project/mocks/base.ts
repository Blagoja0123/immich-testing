import type { BrowserContext } from '@playwright/test';

export async function installBaseMocks(context: BrowserContext) {
  await context.route('**/api/server/config', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: {
        loginPageMessage: '',
        trashDays: 30,
        userDeleteDelay: 7,
        oauthButtonText: 'Login with OAuth',
        isInitialized: true,
        isOnboarded: true,
        externalDomain: '',
        publicUsers: true,
        mapDarkStyleUrl: 'https://tiles.immich.cloud/v1/style/dark.json',
        mapLightStyleUrl: 'https://tiles.immich.cloud/v1/style/light.json',
        maintenanceMode: false,
      },
    }),
  );

  await context.route('**/api/server/features', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: {
        smartSearch: false,
        facialRecognition: false,
        duplicateDetection: false,
        map: true,
        reverseGeocoding: true,
        importFaces: false,
        sidecar: true,
        search: true,
        trash: true,
        oauth: false,
        oauthAutoLaunch: false,
        ocr: false,
        passwordLogin: true,
        configFile: false,
        email: false,
      },
    }),
  );

  await context.route('**/api/server/media-types', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: {
        video: ['.mp4', '.mov', '.webm'],
        image: ['.jpg', '.jpeg', '.png', '.heic', '.webp'],
        sidecar: ['.xmp'],
      },
    }),
  );

  await context.route('**/api/notifications*', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', json: [] }),
  );

  await context.route('**/api/memories*', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', json: [] }),
  );

  await context.route('**/api/memories/statistics*', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', json: { total: 0 } }),
  );

  await context.route('**/api/server/storage', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: {
        diskSize: '100.0 GiB',
        diskUse: '10.0 GiB',
        diskAvailable: '90.0 GiB',
        diskSizeRaw: 107_374_182_400,
        diskUseRaw: 10_737_418_240,
        diskAvailableRaw: 96_636_764_160,
        diskUsagePercentage: 10,
      },
    }),
  );

  await context.route('**/api/server/version-history', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: [{ id: 'v1', createdAt: '2026-01-01T00:00:00.000Z', version: '2.2.3' }],
    }),
  );

  await context.route('**/api/albums*', (route, request) => {
    const url = request.url();
    if (url.endsWith('albums?isShared=true') || url.endsWith('albums?isOwned=true') || url.endsWith('albums')) {
      return route.fulfill({ status: 200, contentType: 'application/json', json: [] });
    }
    return route.fallback();
  });
}
