# Backlog de Tarefas — Weather App

As tarefas abaixo consomem [plans/weather-app-plan.md](../plans/weather-app-plan.md) e estao ordenadas por dependencias. Cada tarefa e uma unidade implementavel e testavel, limitada a uma camada principal e a no maximo dois arquivos de producao quando aplicavel.

## Entrega 1 — Contratos e funcoes puras

### T-01 — Definir tipos meteorologicos

- **ID:** T-01
- **Titulo:** Criar contratos de clima e cidade
- **Descricao:** Definir `Unit`, `City`, `CurrentWeather`, `HourlyForecastItem`, `ForecastDay` e `WeatherData`.
- **Criterios de aceite:**
  - Os campos correspondem ao modelo normalizado da Open-Meteo.
  - Temperaturas internas sao representadas em Celsius.
  - Os tipos nao importam React, rede ou services.
  - `pnpm build` conclui sem erros de TypeScript apos os contratos serem adicionados.
- **Dependencias:** Nenhuma.
- **Arquivos provaveis:** `src/types/weather.ts`.
- **Tipo:** Data

### T-02 — Definir tipos de estado e erro

- **ID:** T-02
- **Titulo:** Criar contratos de estados assincronos
- **Descricao:** Definir `WeatherErrorCode`, `OperationState`, `ServiceError` e `AsyncState<T>`.
- **Criterios de aceite:**
  - Os estados sao exatamente `idle`, `loading`, `success`, `empty` e `error`.
  - Os codigos cobrem validation, no-results, timeout, network, rate-limit, provider e invalid-response.
  - O contrato nao contem efeitos ou chamadas.
- **Dependencias:** T-01.
- **Arquivos provaveis:** `src/types/service.ts`.
- **Tipo:** Data

### T-03 — Normalizar busca

- **ID:** T-03
- **Titulo:** Implementar normalizacao de cidade
- **Descricao:** Criar funcao pura para remover espacos nas extremidades, preservar acentos e rejeitar entrada vazia.
- **Criterios de aceite:**
  - `"  Sao Paulo  "` retorna `"Sao Paulo"`.
  - Entrada vazia ou somente com espacos nao e enviada ao provedor.
  - A funcao nao altera caracteres internos.
- **Dependencias:** T-02.
- **Arquivos provaveis:** `src/lib/normalizeSearch.ts`.
- **Tipo:** Data

### T-04 — Converter temperaturas

- **ID:** T-04
- **Titulo:** Implementar conversao de unidade
- **Descricao:** Criar conversao e arredondamento de apresentacao entre Celsius e Fahrenheit usando o valor original em Celsius.
- **Criterios de aceite:**
  - `0 C` resulta em `32 F` e `32 F` resulta em `0 C`.
  - A funcao arredonda apenas o valor exibido.
  - Alternancias repetidas nao acumulam erro.
- **Dependencias:** T-01.
- **Arquivos provaveis:** `src/lib/temperature.ts`.
- **Tipo:** Data

### T-05 — Mapear codigos meteorologicos

- **ID:** T-05
- **Titulo:** Criar tabela de condicoes WMO
- **Descricao:** Mapear `weather_code` para rotulos pt-BR e rejeitar codigos nao suportados.
- **Criterios de aceite:**
  - Cada codigo suportado retorna um rotulo pt-BR.
  - Codigo desconhecido produz erro `invalid-response`.
  - Nenhum codigo bruto e usado como texto de UI.
- **Dependencias:** T-02.
- **Arquivos provaveis:** `src/lib/weatherCode.ts`.
- **Tipo:** Data

### T-06 — Validar series de forecast

- **ID:** T-06
- **Titulo:** Validar datas e cardinalidade meteorologica
- **Descricao:** Validar timezone, tipos, arrays alinhados, 24 horas, 5 dias, ordem cronologica e ausencia de duplicatas.
- **Criterios de aceite:**
  - Menos de 24 itens horarios ou 5 itens diarios gera `invalid-response`.
  - Arrays com comprimentos diferentes, campos ausentes ou datas duplicadas sao rejeitados.
  - Um fixture com todos os campos obrigatorios retorna exatamente 24 itens horarios e 5 itens diarios.
- **Dependencias:** T-01, T-02, T-05.
- **Arquivos provaveis:** `src/lib/validateWeatherResponse.ts`, `src/lib/dateSeries.ts`.
- **Tipo:** Data

## Entrega 2 — Cliente e services de dados

### T-07 — Montar requests do Open-Meteo

- **ID:** T-07
- **Titulo:** Criar construtores de URL
- **Descricao:** Criar funcoes para montar URLs de geocoding e forecast com os parametros definidos no plano.
- **Criterios de aceite:**
  - Geocoding usa `name`, `count=10`, `language=pt` e `format=json`.
  - Forecast usa coordenadas, `timezone=auto`, `forecast_days=5`, `current`, `hourly` e `daily`.
  - As URLs usam HTTPS e nao incluem credenciais.
- **Dependencias:** T-01, T-03.
- **Arquivos provaveis:** `src/services/openMeteoClient.ts`.
- **Tipo:** Data

### T-08 — Tratar execução HTTP

- **ID:** T-08
- **Titulo:** Implementar fetch com timeout e classificacao
- **Descricao:** Encapsular `fetch`, `AbortController`, parsing JSON e classificacao de falhas externas.
- **Criterios de aceite:**
  - Timeout de 4 segundos gera `timeout`.
  - Rejeicao de rede ou CORS gera `network`.
  - HTTP 429 gera `rate-limit`; demais 4xx/5xx geram `provider`.
  - O cliente nao expoe payload bruto ou stack trace.
- **Dependencias:** T-02, T-07.
- **Arquivos provaveis:** `src/services/openMeteoClient.ts`.
- **Tipo:** Data

### T-09 — Adaptar resposta de geocoding

- **ID:** T-09
- **Titulo:** Implementar busca de cidades
- **Descricao:** Consumir geocoding, validar resultados e mapear cada registro para `City`.
- **Criterios de aceite:**
  - Registros sem id, nome, latitude ou longitude sao descartados.
  - Pais, regiao e timezone sao preservados quando fornecidos.
  - Lista vazia ou ausente gera `no-results`.
- **Dependencias:** T-06, T-08.
- **Arquivos provaveis:** `src/services/weatherService.ts`.
- **Tipo:** Data

### T-10 — Adaptar resposta de forecast

- **ID:** T-10
- **Titulo:** Implementar consulta meteorologica
- **Descricao:** Consumir forecast, validar o payload e mapear current, hourly e daily para `WeatherData`.
- **Criterios de aceite:**
  - O resultado contem clima atual, 24 horas e 5 dias.
  - Datas usam o timezone retornado.
  - Temperaturas permanecem em Celsius.
  - Resposta parcial ou invalida retorna `invalid-response` e nao chega a UI.
- **Dependencias:** T-04, T-05, T-06, T-08, T-01.
- **Arquivos provaveis:** `src/services/weatherService.ts`.
- **Tipo:** Data

## Entrega 3 — Hooks de orquestracao

### T-14 — Orquestrar busca de cidades

- **ID:** T-14
- **Titulo:** Implementar `useLocationSearch`
- **Descricao:** Controlar query, resultados, estados explicitos, selecao de resultados e retry da busca.
- **Criterios de aceite:**
  - Entrada vazia fica em `empty` sem chamar service.
  - Busca valida transita por `loading` para `success` ou `empty`.
  - Erro exibe `error` e permite retry.
  - Resposta antiga nao sobrescreve busca mais recente.
- **Dependencias:** T-03, T-09, T-02.
- **Arquivos provaveis:** `src/hooks/useLocationSearch.ts`.
- **Tipo:** Data

### T-15 — Orquestrar consulta meteorologica

- **ID:** T-15
- **Titulo:** Implementar `useWeatherQuery`
- **Descricao:** Controlar cidade selecionada, `WeatherData`, unidade, retry e `requestId` da consulta.
- **Criterios de aceite:**
  - Selecao inicia `loading` com id e coordenadas corretos.
  - Success so ocorre apos forecast completo e validado.
  - Erro preserva cidade e permite retry sem nova selecao.
  - Resposta fora de ordem e descartada.
- **Dependencias:** T-10, T-02, T-04.
- **Arquivos provaveis:** `src/hooks/useWeatherQuery.ts`.
- **Tipo:** Data

## Entrega 4 — Componentes, integracao e estilos

### T-17 — Criar formulario de busca

- **ID:** T-17
- **Titulo:** Implementar `SearchForm`
- **Descricao:** Criar formulario acessivel que recebe query, loading e callbacks por props.
- **Criterios de aceite:**
  - Campo e botao possuem nomes acessiveis.
  - Submissao por teclado dispara callback uma vez.
  - Loading bloqueia apenas submissao duplicada.
  - O componente nao faz HTTP.
- **Dependencias:** T-14.
- **Arquivos provaveis:** `src/components/SearchForm.tsx`.
- **Tipo:** UI

### T-18 — Criar resultados e status de busca

- **ID:** T-18
- **Titulo:** Implementar `LocationResults` e `WeatherStatus`
- **Descricao:** Renderizar resultados selecionaveis e estados idle/loading/empty/error com foco e roles semanticos.
- **Criterios de aceite:**
  - Resultados mostram nome e regiao/pais quando disponiveis.
  - Opcoes sao selecionaveis por teclado.
  - Mensagens `Informe uma cidade` e `Nenhuma cidade encontrada` aparecem nos estados corretos.
  - Erro oferece retry quando aplicavel.
- **Dependencias:** T-14, T-17.
- **Arquivos provaveis:** `src/components/LocationResults.tsx`, `src/components/WeatherStatus.tsx`.
- **Tipo:** UI

### T-19 — Criar painel de clima atual

- **ID:** T-19
- **Titulo:** Implementar `CurrentWeather`
- **Descricao:** Renderizar cidade, temperatura atual e condicao meteorologica ja normalizadas.
- **Criterios de aceite:**
  - Cidade, temperatura, unidade e rotulo pt-BR sao exibidos.
  - Nenhum payload bruto da Open-Meteo e acessado.
  - Ausencia de dados nao produz valores parciais.
- **Dependencias:** T-15.
- **Arquivos provaveis:** `src/components/CurrentWeather.tsx`.
- **Tipo:** UI

### T-20 — Criar previsao horaria

- **ID:** T-20
- **Titulo:** Implementar `HourlyForecast`
- **Descricao:** Renderizar as 24 entradas horarias em ordem cronologica.
- **Criterios de aceite:**
  - Exatamente 24 itens sao renderizados em success.
  - Hora, temperatura e condicao sao exibidas no timezone/modelo recebido.
  - Estado sem dados nao renderiza lista incompleta.
- **Dependencias:** T-15.
- **Arquivos provaveis:** `src/components/HourlyForecast.tsx`.
- **Tipo:** UI

### T-21 — Criar previsao diaria

- **ID:** T-21
- **Titulo:** Implementar `DailyForecast`
- **Descricao:** Renderizar os cinco dias com data, minima, maxima e condicao meteorologica.
- **Criterios de aceite:**
  - Exatamente 5 itens sao renderizados em ordem cronologica.
  - Minima, maxima, data e rotulo pt-BR sao exibidos.
  - Estado sem dados nao renderiza lista incompleta.
- **Dependencias:** T-15.
- **Arquivos provaveis:** `src/components/DailyForecast.tsx`.
- **Tipo:** UI

### T-22 — Criar controle de unidade

- **ID:** T-22
- **Titulo:** Implementar `TemperatureUnitToggle`
- **Descricao:** Criar controle que altera `Unit` no estado local e deriva a temperatura na renderizacao.
- **Criterios de aceite:**
  - Celsius e a unidade inicial.
  - 0 C aparece como 32 F e 10 C como 50 F.
  - Alternar unidade nao chama nenhum service.
  - Controle tem nome acessivel e opera por teclado.
- **Dependencias:** T-04, T-19, T-20, T-21.
- **Arquivos provaveis:** `src/components/TemperatureUnitToggle.tsx`.
- **Tipo:** UI

### T-26 — Compor a tela principal

- **ID:** T-26
- **Titulo:** Integrar hooks e componentes no App
- **Descricao:** Conectar busca, selecao, consulta, estados, previsoes e unidade em uma tela principal sem persistencia.
- **Criterios de aceite:**
  - Fluxo busca -> selecao -> forecast funciona.
  - A tela alterna entre idle, loading, empty, error e success.
  - Componentes nao fazem chamadas HTTP diretamente.
- Uma busca e uma consulta aparecem no mock de service exatamente uma vez por acao do usuario.
- Nenhum dado e persistido localmente ou no servidor.
- **Dependencias:** T-16, T-18, T-19, T-20, T-21, T-22.
- **Arquivos provaveis:** `src/app/App.tsx`, `src/main.tsx`.
- **Tipo:** UI

### T-27 — Aplicar estilos responsivos

- **ID:** T-27
- **Titulo:** Ajustar layout e acessibilidade visual
- **Descricao:** Aplicar Tailwind/CSS para os fluxos principais em 320, 768 e 1280 CSS px.
- **Criterios de aceite:**
  - Nao existe rolagem horizontal em 320 CSS px.
  - Controles e mensagens permanecem visiveis sem perda de conteudo.
  - Foco, contraste e estados de loading/error/empty permanecem distinguiveis.
- **Dependencias:** T-26.
- **Arquivos provaveis:** `src/app/app.css`.
- **Tipo:** UI

### T-36 — Aplicar background por temperatura

- **ID:** T-36
- **Titulo:** Exibir imagem contextual de temperatura
- **Descricao:** Selecionar uma URL Unsplash por faixa de temperatura em funcao pura e aplicar background `cover` com overlay no App.
- **Criterios de aceite:**
  - Abaixo de 10°C usa faixa fria; 10°C a 24°C usa faixa amena; 25°C ou mais usa faixa quente.
  - O background so aparece com dados meteorologicos validos.
  - O overlay mantém texto e controles legiveis e nao cria overflow.
- **Dependencias:** T-04, T-26, T-27.
- **Arquivos provaveis:** `src/lib/temperatureBackground.ts`, `src/App.tsx`.
- **Tipo:** UI

### T-37 — Testar background contextual

- **ID:** T-37
- **Titulo:** Cobrir faixas de background e legibilidade
- **Descricao:** Testar limites da funcao de faixa e o estado de sucesso com background contextual.
- **Criterios de aceite:**
  - Casos 9.9°C, 10°C, 24.9°C e 25°C selecionam as faixas esperadas.
  - Estados sem clima valido nao exibem background de temperatura anterior.
  - O teste de UI mantém conteúdo e controles acessiveis.
- **Dependencias:** T-36.
- **Arquivos provaveis:** `tests/unit/temperatureBackground.test.ts`, `tests/unit/App.test.tsx`.
- **Tipo:** Test

## Entrega 5 — Testes automatizados

### T-11 — Testar service com mock de fetch

- **ID:** T-11
- **Titulo:** Cobrir service com mock de fetch
- **Descricao:** Testar o cliente e os services Open-Meteo usando `fetch` mockado, sem rede real.
- **Criterios de aceite:**
  - Ha casos para 200, 429, 4xx/5xx, rede, timeout e JSON invalido.
  - Parametros de geocoding e forecast sao verificados.
  - `pnpm test` passa para os testes do cliente.
- **Dependencias:** T-07, T-08.
- **Arquivos provaveis:** `tests/services/openMeteoClient.test.ts`.
- **Tipo:** Test

### T-12 — Testar adaptador de geocoding

- **ID:** T-12
- **Titulo:** Cobrir mapeamento de cidades
- **Descricao:** Testar resposta valida, lista vazia, campos ausentes e resultados ambiguos do geocoding.
- **Criterios de aceite:**
  - Resposta valida produz `City[]` correto.
  - Lista vazia produz `no-results`.
  - Registro invalido nao e entregue ao hook.
- **Dependencias:** T-09, T-11.
- **Arquivos provaveis:** `tests/services/weatherService.geocoding.test.ts`.
- **Tipo:** Test

### T-13 — Testar adaptador de forecast

- **ID:** T-13
- **Titulo:** Cobrir mapeamento meteorologico
- **Descricao:** Testar current, hourly, daily, timezone, cardinalidade e respostas parciais do forecast.
- **Criterios de aceite:**
  - Payload valido produz `WeatherData` com 24 horas e 5 dias.
  - Campos ausentes, arrays desalinhados, datas duplicadas e codigo desconhecido produzem `invalid-response`.
  - Nenhum dado parcial e retornado.
- **Dependencias:** T-10, T-11.
- **Arquivos provaveis:** `tests/services/weatherService.forecast.test.ts`.
- **Tipo:** Test

### T-16 — Testar hooks de estado

- **ID:** T-16
- **Titulo:** Cobrir transicoes e concorrencia dos hooks
- **Descricao:** Testar hooks com services falsos para estados, retry, selecao e respostas fora de ordem.
- **Criterios de aceite:**
  - `idle`, `loading`, `success`, `empty` e `error` possuem cobertura.
  - Retry repete a consulta sem nova selecao.
  - Resposta antiga nao altera o estado atual.
- **Dependencias:** T-14, T-15, T-12, T-13.
- **Arquivos provaveis:** `tests/hooks/useLocationSearch.test.ts`, `tests/hooks/useWeatherQuery.test.ts`.
- **Tipo:** Test

### T-23 — Testar clima atual

- **ID:** T-23
- **Titulo:** Cobrir renderizacao do clima atual
- **Descricao:** Testar `CurrentWeather` com dados completos e ausencia de dados usando Testing Library.
- **Criterios de aceite:**
  - Cidade, temperatura, unidade e rotulo pt-BR aparecem em success.
  - Dados ausentes nao geram valores parciais.
  - O componente possui nome acessivel quando aplicavel.
- **Dependencias:** T-19.
- **Arquivos provaveis:** `tests/components/CurrentWeather.test.tsx`.
- **Tipo:** Test

### T-24 — Testar previsoes

- **ID:** T-24
- **Titulo:** Cobrir previsoes horaria e diaria
- **Descricao:** Testar `HourlyForecast` e `DailyForecast` com series completas e vazias.
- **Criterios de aceite:**
  - 24 itens horarios e 5 itens diarios aparecem em ordem.
  - Dados incompletos nao sao renderizados.
  - Labels e foco dos itens interativos, quando houver, sao acessiveis.
- **Dependencias:** T-20, T-21.
- **Arquivos provaveis:** `tests/components/HourlyForecast.test.tsx`, `tests/components/DailyForecast.test.tsx`.
- **Tipo:** Test

### T-25 — Testar conversao e controle de unidade

- **ID:** T-25
- **Titulo:** Cobrir conversao Celsius/Fahrenheit
- **Descricao:** Testar a funcao pura de conversao e o `TemperatureUnitToggle` sem nova chamada externa.
- **Criterios de aceite:**
  - Celsius e a unidade inicial.
  - Valores conhecidos convertem e arredondam corretamente.
  - A funcao pura e testada diretamente com Celsius e Fahrenheit.
  - Alternar unidade nao chama service e o controle funciona por teclado.
- **Dependencias:** T-22.
- **Arquivos provaveis:** `tests/components/TemperatureUnitToggle.test.tsx`.
- **Tipo:** Test

### T-28 — Preparar fixtures E2E

- **ID:** T-28
- **Titulo:** Configurar mocks Open-Meteo no Playwright
- **Descricao:** Criar fixtures de geocoding e forecast validos, vazios, parciais e com erro.
- **Criterios de aceite:**
  - Chamadas externas sao interceptadas sem depender da rede real.
  - Fixtures incluem current, hourly com 24 itens e daily com 5 itens.
  - Erros de timeout, rede simulada e resposta fora de ordem podem ser reproduzidos.
- **Dependencias:** T-26.
- **Arquivos provaveis:** `tests/e2e/fixtures/weather.ts`, `playwright.config.ts`.
- **Tipo:** Test

### T-29 — Testar fluxo E2E feliz

- **ID:** T-29
- **Titulo:** Cobrir busca e previsoes no navegador
- **Descricao:** Testar busca valida, selecao, clima atual, previsao diaria/horaria e alternancia de unidade.
- **Criterios de aceite:**
  - O fluxo completo termina em success.
  - 24 horas e 5 dias aparecem.
  - Alternar unidade nao dispara nova requisicao.
- **Dependencias:** T-28, T-27.
- **Arquivos provaveis:** `tests/e2e/weather-app.spec.ts`.
- **Tipo:** Test

### T-30 — Testar falhas E2E

- **ID:** T-30
- **Titulo:** Cobrir vazio, erro, retry e concorrencia
- **Descricao:** Testar entrada vazia, nenhum resultado, timeout, erro de provider, retry e respostas fora de ordem.
- **Criterios de aceite:**
  - Cada falha mostra o estado e mensagem esperados.
  - Retry repete a operacao sem nova selecao quando aplicavel.
  - Resposta antiga nunca substitui a mais recente.
- **Dependencias:** T-28, T-27.
- **Arquivos provaveis:** `tests/e2e/weather-errors.spec.ts`.
- **Tipo:** Test

### T-31 — Testar viewports e acessibilidade E2E

- **ID:** T-31
- **Titulo:** Validar mobile e teclado
- **Descricao:** Executar smoke tests nos viewports da spec e validar navegacao por teclado nos fluxos principais.
- **Criterios de aceite:**
  - Viewports 320, 768 e 1280 CSS px nao exibem overflow horizontal.
  - Busca, selecao, retry e unidade funcionam por teclado.
  - A matriz de navegadores configurada no CI executa os cenarios principais.
- **Dependencias:** T-29, T-30.
- **Arquivos provaveis:** `tests/e2e/responsive-accessibility.spec.ts`, `playwright.config.ts`.
- **Tipo:** Test

## Entrega 6 — Hardening e entrega

### T-32 — Testar estados visuais

- **ID:** T-32
- **Titulo:** Cobrir loading, erro, vazio e sucesso nos componentes
- **Descricao:** Testar os estados visuais de busca e clima com Testing Library e services mockados.
- **Criterios de aceite:**
  - `loading` exibe indicador acessivel e bloqueia submissao duplicada.
  - `error` exibe mensagem pt-BR e controle de retry.
  - `empty` exibe `Informe uma cidade` ou `Nenhuma cidade encontrada` conforme o caso.
  - `success` exibe clima atual e previsoes completas sem dados parciais.
- **Dependencias:** T-18, T-19, T-20, T-21, T-26.
- **Arquivos provaveis:** `tests/components/WeatherStatus.test.tsx`, `tests/components/LocationResults.test.tsx`, `tests/components/CurrentWeather.test.tsx`.
- **Tipo:** Test

### T-33 — Testar fluxo principal E2E mobile

- **ID:** T-33
- **Titulo:** Cobrir fluxo principal em viewport mobile
- **Descricao:** Executar busca, selecao, forecast atual/horario/diario e unidade em viewport de 320 CSS px com Playwright.
- **Criterios de aceite:**
  - O fluxo termina em success sem rolagem horizontal.
  - A tela exibe clima atual, 24 horas e 5 dias.
  - A troca de unidade nao dispara nova requisicao.
  - O mesmo cenario pode ser executado com respostas Open-Meteo interceptadas.
- **Dependencias:** T-28, T-29, T-31.
- **Arquivos provaveis:** `tests/e2e/mobile-main-flow.spec.ts`.
- **Tipo:** Test

### T-34 — Validar capacidade e infraestrutura

- **ID:** T-34
- **Titulo:** Executar teste de carga e validar gateway
- **Descricao:** Testar 100 consultas simultaneas, p95 de 5 segundos e suporte de hospedagem para limite da API, HTTPS e checks.
- **Criterios de aceite:**
  - 95 de 100 consultas terminam com dados ou falha em ate 5 segundos.
  - O limite de 10.000 chamadas diarias nao depende apenas do frontend.
  - O teste inicia 100 consultas simultaneas e registra o resultado de cada uma.
  - Ausencia de gateway/proxy e registrada como bloqueio de producao.
- **Dependencias:** T-08, T-10, T-26, decisao de infraestrutura do plano.
- **Arquivos provaveis:** `docs/performance.md`, configuracao do ambiente de hospedagem.
- **Tipo:** Infra

### T-35 — Executar quality gate

- **ID:** T-35
- **Titulo:** Validar entrega do MVP
- **Descricao:** Executar lint, build, testes unitarios e E2E, revisar rastreabilidade e confirmar que nenhuma persistencia ou funcionalidade fora do escopo foi introduzida.
- **Criterios de aceite:**
  - `pnpm lint`, `pnpm build`, `pnpm test` e `pnpm test:e2e` passam.
  - RF-01 a RF-05 e RNF-01 a RNF-11 possuem cobertura ou justificativa documentada.
  - O repositorio nao contem credenciais, armazenamento local ou chamadas HTTP fora de services.
- **Dependencias:** T-14, T-16, T-23, T-24, T-25, T-31, T-32, T-33, T-34.
- **Arquivos provaveis:** `README.md`, configuracao de CI/deploy.
- **Tipo:** Infra

## Functional Requirements Matrix

| Requisito funcional | Tarefas de implementacao | Tarefas de teste relacionadas |
| --- | --- | --- |
| RF-01 — Buscar cidades | T-03, T-07, T-09, T-14, T-17, T-18, T-26 | T-11, T-12, T-16, T-28, T-29, T-30, T-31 |
| RF-02 — Consultar clima atual | T-05, T-06, T-10, T-15, T-19, T-26 | T-13, T-16, T-23, T-28, T-29, T-30, T-32 |
| RF-03 — Consultar previsao de cinco dias | T-06, T-10, T-15, T-21, T-26 | T-13, T-16, T-24, T-28, T-29, T-30, T-32 |
| RF-04 — Alternar unidade de temperatura | T-04, T-22, T-26 | T-25, T-29, T-32 |
| RF-05 — Consultar previsao horaria | T-06, T-10, T-15, T-20, T-26 | T-13, T-16, T-24, T-28, T-29, T-32 |
| RF-06 — Background contextual por temperatura | T-36 | T-37, T-29, T-31 |

**Requisitos funcionais sem tarefa correspondente:** nenhum. RF-01 a RF-06 possuem tarefas de implementacao e tarefas de teste.

## Traceability Matrix

| Tarefa | Requisitos da spec | Criterios relacionados |
| --- | --- | --- |
| T-01 | RF-01 a RF-05 | Contratos de dados e compilacao TypeScript |
| T-02 | RNF-06 | Estados e codigos de erro |
| T-03 | RF-01, AC-RF-01 | Entrada normalizada e sem chamada para vazio |
| T-04 | RF-04, AC-RF-04 | Conversao e arredondamento |
| T-05 | RF-02, RF-03, RF-05 | Rotulos de condicao |
| T-06 | RF-02, RF-03, RF-05, RNF-06 | Series completas e `invalid-response` |
| T-07 | RF-01 | URL e parametros de geocoding |
| T-08 | RNF-04, RNF-06, RNF-09, RNF-10 | Timeout, rede e HTTP |
| T-09 | RF-01, AC-RF-01 | Mapeamento de cidades e `no-results` |
| T-10 | RF-02, RF-03, RF-05, AC-RF-02, AC-RF-03, AC-RF-05 | Forecast completo |
| T-11 | RNF-04, RNF-06, RNF-09 | Cliente HTTP mockado |
| T-12 | RF-01, AC-RF-01 | Adaptacao de geocoding |
| T-13 | RF-02, RF-03, RF-05, AC-RF-02, AC-RF-03, AC-RF-05 | Adaptacao de forecast |
| T-14 | RF-01, AC-RF-01, RNF-06 | Hook de busca e estados |
| T-15 | RF-02, RF-03, RF-05, RNF-06 | Hook de clima e concorrencia |
| T-16 | RNF-02, RNF-06 | Testes de hooks |
| T-17 | RF-01, RNF-01, RNF-03 | Formulario acessivel |
| T-18 | RF-01, RNF-01, RNF-03 | Resultados e estados de busca |
| T-19 | RF-02, RNF-01, RNF-03 | Clima atual |
| T-20 | RF-05, RNF-01, RNF-03 | Previsao horaria |
| T-21 | RF-03, RNF-01, RNF-03 | Previsao diaria |
| T-22 | RF-04, RNF-03 | Controle e derivacao de unidade |
| T-23 | RF-02, RNF-03 | Teste do clima atual |
| T-24 | RF-03, RF-05, RNF-03 | Teste das previsoes |
| T-25 | RF-04, RNF-03 | Teste da unidade |
| T-26 | RF-01 a RF-05, RNF-01, RNF-03, RNF-07 | Integracao da tela |
| T-27 | RNF-01, RNF-03 | Responsividade visual |
| T-28 | RF-01 a RF-05 | Fixtures deterministicas |
| T-29 | RF-01 a RF-05, RNF-04 | E2E do fluxo feliz |
| T-30 | RF-01 a RF-03, RNF-04, RNF-06 | E2E de falhas e retry |
| T-31 | RNF-01, RNF-03 | Viewport e teclado |
| T-32 | RNF-01, RNF-03, RNF-06 | Estados loading, erro, vazio e sucesso |
| T-33 | RF-01 a RF-05, RNF-01, RNF-03, RNF-04 | Fluxo principal E2E mobile |
| T-34 | RNF-04, RNF-05, RNF-08, RNF-11 | Carga e infraestrutura |
| T-35 | RF-01 a RF-05, RNF-01 a RNF-11 | Quality gate final |
| T-36 | RF-06, RNF-01, RNF-03 | Background por temperatura e overlay |
| T-37 | RF-06, RNF-01, RNF-03 | Testes de faixas e legibilidade |

## Prioridade e tamanho

Prioridade: **P0** e necessario para o fluxo principal ou para um criterio de aceite do MVP; **P1** e necessario para qualidade, capacidade ou release de producao; **P2** fica reservado para evolucoes fora do MVP atual. Tamanho: **P** cabe em uma unidade curta e um arquivo principal; **M** envolve uma pequena fronteira entre arquivos/camadas; **G** envolve integracao, infraestrutura ou validacao ampla.

| Tarefa | Prioridade | Tamanho |
| --- | --- | --- |
| T-01 | P0 | P |
| T-02 | P0 | P |
| T-03 | P0 | P |
| T-04 | P0 | P |
| T-05 | P0 | P |
| T-06 | P0 | M |
| T-07 | P0 | P |
| T-08 | P0 | M |
| T-09 | P0 | M |
| T-10 | P0 | M |
| T-11 | P0 | M |
| T-12 | P0 | P |
| T-13 | P0 | M |
| T-14 | P0 | M |
| T-15 | P0 | M |
| T-16 | P0 | M |
| T-17 | P0 | P |
| T-18 | P0 | M |
| T-19 | P0 | P |
| T-20 | P0 | P |
| T-21 | P0 | P |
| T-22 | P0 | P |
| T-23 | P0 | P |
| T-24 | P0 | M |
| T-25 | P0 | P |
| T-26 | P0 | G |
| T-27 | P0 | M |
| T-28 | P0 | M |
| T-29 | P0 | M |
| T-30 | P0 | M |
| T-31 | P1 | M |
| T-32 | P0 | M |
| T-33 | P0 | M |
| T-34 | P1 | G |
| T-35 | P0 | M |
| T-36 | P0 | M |
| T-37 | P0 | P |

Nao ha tarefas P2 no escopo atual. P2 deve ser usado somente para funcionalidades futuras que nao aparecem na spec aprovada.

## Sequencia de fatias verticais

As fatias abaixo entregam comportamento visivel progressivamente. Dentro de cada fatia, respeitar as dependencias listadas na tarefa.

### Fatia 1 — Busca de cidade visivel

**Objetivo:** permitir informar uma cidade, ver resultados e selecionar uma localidade.

**Sequencia:** T-01, T-02, T-03, T-07, T-08, T-09, T-14, T-17, T-18 e T-26 em sua primeira passagem de composicao da busca.

**Resultado demonstravel:** formulario acessivel, estados loading/empty/error, resultados de geocoding e selecao de cidade, sem forecast ainda.

### Fatia 2 — Clima atual

**Objetivo:** transformar uma cidade selecionada em uma consulta meteorologica visivel.

**Sequencia:** T-05, T-06, T-10, T-15 e T-19; completar a composicao correspondente em T-26.

**Resultado demonstravel:** cidade, temperatura atual, condicao pt-BR, loading, erro e retry.

### Fatia 3 — Previsoes diaria e horaria

**Objetivo:** entregar o valor central de planejamento.

**Sequencia:** T-20, T-21, T-24 e a finalizacao de T-26.

**Resultado demonstravel:** 24 horas e cinco dias em ordem cronologica, no timezone da cidade.

### Fatia 4 — Unidade e confiabilidade funcional

**Objetivo:** concluir a interacao de unidade e proteger os fluxos contra regressao.

**Sequencia:** T-04, T-22, T-23, T-25, T-30 e T-32.

**Resultado demonstravel:** Celsius/Fahrenheit sem novo request, estados funcionais cobertos e retry/concorrencia verificados.

### Fatia 5 — Qualidade de release

**Objetivo:** validar o MVP em diferentes telas e preparar a entrega.

**Sequencia:** T-27, T-28, T-29, T-31, T-33, T-35 e T-37.

**Resultado demonstravel:** fluxo E2E principal, erros, viewport mobile, teclado e quality gate automatizado.

### Fatia 6 — Capacidade de producao

**Objetivo:** validar os requisitos operacionais sem bloquear o desenvolvimento local.

**Sequencia:** T-34 apos a escolha da infraestrutura de hospedagem.

**Resultado demonstravel:** teste de 100 consultas simultaneas, p95 verificado e limite da API protegido; sem gateway/proxy, o release permanece bloqueado.
