import { describe, it, expect, vi } from 'vitest';

import { render, screen } from '../../test/utils';

import Button from './Button.tsx';

describe('Button', () => {
  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Clickable Button</Button>);

    const button = screen.getByText('Clickable Button');
    button.click();

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick} disabled>Disabled Button</Button>);

    const button = screen.getByText('Disabled Button');
    button.click();

    expect(handleClick).not.toHaveBeenCalled();
    expect(button).toBeDisabled();
  });
});
