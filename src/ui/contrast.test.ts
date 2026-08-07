import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Épingle les ratios WCAG 2.1 des paires de couleurs du thème : les valeurs sont lues
// directement dans src/index.css — toute régression de contraste casse ce test.
const css = readFileSync('src/index.css', 'utf8');
const root = /:root\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';
const light = /html\[data-theme="light"\]\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';

function token(block: string, name: string): string {
  const m = new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, 'i').exec(block);
  if (!m) throw new Error(`token --${name} introuvable dans index.css`);
  return m[1];
}

function luminance(hex: string): number {
  const srgb = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lin = srgb.map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

function ratio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe('contraste du thème (WCAG AA, lu depuis index.css)', () => {
  it('thème sombre : accent sur fond et blanc sur accent-strong ≥ 4,5:1', () => {
    expect(ratio(token(root, 'accent'), token(root, 'bg'))).toBeGreaterThanOrEqual(4.5);
    expect(ratio('#ffffff', token(root, 'accent-strong'))).toBeGreaterThanOrEqual(4.5);
  });

  it('thème clair : accent sur fond et blanc sur accent-strong ≥ 4,5:1', () => {
    expect(ratio(token(light, 'accent'), token(light, 'bg'))).toBeGreaterThanOrEqual(4.5);
    expect(ratio('#ffffff', token(light, 'accent-strong'))).toBeGreaterThanOrEqual(4.5);
  });
});
