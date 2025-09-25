import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import Chip from './Chip.tsx';

describe('Chip', () => {
  const defaultProps = {
    label: 'A',
    colorBg: '#FF0000',
    colorFg: '#FFFFFF',
    text: 'Test Chip',
  };

  it('renders without crashing', () => {
    render(<Chip {...defaultProps} />);
    
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('Test Chip')).toBeInTheDocument();
  });

  it('renders with correct props', () => {
    render(<Chip {...defaultProps} />);
    
    const labelElement = screen.getByText('A');
    const textElement = screen.getByText('Test Chip');
    
    expect(labelElement).toBeInTheDocument();
    expect(textElement).toBeInTheDocument();
  });

  it('applies correct styles', () => {
    render(<Chip {...defaultProps} />);
    
    const chipElement = screen.getByTitle('Test Chip');
    
    expect(chipElement).toHaveClass('inline-flex', 'items-center', 'gap-2', 'px-2', 'py-1', 'rounded-lg', 'border', 'border-neutral-border', 'bg-black/40');
    expect(chipElement).toHaveAttribute('title', 'Test Chip');
  });

  it('applies correct label styles', () => {
    render(<Chip {...defaultProps} />);
    
    const labelElement = screen.getByText('A');
    
    expect(labelElement).toHaveClass('inline-flex', 'items-center', 'justify-center', 'w-6', 'h-5', 'rounded-md', 'font-bold', 'text-[10px]');
    expect(labelElement).toHaveStyle('background: #FF0000');
    expect(labelElement).toHaveStyle('color: #FFFFFF');
  });

  it('applies correct text styles', () => {
    render(<Chip {...defaultProps} />);
    
    const textElement = screen.getByText('Test Chip');
    
    expect(textElement).toHaveClass('text-xs', 'text-zinc-200');
  });

  it('handles different label values', () => {
    render(<Chip {...defaultProps} label="B" />);
    
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.queryByText('A')).not.toBeInTheDocument();
  });

  it('handles different text values', () => {
    render(<Chip {...defaultProps} text="Different Text" />);
    
    expect(screen.getByText('Different Text')).toBeInTheDocument();
    expect(screen.queryByText('Test Chip')).not.toBeInTheDocument();
  });

  it('handles different colors', () => {
    render(<Chip {...defaultProps} colorBg="#00FF00" colorFg="#000000" />);
    
    const labelElement = screen.getByText('A');
    
    expect(labelElement).toHaveStyle('background: #00FF00');
    expect(labelElement).toHaveStyle('color: #000000');
  });

  it('has correct accessibility attributes', () => {
    render(<Chip {...defaultProps} />);
    
    const chipElement = screen.getByTitle('Test Chip');
    expect(chipElement).toBeInTheDocument();
  });

  it('renders with empty label', () => {
    render(<Chip {...defaultProps} label="" />);
    
    const chipElement = screen.getByTitle('Test Chip');
    const labelElement = chipElement.querySelector('.inline-flex.items-center.justify-center');
    expect(labelElement).toHaveTextContent('');
  });

  it('renders with empty text', () => {
    render(<Chip {...defaultProps} text="" />);
    
    const chipElement = screen.getByTitle('');
    const textElement = chipElement.querySelector('.text-xs.text-zinc-200');
    expect(textElement).toHaveTextContent('');
  });
});
