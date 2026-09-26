/**
 * Unit tests for search string normalisation (src/lib/utils/string-utils.ts),
 * used when filtering people/places/tags client-side.
 *
 * Input Space Partitioning — one characteristic per input property:
 *   case    : lower | upper | mixed
 *   accents : none  | precomposed (é) | decomposed (e + U+0301)
 *   script  : Latin | non-Latin
 *   length  : empty | non-empty
 */
import { normalizeSearchString, removeAccents } from '$lib/utils/string-utils';

describe('string-utils', () => {
  describe('removeAccents', () => {
    it.each([
      { input: 'cafe', expected: 'cafe' },
      { input: 'café', expected: 'cafe' },
      { input: 'café', expected: 'cafe' },
      { input: 'Ångström Über', expected: 'Angstrom Uber' },
      { input: '', expected: '' },
    ])('UT-14 removeAccents($input) = $expected', ({ input, expected }) => {
      expect(removeAccents(input)).toBe(expected);
    });

    it('UT-15 leaves non-Latin scripts without combining marks untouched', () => {
      expect(removeAccents('東京 Москва')).toBe('東京 Москва');
    });
  });

  describe('normalizeSearchString', () => {
    it.each([
      { input: 'paris', expected: 'paris' },
      { input: 'PARIS', expected: 'paris' },
      { input: 'PaRiS', expected: 'paris' },
      { input: 'Zürich', expected: 'zurich' },
      { input: 'SÃO PAULO', expected: 'sao paulo' },
      { input: '', expected: '' },
    ])('UT-16 normalizeSearchString($input) = $expected', ({ input, expected }) => {
      expect(normalizeSearchString(input)).toBe(expected);
    });

    it('UT-17 accented and plain spellings normalise to the same key', () => {
      expect(normalizeSearchString('Émilie')).toBe(normalizeSearchString('emilie'));
    });
  });
});
