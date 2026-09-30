# Especificacao de Produto — Weather App

## Overview

O Weather App e uma aplicacao web responsiva para consulta de informacoes meteorologicas por cidade. O usuario informa uma localidade, seleciona o resultado correto quando necessario e visualiza as condicoes atuais, a previsao horaria de 24 horas e a previsao diaria para cinco dias: hoje e os quatro dias seguintes.

A interface sera apresentada em portugues do Brasil e usara Celsius como unidade inicial de temperatura, com opcao de alternancia para Fahrenheit. Os dados meteorologicos serao obtidos do Open-Meteo, usando a API gratuita e sem exigir autenticacao ou chave de API do usuario. A aplicacao nao tera contas nem persistencia local ou no servidor.

Esta especificacao transforma o discovery em um escopo inicial validavel. O contrato minimo de dados, o comportamento de armazenamento, os formatos regionais, os navegadores e as metas de qualidade do MVP estao definidos abaixo; permanecem em aberto apenas decisoes de operacao, conformidade e evolucao do produto.

### Personas do MVP

- **Consultor cotidiano:** pessoa que consulta rapidamente o clima de uma cidade para decidir como se preparar no dia.
- **Planejador de atividades:** pessoa que consulta os proximos quatro dias para organizar compromissos e atividades.
- **Usuario movel ou em rede instavel:** pessoa que usa um celular ou uma conexao com falhas e precisa de estados claros e nova tentativa.

### Contrato minimo de dados

O MVP deve exibir somente os seguintes campos meteorologicos: temperatura atual; condicao meteorologica atual; data de cada dia; temperatura minima e maxima diaria; e condicao meteorologica diaria. A condicao deve ser apresentada por um rotulo em pt-BR derivado do codigo meteorologico do provedor.

O clima atual e a previsao devem usar os dados da localidade selecionada e o fuso horario retornado para essa localidade. Valores ausentes ou invalidos devem impedir a exibicao daquele conjunto de dados e produzir o estado de erro correspondente.

### Contrato de integracao meteorologica

1. A busca de localidades deve usar o servico de geocoding do Open-Meteo com o texto normalizado pelo RF-01. O resultado interno deve conter `id`, `name`, `latitude`, `longitude`, `country` e `admin1` quando fornecidos.
2. A consulta meteorologica deve usar as coordenadas da localidade selecionada, `timezone=auto`, `forecast_days=5`, `current=temperature_2m,weather_code` e `daily=weather_code,temperature_2m_min,temperature_2m_max`.
3. A camada de servico deve validar tipos, presenca, cardinalidade e correspondencia de datas antes de entregar dados a interface. Ela nao deve repassar a resposta bruta do provedor para a UI.
4. O timeout da requisicao meteorologica e de 4 segundos. A camada de servico deve classificar as falhas como `validation`, `no-results`, `timeout`, `network`, `rate-limit`, `provider` ou `invalid-response`.
5. O contrato nao permite cache no MVP. Cada retry deve executar uma nova requisicao e somente a requisicao mais recente pode atualizar o estado da consulta.
6. A previsao horaria deve usar `hourly=temperature_2m,weather_code` e retornar a hora atual mais as 23 horas seguintes no fuso da localidade.

### Estados da experiencia

Cada operacao deve ter exatamente um estado observavel entre `idle`, `loading`, `success`, `empty` e `error`. O estado `loading` deve bloquear a submissao duplicada da mesma operacao sem impedir uma nova busca; `success` deve conter dados completos; `empty` deve conter uma mensagem acionavel; e `error` deve conter codigo interno, mensagem pt-BR e acao de retry quando aplicavel.

## Functional Requirements

### RF-01 — Buscar cidades

O sistema deve permitir que o usuario informe o nome de uma cidade e inicie uma busca de localidades para consulta meteorologica.

A busca deve aceitar texto digitado pelo usuario e tratar entradas com espacos excedentes de forma previsivel. Os resultados devem fornecer informacao suficiente para distinguir localidades homonimas, como nome, regiao/estado e pais quando esses dados estiverem disponiveis.

A aplicacao deve apresentar estados distintos para carregamento, resultados encontrados, ausencia de resultados e falha na busca. Quando houver mais de uma localidade plausivel, o usuario deve selecionar uma antes de consultar o clima.

Entradas vazias ou compostas somente por espacos nao devem chamar o provedor. A aplicacao deve remover espacos no inicio e no fim, preservar acentos e exibir a mensagem `Informe uma cidade`. Cada resultado deve conter nome, coordenadas e identificador estavel, alem de regiao e pais quando fornecidos pelo provedor.

### RF-02 — Consultar clima atual

Depois que uma cidade for selecionada, o sistema deve consultar e apresentar as condicoes meteorologicas atuais daquela localidade.

A visualizacao deve identificar claramente a cidade selecionada e a unidade usada. No MVP, ela deve exibir a temperatura atual e o rotulo em pt-BR da condicao meteorologica, conforme o contrato minimo de dados.

O sistema deve indicar quando os dados estao sendo carregados e deve apresentar uma mensagem compreensivel quando a consulta falhar ou exceder o tempo limite, mantendo disponivel uma acao de nova tentativa.

O codigo meteorologico deve ser convertido para um rotulo pt-BR por uma tabela versionada da aplicacao. Codigos desconhecidos ou campos obrigatorios ausentes devem ser tratados como resposta invalida e nao podem ser exibidos como texto tecnico.

### RF-03 — Consultar previsao de cinco dias

Depois que uma cidade for selecionada, o sistema deve apresentar uma previsao diaria para cinco dias consecutivos, incluindo o dia atual e os quatro dias seguintes.

Cada dia deve ser distinguivel por data ou rotulo equivalente e deve apresentar os campos meteorologicos definidos para o produto. A ordem deve ser cronologica. A previsao deve estar associada a cidade selecionada e deve respeitar a unidade de temperatura atualmente escolhida.

O sistema deve apresentar estados de carregamento e falha para a previsao. Se a fonte nao fornecer dados validos para o periodo solicitado, a aplicacao deve informar que a previsao nao esta disponivel em vez de exibir valores incompletos como se fossem validos.

O periodo deve ser calculado no fuso horario da localidade selecionada: a primeira data e a data corrente nesse fuso, seguida das quatro datas consecutivas. A previsao so pode ser exibida quando houver dados validos para as cinco datas.

### RF-04 — Alternar unidade de temperatura

O sistema deve permitir alternar a exibicao das temperaturas entre Celsius e Fahrenheit durante a consulta.

A unidade inicialmente selecionada deve ser Celsius. Ao alternar a unidade, todos os valores de temperatura atualmente visiveis, incluindo clima atual e previsao, devem ser convertidos e rotulados com a nova unidade sem exigir uma nova busca da cidade.

A conversao deve usar F = (C * 9 / 5) + 32 e C = (F - 32) * 5 / 9. Os valores devem ser arredondados para o inteiro mais proximo somente na exibicao, usando a mesma regra no clima atual e na previsao. O MVP nao exibe vento, precipitacao ou pressao; portanto, RF-04 altera somente temperaturas.

### RF-05 — Consultar previsao horaria

O sistema deve apresentar a hora atual e as 23 horas seguintes da localidade selecionada, em ordem cronologica, com temperatura e condicao meteorologica em cada hora. O periodo deve usar o fuso da localidade e manter a unidade atualmente selecionada.

## User Stories

- **US-01 (RF-01):** Como Consultor cotidiano, quero informar o nome de uma localidade e iniciar uma busca para encontrar o lugar que desejo consultar.
- **US-02 (RF-01):** Como Consultor cotidiano, quero ver nome, regiao, pais e selecionar uma localidade para evitar consultar uma cidade homonima incorreta.
- **US-03 (RF-02):** Como Consultor cotidiano, quero ver a temperatura e a condicao meteorologica atuais da cidade selecionada para decidir como agir.
- **US-04 (RF-03):** Como Planejador de atividades, quero consultar hoje e os quatro dias seguintes no fuso da cidade para organizar meus proximos dias.
- **US-05 (RF-05):** Como Planejador de atividades, quero consultar as proximas 24 horas por hora para escolher o melhor horario para uma atividade.
- **US-06 (RF-04):** Como usuario acostumado a Fahrenheit, quero alternar a unidade de temperatura de Celsius para Fahrenheit para interpretar os valores na escala que conheco.
- **US-07 (RF-04):** Como usuario acostumado a Celsius, quero alternar a unidade de temperatura de Fahrenheit para Celsius para voltar a interpretar os valores na minha escala preferida.
- **US-08 (RF-01, RF-02 e RF-03):** Como Usuario movel ou em rede instavel, quero receber estados claros e tentar novamente quando a busca ou os dados meteorologicos nao puderem ser carregados para concluir minha consulta.

## Acceptance Criteria

Os criterios abaixo sao verificaveis e estao vinculados aos requisitos funcionais correspondentes.

### AC-RF-01 — Busca de cidades

- **Given** que a aplicacao esteja disponivel e o campo de cidade contenha somente espacos, **When** o usuario tentar iniciar a busca, **Then** a aplicacao deve exibir uma mensagem de validacao e nao deve chamar o provedor.
- **Given** que o usuario informe um nome de cidade valido, **When** a busca for iniciada, **Then** a aplicacao deve exibir um estado de carregamento e, ao concluir, mostrar resultados correspondentes ou a mensagem `Nenhuma cidade encontrada`.
- **Given** que o usuario informe o mesmo nome com e sem espacos no inicio ou no fim, **When** cada busca for iniciada, **Then** o provedor deve receber a mesma string sem os espacos excedentes.
- **Given** que o provedor retorne duas ou mais localidades, **When** os resultados forem exibidos, **Then** cada opcao deve mostrar nome, regiao e pais quando fornecidos, possuir coordenadas e identificador estavel, e ser selecionavel.
- **Given** que o usuario selecione uma localidade, **When** a selecao for confirmada, **Then** a aplicacao deve iniciar uma consulta meteorologica usando o identificador e as coordenadas daquela localidade.
- **Given** que a busca falhe ou exceda 4 segundos, **When** o erro for detectado, **Then** a aplicacao deve exibir a mensagem `Nao foi possivel buscar a cidade` e um controle de nova tentativa.
- **Given** que duas buscas sejam iniciadas em sequencia, **When** a resposta da primeira chegar depois da resposta da segunda, **Then** somente os resultados da segunda busca devem permanecer visiveis.

### AC-RF-02 — Clima atual

- **Given** que o usuario tenha selecionado uma cidade valida e o provedor retorne dados atuais validos, **When** o carregamento terminar, **Then** a tela deve identificar a cidade, exibir a temperatura atual em Celsius com o sufixo `°C` e exibir um rotulo de condicao meteorologica em pt-BR.
- **Given** que uma consulta de clima atual esteja em andamento, **When** a tela estiver aguardando a resposta, **Then** a aplicacao deve exibir um estado de carregamento identificavel e nao deve exibir dados antigos como resultado da nova consulta.
- **Given** que o provedor retorne erro, codigo meteorologico desconhecido, campo obrigatorio ausente ou exceda 4 segundos, **When** a falha for processada, **Then** a aplicacao deve exibir a mensagem `Nao foi possivel carregar o clima atual`, um controle de nova tentativa e nenhum valor meteorologico invalido.
- **Given** que o usuario acione nova tentativa, **When** a acao for processada, **Then** a aplicacao deve iniciar uma nova consulta para a mesma localidade sem exigir nova selecao.

### AC-RF-03 — Previsao de cinco dias

- **Given** que o usuario tenha selecionado uma cidade valida e o provedor retorne dados validos para cinco datas consecutivas, **When** a previsao for exibida, **Then** devem existir exatamente cinco entradas em ordem cronologica, correspondentes a hoje e aos quatro dias seguintes no fuso da cidade.
- **Given** que a previsao esteja visivel, **When** o usuario inspecionar cada entrada diaria, **Then** cada entrada deve exibir data, condicao em pt-BR, temperatura minima com `°C` e temperatura maxima com `°C`.
- **Given** que a consulta da previsao falhe, contenha datas duplicadas, um campo obrigatorio ausente ou nao cubra as cinco datas, **When** a resposta for processada, **Then** a aplicacao deve exibir a mensagem `Previsao nao disponivel` e nao deve criar entradas ou valores para os dias ausentes.
- **Given** que o usuario acione nova tentativa, **When** a acao for processada, **Then** a aplicacao deve iniciar uma nova consulta para a mesma localidade sem exigir nova selecao.

### AC-RF-04 — Unidade de temperatura

- **Given** que o usuario abra a aplicacao ou inicie uma nova consulta, **When** a unidade inicial for exibida, **Then** Celsius deve estar selecionado e as temperaturas devem usar o sufixo `°C`.
- **Given** que a temperatura atual seja 0 °C e a previsao contenha 10 °C, **When** o usuario alternar para Fahrenheit, **Then** os valores devem ser exibidos como 32 °F e 50 °F, respectivamente, sem nova consulta ao provedor.
- **Given** que a temperatura atual seja 32 °F e a previsao contenha 50 °F, **When** o usuario alternar para Celsius, **Then** os valores devem ser exibidos como 0 °C e 10 °C, respectivamente, sem nova consulta ao provedor.
- **Given** que o usuario alterne a unidade varias vezes, **When** cada alternancia for concluida, **Then** os valores devem ser calculados a partir dos dados originais e arredondados para o inteiro mais proximo, sem acumular erro de conversao.

### AC-RF-05 — Previsao horaria

- **Given** que uma cidade valida esteja selecionada e o provedor retorne dados horarios validos, **When** a previsao horaria for exibida, **Then** devem existir exatamente 24 entradas em ordem cronologica, cada uma com hora, temperatura e condicao em pt-BR.

## Non-Functional Requirements

### RNF-01 — Responsividade

Os fluxos de busca, consulta do clima, previsao horaria e troca de unidade devem funcionar em viewports de 320, 768 e 1280 CSS px. A matriz oficial e Chrome 120+, Firefox 121+, Safari 17+ e Edge 120+, em desktop e mobile quando aplicavel, sem rolagem horizontal e sem perda de conteudo ou controles essenciais.

### RNF-02 — Usabilidade

Em um teste moderado com 10 participantes que representem as tres personas do MVP, pelo menos 9 devem concluir sem ajuda as tarefas de buscar uma cidade, selecionar uma localidade, alternar a unidade e consultar a previsao horaria.

### RNF-03 — Acessibilidade

Os fluxos principais devem atender ao nivel AA da WCAG 2.2, incluindo operacao por teclado, foco visivel, nomes acessiveis para controles, ordem de foco coerente, mensagens de estado anunciaveis quando aplicavel e contraste adequado. A validacao deve combinar auditoria automatizada e verificacao manual de teclado e leitor de tela.

### RNF-04 — Desempenho

Em 100 consultas de teste realizadas em um dispositivo movel intermediario, conexao 4G simulada e dados reais ou simulados do provedor, 95% devem exibir dados ou um estado de falha em ate 5 segundos. A medicao inicia no envio da busca ou na selecao da cidade e termina quando o estado final estiver renderizado.

### RNF-05 — Disponibilidade

A aplicacao deve atingir disponibilidade mensal de 99,5% para o fluxo monitorado de busca e consulta. Indisponibilidade do Open-Meteo deve ser medida e reportada separadamente, sem mascarar a disponibilidade da aplicacao.

### RNF-06 — Resiliencia a falhas externas

Quando o provedor retornar erro ou exceder o timeout de 4 segundos, a aplicacao deve permanecer utilizavel, informar que nao foi possivel carregar os dados e oferecer uma acao de nova tentativa que repita a requisicao para a mesma localidade.

### RNF-07 — Privacidade e persistencia

A aplicacao nao deve exigir autenticacao, persistir dados do usuario localmente ou no servidor, ou executar analytics no MVP. Logs operacionais devem conter somente metadados tecnicos anonimizados e ser retidos por no maximo 30 dias.

### RNF-08 — Dependencia e conformidade do provedor

O produto e nao comercial e usara a API gratuita do Open-Meteo, sem chave, respeitando o limite de 10.000 chamadas diarias e os demais termos publicados pelo servico. O release deve bloquear se esse limite ou a classificacao nao comercial nao puderem ser atendidos. A arquitetura de acesso deve usar uma camada de servico sem persistencia, responsavel por proteger limites, validar respostas e aplicar o timeout.

### RNF-09 — Seguranca de entrada e transporte

Todo texto recebido do usuario ou do provedor deve ser tratado como dado, nunca como HTML ou codigo executavel. A comunicacao entre navegador, camada de servico e Open-Meteo deve usar HTTPS. A camada de servico deve aplicar limite de requisicoes por origem e nao deve registrar o texto bruto da busca.

### RNF-10 — Observabilidade

A camada de servico deve emitir metricas de contagem e latencia para buscas, consultas meteorologicas, estados finais, timeouts, rate limits e respostas invalidas. Logs devem conter timestamp, operacao, codigo de erro e um identificador de correlacao, sem cidade, coordenadas ou identificadores de usuario.

### RNF-11 — Operacao e entrega

O servico deve disponibilizar health check sem dependencia do provedor meteorologico e readiness check que valide a configuracao necessaria. O deploy deve bloquear quando o checklist de conformidade do Open-Meteo ou as verificacoes automatizadas de contrato falharem. A capacidade minima de producao e 100 consultas simultaneas, com teste de carga antes do lancamento.

### Metricas recomendadas

- **Disponibilidade do fluxo:** percentual mensal de buscas e consultas que terminam em `success` ou `empty` sem erro interno; meta de 99,5%.
- **Latencia:** p50, p95 e p99 do tempo entre busca/selecao e estado final; p95 menor ou igual a 5 segundos.
- **Taxa de sucesso:** percentual de buscas com selecao de localidade e percentual de consultas meteorologicas com resposta valida.
- **Taxa de erro:** erros por classe (`timeout`, `network`, `rate-limit`, `provider`, `invalid-response`) por mil requisicoes.
- **Recuperacao:** percentual de erros que terminam em sucesso apos retry e tempo medio ate recuperacao.
- **Qualidade de busca:** taxa de `no-results`, taxa de selecao de resultado e abandono apos resultados.
- **Uso do produto:** consultas por dispositivo, uso de Celsius/Fahrenheit e uso da previsao horaria.
- **Capacidade:** requisicoes simultaneas, saturacao, memoria, CPU e fila da camada de servico durante teste e producao.
- **Indicador principal de sucesso:** taxa mensal de consultas meteorologicas concluidas com dados validos, calculada como consultas que exibem clima atual e previsao diaria validos divididas pelo total de consultas iniciadas para uma localidade valida; meta inicial de pelo menos 95%.

### Acceptance Criteria dos requisitos nao funcionais

- **Given** que a aplicacao seja aberta em 320, 768 ou 1280 CSS px nos navegadores suportados, **When** o usuario executar busca, selecao, consulta e troca de unidade, **Then** nao deve existir rolagem horizontal e todos os controles essenciais devem permanecer acessiveis.
- **Given** que 10 participantes representem as personas do MVP, **When** cada participante executar o roteiro sem ajuda, **Then** pelo menos 9 devem concluir busca, selecao de localidade, troca de unidade e consulta horaria.
- **Given** que os fluxos principais sejam auditados automaticamente e manualmente, **When** a validacao de acessibilidade for concluida, **Then** nao deve existir violacao critica ou grave conhecida de WCAG 2.2 AA e todos os controles do fluxo devem ser operaveis por teclado.
- **Given** que sejam executadas 100 consultas no perfil definido, **When** o tempo for medido do envio da busca ou selecao ate a renderizacao do estado final, **Then** pelo menos 95 consultas devem terminar em ate 5 segundos.
- **Given** que o monitoramento execute o fluxo definido durante um mes, **When** a janela mensal for encerrada, **Then** a aplicacao deve ter no maximo 0,5% de indisponibilidade, com falhas do provedor registradas separadamente.
- **Given** que o provedor demore mais de 4 segundos ou retorne erro, **When** a aplicacao processar a falha, **Then** ela deve manter a interface utilizavel, exibir a mensagem de indisponibilidade e oferecer nova tentativa para a mesma localidade.
- **Given** que uma consulta seja realizada no MVP, **When** a operacao terminar, **Then** nenhum dado de cidade, coordenada ou identificador de usuario deve ser persistido localmente, no servidor ou em analytics, e logs tecnicos devem omitir esses dados.
- **Given** que o produto seja nao comercial e o checklist do Open-Meteo esteja completo, **When** o processo de release for iniciado, **Then** o lancamento deve ser permitido somente se o limite de 10.000 chamadas diarias e os termos aplicaveis puderem ser atendidos.
- **Given** que a entrada contenha HTML, script ou caracteres de controle, **When** ela for exibida ou enviada ao servico, **Then** deve ser tratada como texto e nao deve gerar HTML executavel, e a requisicao deve usar HTTPS.
- **Given** que uma requisicao seja processada, **When** metricas e logs forem emitidos, **Then** eles devem conter operacao, estado, latencia, codigo de erro quando houver e identificador de correlacao, sem nome de cidade, coordenadas ou identificador de usuario.
- **Given** que o servico seja iniciado, **When** health check e readiness check forem executados, **Then** health check deve responder sem chamar o provedor e readiness check deve falhar quando a configuracao obrigatoria estiver ausente.
- **Given** que o teste de carga execute 100 consultas simultaneas, **When** a carga for mantida pelo periodo definido no plano de validacao, **Then** o servico deve permanecer disponivel e cumprir o p95 de 5 segundos sem erro interno.
## Traceability Matrix

| ID | User Story | Acceptance Criteria | RNFs relevantes |
| --- | --- | --- | --- |
| US-01 | Buscar uma localidade para consultar o clima. | AC-RF-01 | RNF-01, RNF-03, RNF-04, RNF-06, RNF-09 |
| US-02 | Desambiguar e selecionar a localidade correta. | AC-RF-01 | RNF-01, RNF-03, RNF-04, RNF-09 |
| US-03 | Ver clima atual para decidir como agir. | AC-RF-02 | RNF-01, RNF-03, RNF-04, RNF-06, RNF-08, RNF-10 |
| US-04 | Consultar previsao de cinco dias no fuso da cidade. | AC-RF-03 | RNF-01, RNF-03, RNF-04, RNF-06, RNF-08 |
| US-05 | Consultar previsao das proximas 24 horas. | AC-RF-05 | RNF-01, RNF-03, RNF-04, RNF-06, RNF-08 |
| US-06 | Alternar Celsius para Fahrenheit. | AC-RF-04 | RNF-01, RNF-03, RNF-04 |
| US-07 | Alternar Fahrenheit para Celsius. | AC-RF-04 | RNF-01, RNF-03, RNF-04 |
| US-08 | Consultar em rede instavel com estados claros e retry. | AC-RF-01, AC-RF-02, AC-RF-03 | RNF-01, RNF-03, RNF-04, RNF-05, RNF-06, RNF-10, RNF-11 |

Os criterios `AC-RF-*` sao a base dos testes funcionais. Os RNFs devem ser cobertos adicionalmente por testes de responsividade, acessibilidade, desempenho, carga, seguranca, privacidade e operacao conforme seus criterios especificos.

## Edge Cases

- A entrada de busca esta vazia ou contem apenas espacos.
- O nome informado tem acentos, caracteres especiais, capitalizacao diferente ou nome parcial.
- Existem varias cidades com o mesmo nome em estados, regioes ou paises diferentes.
- A busca nao encontra nenhuma localidade correspondente.
- A localidade selecionada nao possui dados meteorologicos atuais ou previsao completa.
- O usuario inicia uma nova busca enquanto a anterior ainda esta carregando.
- A resposta do provedor e lenta, excede o tempo limite, esta incompleta ou tem formato invalido.
- O provedor esta indisponivel, retorna erro de limite ou a rede do usuario fica offline.
- O usuario tenta alternar a unidade antes de haver dados carregados.
- A conversao resulta em valores negativos, zero, decimais ou temperaturas extremas.
- A data local do usuario difere da data usada pelo provedor, especialmente perto da meia-noite ou da mudanca de horario.
- A previsao cruza uma virada de mes ou ano.
- O viewport tem 320 CSS px ou o dispositivo esta em orientacao diferente.
- O usuario opera todos os controles por teclado ou usa tecnologia assistiva.
- O navegador bloqueia chamadas externas por CORS ou limita recursos disponiveis.

## Assumptions

- A consulta inicial sera feita por uma cidade informada manualmente pelo usuario.
- O Open-Meteo sera a fonte externa de geocoding e previsao, sem chave de API exigida ao usuario, sujeito aos limites e termos do plano aplicavel.
- A previsao diaria sera composta por hoje mais os quatro dias seguintes.
- Celsius sera a unidade inicial e Fahrenheit sera a alternativa para temperaturas.
- A interface sera escrita em pt-BR.
- Nao havera autenticacao nem armazenamento persistente no servidor.
- A previsao sera exibida por hora nas proximas 24 horas e por dia para hoje mais os quatro dias seguintes, com os campos definidos no contrato.
- As datas serao calculadas no fuso horario da localidade selecionada e a interface usara os formatos pt-BR definidos no contrato do produto.
- A conversao de temperatura usara as formulas Celsius/Fahrenheit e arredondamento para o inteiro mais proximo somente na exibicao.
- Nao havera armazenamento local, historico, favoritos ou analytics no MVP; logs tecnicos serao anonimizados e retidos por no maximo 30 dias.
- O acesso ao provedor sera feito por uma camada de servico sem persistencia, com validacao de resposta e timeout de 4 segundos.

## Risks

- Indisponibilidade, lentidao, limites ou mudancas no Open-Meteo podem impedir ou atrasar consultas.
- Os limites ou demais termos do provedor podem mudar e interromper o uso da API gratuita.
- Nomes de cidades ambiguos podem levar o usuario a selecionar uma localidade incorreta.
- Cobertura, frequencia de atualizacao e precisao dos dados dependem do provedor.
- Dados incompletos ou mudancas no formato da API podem gerar informacoes incorretas se nao forem validados.
- A ausencia de definicao sobre campos, unidades, fuso e formatos pode produzir uma experiencia inconsistente.
- Metas propostas de 90%, 5 segundos, 99,5% e WCAG 2.2 AA podem exigir escopo, infraestrutura ou validacao adicionais.
- Suporte a dispositivos e navegadores nao definido pode ampliar o custo de testes e manutencao.
- Chamadas diretas do navegador podem exigir decisoes sobre CORS, cache, protecao contra abuso, observabilidade e exposicao de dados de busca.

## Out of Scope

- Criacao de contas, login, autenticacao ou perfis.
- Localizacao automatica, geolocalizacao do dispositivo, favoritos e historico local ou no servidor.
- Mapas, radar, imagens de satelite ou camadas geoespaciais.
- Notificacoes meteorologicas, push ou avisos proativos.
- Comparacao de varias cidades na mesma tela.
- Edicao manual de dados meteorologicos ou uso de outra fonte alem do provedor aprovado.
- Recomendacoes personalizadas de roupas, viagens ou atividades.
- Internacionalizacao para idiomas diferentes de pt-BR.

## Open Questions

Nenhuma para o escopo funcional do MVP. O uso deve permanecer nao comercial e limitado a 10.000 chamadas diarias conforme os termos vigentes do Open-Meteo.

## Decisions Applied

As decisoes da revisao foram incorporadas ao contrato, requisitos e criterios de aceite. O MVP permanece focado em busca manual, clima atual, previsao diaria e horaria e alternancia de unidade, sem armazenamento local ou no servidor e sem operacao de incidentes. O produto e nao comercial e esta limitado a 10.000 chamadas diarias do Open-Meteo.
