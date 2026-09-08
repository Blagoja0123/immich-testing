import { test as base, type BrowserContext } from '@playwright/test';
import { installBaseMocks } from '../mocks/base.js';
import { installAuthenticatedUserMocks, markAuthenticated } from '../mocks/auth.js';
import { installEmptyTimelineMock } from '../mocks/timeline.js';
import { createUser, resetCounters, type MockUser } from '../generators/data.js';

export interface MockedApp {
  context: BrowserContext;
  loginAs: (user?: MockUser) => Promise<MockUser>;
}

export const test = base.extend<{ mockedApp: MockedApp }>({
  mockedApp: async ({ context }, use) => {
    resetCounters();
    await installBaseMocks(context);

    await installEmptyTimelineMock(context);

    const loginAs = async (user: MockUser = createUser()) => {
      await installAuthenticatedUserMocks(context, user);
      await markAuthenticated(context);
      return user;
    };

    await use({ context, loginAs });
  },
});

export { expect } from '@playwright/test';
