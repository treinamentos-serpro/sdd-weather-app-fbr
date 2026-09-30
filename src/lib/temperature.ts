import type { Unit } from '../types/weather';

export function convertTemperature(valueCelsius: number, unit: Unit): number {
  return unit === 'fahrenheit' ? (valueCelsius * 9) / 5 + 32 : valueCelsius;
}

export function unitLabel(unit: Unit): string {
  return unit === 'fahrenheit' ? '°F' : '°C';
}

export function formatTemperature(valueCelsius: number, unit: Unit): string {
  if (typeof valueCelsius !== 'number' || !Number.isFinite(valueCelsius)) {
    return '—';
  }

  return `${Math.round(convertTemperature(valueCelsius, unit))}${unitLabel(unit)}`;
}
