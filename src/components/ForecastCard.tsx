import { formatDayLabel, formatTemperature, getWeatherIcon } from '../lib/format';
import type { ForecastDay, Unit } from '../types/weather';

interface ForecastCardProps {
  day: ForecastDay;
  unit: Unit;
}

export default function ForecastCard({ day, unit }: ForecastCardProps) {
  return (
    <article
      aria-label={`Previsao para ${formatDayLabel(day.date)}`}
      className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-glass backdrop-blur-md"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold capitalize text-white">{formatDayLabel(day.date)}</h3>
        <span aria-hidden="true" className="text-2xl" role="img">
          {getWeatherIcon(day.weatherCode)}
        </span>
      </div>
      <p className="mt-3 break-words text-sm text-white/80">{day.conditionLabel}</p>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-2">
        <strong className="text-2xl font-semibold text-white">
          {formatTemperature(day.maxTemperatureCelsius, unit)}
        </strong>
        <span className="text-sm text-white/70">
          Min. {formatTemperature(day.minTemperatureCelsius, unit)}
        </span>
      </div>
      <p className="mt-3 text-sm text-white/80">Chuva {day.precipitationProbability ?? 0}%</p>
    </article>
  );
}
