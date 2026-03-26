/** Plotly 다크 테마 레이아웃 빌더. */
import type { Layout } from 'plotly.js';

export function darkPlotLayout(title: string, overrides?: Partial<Layout>): Partial<Layout> {
  return {
    title: { text: title, font: { size: 13, color: '#cdd6f4' } },
    paper_bgcolor: '#1e1e2e',
    plot_bgcolor: '#181825',
    font: { color: '#a6adc8', size: 10 },
    margin: { t: 35, b: 35, l: 45, r: 15 },
    xaxis: { gridcolor: '#313244' },
    yaxis: { gridcolor: '#313244' },
    height: 200,
    ...overrides,
  };
}
