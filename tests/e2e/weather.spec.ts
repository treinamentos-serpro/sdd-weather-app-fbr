import { expect, type Page, test } from '@playwright/test';

const hourlyTimes = Array.from(
  { length: 24 },
  (_, index) => `2026-09-30T${String(12 + index).padStart(2, '0')}:00`,
);

async function mockGeocoding(page: Page, response: object) {
  await page.route('**/geocoding-api.open-meteo.com/**', async (route) => {
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(response) });
  });
}

async function mockForecast(page: Page) {
  await page.route('**/api.open-meteo.com/v1/forecast**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        timezone: 'America/Sao_Paulo',
        current: { temperature_2m: 20, weather_code: 1 },
        hourly: {
          time: hourlyTimes,
          temperature_2m: hourlyTimes.map(() => 20),
          weather_code: hourlyTimes.map(() => 1),
        },
        daily: {
          time: ['2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04'],
          temperature_2m_min: [12, 13, 14, 15, 16],
          temperature_2m_max: [20, 21, 22, 23, 24],
          weather_code: [1, 2, 3, 61, 63],
          precipitation_probability_max: [0, 10, 20, 60, 70],
        },
      }),
    });
  });
}

async function mockCuritiba(page: Page) {
  await mockGeocoding(page, {
    results: [
      {
        id: 1,
        name: 'Curitiba',
        latitude: -25.43,
        longitude: -49.27,
        country: 'Brasil',
        admin1: 'Parana',
        timezone: 'America/Sao_Paulo',
      },
    ],
  });
  await mockForecast(page);
}

test('busca cidade, exibe previsao e troca para Fahrenheit', async ({ page }) => {
  await mockCuritiba(page);

  await page.getByLabel('Cidade').fill('Curitiba');
  await page.getByRole('button', { name: 'Buscar' }).click();

  await expect(page.getByRole('heading', { name: 'Curitiba' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Previsão de 5 dias' })).toBeVisible();

  await page.getByRole('button', { name: '°F' }).click();

  await expect(page.locator('article').first()).toContainText('68°F');
});

test('exibe estado vazio quando geocoding nao retorna results', async ({ page }) => {
  await mockGeocoding(page, {});

  await page.getByLabel('Cidade').fill('Cidade inexistente');
  await page.getByRole('button', { name: 'Buscar' }).click();

  await expect(page.getByText('Nenhuma previsao encontrada para esta busca.')).toBeVisible();
});

test('renderiza o fluxo principal em viewport mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await mockCuritiba(page);

  await page.getByLabel('Cidade').fill('Curitiba');
  await page.getByRole('button', { name: 'Buscar' }).click();

  await expect(page.getByRole('heading', { name: 'Curitiba' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Previsão de 5 dias' })).toBeVisible();
  await expect(page.locator('body')).not.toHaveCSS('overflow-x', 'scroll');
});
