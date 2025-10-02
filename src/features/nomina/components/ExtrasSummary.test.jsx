import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import ExtrasSummary from './ExtrasSummary';

describe('ExtrasSummary', () => {
  it('should render empty string when no extras are present', () => {
    const { container } = render(
      <ExtrasSummary 
        horasExtra={0} 
        turnAround={0} 
        nocturnidad={0} 
        penaltyLunch={0} 
      />
    );
    expect(container.textContent).toBe('');
  });

  it('should render horas extra when present', () => {
    const { container } = render(
      <ExtrasSummary 
        horasExtra={3} 
        turnAround={0} 
        nocturnidad={0} 
        penaltyLunch={0} 
      />
    );
    expect(container.textContent).toBe('Horas extra x3');
  });

  it('should render turn around when present', () => {
    const { container } = render(
      <ExtrasSummary 
        horasExtra={0} 
        turnAround={2} 
        nocturnidad={0} 
        penaltyLunch={0} 
      />
    );
    expect(container.textContent).toBe('Turn Around x2');
  });

  it('should render nocturnidad when present', () => {
    const { container } = render(
      <ExtrasSummary 
        horasExtra={0} 
        turnAround={0} 
        nocturnidad={1} 
        penaltyLunch={0} 
      />
    );
    expect(container.textContent).toBe('Nocturnidad x1');
  });

  it('should render penalty lunch when present', () => {
    const { container } = render(
      <ExtrasSummary 
        horasExtra={0} 
        turnAround={0} 
        nocturnidad={0} 
        penaltyLunch={1} 
      />
    );
    expect(container.textContent).toBe('Penalty lunch x1');
  });

  it('should render multiple extras separated by dots', () => {
    const { container } = render(
      <ExtrasSummary 
        horasExtra={2} 
        turnAround={1} 
        nocturnidad={1} 
        penaltyLunch={1} 
      />
    );
    expect(container.textContent).toBe('Horas extra x2 · Turn Around x1 · Nocturnidad x1 · Penalty lunch x1');
  });

  it('should render partial combinations correctly', () => {
    const { container } = render(
      <ExtrasSummary 
        horasExtra={3} 
        turnAround={0} 
        nocturnidad={2} 
        penaltyLunch={0} 
      />
    );
    expect(container.textContent).toBe('Horas extra x3 · Nocturnidad x2');
  });
});
