import type { ByteUnit } from '$lib/utils/byte-units';
import { convertFromBytes, convertToBytes, getByteUnitString, getBytesWithUnit } from '$lib/utils/byte-units';

describe('byte-units', () => {
  describe('getBytesWithUnit', () => {
    it.each([
      { bytes: 512, size: 512, unit: 'B' },
      { bytes: 1024, size: 1, unit: 'KiB' },
      { bytes: 1024 ** 2, size: 1, unit: 'MiB' },
      { bytes: 1024 ** 3, size: 1, unit: 'GiB' },
      { bytes: 1024 ** 4, size: 1, unit: 'TiB' },
      { bytes: 1024 ** 5, size: 1, unit: 'PiB' },
      { bytes: 1024 ** 6, size: 1, unit: 'EiB' },
    ])('UT-31 $bytes bytes is reported as $size $unit', ({ bytes, size, unit }) => {
      expect(getBytesWithUnit(bytes)).toEqual([size, unit]);
    });

    it('UT-32 rounds a fractional value to one decimal by default', () => {
      expect(getBytesWithUnit(1536)).toEqual([1.5, 'KiB']);
    });

    it('UT-33 zero bytes is reported as 0 B', () => {
      expect(getBytesWithUnit(0)).toEqual([0, 'B']);
    });

    it('UT-34 maxPrecision controls the number of decimals', () => {
      expect(getBytesWithUnit(1234, 0)).toEqual([1, 'KiB']);
      expect(getBytesWithUnit(1234, 2)).toEqual([1.21, 'KiB']);
    });
  });

  describe('getByteUnitString', () => {
    it('UT-35 formats the value and unit for the given locale', () => {
      expect(getByteUnitString(1536, 'en-US')).toBe('1.5 KiB');
      expect(getByteUnitString(1536, 'de-DE')).toBe('1,5 KiB');
    });
  });

  describe('conversions', () => {
    it.each(['KiB', 'MiB', 'GiB', 'TiB'])('UT-36 convertToBytes then convertFromBytes round-trips for %s', (unit) => {
      const bytes = convertToBytes(1, unit as ByteUnit);
      expect(convertFromBytes(bytes, unit as ByteUnit)).toBe(1);
    });

    it('UT-37 convertToBytes matches the unit magnitude', () => {
      expect(convertToBytes(1, 'GiB' as ByteUnit)).toBe(1024 ** 3);
      expect(convertFromBytes(1024 ** 3, 'GiB' as ByteUnit)).toBe(1);
    });
  });
});
