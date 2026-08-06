import { describe, expect, it } from 'vitest';
import { nowMs } from './clock';

describe('nowMs', () => {
  it('retourne un timestamp fini, non décroissant, sur l\'origine performance', () => {
    const a = nowMs();
    const b = nowMs();
    expect(Number.isFinite(a)).toBe(true);
    expect(b).toBeGreaterThanOrEqual(a);
    // origine « démarrage de la page », très éloignée de l'epoch Date.now() :
    // échoue si quelqu'un réimplémente nowMs avec Date.now()
    expect(a).toBeLessThan(Date.now());
  });
});
