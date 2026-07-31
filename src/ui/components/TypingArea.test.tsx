import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { createRun, typeChar } from '@/engine/typingEngine';
import { TypingArea } from './TypingArea';

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

  it('ignore les frappes quand disabled', async () => {
    const onChar = vi.fn();
    render(<TypingArea state={createRun('ab')} disabled onChar={onChar} onBackspace={() => {}} />);
    screen.getByLabelText('Zone de saisie').focus();
    await userEvent.keyboard('a');
    expect(onChar).not.toHaveBeenCalled();
  });
});
