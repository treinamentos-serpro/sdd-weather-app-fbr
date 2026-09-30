import { useRef, useState } from 'react';
import { getWeather, searchCities, WeatherServiceError } from '../services/weatherService';
import type { City, WeatherData } from '../types/weather';

type WeatherStatus = 'idle' | 'loading' | 'success' | 'error' | 'empty';

type WeatherOperation = () => Promise<void>;

export interface UseWeatherResult {
  status: WeatherStatus;
  data: WeatherData | null;
  cities: City[];
  error: WeatherServiceError | null;
  query: string;
  search: (name: string) => Promise<void>;
  selectCity: (city: City) => Promise<void>;
  retry: () => Promise<void>;
}

export function useWeather(): UseWeatherResult {
  const [status, setStatus] = useState<WeatherStatus>('idle');
  const [data, setData] = useState<WeatherData | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [error, setError] = useState<WeatherServiceError | null>(null);
  const [query, setQuery] = useState('');
  const requestIdRef = useRef(0);
  const lastOperationRef = useRef<WeatherOperation | null>(null);

  async function selectCity(city: City): Promise<void> {
    lastOperationRef.current = () => selectCity(city);
    const requestId = ++requestIdRef.current;

    setQuery(city.name);
    setStatus('loading');
    setError(null);

    try {
      const weather = await getWeather(city);

      if (requestId !== requestIdRef.current) {
        return;
      }

      setData(weather);
      setStatus('success');
    } catch (caughtError) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      setData(null);
      setError(toWeatherServiceError(caughtError));
      setStatus('error');
    }
  }

  async function search(name: string): Promise<void> {
    lastOperationRef.current = () => search(name);
    const requestId = ++requestIdRef.current;

    setQuery(name);
    setStatus('loading');
    setError(null);
    setData(null);
    setCities([]);

    try {
      const results = await searchCities(name);

      if (requestId !== requestIdRef.current) {
        return;
      }

      setCities(results);

      if (results.length === 0) {
        setStatus('empty');
        return;
      }

      const weather = await getWeather(results[0]);

      if (requestId !== requestIdRef.current) {
        return;
      }

      setData(weather);
      setStatus('success');
    } catch (caughtError) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      setError(toWeatherServiceError(caughtError));
      setStatus('error');
    }
  }

  async function retry(): Promise<void> {
    if (lastOperationRef.current) {
      await lastOperationRef.current();
    }
  }

  return {
    status,
    data,
    cities,
    error,
    query,
    search,
    selectCity,
    retry,
  };
}

function toWeatherServiceError(error: unknown): WeatherServiceError {
  if (error instanceof WeatherServiceError) {
    return new WeatherServiceError(getFriendlyMessage(error), error.status);
  }

  return new WeatherServiceError('Falha de rede. Tente novamente.', 0);
}

function getFriendlyMessage(error: WeatherServiceError): string {
  if (error.status === 408) {
    return 'A requisição demorou demais. Tente novamente.';
  }

  if (error.status === 0) {
    return 'Falha de rede. Verifique sua conexão e tente novamente.';
  }

  if (error.status === 429) {
    return 'Muitas consultas no momento. Tente novamente em instantes.';
  }

  if (error.status === 422) {
    return 'Os dados meteorológicos estão incompletos.';
  }

  return 'Não foi possível carregar o clima. Tente novamente.';
}
