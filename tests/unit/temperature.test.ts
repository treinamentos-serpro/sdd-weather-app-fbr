import { describe, expect, it } from 'vitest';
import { convertTemperature, formatTemperature, unitLabel } from '../../src/lib/temperature';

describe('convertTemperature', () => {
  it.each([
    [0, 32],
    [100, 212],
    [-40, -40],
  ])('converts %d°C to %d°F', (celsius, fahrenheit) => {
    expect(convertTemperature(celsius, 'fahrenheit')).toBe(fahrenheit);
  });

  it('returns the original Celsius value for the Celsius unit', () => {
    expect(convertTemperature(21.5, 'celsius')).toBe(21.5);
  });
});

describe('formatTemperature', () => {
  it('rounds the converted value and appends the Fahrenheit symbol', () => {
    expect(formatTemperature(20.4, 'fahrenheit')).toBe('69°F');
  });

  it('rounds the Celsius value and appends the Celsius symbol', () => {
    expect(formatTemperature(20.6, 'celsius')).toBe('21°C');
  });

  it('uses a dash instead of exposing an invalid temperature', () => {
    expect(formatTemperature(Number.NaN, 'celsius')).toBe('—');
  });
});

describe('unitLabel', () => {
  it('returns the symbol for each supported unit', () => {
    expect(unitLabel('celsius')).toBe('°C');
    expect(unitLabel('fahrenheit')).toBe('°F');
  });
});
