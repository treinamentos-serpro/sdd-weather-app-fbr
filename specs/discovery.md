# Análise de Discovery — Aplicação de Previsão do Tempo

## Contexto

A empresa solicitou uma aplicação para consulta de informações meteorológicas por cidade. O usuário deve conseguir buscar localidades, ver as condições atuais, consultar a previsão de cinco dias, alternar a unidade de temperatura entre Celsius e Fahrenheit e utilizar a aplicação em dispositivos móveis. As decisões iniciais sobre provedor, período da previsão, unidade padrão, autenticação, persistência no servidor e idioma estão registradas abaixo.

O briefing define as capacidades principais, mas não informa o público-alvo, os campos meteorológicos exibidos, as plataformas suportadas nem metas mensuráveis de qualidade. Os limites numéricos abaixo são propostas iniciais para validação com as partes interessadas, não compromissos já aprovados.

## Decisões

- **Fonte de dados — Open-Meteo, sem API key:** usar o Open-Meteo para dados meteorológicos sem exigir uma chave de API. Isso evita configurar uma credencial para esse acesso e resolve a pergunta sobre qual provedor será usado; adequação ao uso comercial, atribuição, limites, cobertura e condições do serviço ainda devem ser verificados.
- **Período da previsão — hoje + quatro dias:** considerar o dia atual como o primeiro dos cinco dias. Isso resolve a pergunta sobre incluir hoje ou mostrar os cinco dias seguintes.
- **Unidade padrão — Celsius:** exibir temperaturas inicialmente em Celsius. Isso define o comportamento inicial; a alternância para Fahrenheit continua disponível conforme RF-04.
- **Autenticação e persistência — sem autenticação e sem persistência no servidor:** não exigir conta e não armazenar dados persistentes do usuário no servidor. Isso fecha a decisão sobre login e armazenamento no servidor; armazenamento local no dispositivo permanece em aberto.
- **Idioma da interface — pt-BR:** apresentar a interface em português do Brasil. Isso resolve a escolha do idioma da UI; formatos regionais de data e hora ainda precisam ser confirmados.

## Requisitos Funcionais

- **RF-01 — Buscar cidades:** permitir que o usuário informe uma cidade para consultar informações meteorológicas.
- **RF-02 — Consultar clima atual:** apresentar as condições meteorológicas atuais da cidade consultada.
- **RF-03 — Consultar previsão:** apresentar a previsão do tempo para um período de cinco dias.
- **RF-04 — Alternar unidade de temperatura:** permitir alternar a exibição das temperaturas entre Celsius e Fahrenheit.

## Requisitos Não-Funcionais

- **RNF-01 — Responsividade e suporte móvel:** os fluxos de busca, consulta do clima e troca de unidade devem funcionar em viewports a partir de 320 CSS px, sem rolagem horizontal nem perda de conteúdo ou controles.
- **RNF-02 — Usabilidade:** em um teste com usuários representativos, pelo menos 90% devem conseguir buscar uma cidade e alternar a unidade sem ajuda. A amostra e o protocolo do teste devem ser definidos no plano de validação.
- **RNF-03 — Acessibilidade:** atender ao nível AA da WCAG 2.2 nos fluxos principais, incluindo operação por teclado, foco visível, nomes acessíveis para controles e contraste adequado.
- **RNF-04 — Desempenho:** em um perfil de dispositivo e rede a ser acordado, 95% das consultas devem exibir os dados ou um estado de falha em até 5 segundos, incluindo o tempo de resposta do provedor externo.
- **RNF-05 — Disponibilidade:** atingir uma disponibilidade mensal proposta de 99,5%; a medição deve definir se indisponibilidades do provedor externo entram no cálculo.
- **RNF-06 — Resiliência a falhas externas:** quando o provedor retornar erro ou exceder o tempo limite configurado, a aplicação deve permanecer utilizável, informar que não foi possível carregar os dados e oferecer uma ação de nova tentativa.

## Riscos

- **Dependência de dados externos:** indisponibilidade, lentidão ou limites do provedor podem impedir ou atrasar consultas.
- **Condições de uso do provedor:** a adequação do uso sem chave ao contexto da empresa, incluindo termos comerciais, atribuição e limites, ainda precisa ser confirmada.
- **Ambiguidade na busca:** cidades com nomes iguais podem levar o usuário a consultar a localidade incorreta.
- **Qualidade dos dados:** cobertura, frequência de atualização e precisão dependem da fonte escolhida.
- **Escopo de compatibilidade indefinido:** viewports, navegadores e dispositivos suportados ainda precisam ser confirmados.
- **Metas propostas ainda não aprovadas:** os valores de usabilidade, desempenho e disponibilidade precisam de validação com as partes interessadas antes de virarem critérios de aceite.

## Perguntas em Aberto

- Quem são os usuários principais e em quais situações consultarão a aplicação?
- A busca deve aceitar nomes parciais, acentos e localidades de diferentes países?
- Como o usuário deverá escolher quando houver mais de uma cidade correspondente?
- O navegador chamará o Open-Meteo diretamente ou haverá um serviço intermediário sem persistência? Quais requisitos de CORS, cache, proteção contra abuso e atribuição se aplicam?
- O uso do Open-Meteo sem chave atende aos termos aplicáveis ao contexto da empresa, incluindo uso comercial, limites e atribuição?
- Quais informações devem aparecer no clima atual e em cada dia da previsão?
- Quais unidades devem ser usadas para vento, precipitação e pressão, e como os valores devem ser arredondados e rotulados?
- A alternância Celsius/Fahrenheit deve afetar somente temperaturas?
- Há necessidade de localização automática, histórico de buscas ou cidades favoritas armazenados localmente no dispositivo?
- As metas propostas de 90% de sucesso em usabilidade, 5 segundos para consulta, 99,5% de disponibilidade e WCAG 2.2 AA são aceitáveis?
- A disponibilidade deve incluir falhas do provedor meteorológico ou medir apenas a aplicação?
- Qual perfil de dispositivo e rede deve ser usado para medir desempenho?
- Quais viewports, navegadores e dispositivos precisam ser suportados? É necessário oferecer instalação como aplicativo?
- Qual resultado de negócio define o sucesso do produto e quais métricas serão acompanhadas após o lançamento?
- A previsão deve mostrar apenas máximas e mínimas diárias ou também dados por hora? Em qual fuso horário serão apresentados os horários e as datas, considerando que o período definido é hoje mais quatro dias?
- Qual é a defasagem máxima aceitável dos dados? Resultados podem ser armazenados em cache e, em caso afirmativo, por quanto tempo?
- Quais formatos de data e hora e convenções regionais devem ser usados além do idioma pt-BR definido para a interface?
- Como a aplicação deve se comportar quando não houver resultados, a conexão estiver offline ou a consulta falhar? A opção de tentar novamente é suficiente?
- Quais dados de busca serão enviados ao provedor e quais dados, se algum, poderão ser registrados em logs ou ferramentas de análise? Por quanto tempo?
- Se houver localização automática, quais permissões serão solicitadas, quando serão solicitadas e como os dados de localização serão tratados e retidos?
- Qual volume de usuários e consultas simultâneas deve ser suportado? Quais requisitos de monitoramento, registro de falhas e suporte operacional existem?
- Alertas, notificações, mapas ou outras funções além da consulta descrita estão no escopo inicial ou devem ser explicitamente excluídos?

## Suposições

- A consulta será iniciada por uma cidade informada pelo usuário; localização automática não foi solicitada.
- O usuário poderá alternar a unidade de temperatura durante a consulta.
- A previsão será apresentada por dia para cinco dias, incluindo hoje e os quatro dias seguintes, conforme decisão registrada.
- A aplicação consultará o Open-Meteo como fonte externa de dados meteorológicos.
- Não haverá autenticação nem persistência de dados no servidor; eventual armazenamento local de preferências, histórico ou favoritos ainda precisa ser decidido.
