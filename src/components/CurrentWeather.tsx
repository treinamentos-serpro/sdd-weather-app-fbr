import { formatTemperature, getWeatherIcon } from '../lib/format';
import type { City, CurrentWeather as CurrentWeatherData, Unit } from '../types/weather';

interface CurrentWeatherProps {
  city: City;
  weather: CurrentWeatherData;
  unit: Unit;
}

export default function CurrentWeather({ city, weather, unit }: CurrentWeatherProps) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-glass backdrop-blur-md sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-white/60">Agora em</p>
          <h2 className="mt-1 break-words text-3xl font-semibold text-white">{city.name}</h2>
          <p className="mt-1 text-sm text-white/70">{city.country ?? '—'}</p>
        </div>
        <span aria-hidden="true" className="text-5xl" role="img">
          {getWeatherIcon(weather.weatherCode)}
        </span>
      </div>
      <div className="mt-10 flex flex-wrap items-end gap-3">
        <strong className="text-6xl font-semibold tracking-tight text-white sm:text-7xl">
          {formatTemperature(weather.temperatureCelsius, unit)}
        </strong>
        <span className="mb-2 max-w-full break-words text-sm text-white/70">
          {weather.conditionLabel}
        </span>
      </div>
    </article>
  );
}
