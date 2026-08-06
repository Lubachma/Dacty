import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRun, typeChar } from '@/engine/typingEngine';
import { computeCaret, TypingArea } from './TypingArea';

function fakeEl(rects: Partial<DOMRect>[], clientLeft = 0, clientTop = 0): HTMLElement {
  const el = document.createElement('div');
  const full = rects.map(
    (r) =>
      ({ left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}), ...r }) as DOMRect,
  );
  el.getBoundingClientRect = () => full[0];
  el.getClientRects = () => {
    const list = full.slice() as unknown as DOMRectList;
    Object.defineProperty(list, 'item', { value: (i: number) => full[i] ?? null });
    return list;
  };
  Object.defineProperty(el, 'clientLeft', { value: clientLeft });
  Object.defineProperty(el, 'clientTop', { value: clientTop });
  return el;
}

describe('TypingArea', () => {
  it('affiche les caractères avec leurs statuts', () => {
    const state = typeChar(createRun('ab'), 'x', 1000); // erreur sur 'a'
    render(<TypingArea state={state} onChar={() => {}} onBackspace={() => {}} />);
    const chars = screen.getByTestId('typing-area').querySelectorAll('[data-char]');
    expect(chars).toHaveLength(2);
    expect(chars[0].className).toContain('text-err');
    expect(chars[1].className).toContain('text-muted');
  });

  it('transmet les frappes et le backspace', async () => {
    const onChar = vi.fn();
    const onBackspace = vi.fn();
    render(<TypingArea state={createRun('ab')} onChar={onChar} onBackspace={onBackspace} />);
    const input = screen.getByLabelText('Zone de saisie');
    input.focus();
    await userEvent.keyboard('a');
    expect(onChar).toHaveBeenCalledWith('a');
    await userEvent.keyboard('{Backspace}');
    expect(onBackspace).toHaveBeenCalled();
  });

  it('bloque le collage', () => {
    render(<TypingArea state={createRun('ab')} onChar={() => {}} onBackspace={() => {}} />);
    const input = screen.getByLabelText('Zone de saisie');
    // fireEvent retourne false quand preventDefault a été appelé
    const notPrevented = fireEvent.paste(input, { clipboardData: { getData: () => 'ab' } });
    expect(notPrevented).toBe(false);
  });

  it('capture les caractères composés via l\'événement input', () => {
    const onChar = vi.fn();
    render(<TypingArea state={createRun('ê')} onChar={onChar} onBackspace={() => {}} />);
    const input = screen.getByLabelText('Zone de saisie') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'ê' } });
    expect(onChar).toHaveBeenCalledWith('ê');
    expect(input.value).toBe('');
  });

  it('ignore les frappes quand disabled', async () => {
    const onChar = vi.fn();
    render(<TypingArea state={createRun('ab')} disabled onChar={onChar} onBackspace={() => {}} />);
    screen.getByLabelText('Zone de saisie').focus();
    await userEvent.keyboard('a');
    expect(onChar).not.toHaveBeenCalled();
  });

  it('la touche Entrée envoie un caractère nouvelle ligne', async () => {
    const onChar = vi.fn();
    render(<TypingArea state={createRun('a\nb')} onChar={onChar} onBackspace={() => {}} />);
    screen.getByLabelText('Zone de saisie').focus();
    await userEvent.keyboard('{Enter}');
    expect(onChar).toHaveBeenCalledWith('\n');
  });

  it('affiche un marqueur pour les sauts de ligne', () => {
    render(<TypingArea state={createRun('a\nb')} onChar={() => {}} onBackspace={() => {}} />);
    const chars = screen.getByTestId('typing-area').querySelectorAll('[data-char]');
    expect(chars).toHaveLength(3);
    expect(chars[1].textContent).toBe('↵\n');
  });

  it('ancre le curseur dans le coin haut-gauche du conteneur', () => {
    render(<TypingArea state={createRun('ab')} onChar={() => {}} onBackspace={() => {}} />);
    const caret = screen.getByTestId('caret');
    expect(caret.className).toContain('left-0');
    expect(caret.className).toContain('top-0');
  });

  it('recalcule la position du curseur lors d\'un redimensionnement', () => {
    let roCallback: ResizeObserverCallback | undefined;
    const observe = vi.fn();
    const disconnect = vi.fn();
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(cb: ResizeObserverCallback) {
          roCallback = cb;
        }
        observe = observe;
        disconnect = disconnect;
      },
    );
    const { unmount } = render(
      <TypingArea state={createRun('ab')} onChar={() => {}} onBackspace={() => {}} />,
    );
    const container = screen.getByTestId('typing-area');
    expect(observe).toHaveBeenCalledWith(container);
    const chars = container.querySelectorAll<HTMLElement>('[data-char]');
    const spy = vi.spyOn(chars[0], 'getClientRects');
    act(() => roCallback?.([], {} as ResizeObserver));
    expect(spy).toHaveBeenCalled();
    unmount();
    expect(disconnect).toHaveBeenCalled();
  });

  it("désactive l'autocorrection mobile sur l'input caché", () => {
    render(<TypingArea state={createRun('ab')} onChar={() => {}} onBackspace={() => {}} />);
    const input = screen.getByLabelText('Zone de saisie');
    expect(input).toHaveAttribute('autocapitalize', 'off');
    expect(input).toHaveAttribute('autocorrect', 'off');
    expect(input).toHaveAttribute('autocomplete', 'off');
    expect(input).toHaveAttribute('spellcheck', 'false');
  });

  it('conserve le focus sur Tab pendant la saisie', async () => {
    render(<TypingArea state={createRun('ab')} onChar={() => {}} onBackspace={() => {}} />);
    const input = screen.getByLabelText('Zone de saisie');
    input.focus();
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).toBe(input);
  });
});

describe('computeCaret', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('mesure depuis la padding box du conteneur (bordure exclue)', () => {
    const container = fakeEl([{ left: 100, top: 50 }], 1, 1);
    const chars = [fakeEl([{ left: 125, top: 75, right: 137, height: 32 }])];
    expect(computeCaret(container, chars, 0)).toEqual({ x: 24, y: 24, h: 32 });
  });

  it('utilise le premier fragment d\'un caractère fragmenté (saut de ligne)', () => {
    const container = fakeEl([{ left: 100, top: 50 }], 1, 1);
    // span « ↵\n » : fragment du ↵ puis fragment vide sur la ligne suivante ;
    // la boîte englobante (bounding rect) ferait deux lignes de haut
    const char = fakeEl([
      { left: 125, top: 75, right: 137, height: 32 },
      { left: 101, top: 107, right: 101, height: 32 },
    ]);
    char.getBoundingClientRect = () =>
      ({ left: 101, top: 75, right: 137, height: 64 }) as DOMRect;
    expect(computeCaret(container, [char], 0)).toEqual({ x: 24, y: 24, h: 32 });
  });

  it('vise le bord droit du dernier caractère en fin de texte', () => {
    const container = fakeEl([{ left: 100, top: 50 }], 1, 1);
    const chars = [
      fakeEl([{ left: 125, top: 75, right: 137, height: 32 }]),
      fakeEl([{ left: 137, top: 75, right: 149, height: 32 }]),
    ];
    expect(computeCaret(container, chars, 2)).toEqual({ x: 48, y: 24, h: 32 });
  });

  it('retourne null sans caractères', () => {
    const container = fakeEl([{ left: 100, top: 50 }], 1, 1);
    expect(computeCaret(container, [], 0)).toBeNull();
  });
});
