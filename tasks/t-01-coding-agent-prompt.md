# Prompt de Implementacao — T-01

Voce e o **Code Agent** do Weather App. Implemente somente a tarefa **T-01 — Definir tipos meteorologicos** de `tasks/weather-app-tasks.md`.

## Contexto

O produto e uma SPA React + Vite em TypeScript strict para consulta meteorologica por cidade. O MVP usa o Open-Meteo para geocoding e forecast, nao possui autenticacao, cache ou persistencia, e mantem temperaturas internas em Celsius. A arquitetura separa `components`, `hooks`, `services`, `lib` e `types`.

Use como fonte da verdade:

- `specs/weather-app-spec.md`
- `plans/weather-app-plan.md`
- `tasks/weather-app-tasks.md`
- `.github/copilot-instructions.md`
- `.github/instructions/react.instructions.md`, se aplicavel ao arquivo TypeScript

## Objetivo da tarefa

Criar os contratos TypeScript compartilhados do dominio meteorologico que serao usados por services, hooks e componentes nas tarefas seguintes.

## Escopo

Implemente os seguintes tipos:

- `Unit = 'celsius' | 'fahrenheit'`
- `City`
- `CurrentWeather`
- `HourlyForecastItem`
- `ForecastDay`
- `WeatherData`

Os campos devem seguir o Data Model de `plans/weather-app-plan.md` e os dados normalizados da Open-Meteo:

- `City`: `id`, `name`, `latitude`, `longitude`, `country?`, `admin1?`, `timezone?`.
- `CurrentWeather`: `temperatureCelsius`, `weatherCode`, `conditionLabel`.
- `HourlyForecastItem`: `time`, `temperatureCelsius`, `weatherCode`, `conditionLabel`.
- `ForecastDay`: `date`, `minTemperatureCelsius`, `maxTemperatureCelsius`, `weatherCode`, `conditionLabel`.
- `WeatherData`: `city`, `timezone`, `current`, `hourly`, `daily`.

Use `interface` para os objetos e `type` para `Unit`. Preserve os nomes dos campos e tipos definidos no plano. Inclua comentarios curtos em pt-BR explicando cada campo, conforme o contrato do plano.

## Criterios de aceite

1. Os tipos representam os campos normalizados necessários para RF-01, RF-02, RF-03, RF-04 e RF-05.
2. As temperaturas do modelo sao sempre representadas em Celsius; nao crie campos Fahrenheit no modelo de dominio.
3. `WeatherData.hourly` representa exatamente 24 itens por contrato documentado.
4. `WeatherData.daily` representa exatamente 5 itens por contrato documentado.
5. Os tipos nao importam React, services, `fetch`, APIs de navegador ou qualquer dependencia de runtime.
6. Os tipos podem ser importados por `src/services/`, `src/hooks/` e `src/components/` sem dependencia circular.
7. `pnpm build` conclui sem erros de TypeScript depois da implementacao.

## Arquivo permitido

Crie ou edite somente:

- `src/types/weather.ts`

Nao implemente nesta tarefa:

- `WeatherErrorCode`, `OperationState`, `ServiceError` ou `AsyncState<T>`; isso pertence a T-02.
- Funcoes de conversao, normalizacao, validacao ou mapeamento de `weather_code`.
- Services, hooks, componentes, chamadas ao Open-Meteo ou testes E2E.
- Persistencia, estado React ou qualquer UI.

## Regras de implementacao

- Use TypeScript strict e nenhum `any`.
- Mantenha a mudanca minima e nao refatore arquivos nao relacionados.
- Siga os nomes em en-US para identificadores e pt-BR para comentarios/documentacao.
- Nao adicione dependencias.
- Nao altere a API externa nem invente campos alem do contrato.

## Validacao obrigatoria

Depois de editar, execute:

```bash
pnpm build
```

Se o build falhar por um problema causado pela tarefa, corrija-o. Nao corrija problemas nao relacionados ao escopo de T-01.

## Relatorio final

Informe:

1. Arquivo alterado.
2. Tipos criados.
3. Criterios de aceite atendidos.
4. Comando executado e resultado.
5. Qualquer bloqueio ou observacao relevante.
