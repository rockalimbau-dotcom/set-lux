import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import ToggleIconButton from './ToggleIconButton.tsx';

describe('ToggleIconButton', () => {
  const defaultProps = {
    isOpen: false,
    onClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<ToggleIconButton {...defaultProps} />);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('renders with correct default props', () => {
    render(<ToggleIconButton {...defaultProps} />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('+');
    expect(button).toHaveAttribute('title', 'Abrir');
    expect(button).toHaveAttribute('type', 'button');
  });

  it('renders open state correctly', () => {
    render(<ToggleIconButton {...defaultProps} isOpen={true} />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('−');
    expect(button).toHaveAttribute('title', 'Cerrar');
  });

  it('renders closed state correctly', () => {
    render(<ToggleIconButton {...defaultProps} isOpen={false} />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('+');
    expect(button).toHaveAttribute('title', 'Abrir');
  });

  it('calls onClick when clicked', () => {
    const mockOnClick = vi.fn();
    render(<ToggleIconButton {...defaultProps} onClick={mockOnClick} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('renders with custom titles', () => {
    render(
      <ToggleIconButton
        {...defaultProps}
        titleOpen="Custom Close"
        titleClosed="Custom Open"
      />
    );
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('title', 'Custom Open');
  });

  it('renders with custom titles when open', () => {
    render(
      <ToggleIconButton
        {...defaultProps}
        isOpen={true}
        titleOpen="Custom Close"
        titleClosed="Custom Open"
      />
    );
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('title', 'Custom Close');
  });

  it('applies custom className', () => {
    render(<ToggleIconButton {...defaultProps} className="custom-class" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('has correct CSS classes', () => {
    render(<ToggleIconButton {...defaultProps} />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass(
      'no-pdf',
      'w-6',
      'h-6',
      'sm:w-8',
      'sm:h-8',
      'rounded-lg',
      'border',
      'border-neutral-border',
      'hover:border-accent'
    );
  });

  it('handles multiple clicks', () => {
    const mockOnClick = vi.fn();
    render(<ToggleIconButton {...defaultProps} onClick={mockOnClick} />);
    
    const button = screen.getByRole('button');
    
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);
    
    expect(mockOnClick).toHaveBeenCalledTimes(3);
  });

  it('updates title when isOpen changes', () => {
    const { rerender } = render(<ToggleIconButton {...defaultProps} />);
    
    let button = screen.getByRole('button');
    expect(button).toHaveAttribute('title', 'Abrir');
    
    rerender(<ToggleIconButton {...defaultProps} isOpen={true} />);
    
    button = screen.getByRole('button');
    expect(button).toHaveAttribute('title', 'Cerrar');
  });

  it('updates text content when isOpen changes', () => {
    const { rerender } = render(<ToggleIconButton {...defaultProps} />);
    
    let button = screen.getByRole('button');
    expect(button).toHaveTextContent('+');
    
    rerender(<ToggleIconButton {...defaultProps} isOpen={true} />);
    
    button = screen.getByRole('button');
    expect(button).toHaveTextContent('−');
  });

  it('handles empty className', () => {
    render(<ToggleIconButton {...defaultProps} className="" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('no-pdf', 'w-6', 'h-6', 'sm:w-8', 'sm:h-8', 'rounded-lg', 'border', 'border-neutral-border', 'hover:border-accent');
  });

  it('handles undefined className', () => {
    render(<ToggleIconButton {...defaultProps} className={undefined} />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('no-pdf', 'w-6', 'h-6', 'sm:w-8', 'sm:h-8', 'rounded-lg', 'border', 'border-neutral-border', 'hover:border-accent');
  });
});
