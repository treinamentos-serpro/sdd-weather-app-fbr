export type Unit = 'celsius' | 'fahrenheit';

export interface City {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
  timezone?: string;
}

export interface CurrentWeather {
  temperatureCelsius: number;
  weatherCode: number;
  conditionLabel: string;
}

export interface HourlyForecastItem {
  time: string;
  temperatureCelsius: number;
  weatherCode: number;
  conditionLabel: string;
}

export interface ForecastDay {
  date: string;
  minTemperatureCelsius: number;
  maxTemperatureCelsius: number;
  weatherCode: number;
  conditionLabel: string;
  precipitationProbability: number;
}

export interface WeatherData {
  city: City;
  timezone: string;
  current: CurrentWeather;
  hourly: HourlyForecastItem[];
  daily: ForecastDay[];
}
