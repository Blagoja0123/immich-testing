import { SvelteSet } from 'svelte/reactivity';
import { plainDateTimeCompare, setDifference, type TimelineDateTime } from '$lib/utils/timeline-util';

const dt = (overrides: Partial<TimelineDateTime> = {}): TimelineDateTime => ({
  year: 2020,
  month: 6,
  day: 15,
  hour: 12,
  minute: 30,
  second: 30,
  millisecond: 500,
  ...overrides,
});

describe('timeline-util', () => {
  describe('plainDateTimeCompare', () => {
    const earlier = dt();

    it.each([
      { field: 'year', later: dt({ year: 2021 }) },
      { field: 'month', later: dt({ month: 7 }) },
      { field: 'day', later: dt({ day: 16 }) },
      { field: 'hour', later: dt({ hour: 13 }) },
      { field: 'minute', later: dt({ minute: 31 }) },
      { field: 'second', later: dt({ second: 31 }) },
      { field: 'millisecond', later: dt({ millisecond: 501 }) },
    ])('UT-21 ascending orders the earlier instant first when $field differs', ({ later }) => {
      expect(Math.sign(plainDateTimeCompare(true, earlier, later))).toBe(-1);
      expect(Math.sign(plainDateTimeCompare(true, later, earlier))).toBe(1);
    });

    it('UT-22 descending reverses the ordering', () => {
      const later = dt({ year: 2021 });
      expect(Math.sign(plainDateTimeCompare(false, earlier, later))).toBe(1);
      expect(Math.sign(plainDateTimeCompare(false, later, earlier))).toBe(-1);
    });

    it.each([true, false])('UT-23 two equal instants compare as 0 (ascending=%s)', (ascending) => {
      expect(plainDateTimeCompare(ascending, dt(), dt())).toBe(0);
    });
  });

  describe('setDifference', () => {
    it('UT-24 disjoint sets return all of A', () => {
      expect([...setDifference(new Set([1, 2]), new Set([3, 4]))]).toEqual([1, 2]);
    });

    it('UT-25 overlapping sets return only the members unique to A', () => {
      expect([...setDifference(new Set([1, 2, 3]), new Set([2, 3, 4]))]).toEqual([1]);
    });

    it('UT-26 A being a subset of B returns empty', () => {
      expect([...setDifference(new Set([1, 2]), new Set([1, 2, 3]))]).toEqual([]);
    });

    it('UT-27 equal sets return empty', () => {
      expect([...setDifference(new Set([1, 2]), new Set([1, 2]))]).toEqual([]);
    });

    it('UT-28 an empty A returns empty', () => {
      expect([...setDifference(new Set<number>(), new Set([1]))]).toEqual([]);
    });

    it('UT-29 an empty B returns all of A', () => {
      expect([...setDifference(new Set([1, 2]), new Set<number>())]).toEqual([1, 2]);
    });

    it('UT-30 returns a SvelteSet instance', () => {
      expect(setDifference(new Set([1]), new Set<number>())).toBeInstanceOf(SvelteSet);
    });
  });
});
