import { useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useT } from '@/i18n';
import type { TypingState } from '@/engine/types';

interface TypingAreaProps {
  state: TypingState;
  disabled?: boolean;
  onChar: (c: string) => void;
  onBackspace: () => void;
}

export interface CaretRect {
  x: number;
  y: number;
  h: number;
}

// Position du curseur mesurée depuis la padding box du conteneur : c'est
// l'origine d'un enfant positionné avec left-0/top-0 (la bordure est exclue).
// On prend le premier fragment du caractère ciblé : les spans « ↵\n » en
// génèrent un deuxième, vide, sur la ligne suivante — la boîte englobante
// ferait deux lignes de haut.
export function computeCaret(
  container: HTMLElement,
  chars: ArrayLike<HTMLElement>,
  cursor: number,
): CaretRect | null {
  if (chars.length === 0) return null;
  const idx = Math.min(cursor, chars.length - 1);
  const target = chars[idx];
  const rect = target.getClientRects()[0] ?? target.getBoundingClientRect();
  const cRect = container.getBoundingClientRect();
  const originX = cRect.left + container.clientLeft;
  const originY = cRect.top + container.clientTop;
  return {
    x: (cursor >= chars.length ? rect.right : rect.left) - originX,
    y: rect.top - originY,
    h: rect.height,
  };
}

export function TypingArea({ state, disabled = false, onChar, onBackspace }: TypingAreaProps) {
  const t = useT();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [caret, setCaret] = useState<CaretRect>({ x: 0, y: 0, h: 28 });

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const update = () => {
      const next = computeCaret(
        container,
        container.querySelectorAll<HTMLElement>('[data-char]'),
        state.cursor,
      );
      if (next) setCaret(next);
    };
    update();
    // le texte peut se ré-agencer sans frappe (redimensionnement, fontes) : on recalcule
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(update);
    ro.observe(container);
    return () => ro.disconnect();
  }, [state.cursor, state.text]);

  return (
    <div
      ref={containerRef}
      data-testid="typing-area"
      onClick={() => inputRef.current?.focus()}
      className={`relative cursor-text rounded-xl border border-line bg-surface p-6 font-type text-xl leading-relaxed break-words whitespace-pre-wrap backdrop-blur select-none ${
        disabled ? 'opacity-60' : ''
      }`}
    >
      <input
        ref={inputRef}
        aria-label={t('run.typingAria')}
        className="absolute h-1 w-1 opacity-0"
        autoFocus
        defaultValue=""
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        onChange={(e) => {
          // caractères composés (touches mortes, IME) : non vus par onKeyDown
          const v = e.target.value;
          e.target.value = '';
          if (disabled || v.length === 0) return;
          onChar(v[v.length - 1]);
        }}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === 'Tab') {
            // garder le focus dans la zone de saisie pendant la run
            e.preventDefault();
            return;
          }
          if (e.key === 'Backspace') {
            e.preventDefault();
            onBackspace();
            return;
          }
          if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
            onChar('\n');
            return;
          }
          if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
            onChar(e.key);
          }
        }}
        onPaste={(e) => e.preventDefault()}
      />
      <motion.span
        data-testid="caret"
        className="absolute top-0 left-0 w-0.5 rounded bg-accent"
        animate={{ x: caret.x, y: caret.y, height: caret.h }}
        transition={{ type: 'spring', stiffness: 500, damping: 40 }}
      />
      {state.text.split('').map((ch, i) => (
        <span
          // eslint-disable-next-line react/no-array-index-key
          key={i}
          data-char
          className={
            state.statuses[i] === 'correct'
              ? 'text-ok'
              : state.statuses[i] === 'incorrect'
                ? 'rounded-sm bg-err/15 text-err underline underline-offset-2'
                : 'text-muted'
          }
        >
          {ch === '\n' ? '↵\n' : ch}
        </span>
      ))}
    </div>
  );
}
