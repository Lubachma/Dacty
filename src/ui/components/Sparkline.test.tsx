import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Sparkline } from './Sparkline';

describe('Sparkline', () => {
  it('rend une polyline normalisée', () => {
    const { container } = render(<Sparkline data={[10, 20, 10]} width={100} height={40} label="Évolution du WPM" />);
    const line = container.querySelector('polyline');
    // y = 40 - (v/20)*36 - 2 -> v=10 : 20 ; v=20 : 2
    expect(line?.getAttribute('points')).toBe('0,20 50,2 100,20');
    // le label est exposé via aria-label sur le svg
    expect(container.querySelector('svg')?.getAttribute('aria-label')).toBe('Évolution du WPM');
  });

  it('ne rend rien sans données', () => {
    const { container } = render(<Sparkline data={[]} label="Évolution du WPM" />);
    expect(container.querySelector('svg')).toBeNull();
  });

  it('est responsive : viewBox sans largeur fixe', () => {
    const { container } = render(<Sparkline data={[10, 20, 10]} width={100} height={40} label="Évolution du WPM" />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('viewBox')).toBe('0 0 100 40');
    expect(svg?.hasAttribute('width')).toBe(false);
  });
});
