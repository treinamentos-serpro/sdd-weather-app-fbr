# Plano Tecnico — Weather App

## Architecture

A aplicacao sera uma SPA React organizada em quatro camadas, com dependencias apontando para dentro: a apresentacao conhece hooks e tipos, hooks conhecem services e lib, services conhecem lib e os adaptadores externos, e lib nao conhece React nem rede. `services` e uma camada de modulos client-side nesta etapa, nao um backend separado. O fluxo sera:

```text
components (apresentacao)
  -> hooks (orquestracao e estado)
    -> services (acesso e adaptacao de dados)
      -> Open-Meteo Geocoding e Forecast APIs

lib (funcoes puras e contratos de dominio) apoia hooks e services sem depender deles.
```

### Componentes

- **Presentation:** componentes React recebem props, disparam callbacks e renderizam estados; nao fazem `fetch` nem conhecem payloads do Open-Meteo.
- **Orchestration:** hooks coordenam eventos da UI, estado local, retries e identificador da requisicao mais recente.
- **Data access:** services encapsulam `fetch`, URLs, timeout, classificacao de erros e adaptacao do payload externo para os tipos internos.
- **Pure domain:** lib concentra normalizacao, conversao de temperatura, mapeamento de `weather_code`, validacao de datas/series e tipos; nao acessa rede, DOM ou estado React.
- **Infraestrutura:** configuracao de build/deploy, timeout de 4 segundos, HTTPS e validacoes de contrato. Rate limiting e health/readiness dependem da camada de hospedagem, pois nao podem ser garantidos por uma SPA client-side.

Nao havera banco, autenticacao, cache, armazenamento local, analytics, mapa, geolocalizacao ou notificacoes no MVP.

### Rastreabilidade arquitetural

- RF-01: geocoding, normalizacao e selecao de localidade.
- RF-02: consulta `current` e painel de clima atual.
- RF-03: consulta `daily` e cards de cinco dias.
- RF-04: estado de unidade e conversao derivada dos dados originais.
- RF-05: consulta `hourly` e serie das proximas 24 horas.
- RNF-01/RNF-02/RNF-03: componentes responsivos, usabilidade validada, semanticos e operaveis por teclado.
- RNF-04/RNF-05/RNF-06: timeout, estados finais, retry e metricas de latencia/disponibilidade.
- RNF-07/RNF-09/RNF-10: ausencia de persistencia, entrada segura e telemetria tecnica sem dados da busca.
- RNF-11: build/deploy e teste de carga; health/readiness e rate limiting precisam de suporte da infraestrutura de hospedagem.

## Tech Stack

| Camada | Tecnologia | Decisao |
| --- | --- | --- |
| Linguagem | TypeScript strict | Tipos compartilhados e contratos explicitos. |
| UI | React 19 + React DOM | Ja definido no projeto; componentes funcionais. |
| Build/dev server | Vite 8 | Ja configurado no projeto. |
| Estilo | Tailwind CSS 3 + PostCSS | Segue a stack existente e permite responsividade nos breakpoints da spec. |
| Testes unitarios | Vitest 4 + Testing Library + user-event | Testes de funcoes puras, hooks e comportamento de UI. |
| Testes E2E | Playwright 1.61 | Fluxos principais em navegadores da matriz. |
| Qualidade | Biome | Lint e formatacao conforme scripts do repositorio. |
| Runtime | Node.js >=22 | Requisito declarado no `package.json`. |
| Dados | Open-Meteo | Geocoding e Forecast API, sem API key no uso nao comercial definido pela spec. |

Nao sera adicionado gerenciador global de estado ou cliente HTTP pesado. `fetch` encapsulado em services e estado local React sao suficientes para o escopo.

## Project Structure

```text
src/
  app/
    App.tsx
    app.css
  components/
    SearchForm.tsx
    LocationResults.tsx
    CurrentWeather.tsx
    HourlyForecast.tsx
    DailyForecast.tsx
    TemperatureUnitToggle.tsx
    WeatherStatus.tsx
  hooks/
    useLocationSearch.ts
    useWeatherQuery.ts
  services/
    openMeteoClient.ts
    weatherService.ts
  types/
    weather.ts
    service.ts
  lib/
    normalizeSearch.ts
    temperature.ts
    weatherCode.ts
    validateWeatherResponse.ts
    dateSeries.ts
  main.tsx

tests/
  services/
  lib/
  hooks/
  components/
  e2e/
```

### Responsabilidades

- `components/`: apresentacao e eventos de usuario; recebem dados ja normalizados e expõem callbacks sem regra de negocio externa.
- `hooks/`: orquestracao de estado de busca/consulta, retry, selecao de cidade e controle da requisicao mais recente.
- `services/`: acesso a rede, construcao de requests, timeout, classificacao de erro e adaptacao de payloads Open-Meteo.
- `lib/`: funcoes puras e deterministicas de dominio, sem efeitos colaterais, React ou dependencias de rede; os tipos compartilhados permanecem em `types/`.
- `types/`: contratos publicos entre services, hooks e componentes.

### Regras de dependencia

- `components` podem importar `hooks`, `types` e formatadores puros de `lib`, mas nao `openMeteoClient`.
- `hooks` podem importar `services`, `lib` e `types`, mas nao devem montar markup complexo.
- `services` podem importar `lib` e `types`, mas nao podem importar React ou componentes.
- `lib` nao pode importar `components`, `hooks`, `services`, React ou APIs de rede.
- `types` nao deve conter chamadas, transformacoes com efeitos ou dependencias de UI.

### Impacto nos testes

- **components:** testar comportamento visivel com Testing Library: estados, mensagens, callbacks, acessibilidade e teclado, usando services mockados.
- **hooks:** testar transicoes `idle/loading/success/empty/error`, retry e descarte de respostas antigas com services falsos.
- **services:** testar URLs, parametros, timeout, parsing, classificacao de HTTP/network errors e adaptacao de respostas com `fetch` mockado.
- **lib:** testar tabelas e funcoes puras diretamente, cobrindo entradas limite sem setup de React ou rede.

Essa separacao reduz testes lentos e frageis: cada camada tem uma fronteira clara, e falhas de API podem ser simuladas sem depender do provedor real.

## Data Model

Os tipos abaixo sao contratos de planejamento; a implementacao deve manter os nomes e invariantes, podendo separar arquivos conforme a necessidade.

```ts
type Unit = 'celsius' | 'fahrenheit'

type WeatherErrorCode =
  | 'validation'
  | 'no-results'
  | 'timeout'
  | 'network'
  | 'rate-limit'
  | 'provider'
  | 'invalid-response'

type OperationState = 'idle' | 'loading' | 'success' | 'empty' | 'error'

interface City {
  id: number // Identificador estavel retornado pelo geocoding.
  name: string // Nome da cidade retornado pelo geocoding.
  latitude: number // Latitude em graus decimais.
  longitude: number // Longitude em graus decimais.
  country?: string // Pais, quando fornecido pelo provedor.
  admin1?: string // Estado ou regiao administrativa, quando fornecido.
  timezone?: string // Fuso horario IANA da cidade, quando disponivel.
}

interface CurrentWeather {
  temperatureCelsius: number // Temperatura original em Celsius.
  weatherCode: number // Codigo WMO retornado em current.weather_code.
  conditionLabel: string // Rotulo pt-BR derivado do codigo WMO.
}

interface HourlyForecastItem {
  time: string // Data/hora ISO no fuso da cidade.
  temperatureCelsius: number // Temperatura original em Celsius.
  weatherCode: number // Codigo WMO retornado em hourly.weather_code.
  conditionLabel: string // Rotulo pt-BR derivado do codigo WMO.
}

interface ForecastDay {
  date: string // Data ISO local da cidade, sem horario.
  minTemperatureCelsius: number // Minima diaria original em Celsius.
  maxTemperatureCelsius: number // Maxima diaria original em Celsius.
  weatherCode: number // Codigo WMO retornado em daily.weather_code.
  conditionLabel: string // Rotulo pt-BR derivado do codigo WMO.
}

interface WeatherData {
  city: City // Cidade selecionada pelo usuario.
  timezone: string // Fuso IANA retornado por timezone=auto.
  current: CurrentWeather // Condicao meteorologica atual.
  hourly: HourlyForecastItem[] // 24 itens cronologicos, hora atual mais 23.
  daily: ForecastDay[] // 5 itens cronologicos, hoje mais 4 dias.
}

interface ServiceError {
  code: WeatherErrorCode
  message: string
  retryable: boolean
}

interface AsyncState<T> {
  status: OperationState
  data?: T
  error?: ServiceError
}
```

### Invariantes

- Temperaturas internas ficam sempre em Celsius; Fahrenheit e apenas uma projecao de apresentacao.
- `hourly` tem 24 itens cronologicos e `daily` tem 5 datas cronologicas consecutivas.
- `conditionLabel` nunca exibe o codigo bruto do provedor.
- Dados incompletos, tipos invalidos, datas duplicadas ou codigos meteorologicos desconhecidos geram `invalid-response`.
- Nenhuma interface de persistencia faz parte do modelo do MVP.

## Data Flow

1. O usuario envia o texto da cidade.
2. `normalizeSearch` remove espacos nas extremidades, preserva acentos e bloqueia entrada vazia.
3. `useLocationSearch` muda para `loading` e solicita localidades ao `weatherService`.
4. O service chama o endpoint de geocoding, valida o payload e retorna `City[]` ou um erro classificado.
5. A UI mostra resultados ou `Nenhuma cidade encontrada`.
6. O usuario seleciona uma localidade; a selecao guarda apenas o estado da sessao em memoria.
7. `useWeatherQuery` cria um identificador de requisicao e muda as operacoes meteorologicas para `loading`.
8. O service chama o Forecast API com `current`, `hourly`, `daily`, `forecast_days=5` e `timezone=auto`.
9. O adaptador valida cardinalidade, datas, tipos e codigos, mapeia condicoes para pt-BR e retorna `WeatherData`.
10. Respostas de requisicoes antigas sao descartadas pelo identificador de requisicao.
11. A UI renderiza clima atual, 24 horas e cinco dias; valores sao exibidos na unidade selecionada.
12. Retry repete a consulta para a mesma localidade e nao cria cache.

### Diagrama do fluxo

```mermaid
flowchart TD
  A[Input de busca] --> B{Entrada valida?}
  B -- Nao --> E1[Estado empty: "Informe uma cidade"]
  B -- Sim --> H1[useLocationSearch: loading]
  H1 --> G[Service de geocoding]
  G --> G1{Resposta valida?}
  G1 -- "Sem resultados" --> E2[Estado empty: "Nenhuma cidade encontrada"]
  G1 -- "Erro, timeout ou rede" --> X1[Estado error: retry de geocoding]
  X1 --> G
  G1 -- "Resultados" --> S[Selecao de cidade]
  S --> H2[useWeatherQuery: loading]
  H2 --> F[Service de forecast]
  F --> F1{Forecast valido e completo?}
  F1 -- "Erro, timeout ou rede" --> X2[Estado error: retry de forecast]
  X2 --> F
  F1 -- "Resposta parcial ou invalida" --> X3[Estado error: sem dados parciais]
  F1 -- Sim --> H3[Hook de estado: success + WeatherData]
  H3 --> U[Componentes de UI]
  U --> U1[Clima atual]
  U --> U2[Previsao horaria: 24 horas]
  U --> U3[Previsao diaria: 5 dias]
  U --> U4[Unidade Celsius/Fahrenheit na renderizacao]
```

## External APIs

### Geocoding API

- Base: `https://geocoding-api.open-meteo.com/v1/search`
- Metodo: `GET`
- Parametros minimos: `name`, `count`, `language=pt`, `format=json`.
- `count` deve ser limitado a um valor pequeno, como 10, para evitar listas extensas.
- A resposta esperada contem `results`; ausencia ou lista vazia resulta em `empty`/`no-results`.
- O service deve mapear cada resultado para `City` e descartar registros sem `id`, nome, latitude ou longitude validos.

Exemplo de URL:

```text
https://geocoding-api.open-meteo.com/v1/search?name=Curitiba&count=10&language=pt&format=json
```

Exemplo resumido de resposta JSON:

```json
{
  "results": [
    {
      "id": 3448439,
      "name": "Curitiba",
      "latitude": -25.4278,
      "longitude": -49.2731,
      "country": "Brasil",
      "admin1": "Parana",
      "timezone": "America/Sao_Paulo"
    }
  ]
}
```

Mapeamento para `City`:

| Open-Meteo | Modelo |
| --- | --- |
| `results[].id` | `City.id` |
| `results[].name` | `City.name` |
| `results[].latitude` | `City.latitude` |
| `results[].longitude` | `City.longitude` |
| `results[].country` | `City.country` |
| `results[].admin1` | `City.admin1` |
| `results[].timezone` | `City.timezone` |

### Forecast API

- Base: `https://api.open-meteo.com/v1/forecast`
- Metodo: `GET`
- Parametros obrigatorios:
  - `latitude` e `longitude` da localidade selecionada.
  - `timezone=auto`.
  - `forecast_days=5`.
  - `current=temperature_2m,weather_code`.
  - `hourly=temperature_2m,weather_code`.
  - `daily=weather_code,temperature_2m_min,temperature_2m_max`.
- O service deve verificar `current`, `hourly`, `daily`, `timezone` e os arrays de tempo antes de criar `WeatherData`.
- A camada de dominio deve selecionar a hora atual e as 23 seguintes, mantendo o fuso retornado.
- As chamadas devem usar HTTPS, timeout de 4 segundos e nenhum cache.

Exemplo de URL:

```text
https://api.open-meteo.com/v1/forecast?latitude=-25.4278&longitude=-49.2731&timezone=auto&forecast_days=5&current=temperature_2m,weather_code&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_min,temperature_2m_max
```

Exemplo resumido de resposta JSON; as listas reais devem conter 24 itens horarios e 5 itens diarios:

```json
{
  "timezone": "America/Sao_Paulo",
  "current": {
    "time": "2026-09-30T12:00",
    "temperature_2m": 18.4,
    "weather_code": 2
  },
  "hourly": {
    "time": ["2026-09-30T12:00", "2026-09-30T13:00"],
    "temperature_2m": [18.4, 19.1],
    "weather_code": [2, 2]
  },
  "daily": {
    "time": ["2026-09-30", "2026-10-01"],
    "temperature_2m_min": [12.0, 13.2],
    "temperature_2m_max": [21.4, 23.0],
    "weather_code": [2, 3]
  }
}
```

Mapeamento para `WeatherData`:

| Open-Meteo | Modelo |
| --- | --- |
| cidade selecionada pelo geocoding | `WeatherData.city` |
| `timezone` | `WeatherData.timezone` |
| `current.temperature_2m` | `CurrentWeather.temperatureCelsius` |
| `current.weather_code` | `CurrentWeather.weatherCode` e `conditionLabel` via tabela WMO |
| `hourly.time[i]` | `HourlyForecastItem.time` |
| `hourly.temperature_2m[i]` | `HourlyForecastItem.temperatureCelsius` |
| `hourly.weather_code[i]` | `HourlyForecastItem.weatherCode` e `conditionLabel` |
| `daily.time[i]` | `ForecastDay.date` |
| `daily.temperature_2m_min[i]` | `ForecastDay.minTemperatureCelsius` |
| `daily.temperature_2m_max[i]` | `ForecastDay.maxTemperatureCelsius` |
| `daily.weather_code[i]` | `ForecastDay.weatherCode` e `conditionLabel` |

As listas `hourly` e `daily` devem ser percorridas por indice, validando que todos os arrays de cada secao tenham o mesmo comprimento. A conversao para Fahrenheit ocorre somente na camada de apresentacao; o modelo interno permanece em Celsius.

### Limites e conformidade

O produto e nao comercial e deve permanecer dentro do limite de 10.000 chamadas diarias da API gratuita definido na spec. Os services client-side podem reduzir chamadas duplicadas na sessao, mas nao conseguem garantir um limite global por origem. Para cumprir RNF-08/RNF-09/RNF-11 em producao, a hospedagem deve fornecer gateway, proxy ou mecanismo equivalente para limitar chamadas, aplicar HTTPS, expor health/readiness e coletar logs tecnicos. Sem essa capacidade de infraestrutura, o MVP pode ser desenvolvido localmente, mas nao atende integralmente os requisitos de producao.

### Decisao de infraestrutura pendente

O plano nao adiciona um backend ao repositorio atual. Antes do deploy, a equipe deve escolher entre:

1. Hospedar a SPA atras de um gateway/proxy gerenciado com rate limiting, health/readiness e logs; ou
2. Adicionar um servico intermediario separado, mantendo os mesmos contratos de `services` no frontend.

Essa escolha nao altera os componentes, hooks, `lib` ou modelos, mas e necessaria para cumprir os RNFs de limite, observabilidade e operacao.

## State Management

Usar estado local React, dividido por responsabilidade. Nao usar Redux, Context global, cache ou persistencia: a sessao e curta e todo o estado pertence ao fluxo visivel.

```ts
interface SearchState {
  query: string
  locations: City[]
  status: AsyncState<City[]>
}

interface WeatherState {
  selectedCity?: City
  weather: AsyncState<WeatherData>
  unit: Unit
  requestId: number
}
```

- `useLocationSearch` e dono de `query`, `locations` e `status` da busca.
- `useWeatherQuery` e dono de `selectedCity`, `weather`, `requestId` e retry da consulta.
- `unit` vive no container da tela, inicia como `celsius` e nao dispara nova chamada externa.
- `requestId` incrementa a cada consulta; uma resposta so pode atualizar o estado se seu id ainda for o mais recente.
- O estado de erro preserva `selectedCity` quando o retry puder reutiliza-la.

### Estados explicitos

Cada operacao de busca e clima usa exatamente um estado `AsyncState`:

- **`idle`:** nenhuma operacao foi iniciada; nao exibe loading, erro ou dados de uma consulta inexistente.
- **`loading`:** requisicao em andamento; exibe indicador acessivel e bloqueia somente a submissao duplicada da mesma operacao.
- **`success`:** resposta validada e completa em `data`; permite renderizar os componentes correspondentes.
- **`empty`:** operacao concluida sem dados selecionaveis, como entrada vazia ou nenhum resultado; exibe mensagem acionavel e nao chama clima sem cidade.
- **`error`:** falha classificada em `error`; exibe mensagem pt-BR e retry quando `retryable` for verdadeiro.

As transicoes permitidas sao `idle -> loading`, `loading -> success|empty|error` e `error|empty -> loading` por nova tentativa. Uma nova busca pode iniciar `loading` mesmo quando a consulta anterior ainda estiver em andamento, mas somente a resposta mais recente vence.

### Unidade derivada na renderizacao

O estado e o modelo de dados armazenam todas as temperaturas em Celsius. A UI deriva o valor exibido no momento da renderizacao:

```ts
function displayTemperature(valueCelsius: number, unit: Unit): number {
  const value = unit === 'fahrenheit'
    ? (valueCelsius * 9) / 5 + 32
    : valueCelsius

  return Math.round(value)
}
```

O componente recebe `temperatureCelsius` e `unit`, calcula o valor apenas para exibir e adiciona `°C` ou `°F`. Alternar `unit` atualiza o estado local e re-renderiza clima atual, previsao diaria e previsao horaria sem chamar nenhum service ou emitir novo request. O valor original em Celsius evita erro acumulado em alternancias repetidas.

## Error Handling

| Situacao | Classificacao | Estado UI | Comportamento |
| --- | --- | --- | --- |
| Entrada vazia | `validation` | `empty`/validacao | Mostrar `Informe uma cidade`; nao chamar API. |
| Nenhum resultado | `no-results` | `empty` | Mostrar `Nenhuma cidade encontrada`. |
| Timeout acima de 4 s | `timeout` | `error` | Mensagem pt-BR e retry. |
| Falha de rede/CORS | `network` | `error` | Mensagem pt-BR e retry. |
| Rate limit | `rate-limit` | `error` | Mensagem de indisponibilidade; retry manual. |
| Erro HTTP do provedor | `provider` | `error` | Nao exibir payload bruto; permitir retry quando aplicavel. |
| Schema/campos invalidos | `invalid-response` | `error` | Nao renderizar dados parciais; registrar erro tecnico sem dados de busca. |

### Classificacao por origem

- **Rede:** `fetch` rejeitado, DNS, CORS ou ausencia de conectividade devem virar `network`; a UI mostra indisponibilidade e retry manual.
- **API:** respostas HTTP 429 viram `rate-limit`; demais status 4xx/5xx viram `provider`, sem expor corpo ou URL ao usuario.
- **Timeout:** `AbortController` encerra a requisicao aos 4 segundos e produz `timeout`; o retry inicia uma nova requisicao.
- **Resposta parcial:** ausencia de campo obrigatorio, arrays com comprimentos diferentes, menos de 24 horas, menos de 5 dias, datas duplicadas ou codigo desconhecido viram `invalid-response`; nenhum dado parcial chega a UI.
- **Sem resultados:** geocoding sem `results` validos vira `no-results` e permanece em `empty`, sem iniciar forecast.

Regras adicionais:

- Mensagens apresentadas ao usuario ficam em pt-BR e nao expõem URL, payload, stack trace ou detalhes internos.
- Cada retry executa uma nova requisicao.
- A requisicao mais recente vence; respostas antigas nao podem substituir resultados atuais.
- O service normaliza qualquer falha externa para `ServiceError`; componentes nao tratam `Response`, `Error` ou payload do provedor diretamente.
- Loading, erro e empty devem ter roles/labels acessiveis e foco coerente.
- O service deve gerar logs estruturados com operacao, estado, latencia, codigo de erro e correlacao, sem cidade ou coordenadas.

## Testing Strategy

### Unitarios e integracao de service

Com Vitest, cobrir funcoes puras e services sem depender da rede real:

- `normalizeSearch`: espacos, entrada vazia, acentos e caracteres especiais.
- `temperature`: conversoes conhecidas, arredondamento e ausencia de erro acumulado.
- `weatherCode`: todos os codigos suportados e codigo desconhecido.
- `validateWeatherResponse`: campos ausentes, tipos invalidos, cinco dias, 24 horas, datas duplicadas e timezone.
- `openMeteoClient`: URL, parametros, timeout, HTTPS, HTTP errors e classificacao de falhas.
- `weatherService`: adaptacao de geocoding/forecast e descarte de respostas invalidas.

O `fetch` deve ser mockado nos testes de service. Os casos minimos sao resposta 200 valida, lista vazia, 4xx/5xx, 429, rejeicao de rede, abort por timeout e JSON parcial/invalido. Cada teste deve verificar tambem que os parametros enviados correspondem ao contrato da Open-Meteo.

### Componentes e hooks

Com Vitest e Testing Library, testar os componentes por comportamento observavel, com hooks e services mockados:

- `idle`: tela inicial sem dados meteorologicos e sem mensagem de erro.
- `loading`: indicador acessivel e bloqueio da submissao duplicada da mesma operacao.
- `empty`: entrada vazia e nenhum resultado com mensagens esperadas e sem chamada de forecast.
- `success`: cidade selecionada, clima atual, 24 itens horarios e 5 itens diarios renderizados.
- `error`: erro de rede/API/timeout/resposta invalida com mensagem pt-BR e retry.
- Busca vazia nao chama service.
- Selecao de cidade inicia consulta com o identificador/coordenadas corretos.
- Retry repete a consulta sem nova selecao.
- Resposta antiga nao sobrescreve resposta nova.
- Alternancia Celsius/Fahrenheit atualiza todos os valores sem nova chamada externa.
- Controles possuem nomes acessiveis, foco visivel e operacao por teclado.

### E2E com Playwright

Com Playwright, cobrir fluxos completos em navegador, mantendo as chamadas Open-Meteo interceptadas para tornar os cenarios deterministas:

1. Busca valida, selecao e exibicao de clima atual.
2. Exibicao de cinco dias e 24 horas com dados mockados.
3. Alternancia de unidade sem nova requisicao.
4. Entrada vazia, nenhum resultado, timeout e retry.
5. Busca concorrente com resposta fora de ordem.
6. Viewports de 320, 768 e 1280 CSS px, com pelo menos um projeto mobile em 320 CSS px.
7. Navegadores Chrome, Firefox, Safari e Edge da matriz da spec; a cobertura completa de navegadores fica no CI e o smoke test local usa Chromium.

Os testes E2E nao devem depender da disponibilidade real do Open-Meteo para validar a UI. Um teste separado de contrato do service valida a forma das requisicoes sem transformar a API externa em dependencia dos fluxos E2E.

### Qualidade e performance

- `pnpm lint`, `pnpm build` e `pnpm test` devem passar antes da entrega.
- `pnpm test:e2e` deve passar nos fluxos principais.
- Usar auditoria automatizada de acessibilidade e verificacao manual de teclado/leitor de tela.
- Executar teste de carga com 100 consultas simultaneas conforme o plano de validacao, sem transformar operacao de incidentes em escopo do MVP.

## Risks & Trade-offs

### Trade-offs e alternativas

- **Estado local React vs. Redux/Zustand:** foi escolhido estado local porque ha poucos fluxos, nao existe persistencia e os hooks ja delimitam a orquestracao. Redux/Zustand seriam justificaveis apenas com estado compartilhado entre muitas telas.
- **`fetch` vs. Axios:** foi escolhido `fetch` nativo para evitar dependencia adicional. Axios simplificaria alguns interceptors, mas adicionaria custo sem reduzir o contrato de timeout/classificacao que ainda precisaria existir.
- **Services/adapters vs. chamadas na UI:** services foram escolhidos para isolar o provedor, validar schema e facilitar mocks. Chamadas diretas em componentes seriam menores inicialmente, mas acoplariam UI ao payload externo e dificultariam testes.
- **`lib` pura vs. utilitarios misturados nos componentes:** `lib` permite testar conversao, normalizacao e validacao sem React ou rede. Colocar essas regras nos componentes reduziria arquivos, mas aumentaria acoplamento e casos de teste de UI.
- **Sem cache vs. cache no cliente:** sem cache segue a spec, evita dados meteorologicos obsoletos e simplifica consistencia. Cache reduziria chamadas, mas exigiria TTL, invalidacao e tratamento de dados antigos.
- **Mock E2E vs. API real:** mocks tornam cenarios de loading, erro, timeout e respostas parciais deterministas. A API real e util para um smoke test manual separado, mas nao deve controlar o resultado do CI.
- **Vitest focado por camada vs. apenas E2E:** testes unitarios sao mais rapidos para regras e contratos; E2E cobre integracao visual. Usar apenas E2E deixaria conversao, parsing e classificacao mais lentos e dificeis de diagnosticar.
- **Gateway/proxy vs. chamadas diretas do browser:** o plano mantem services client-side para o desenvolvimento da SPA. Em producao, gateway/proxy e a alternativa recomendada para proteger limites, centralizar HTTPS/health/logs e reduzir abuso; chamadas diretas sao mais simples, mas nao garantem limite global nem observabilidade server-side.

Riscos funcionais: Open-Meteo pode sofrer lentidao, indisponibilidade ou rate limit; nomes ambiguos podem gerar selecao incorreta; respostas parciais podem corromper a UI; e o fuso muda o significado de "hoje". Mitigacoes: timeout, retry manual, validacao completa, selecao explicita e `timezone=auto`.
