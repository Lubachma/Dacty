import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toggle } from './Toggle';

describe('Toggle', () => {
  it('renders a switch with the accessible name and state', () => {
    render(<Toggle checked={true} onChange={() => {}} label="Punctuation" />);
    const sw = screen.getByRole('switch', { name: 'Punctuation' });
    expect(sw).toHaveAttribute('aria-checked', 'true');
  });

  it('reports the inverted value on click', async () => {
    const onChange = vi.fn();
    render(<Toggle checked={true} onChange={onChange} label="Digits" />);
    await userEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('anchors the knob to the left edge of the track', () => {
    // jsdom does no layout, so pin the anchor class: without left-0 the
    // absolutely positioned knob takes its static position, which follows the
    // button's default text-align: center — the knob then starts mid-track and
    // the checked translate pushes it fully outside the track.
    render(<Toggle checked={true} onChange={() => {}} label="Accents" />);
    const knob = screen.getByRole('switch').querySelector('span');
    expect(knob?.className).toContain('left-0');
  });
});
