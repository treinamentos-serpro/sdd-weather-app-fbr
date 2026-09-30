import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import CurrentWeather from '../../src/components/CurrentWeather';
import UnitToggle from '../../src/components/UnitToggle';
import type { City, CurrentWeather as CurrentWeatherData, Unit } from '../../src/types/weather';

const city: City = {
  id: 1,
  name: 'Curitiba',
  latitude: -25.43,
  longitude: -49.27,
};

const currentWeather: CurrentWeatherData = {
  temperatureCelsius: 0,
  weatherCode: 0,
  conditionLabel: 'Ceu limpo',
};

describe('UnitToggle + CurrentWeather', () => {
  it('renders 32°F after switching from 0°C', async () => {
    const user = userEvent.setup();
    let unit: Unit = 'celsius';
    const onChange = vi.fn((nextUnit: Unit) => {
      unit = nextUnit;
    });

    const { rerender } = render(
      <>
        <UnitToggle onChange={onChange} unit={unit} />
        <CurrentWeather city={city} unit={unit} weather={currentWeather} />
      </>,
    );

    expect(screen.getByText('0°C')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '°F' }));
    rerender(
      <>
        <UnitToggle onChange={onChange} unit={unit} />
        <CurrentWeather city={city} unit={unit} weather={currentWeather} />
      </>,
    );

    expect(screen.getByText('32°F')).toBeInTheDocument();
  });
});
