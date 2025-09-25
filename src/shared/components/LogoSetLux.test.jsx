import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import LogoSetLux from './LogoSetLux.tsx';

describe('LogoSetLux', () => {
  it('renders without crashing', () => {
    render(<LogoSetLux />);
    
    expect(screen.getByText('Set')).toBeInTheDocument();
    expect(screen.getByText('Lux')).toBeInTheDocument();
    expect(screen.getByText('All in One')).toBeInTheDocument();
  });

  it('renders with default props', () => {
    render(<LogoSetLux />);
    
    const setSpan = screen.getByText('Set');
    const luxSpan = screen.getByText('Lux');
    const tagline = screen.getByText('All in One');
    
    expect(setSpan).toBeInTheDocument();
    expect(luxSpan).toBeInTheDocument();
    expect(tagline).toBeInTheDocument();
  });

  it('renders in compact mode', () => {
    render(<LogoSetLux compact={true} />);
    
    expect(screen.getByText('Set')).toBeInTheDocument();
    expect(screen.getByText('Lux')).toBeInTheDocument();
    expect(screen.queryByText('All in One')).not.toBeInTheDocument();
  });

  it('renders with custom className', () => {
    const { container } = render(<LogoSetLux className="custom-class" />);
    
    const mainDiv = container.firstChild;
    expect(mainDiv).toHaveClass('flex', 'items-center', 'gap-3', 'custom-class');
  });

  it('renders with custom size', () => {
    render(<LogoSetLux size={50} />);
    
    const svg = screen.getByTestId('logo-setlux').querySelector('svg');
    expect(svg).toHaveAttribute('width', '50');
    expect(svg).toHaveAttribute('height', '50');
  });

  it('has correct CSS classes', () => {
    const { container } = render(<LogoSetLux />);
    
    const mainDiv = container.firstChild;
    expect(mainDiv).toHaveClass('flex', 'items-center', 'gap-3');
    
    const textContainer = mainDiv?.querySelector('.leading-none');
    expect(textContainer).toHaveClass('leading-none', 'select-none');
    
    const titleDiv = screen.getByText('Set').closest('div');
    expect(titleDiv).toHaveClass('text-2xl', 'font-extrabold', 'tracking-tight');
    
    const taglineDiv = screen.getByText('All in One');
    expect(taglineDiv).toHaveClass('text-[10px]', 'uppercase', 'tracking-wider', 'text-zinc-400');
  });

  it('has correct text colors', () => {
    render(<LogoSetLux />);
    
    const setSpan = screen.getByText('Set');
    const luxSpan = screen.getByText('Lux');
    
    expect(setSpan).toHaveStyle('color: #296CF2');
    expect(luxSpan).toHaveStyle('color: #F59E0B');
  });

  it('shows tagline when not compact', () => {
    render(<LogoSetLux compact={false} />);
    
    expect(screen.getByText('All in One')).toBeInTheDocument();
  });

  it('hides tagline when compact', () => {
    render(<LogoSetLux compact={true} />);
    
    expect(screen.queryByText('All in One')).not.toBeInTheDocument();
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<LogoSetLux size={30} />);
    
    let svg = screen.getByTestId('logo-setlux').querySelector('svg');
    expect(svg).toHaveAttribute('width', '30');
    
    rerender(<LogoSetLux size={60} />);
    
    svg = screen.getByTestId('logo-setlux').querySelector('svg');
    expect(svg).toHaveAttribute('width', '60');
  });

  it('renders with different className values', () => {
    const { rerender } = render(<LogoSetLux className="class1" />);
    
    let mainDiv = screen.getByText('Set').closest('.flex');
    expect(mainDiv).toHaveClass('class1');
    
    rerender(<LogoSetLux className="class2" />);
    
    mainDiv = screen.getByText('Set').closest('.flex');
    expect(mainDiv).toHaveClass('class2');
  });

  it('has correct structure with LogoIcon', () => {
    render(<LogoSetLux />);
    
    const svg = screen.getByTestId('logo-setlux').querySelector('svg');
    expect(svg).toBeInTheDocument();
    
    const container = svg.closest('div');
    expect(container).toHaveClass('rounded-2xl', 'shadow-[0_0_40px_rgba(37,99,235,0.25)]');
  });

  it('handles empty className', () => {
    const { container } = render(<LogoSetLux className="" />);
    
    const mainDiv = container.firstChild;
    expect(mainDiv).toHaveClass('flex', 'items-center', 'gap-3');
  });
});
