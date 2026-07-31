import { useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { TypingState } from '@/engine/types';

interface TypingAreaProps {
  state: TypingState;
  disabled?: boolean;
  onChar: (c: string) => void;
  onBackspace: () => void;
}

export function TypingArea({ state, disabled = false, onChar, onBackspace }: TypingAreaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [caret, setCaret] = useState({ x: 0, y: 0, h: 28 });

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const chars = container.querySelectorAll<HTMLSpanElement>('[data-char]');
    if (chars.length === 0) return;
    const idx = Math.min(state.cursor, chars.length - 1);
    const target = chars[idx];
    const cRect = container.getBoundingClientRect();
    const tRect = target.getBoundingClientRect();
    setCaret({
      x: (state.cursor >= chars.length ? tRect.right : tRect.left) - cRect.left,
      y: tRect.top - cRect.top,
      h: tRect.height,
    });
  }, [state.cursor, state.text]);

  return (
    <div
      ref={containerRef}
      data-testid="typing-area"
      onClick={() => inputRef.current?.focus()}
      className="relative cursor-text rounded-xl border border-line bg-surface p-6 font-type text-xl leading-relaxed break-words whitespace-pre-wrap backdrop-blur select-none"
    >
      <input
        ref={inputRef}
        aria-label="Zone de saisie"
        className="absolute h-1 w-1 opacity-0"
        autoFocus
        defaultValue=""
        onChange={(e) => {
          // caractères composés (touches mortes, IME) : non vus par onKeyDown
          const v = e.target.value;
          e.target.value = '';
          if (disabled || v.length === 0) return;
          onChar(v[v.length - 1]);
        }}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === 'Backspace') {
            e.preventDefault();
            onBackspace();
            return;
          }
          if (e.key === 'Enter') {
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
        className="absolute w-0.5 rounded bg-accent"
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
                ? 'rounded-sm bg-err/15 text-err'
                : 'text-muted'
          }
        >
          {ch === '\n' ? '↵\n' : ch}
        </span>
      ))}
    </div>
  );
}
