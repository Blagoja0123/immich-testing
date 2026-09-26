/**
 * Unit tests for album sorting/filter helpers (src/lib/utils/album-utils.ts).
 *
 * Input Space Partitioning — sortAlbums(albums, { sortBy, orderBy }):
 *   C1 sortBy : b1 known key (base: Title) | b2 each other known key | b3 unknown key
 *   C2 orderBy: b1 'asc' (base)           | b2 'desc'                | b3 any other string
 *   C3 dates  : b1 all albums dated (base) | b2 some albums missing endDate
 * Base Choice Coverage: base (Title, asc, dated) + one test per non-base block.
 */
import { init, register, waitLocale } from 'svelte-i18n';
import { AlbumFilter, AlbumSortBy, SortOrder } from '$lib/stores/preferences.store';
import { findFilterOption, findSortOptionMetadata, sortAlbums, stringToSortOrder } from '$lib/utils/album-utils';
import { albumFactory } from '@test-data/factories/album-factory';

const names = (albums: { albumName: string }[]) => albums.map(({ albumName }) => albumName);

describe('album-utils', () => {
  beforeAll(async () => {
    await init({ fallbackLocale: 'en-US' });
    register('en-US', () => import('$i18n/en.json'));
    await waitLocale('en-US');
  });

  describe('stringToSortOrder', () => {
    it('UT-01 maps "desc" to Desc', () => {
      expect(stringToSortOrder('desc')).toBe(SortOrder.Desc);
    });

    it.each(['asc', '', 'DESC', 'garbage'])('UT-02 maps %j to Asc (default)', (value) => {
      expect(stringToSortOrder(value)).toBe(SortOrder.Asc);
    });
  });

  describe('findSortOptionMetadata', () => {
    it.each(Object.values(AlbumSortBy))('UT-03 finds metadata for %s', (sortBy) => {
      expect(findSortOptionMetadata(sortBy).id).toBe(sortBy);
    });

    it('UT-04 falls back to MostRecentPhoto for an unknown key', () => {
      expect(findSortOptionMetadata('nope').id).toBe(AlbumSortBy.MostRecentPhoto);
    });
  });

  describe('findFilterOption', () => {
    it.each(Object.values(AlbumFilter))('UT-05 finds filter %s', (filter) => {
      expect(findFilterOption(filter)).toBe(filter);
    });

    it('UT-06 falls back to All for an unknown filter', () => {
      expect(findFilterOption('nope')).toBe(AlbumFilter.All);
    });
  });

  describe('sortAlbums', () => {
    const banana = albumFactory.build({
      albumName: 'Banana',
      assetCount: 2,
      createdAt: '2024-02-01T00:00:00.000Z',
      updatedAt: '2024-03-01T00:00:00.000Z',
      startDate: '2020-01-01T00:00:00.000Z',
      endDate: '2021-01-01T00:00:00.000Z',
    });
    const apple = albumFactory.build({
      albumName: 'apple',
      assetCount: 10,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-05-01T00:00:00.000Z',
      startDate: '2019-01-01T00:00:00.000Z',
      endDate: '2023-01-01T00:00:00.000Z',
    });
    const cherry = albumFactory.build({
      albumName: 'Cherry',
      assetCount: 5,
      createdAt: '2024-03-01T00:00:00.000Z',
      updatedAt: '2024-04-01T00:00:00.000Z',
      startDate: '2022-01-01T00:00:00.000Z',
      endDate: '2022-06-01T00:00:00.000Z',
    });
    const albums = [banana, apple, cherry];

    it('UT-07 base: Title asc sorts case-insensitively by locale', () => {
      expect(names(sortAlbums(albums, { sortBy: AlbumSortBy.Title, orderBy: 'asc' }))).toEqual([
        'apple',
        'Banana',
        'Cherry',
      ]);
    });

    it('UT-08 Title desc reverses the order', () => {
      expect(names(sortAlbums(albums, { sortBy: AlbumSortBy.Title, orderBy: 'desc' }))).toEqual([
        'Cherry',
        'Banana',
        'apple',
      ]);
    });

    it('UT-09 an unrecognised orderBy is treated as asc', () => {
      expect(names(sortAlbums(albums, { sortBy: AlbumSortBy.Title, orderBy: 'sideways' }))).toEqual([
        'apple',
        'Banana',
        'Cherry',
      ]);
    });

    it.each([
      { sortBy: AlbumSortBy.ItemCount, expected: ['Banana', 'Cherry', 'apple'] },
      { sortBy: AlbumSortBy.DateModified, expected: ['Banana', 'Cherry', 'apple'] },
      { sortBy: AlbumSortBy.DateCreated, expected: ['apple', 'Banana', 'Cherry'] },
      { sortBy: AlbumSortBy.MostRecentPhoto, expected: ['Banana', 'Cherry', 'apple'] },
      { sortBy: AlbumSortBy.OldestPhoto, expected: ['apple', 'Banana', 'Cherry'] },
    ])('UT-10 $sortBy asc orders by the matching field', ({ sortBy, expected }) => {
      expect(names(sortAlbums(albums, { sortBy, orderBy: 'asc' }))).toEqual(expected);
    });

    it('UT-11 an unknown sortBy falls back to DateModified', () => {
      expect(sortAlbums(albums, { sortBy: 'nope', orderBy: 'desc' })).toEqual(
        sortAlbums(albums, { sortBy: AlbumSortBy.DateModified, orderBy: 'desc' }),
      );
    });

    it.each(['asc', 'desc'])('UT-12 albums without photos (no endDate) go last for MostRecentPhoto %s', (orderBy) => {
      const empty = albumFactory.build({ albumName: 'Empty', startDate: undefined, endDate: undefined });
      const sorted = sortAlbums([empty, ...albums], { sortBy: AlbumSortBy.MostRecentPhoto, orderBy });
      expect(sorted.at(-1)).toBe(empty);
    });

    it('UT-13 does not mutate the input array', () => {
      const input = [...albums];
      sortAlbums(input, { sortBy: AlbumSortBy.Title, orderBy: 'desc' });
      expect(input).toEqual(albums);
    });
  });
});
