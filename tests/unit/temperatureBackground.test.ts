import { describe, expect, it } from 'vitest';
import { getTemperatureBackground } from '../../src/lib/temperatureBackground';

describe('getTemperatureBackground', () => {
  it('selects a cold background below 10°C', () => {
    const background = getTemperatureBackground(9.9);

    expect(background.label).toBe('Paisagem fria');
    expect(background.url).toContain('images.unsplash.com');
  });

  it('selects a mild background from 10°C to 24°C', () => {
    expect(getTemperatureBackground(10).label).toBe('Ceu ameno');
    expect(getTemperatureBackground(24.9).label).toBe('Ceu ameno');
  });

  it('selects a hot background from 25°C', () => {
    expect(getTemperatureBackground(25).label).toBe('Paisagem ensolarada');
  });
});
