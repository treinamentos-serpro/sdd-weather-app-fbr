import type {
  City,
  CurrentWeather,
  ForecastDay,
  HourlyForecastItem,
  WeatherData,
} from '../types/weather';

interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
  timezone?: string;
}

interface GeocodingResponse {
  results?: GeocodingResult[];
}

interface ForecastResponse {
  timezone?: string;
  current?: {
    temperature_2m?: number;
    weather_code?: number;
  };
  hourly?: {
    time?: string[];
    temperature_2m?: number[];
    weather_code?: number[];
  };
  daily?: {
    time?: string[];
    temperature_2m_min?: number[];
    temperature_2m_max?: number[];
    weather_code?: number[];
    precipitation_probability_max?: number[];
  };
}

const weatherConditionLabels: Record<number, string> = {
  0: 'Ceu limpo',
  1: 'Predominantemente limpo',
  2: 'Parcialmente nublado',
  3: 'Nublado',
  45: 'Nevoeiro',
  48: 'Nevoeiro',
  51: 'Chuvisco fraco',
  53: 'Chuvisco moderado',
  55: 'Chuvisco intenso',
  61: 'Chuva fraca',
  63: 'Chuva moderada',
  65: 'Chuva intensa',
  71: 'Neve fraca',
  73: 'Neve moderada',
  75: 'Neve intensa',
  80: 'Pancadas fracas',
  81: 'Pancadas moderadas',
  82: 'Pancadas intensas',
  95: 'Trovoada',
  96: 'Trovoada com granizo fraco',
  99: 'Trovoada com granizo intenso',
};

export class WeatherServiceError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'WeatherServiceError';
    this.status = status;
  }
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      error.name === 'AbortError'
    ) {
      throw new WeatherServiceError('A requisição demorou demais.', 408);
    }

    throw new WeatherServiceError('Falha de rede.', 0);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function requestJson<T>(url: string, operation: string): Promise<T> {
  const response = await fetchWithTimeout(url);

  if (!response.ok) {
    throw new WeatherServiceError(
      `${operation} falhou (HTTP ${response.status}).`,
      response.status,
    );
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new WeatherServiceError('Resposta inválida do serviço.', 422);
  }
}

export async function searchCities(name: string): Promise<City[]> {
  const normalizedName = name.trim();

  if (!normalizedName) {
    return [];
  }

  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(normalizedName)}&count=10&language=pt&format=json`;
  const data = await requestJson<GeocodingResponse>(url, 'Busca de cidades');

  return (data.results ?? [])
    .map((result) => ({
      id: result.id,
      name: result.name,
      latitude: result.latitude,
      longitude: result.longitude,
      country: typeof result.country === 'string' ? result.country : undefined,
      admin1: typeof result.admin1 === 'string' ? result.admin1 : undefined,
      timezone: typeof result.timezone === 'string' ? result.timezone : undefined,
    }))
    .filter(
      (city) =>
        Number.isFinite(city.id) &&
        Boolean(city.name) &&
        Number.isFinite(city.latitude) &&
        Number.isFinite(city.longitude),
    );
}

export async function getWeather(city: City): Promise<WeatherData> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${city.latitude}` +
    `&longitude=${city.longitude}&timezone=auto&forecast_days=5` +
    '&current=temperature_2m,weather_code' +
    '&hourly=temperature_2m,weather_code' +
    '&daily=weather_code,temperature_2m_min,temperature_2m_max,precipitation_probability_max';
  const data = await requestJson<ForecastResponse>(url, 'Consulta meteorológica');

  if (!data.current || !data.daily) {
    throw new WeatherServiceError('Forecast response is incomplete', 422);
  }

  const current = mapCurrentWeather(data.current);
  const daily = mapForecastDays(data.daily);
  const hourly = mapHourlyForecast(data.hourly);

  return {
    city,
    timezone: data.timezone ?? city.timezone ?? 'UTC',
    current,
    hourly,
    daily,
  };
}

function getConditionLabel(weatherCode: number): string {
  return weatherConditionLabels[weatherCode] ?? 'Condicao desconhecida';
}

function mapCurrentWeather(current: NonNullable<ForecastResponse['current']>): CurrentWeather {
  if (!isFiniteNumber(current.temperature_2m) || !isFiniteNumber(current.weather_code)) {
    throw new WeatherServiceError('Current weather response is incomplete', 422);
  }

  return {
    temperatureCelsius: current.temperature_2m,
    weatherCode: current.weather_code,
    conditionLabel: getConditionLabel(current.weather_code),
  };
}

function mapForecastDays(daily: NonNullable<ForecastResponse['daily']>): ForecastDay[] {
  const dates = daily.time ?? [];
  const minTemperatures = daily.temperature_2m_min ?? [];
  const maxTemperatures = daily.temperature_2m_max ?? [];
  const weatherCodes = daily.weather_code ?? [];
  const precipitationProbabilities = daily.precipitation_probability_max ?? [];

  if (
    dates.length < 5 ||
    minTemperatures.length < 5 ||
    maxTemperatures.length < 5 ||
    weatherCodes.length < 5 ||
    precipitationProbabilities.length < 5
  ) {
    throw new WeatherServiceError('Daily forecast response is incomplete', 422);
  }

  for (let index = 0; index < 5; index += 1) {
    if (
      typeof dates[index] !== 'string' ||
      !isFiniteNumber(minTemperatures[index]) ||
      !isFiniteNumber(maxTemperatures[index]) ||
      !isFiniteNumber(weatherCodes[index])
    ) {
      throw new WeatherServiceError('Daily forecast response is incomplete', 422);
    }
  }

  return dates.slice(0, 5).map((date, index) => ({
    date,
    minTemperatureCelsius: minTemperatures[index],
    maxTemperatureCelsius: maxTemperatures[index],
    weatherCode: weatherCodes[index],
    conditionLabel: getConditionLabel(weatherCodes[index]),
    precipitationProbability: precipitationProbabilities[index] ?? 0,
  }));
}

function mapHourlyForecast(hourly: ForecastResponse['hourly']): HourlyForecastItem[] {
  if (!hourly?.time || !hourly.temperature_2m || !hourly.weather_code) {
    return [];
  }

  const count = Math.min(
    hourly.time.length,
    hourly.temperature_2m.length,
    hourly.weather_code.length,
  );

  if (count < 24) {
    throw new WeatherServiceError('Hourly forecast response is incomplete', 422);
  }

  for (let index = 0; index < 24; index += 1) {
    if (
      typeof hourly.time[index] !== 'string' ||
      !isFiniteNumber(hourly.temperature_2m[index]) ||
      !isFiniteNumber(hourly.weather_code[index])
    ) {
      throw new WeatherServiceError('Hourly forecast response is incomplete', 422);
    }
  }

  return hourly.time.slice(0, count).map((time, index) => ({
    time,
    temperatureCelsius: hourly.temperature_2m![index],
    weatherCode: hourly.weather_code![index],
    conditionLabel: getConditionLabel(hourly.weather_code![index]),
  }));
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}
