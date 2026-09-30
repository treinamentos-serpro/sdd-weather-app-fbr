import { useEffect, useRef, useState } from 'react';
import CurrentWeather from './components/CurrentWeather';
import ErrorState from './components/ErrorState';
import ForecastList from './components/ForecastList';
import SearchBar from './components/SearchBar';
import UnitToggle from './components/UnitToggle';
import { useWeather } from './hooks/useWeather';
import { formatTemperature, getWeatherIcon } from './lib/format';
import type { Unit } from './types/weather';

const statusMessages = {
  idle: 'Busque uma cidade para acompanhar as condicoes atuais e a previsao.',
  loading: 'Carregando previsao...',
  empty: 'Nenhuma previsao encontrada para esta busca.',
};

export default function App() {
  const [unit, setUnit] = useState<Unit>('celsius');
  const statusPanelRef = useRef<HTMLElement | null>(null);
  const resultPanelRef = useRef<HTMLDivElement | null>(null);
  const { status, data, error, query, search, retry } = useWeather();

  useEffect(() => {
    if (status === 'empty') {
      statusPanelRef.current?.focus();
    }
  }, [status]);

  useEffect(() => {
    if (status === 'success') {
      resultPanelRef.current?.focus();
    }
  }, [status]);

  const statusMessage = status === 'success' || status === 'error' ? '' : statusMessages[status];

  return (
    <div className="min-h-screen bg-night-900 text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(109,124,255,0.2),_transparent_42%),radial-gradient(circle_at_bottom_left,_rgba(245,185,66,0.1),_transparent_35%)]" />
      <div className="relative mx-auto min-h-screen max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-6 lg:flex-row lg:items-end">
          <div className="shrink-0">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent-400">
              WeatherView
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
              Clima, sem ruido.
            </h1>
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-end">
            <SearchBar disabled={status === 'loading'} onSearch={(city) => void search(city)} />
            <UnitToggle onChange={setUnit} unit={unit} />
          </div>
        </header>

        <main aria-busy={status === 'loading'} className="py-8" id="main-content">
          {status === 'error' ? (
            <ErrorState
              message={error?.message ?? 'Nao foi possivel carregar a previsao.'}
              onRetry={() => void retry()}
            />
          ) : status !== 'success' || !data ? (
            <section
              aria-atomic="true"
              aria-live="polite"
              className="flex min-h-[420px] items-center justify-center rounded-3xl border border-white/10 bg-white/5 p-5 text-center shadow-glass backdrop-blur-md sm:p-6"
              ref={statusPanelRef}
              role="region"
              tabIndex={-1}
            >
              <div className="max-w-md">
                {status === 'loading' ? (
                  <div
                    aria-label="Carregando previsao"
                    className="mx-auto mb-5 h-12 w-12 animate-pulse rounded-full bg-accent-500/50"
                    role="status"
                  />
                ) : null}
                <p className="text-lg font-medium text-white">{statusMessage}</p>
                {status === 'idle' ? (
                  <p className="mt-3 text-sm leading-6 text-white/70">
                    Comece com uma cidade como Sao Paulo, Curitiba ou Recife.
                  </p>
                ) : null}
                {status === 'empty' && query ? (
                  <p className="mt-3 break-words text-sm text-white/70">Busca atual: {query}</p>
                ) : null}
              </div>
            </section>
          ) : (
            <div aria-live="polite" className="space-y-8" ref={resultPanelRef} tabIndex={-1}>
              <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
                <CurrentWeather city={data.city} unit={unit} weather={data.current} />

                <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-glass backdrop-blur-md sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/60">Proximas horas</p>
                      <h2 className="mt-1 text-xl font-semibold text-white">Hoje</h2>
                    </div>
                    <span className="max-w-[10rem] break-words text-right text-xs leading-5 text-white/70">
                      {data.timezone}
                    </span>
                  </div>
                  <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {data.hourly.slice(0, 8).map((hour) => (
                      <div className="rounded-xl bg-night-800/70 p-3 text-center" key={hour.time}>
                        <p className="text-xs text-white/50">{hour.time.slice(11, 16)}</p>
                        <span aria-hidden="true" className="my-2 block text-xl" role="img">
                          {getWeatherIcon(hour.weatherCode)}
                        </span>
                        <p className="text-sm font-semibold text-white">
                          {formatTemperature(hour.temperatureCelsius, unit)}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              </section>

              <ForecastList days={data.daily} unit={unit} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
