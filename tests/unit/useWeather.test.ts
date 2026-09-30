import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useWeather } from '../../src/hooks/useWeather';
import { getWeather, searchCities } from '../../src/services/weatherService';
import type { City } from '../../src/types/weather';
import { weatherDataMock } from '../../src/types/weatherMock';

vi.mock('../../src/services/weatherService', () => ({
  WeatherServiceError: class WeatherServiceError extends Error {
    status: number;

    constructor(message: string, status: number) {
      super(message);
      this.name = 'WeatherServiceError';
      this.status = status;
    }
  },
  getWeather: vi.fn(),
  searchCities: vi.fn(),
}));

const city: City = {
  id: 1,
  name: 'Curitiba',
  latitude: -25.43,
  longitude: -49.27,
};

const weather = { ...weatherDataMock, city };

const mockedSearchCities = vi.mocked(searchCities);
const mockedGetWeather = vi.mocked(getWeather);

describe('useWeather', () => {
  beforeEach(() => {
    mockedSearchCities.mockReset();
    mockedGetWeather.mockReset();
  });

  it('searches cities and loads the first result weather', async () => {
    mockedSearchCities.mockResolvedValueOnce([city]);
    mockedGetWeather.mockResolvedValueOnce(weather);

    const { result } = renderHook(() => useWeather());

    await act(async () => {
      await result.current.search('Curitiba');
    });

    expect(result.current.status).toBe('success');
    expect(result.current.query).toBe('Curitiba');
    expect(result.current.cities).toEqual([city]);
    expect(result.current.data).toBe(weather);
    expect(mockedGetWeather).toHaveBeenCalledWith(city);
  });

  it('sets empty without loading weather when no city is found', async () => {
    mockedSearchCities.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useWeather());

    await act(async () => {
      await result.current.search('Atlantis');
    });

    expect(result.current.status).toBe('empty');
    expect(result.current.data).toBeNull();
    expect(result.current.cities).toEqual([]);
    expect(mockedGetWeather).not.toHaveBeenCalled();
  });

  it('retries the last city selection operation', async () => {
    mockedGetWeather.mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce(weather);

    const { result } = renderHook(() => useWeather());

    await act(async () => {
      await result.current.selectCity(city);
    });
    expect(result.current.status).toBe('error');

    await act(async () => {
      await result.current.retry();
    });

    expect(result.current.status).toBe('success');
    expect(result.current.data).toBe(weather);
    expect(mockedGetWeather).toHaveBeenCalledTimes(2);
  });
});
