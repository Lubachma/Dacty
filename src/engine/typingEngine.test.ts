import { describe, expect, it } from 'vitest';
import {
  createRun, typeChar, pressBackspace, pauseRun, resumeRun, isFinished, elapsedMs,
} from './typingEngine';

describe('typingEngine', () => {
  it('démarre à la première frappe et marque les caractères corrects', () => {
    let s = createRun('ab');
    expect(s.startedAt).toBeNull();
    s = typeChar(s, 'a', 1000);
    expect(s.startedAt).toBe(1000);
    expect(s.statuses).toEqual(['correct', 'pending']);
    expect(s.cursor).toBe(1);
    expect(s.keystrokes).toBe(1);
  });

  it('compte les erreurs même après correction par backspace', () => {
    let s = createRun('ab');
    s = typeChar(s, 'x', 1000); // error
    expect(s.errors).toBe(1);
    expect(s.statuses[0]).toBe('incorrect');
    s = pressBackspace(s, 1100);
    expect(s.cursor).toBe(0);
    expect(s.statuses[0]).toBe('pending');
    expect(s.errors).toBe(1); // still counted
    expect(s.backspaces).toBe(1);
    s = typeChar(s, 'a', 1200);
    expect(s.statuses[0]).toBe('correct');
    expect(s.keystrokes).toBe(2);
  });

  it("n'est finie que si tous les caractères sont corrects", () => {
    let s = createRun('ab');
    s = typeChar(s, 'a', 1000);
    s = typeChar(s, 'x', 1100); // trailing error
    expect(isFinished(s)).toBe(false);
    s = pressBackspace(s, 1200);
    s = typeChar(s, 'b', 1300);
    expect(isFinished(s)).toBe(true);
    expect(s.finishedAt).toBe(1300);
  });

  it('ignore les frappes après la fin', () => {
    let s = createRun('a');
    s = typeChar(s, 'a', 1000);
    const after = typeChar(s, 'b', 1100);
    expect(after).toBe(s);
  });

  it('met en pause, ignore les frappes en pause, exclut la pause du temps', () => {
    let s = createRun('ab');
    s = typeChar(s, 'a', 1000);
    s = pauseRun(s, 1500);
    expect(typeChar(s, 'b', 1600)).toBe(s);
    expect(elapsedMs(s, 1500)).toBe(500);
    s = resumeRun(s, 3000);
    expect(elapsedMs(s, 3500)).toBe(1000); // 1500ms of pause excluded
    s = typeChar(s, 'b', 4000);
    expect(isFinished(s)).toBe(true);
    expect(elapsedMs(s, 9999)).toBe(1500); // 4000-1000-1500
  });

  it('backspace au début est un no-op', () => {
    const s = createRun('ab');
    expect(pressBackspace(s, 1000)).toBe(s);
  });

  it('accepte le caractère nouvelle ligne comme tout autre caractère', () => {
    let s = createRun('a\nb');
    s = typeChar(s, 'a', 1000);
    s = typeChar(s, '\n', 1100);
    expect(s.statuses).toEqual(['correct', 'correct', 'pending']);
    s = typeChar(s, 'b', 1200);
    expect(isFinished(s)).toBe(true);
  });

  it('enregistre les événements de frappe', () => {
    let s = createRun('ab');
    s = typeChar(s, 'a', 1000);
    s = typeChar(s, 'x', 1100);
    s = pressBackspace(s, 1200);
    expect(s.events).toEqual([
      { at: 1000, kind: 'char', correct: true },
      { at: 1100, kind: 'char', correct: false },
      { at: 1200, kind: 'backspace', correct: true },
    ]);
  });

  it('frappe synthétique : avance sans compter la frappe ni l\'événement', () => {
    let s = createRun('a b');
    s = typeChar(s, 'a', 1000);
    s = typeChar(s, ' ', 1100, true);
    expect(s.cursor).toBe(2);
    expect(s.statuses[1]).toBe('correct');
    expect(s.keystrokes).toBe(1);
    expect(s.events).toHaveLength(1);
  });
});
