import type { BrowserContext, Route } from '@playwright/test';
import { toUserAdminResponse, toUserPreferencesResponse, type MockUser } from '../generators/data.js';

const COOKIE_HOST = '127.0.0.1';

export interface PublicConfigOptions {
  passwordLoginEnabled?: boolean;
  oauthEnabled?: boolean;
  loginPageMessage?: string;
}

export async function installPublicConfigMock(context: BrowserContext, options: PublicConfigOptions = {}) {
  await context.route('**/api/public/config', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: {
        oauth: {
          enabled: options.oauthEnabled ?? false,
          autoLaunch: false,
          buttonText: 'Login with OAuth',
        },
        passwordLogin: { enabled: options.passwordLoginEnabled ?? true },
        server: { loginPageMessage: options.loginPageMessage ?? '' },
        theme: { customCss: '' },
      },
    }),
  );
}

export async function installLoginMock(
  context: BrowserContext,
  user: MockUser,
  validCredentials?: { email: string; password: string },
) {
  await context.route('**/api/auth/login', async (route) => {
    const body = route.request().postDataJSON() as { email: string; password: string };

    if (validCredentials && (body.email !== validCredentials.email || body.password !== validCredentials.password)) {
      return route.fulfill({
        status: 401,
        contentType: 'application/json',
        json: { message: 'Incorrect email or password', statusCode: 401 },
      });
    }

    await context.addCookies([
      { name: 'immich_is_authenticated', value: 'true', domain: COOKIE_HOST, path: '/' },
    ]);

    return route.fulfill({
      status: 201,
      contentType: 'application/json',
      json: {
        accessToken: 'mock-access-token',
        isAdmin: user.isAdmin,
        isOnboarded: true,
        name: user.name,
        profileImagePath: '',
        shouldChangePassword: false,
        userEmail: user.email,
        userId: user.id,
      },
    });
  });
}


export async function installAuthenticatedUserMocks(context: BrowserContext, user: MockUser) {
  await context.route('**/api/users/me', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', json: toUserAdminResponse(user) }),
  );
  await context.route('**/users/me/preferences', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', json: toUserPreferencesResponse() }),
  );
  await context.route('**/server/about', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: { version: 'v2.2.3', licensed: false, build: 'test', nodejs: 'v22', exiftool: '', ffmpeg: '', libvips: '', imagemagick: '' },
    }),
  );
}

export async function markAuthenticated(context: BrowserContext) {
  await context.addCookies([{ name: 'immich_is_authenticated', value: 'true', domain: COOKIE_HOST, path: '/' }]);
}

export async function installLogoutMock(context: BrowserContext) {
  await context.route('**/api/auth/logout', async (route) => {
    if (route.request().method() !== 'POST') {
      return route.fallback();
    }
    await context.clearCookies();
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: { successful: true, redirectUri: '/auth/login' },
    });
  });
}

export async function installExpiredSessionMocks(context: BrowserContext) {
  await markAuthenticated(context);
  const unauthorized = (route: Route) =>
    route.fulfill({ status: 401, contentType: 'application/json', json: { message: 'Unauthorized', statusCode: 401 } });
  await context.route('**/api/users/me', unauthorized);
  await context.route('**/users/me/preferences', unauthorized);
}
