/**
 * Unit tests for shared-link URL building (asQueryString in
 * src/lib/utils/shared-links.ts), which appends the link's slug/key to every
 * asset request made from a public shared-link page.
 *
 * Input Space Partitioning — each-choice over slug × key, each with blocks
 * { absent, empty string, plain value, value needing URL encoding }.
 */
import { asQueryString } from '$lib/utils/shared-links';

describe('asQueryString', () => {
  it.each([
    { slug: undefined, key: undefined, expected: '' },
    { slug: 'my-trip', key: undefined, expected: 'slug=my-trip' },
    { slug: undefined, key: 'abc123', expected: 'key=abc123' },
    { slug: 'my-trip', key: 'abc123', expected: 'slug=my-trip&key=abc123' },
  ])('UT-18 slug=$slug key=$key -> "$expected"', ({ slug, key, expected }) => {
    expect(asQueryString({ slug, key })).toBe(expected);
  });

  it('UT-19 treats empty strings as absent', () => {
    expect(asQueryString({ slug: '', key: '' })).toBe('');
  });

  it('UT-20 URL-encodes reserved characters', () => {
    const query = asQueryString({ slug: 'a b&c', key: 'k=/+' });
    expect(query).toBe('slug=a+b%26c&key=k%3D%2F%2B');
    expect(new URLSearchParams(query).get('slug')).toBe('a b&c');
    expect(new URLSearchParams(query).get('key')).toBe('k=/+');
  });
});
