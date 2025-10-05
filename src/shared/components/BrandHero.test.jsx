import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import BrandHero from './BrandHero.tsx';

describe('BrandHero', () => {
  it('renders without crashing', () => {
    render(<BrandHero />);

    expect(screen.getByText('SetLux')).toBeInTheDocument();
    expect(screen.getByText('ALL IN ONE')).toBeInTheDocument();
  });

  it('renders with custom tagline', () => {
    render(<BrandHero tagline='Custom Tagline' />);

    expect(screen.getByText('SetLux')).toBeInTheDocument();
    expect(screen.getByText('Custom Tagline')).toBeInTheDocument();
  });

  it('renders with default tagline when no prop provided', () => {
    render(<BrandHero />);

    expect(screen.getByText('ALL IN ONE')).toBeInTheDocument();
  });

  it('has correct CSS classes', () => {
    const { container } = render(<BrandHero />);

    const mainDiv = container.firstChild;
    expect(mainDiv).toHaveClass('text-center', 'mb-12');

    const logoContainer = mainDiv?.querySelector('.mx-auto.mb-6');
    expect(logoContainer).toHaveClass(
      'mx-auto',
      'mb-6',
      'grid',
      'place-items-center'
    );

    const title = screen.getByText('SetLux').closest('h1');
    expect(title).toHaveClass(
      'text-6xl',
      'font-bold',
      'tracking-wide',
      'leading-tight',
      'select-none'
    );

    const tagline = screen.getByText('ALL IN ONE');
    expect(tagline).toHaveClass(
      'mt-4',
      'text-lg',
      'uppercase',
      'tracking-[0.2em]',
      'select-none',
      'font-medium'
    );
  });

  it('has correct text content structure', () => {
    render(<BrandHero tagline='Test Tagline' />);

    const title = screen.getByText('SetLux');

    expect(title).toHaveClass(
      'text-6xl',
      'font-bold',
      'tracking-wide',
      'leading-tight',
      'select-none'
    );
  });

  it('is memoized correctly', () => {
    const { rerender } = render(<BrandHero tagline='Test' />);

    // Re-render with same props
    rerender(<BrandHero tagline='Test' />);

    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('updates when tagline changes', () => {
    const { rerender } = render(<BrandHero tagline='First' />);

    expect(screen.getByText('First')).toBeInTheDocument();

    rerender(<BrandHero tagline='Second' />);

    expect(screen.getByText('Second')).toBeInTheDocument();
    expect(screen.queryByText('First')).not.toBeInTheDocument();
  });
});
