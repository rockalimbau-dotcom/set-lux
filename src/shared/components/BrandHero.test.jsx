import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import BrandHero from './BrandHero.tsx';

describe('BrandHero', () => {
  it('renders without crashing', () => {
    render(<BrandHero />);
    
    expect(screen.getByText('Set')).toBeInTheDocument();
    expect(screen.getByText('Lux')).toBeInTheDocument();
    expect(screen.getByText('All in One')).toBeInTheDocument();
  });

  it('renders with custom tagline', () => {
    render(<BrandHero tagline="Custom Tagline" />);
    
    expect(screen.getByText('Set')).toBeInTheDocument();
    expect(screen.getByText('Lux')).toBeInTheDocument();
    expect(screen.getByText('Custom Tagline')).toBeInTheDocument();
  });

  it('renders with default tagline when no prop provided', () => {
    render(<BrandHero />);
    
    expect(screen.getByText('All in One')).toBeInTheDocument();
  });

  it('has correct CSS classes', () => {
    const { container } = render(<BrandHero />);
    
    const mainDiv = container.firstChild;
    expect(mainDiv).toHaveClass('text-center', 'mb-8');
    
    const logoContainer = mainDiv?.querySelector('.mx-auto.mb-4');
    expect(logoContainer).toHaveClass('mx-auto', 'mb-4', 'grid', 'place-items-center');
    
    const title = screen.getByText('Set').closest('h1');
    expect(title).toHaveClass('text-3xl', 'font-extrabold', 'tracking-wide', 'leading-tight', 'select-none');
    
    const tagline = screen.getByText('All in One');
    expect(tagline).toHaveClass('mt-1', 'text-sm', 'uppercase', 'tracking-[0.18em]', 'text-zinc-300', 'select-none');
  });

  it('has correct text content structure', () => {
    render(<BrandHero tagline="Test Tagline" />);
    
    const setSpan = screen.getByText('Set');
    const luxSpan = screen.getByText('Lux');
    
    expect(setSpan).toHaveClass('text-brand');
    expect(luxSpan).toHaveClass('text-[#F59E0B]');
  });

  it('is memoized correctly', () => {
    const { rerender } = render(<BrandHero tagline="Test" />);
    
    // Re-render with same props
    rerender(<BrandHero tagline="Test" />);
    
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('updates when tagline changes', () => {
    const { rerender } = render(<BrandHero tagline="First" />);
    
    expect(screen.getByText('First')).toBeInTheDocument();
    
    rerender(<BrandHero tagline="Second" />);
    
    expect(screen.getByText('Second')).toBeInTheDocument();
    expect(screen.queryByText('First')).not.toBeInTheDocument();
  });
});
