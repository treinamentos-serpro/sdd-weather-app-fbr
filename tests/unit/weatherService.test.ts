import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  fetchWithTimeout,
  getWeather,
  searchCities,
  WeatherServiceError,
} from '../../src/services/weatherService';
import type { City } from '../../src/types/weather';

const fetchMock = vi.fn();

vi.stubGlobal('fetch', fetchMock);

afterEach(() => {
  fetchMock.mockReset();
});

describe('searchCities', () => {
  it('returns an empty list without calling the network for empty input', async () => {
    await expect(searchCities('   ')).resolves.toEqual([]);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('encodes the name and maps geocoding results to City', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          results: [
            {
              id: 1,
              name: 'Sao Paulo',
              latitude: -23.55,
              longitude: -46.63,
              country: 'Brasil',
              admin1: 'Sao Paulo',
              timezone: 'America/Sao_Paulo',
            },
          ],
        }),
        { status: 200 },
      ),
    );

    await expect(searchCities('São Paulo & Centro')).resolves.toEqual([
      {
        id: 1,
        name: 'Sao Paulo',
        latitude: -23.55,
        longitude: -46.63,
        country: 'Brasil',
        admin1: 'Sao Paulo',
        timezone: 'America/Sao_Paulo',
      },
    ]);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://geocoding-api.open-meteo.com/v1/search?name=S%C3%A3o%20Paulo%20%26%20Centro&count=10&language=pt&format=json',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('returns an empty list when results is absent', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));

    await expect(searchCities('Curitiba')).resolves.toEqual([]);
  });

  it('throws WeatherServiceError for a non-ok response', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 503 }));
    const request = searchCities('Curitiba');

    await expect(request).rejects.toMatchObject({
      name: 'WeatherServiceError',
      status: 503,
    });
    await expect(request).rejects.toBeInstanceOf(WeatherServiceError);
  });

  it('converts invalid JSON into a WeatherServiceError', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{invalid', { status: 200 }));

    await expect(searchCities('Curitiba')).rejects.toMatchObject({
      name: 'WeatherServiceError',
      message: 'Resposta inválida do serviço.',
      status: 422,
    });
  });
});

describe('fetchWithTimeout', () => {
  it('converts AbortError to a timeout WeatherServiceError', async () => {
    fetchMock.mockRejectedValueOnce(new DOMException('Aborted', 'AbortError'));

    await expect(fetchWithTimeout('/forecast')).rejects.toMatchObject({
      name: 'WeatherServiceError',
      message: 'A requisição demorou demais.',
      status: 408,
    });
  });

  it('converts network failures to a WeatherServiceError', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    await expect(fetchWithTimeout('/forecast')).rejects.toMatchObject({
      name: 'WeatherServiceError',
      message: 'Falha de rede.',
      status: 0,
    });
  });

  it('clears the timeout after a successful response', async () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 200 }));

    await expect(fetchWithTimeout('/forecast')).resolves.toBeInstanceOf(Response);

    expect(clearTimeoutSpy).toHaveBeenCalledOnce();
    clearTimeoutSpy.mockRestore();
  });
});

describe('getWeather', () => {
  const city: City = {
    id: 1,
    name: 'Curitiba',
    latitude: -25.43,
    longitude: -49.27,
    country: 'Brasil',
    timezone: 'America/Sao_Paulo',
  };

  it('maps current weather and five parallel daily entries', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          timezone: 'America/Sao_Paulo',
          current: { temperature_2m: 18.5, weather_code: 2 },
          daily: {
            time: ['2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04'],
            temperature_2m_min: [12, 13, 14, 15, 16],
            temperature_2m_max: [21, 22, 23, 24, 25],
            weather_code: [2, 1, 3, 61, 63],
            precipitation_probability_max: [20, 10, 30, 70, 80],
          },
        }),
        { status: 200 },
      ),
    );

    const weather = await getWeather(city);

    expect(weather.city).toEqual(city);
    expect(weather.timezone).toBe('America/Sao_Paulo');
    expect(weather.current).toEqual({
      temperatureCelsius: 18.5,
      weatherCode: 2,
      conditionLabel: 'Parcialmente nublado',
    });
    expect(weather.daily).toHaveLength(5);
    expect(weather.daily[0]).toMatchObject({
      date: '2026-09-30',
      minTemperatureCelsius: 12,
      maxTemperatureCelsius: 21,
      weatherCode: 2,
      precipitationProbability: 20,
    });
    expect(weather.daily[4]).toMatchObject({
      date: '2026-10-04',
      precipitationProbability: 80,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(
        'https://api.open-meteo.com/v1/forecast?latitude=-25.43&longitude=-49.27',
      ),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('normalizes null precipitation probabilities to zero', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          current: { temperature_2m: 18.5, weather_code: 2 },
          daily: {
            time: ['2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04'],
            temperature_2m_min: [12, 13, 14, 15, 16],
            temperature_2m_max: [21, 22, 23, 24, 25],
            weather_code: [2, 1, 3, 61, 63],
            precipitation_probability_max: [null, 10, 30, 70, 80],
          },
        }),
        { status: 200 },
      ),
    );

    const weather = await getWeather(city);

    expect(weather.daily[0].precipitationProbability).toBe(0);
  });

  it('throws WeatherServiceError when current or daily is missing', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ current: { temperature_2m: 18.5 } }), { status: 200 }),
    );

    const request = getWeather(city);

    await expect(request).rejects.toBeInstanceOf(WeatherServiceError);
    await expect(request).rejects.toMatchObject({ status: 422 });
  });

  it.each([
    { current: undefined, daily: {} },
    { current: { temperature_2m: 18.5, weather_code: 2 }, daily: undefined },
  ])('throws WeatherServiceError when current or daily is absent', async ({ current, daily }) => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ current, daily }), { status: 200 }),
    );

    await expect(getWeather(city)).rejects.toBeInstanceOf(WeatherServiceError);
  });

  it('throws WeatherServiceError when current fields are incomplete', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          current: { temperature_2m: 18.5 },
          daily: {
            time: ['2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04'],
            temperature_2m_min: [12, 13, 14, 15, 16],
            temperature_2m_max: [21, 22, 23, 24, 25],
            weather_code: [2, 1, 3, 61, 63],
            precipitation_probability_max: [20, 10, 30, 70, 80],
          },
        }),
        { status: 200 },
      ),
    );

    await expect(getWeather(city)).rejects.toMatchObject({ status: 422 });
  });

  it('throws WeatherServiceError when daily arrays do not contain five days', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          current: { temperature_2m: 18.5, weather_code: 2 },
          daily: {
            time: ['2026-09-30'],
            temperature_2m_min: [12],
            temperature_2m_max: [21],
            weather_code: [2],
            precipitation_probability_max: [20],
          },
        }),
        { status: 200 },
      ),
    );

    await expect(getWeather(city)).rejects.toMatchObject({ status: 422 });
  });

  it('throws WeatherServiceError when hourly arrays are partial', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          current: { temperature_2m: 18.5, weather_code: 2 },
          hourly: {
            time: ['2026-09-30T12:00'],
            temperature_2m: [18.5],
            weather_code: [2],
          },
          daily: {
            time: ['2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04'],
            temperature_2m_min: [12, 13, 14, 15, 16],
            temperature_2m_max: [21, 22, 23, 24, 25],
            weather_code: [2, 1, 3, 61, 63],
            precipitation_probability_max: [20, 10, 30, 70, 80],
          },
        }),
        { status: 200 },
      ),
    );

    await expect(getWeather(city)).rejects.toMatchObject({ status: 422 });
  });
});
