import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ForecastCard from '../../src/components/ForecastCard';
import type { ForecastDay } from '../../src/types/weather';

const forecastDay: ForecastDay = {
  date: '2026-10-01',
  minTemperatureCelsius: 10,
  maxTemperatureCelsius: 20,
  weatherCode: 1,
  conditionLabel: 'Predominantemente limpo',
  precipitationProbability: 30,
};

describe('ForecastCard', () => {
  it('renders the day, condition, rain probability and temperatures', () => {
    render(<ForecastCard day={forecastDay} unit="celsius" />);

    expect(screen.getByRole('article', { name: /previsao para/i })).toHaveTextContent('20°C');
    expect(screen.getByRole('article')).toHaveTextContent('Min. 10°C');
    expect(screen.getByRole('article')).toHaveTextContent('Chuva 30%');
    expect(screen.getByText('🌤️')).toBeInTheDocument();
  });

  it('derives Fahrenheit values from Celsius data', () => {
    render(<ForecastCard day={forecastDay} unit="fahrenheit" />);

    expect(screen.getByRole('article')).toHaveTextContent('68°F');
    expect(screen.getByRole('article')).toHaveTextContent('Min. 50°F');
  });
});
