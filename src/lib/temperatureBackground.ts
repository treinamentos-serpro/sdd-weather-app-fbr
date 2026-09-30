export interface TemperatureBackground {
  url: string;
  label: string;
}

const backgrounds = {
  cold: {
    url: 'https://images.unsplash.com/photo-1483347756197-71ef80e95f73?auto=format&fit=crop&w=2400&q=85',
    label: 'Paisagem fria',
  },
  mild: {
    url: 'https://images.unsplash.com/photo-1534088568595-a066f710f802?auto=format&fit=crop&w=2400&q=85',
    label: 'Ceu ameno',
  },
  hot: {
    url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2400&q=85',
    label: 'Paisagem ensolarada',
  },
} satisfies Record<string, TemperatureBackground>;

export function getTemperatureBackground(temperatureCelsius: number): TemperatureBackground {
  if (temperatureCelsius < 10) {
    return backgrounds.cold;
  }

  if (temperatureCelsius < 25) {
    return backgrounds.mild;
  }

  return backgrounds.hot;
}
