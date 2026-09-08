import { test, expect } from '../fixtures/test.js';
import { installSearchMock } from '../mocks/search.js';
import { installTimelineMock } from '../mocks/timeline.js';
import { createAsset } from '../generators/data.js';
import { SearchPage } from '../pages/SearchPage.js';
import { TimelinePage } from '../pages/TimelinePage.js';


test.describe('Search', () => {
  test('SR-01: submitting a query navigates to results and renders matches', async ({ page, mockedApp }) => {
    const user = await mockedApp.loginAs();
    const matches = [createAsset({ originalFileName: 'beach.jpg' })];
    await installTimelineMock(mockedApp.context, matches, { ownerId: user.id });
    await installSearchMock(mockedApp.context, matches, user.id);

    const search = new SearchPage(page);
    const timeline = new TimelinePage(page);
    await search.goto();
    await search.search('beach');

    await expect(page).toHaveURL(/\/search/);
    await expect(timeline.thumbnail(matches[0].id)).toBeVisible();
  });

  test('SR-02: a query with no matches shows the empty-results state', async ({ page, mockedApp }) => {
    const user = await mockedApp.loginAs();
    await installTimelineMock(mockedApp.context, []);
    await installSearchMock(mockedApp.context, [], user.id);

    const search = new SearchPage(page);
    await search.goto();
    await search.search('nonexistent-query-xyz');

    await expect(search.emptyResultsMessage).toBeVisible();
  });
});
