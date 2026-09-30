import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ForecastList from '../../src/components/ForecastList';
import { weatherDataMock } from '../../src/types/weatherMock';

describe('ForecastList', () => {
  it('renders the five forecast days', () => {
    render(<ForecastList days={weatherDataMock.daily} unit="celsius" />);

    expect(screen.getByRole('heading', { name: 'Previsão de 5 dias' })).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(5);
  });
});
