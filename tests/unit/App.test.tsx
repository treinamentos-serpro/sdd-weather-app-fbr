import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App';
import { useWeather } from '../../src/hooks/useWeather';
import { WeatherServiceError } from '../../src/services/weatherService';
import { weatherDataMock } from '../../src/types/weatherMock';

vi.mock('../../src/hooks/useWeather', () => ({
  useWeather: vi.fn(),
}));

const mockedUseWeather = vi.mocked(useWeather);
const search = vi.fn();
const retry = vi.fn();

function mockWeatherState(overrides: Partial<ReturnType<typeof useWeather>> = {}) {
  return {
    status: 'idle' as const,
    data: null,
    cities: [],
    error: null,
    query: '',
    search,
    selectCity: vi.fn(),
    retry,
    ...overrides,
  };
}

describe('App', () => {
  beforeEach(() => {
    search.mockReset();
    retry.mockReset();
    mockedUseWeather.mockReturnValue(mockWeatherState());
  });

  it('renders idle and delegates the search to useWeather', async () => {
    const user = userEvent.setup();

    render(<App />);

    expect(
      screen.getByText('Busque uma cidade para acompanhar as condicoes atuais e a previsao.'),
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText('Cidade'), 'Curitiba');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(search).toHaveBeenCalledWith('Curitiba');
  });

  it('renders success data and passes the UI unit to the presentation', async () => {
    const user = userEvent.setup();

    mockedUseWeather.mockReturnValue(
      mockWeatherState({ status: 'success', data: weatherDataMock }),
    );

    render(<App />);

    expect(screen.getByText('Sao Paulo')).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(6);

    await user.click(screen.getByRole('button', { name: '°F' }));

    expect(screen.getAllByText('72°F')).toHaveLength(3);
  });

  it('renders loading with aria-busy', () => {
    mockedUseWeather.mockReturnValue(mockWeatherState({ status: 'loading' }));

    render(<App />);

    expect(screen.getByRole('main')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status', { name: 'Carregando previsao' })).toBeInTheDocument();
  });

  it('renders the empty state for a search without results', () => {
    mockedUseWeather.mockReturnValue(mockWeatherState({ status: 'empty', query: 'Atlantis' }));

    render(<App />);

    expect(screen.getByText('Nenhuma previsao encontrada para esta busca.')).toBeInTheDocument();
    expect(screen.getByText('Busca atual: Atlantis')).toBeInTheDocument();
  });

  it('renders ErrorState and delegates retry to useWeather', async () => {
    const user = userEvent.setup();
    const message = 'Falha de rede.';

    mockedUseWeather.mockReturnValue(
      mockWeatherState({
        status: 'error',
        error: new WeatherServiceError(message, 0),
      }),
    );

    render(<App />);

    expect(screen.getByRole('alert')).toHaveTextContent(message);

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(retry).toHaveBeenCalledOnce();
  });
});
