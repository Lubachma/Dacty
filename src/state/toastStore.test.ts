import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useToasts } from './toastStore';

beforeEach(() => {
  useToasts.setState({ toasts: [] });
});

describe('toastStore', () => {
  it('empile et retire les toasts, auto-dismiss après 5s', () => {
    vi.useFakeTimers();
    useToasts.getState().push({ title: 'Succès débloqué', description: 'Machine', kind: 'achievement' });
    expect(useToasts.getState().toasts).toHaveLength(1);
    const id = useToasts.getState().toasts[0].id;
    useToasts.getState().dismiss(id);
    expect(useToasts.getState().toasts).toHaveLength(0);
    useToasts.getState().push({ title: 'Info', kind: 'info' });
    vi.advanceTimersByTime(5100);
    expect(useToasts.getState().toasts).toHaveLength(0);
    vi.useRealTimers();
  });

  it('borne la pile à 3 toasts en éjectant les plus anciens', () => {
    vi.useFakeTimers();
    for (const title of ['a', 'b', 'c', 'd']) {
      useToasts.getState().push({ title, kind: 'info' });
    }
    const titles = useToasts.getState().toasts.map((t) => t.title);
    expect(titles).toEqual(['b', 'c', 'd']);
    vi.useRealTimers();
  });
});
