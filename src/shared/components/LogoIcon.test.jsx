import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import LogoIcon from './LogoIcon.tsx';

describe('LogoIcon', () => {
  it('renders without crashing', () => {
    render(<LogoIcon />);
    
    const container = screen.getByTestId('logo-icon');
    expect(container).toBeInTheDocument();
  });

  it('renders with default size', () => {
    render(<LogoIcon />);
    
    const container = screen.getByTestId('logo-icon');
    expect(container).toHaveStyle('width: 80px');
    expect(container).toHaveStyle('height: 80px');
  });

  it('renders with custom size', () => {
    render(<LogoIcon size={120} />);
    
    const container = screen.getByTestId('logo-icon');
    expect(container).toHaveStyle('width: 120px');
    expect(container).toHaveStyle('height: 120px');
  });

  it('has correct CSS classes', () => {
    render(<LogoIcon />);
    
    const container = screen.getByTestId('logo-icon');
    expect(container).toHaveClass('rounded-2xl', 'shadow-[0_0_40px_rgba(37,99,235,0.25)]');
  });

  it('has correct accessibility attributes', () => {
    render(<LogoIcon />);
    
    const container = screen.getByTestId('logo-icon');
    expect(container).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders SVG with correct attributes', () => {
    render(<LogoIcon size={100} />);
    
    const svg = screen.getByTestId('logo-icon').querySelector('svg');
    expect(svg).toHaveAttribute('viewBox', '0 0 100 100');
    expect(svg).toHaveAttribute('width', '100');
    expect(svg).toHaveAttribute('height', '100');
    expect(svg).toHaveClass('rounded-2xl');
  });

  it('has correct gradient definition', () => {
    render(<LogoIcon />);
    
    const gradient = screen.getByTestId('logo-icon').querySelector('#setluxWarm');
    expect(gradient).toBeInTheDocument();
    expect(gradient).toHaveAttribute('x1', '0');
    expect(gradient).toHaveAttribute('y1', '0');
    expect(gradient).toHaveAttribute('x2', '1');
    expect(gradient).toHaveAttribute('y2', '1');
  });

  it('has correct gradient stops', () => {
    render(<LogoIcon />);
    
    const stops = screen.getByTestId('logo-icon').querySelectorAll('stop');
    expect(stops).toHaveLength(2);
    
    expect(stops[0]).toHaveAttribute('offset', '0');
    expect(stops[0]).toHaveAttribute('stop-color', '#FDE047');
    
    expect(stops[1]).toHaveAttribute('offset', '1');
    expect(stops[1]).toHaveAttribute('stop-color', '#F59E0B');
  });

  it('has correct rectangle element', () => {
    render(<LogoIcon />);
    
    const rect = screen.getByTestId('logo-icon').querySelector('rect');
    expect(rect).toHaveAttribute('x', '6');
    expect(rect).toHaveAttribute('y', '6');
    expect(rect).toHaveAttribute('width', '88');
    expect(rect).toHaveAttribute('height', '88');
    expect(rect).toHaveAttribute('rx', '22');
    expect(rect).toHaveAttribute('fill', 'url(#setluxWarm)');
  });

  it('has correct polygon element', () => {
    render(<LogoIcon />);
    
    const polygon = screen.getByTestId('logo-icon').querySelector('polygon');
    expect(polygon).toHaveAttribute('points', '52,18 72,18 60,46');
    expect(polygon).toHaveAttribute('fill', 'rgba(0,0,0,0.72)');
    expect(polygon).toHaveAttribute('transform', 'rotate(10 60 32)');
  });

  it('is memoized correctly', () => {
    const { rerender } = render(<LogoIcon size={80} />);
    
    // Re-render with same props
    rerender(<LogoIcon size={80} />);
    
    const container = screen.getByTestId('logo-icon');
    expect(container).toHaveStyle('width: 80px');
    expect(container).toHaveStyle('height: 80px');
  });

  it('updates when size changes', () => {
    const { rerender } = render(<LogoIcon size={80} />);
    
    let container = screen.getByTestId('logo-icon');
    expect(container).toHaveStyle('width: 80px');
    
    rerender(<LogoIcon size={120} />);
    
    container = screen.getByTestId('logo-icon');
    expect(container).toHaveStyle('width: 120px');
  });
});
