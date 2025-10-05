import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

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
    expect(container.textContent).toBe('0');
  });

  it('should render total and horas extra when present', () => {
    const { container } = render(
      <ExtrasSummary
        horasExtra={3}
        turnAround={0}
        nocturnidad={0}
        penaltyLunch={0}
      />
    );
    expect(container.textContent).toContain('3');
    expect(container.textContent).toContain('Horas extra x3');
  });

  it('should render total and turn around when present', () => {
    const { container } = render(
      <ExtrasSummary
        horasExtra={0}
        turnAround={2}
        nocturnidad={0}
        penaltyLunch={0}
      />
    );
    expect(container.textContent).toContain('2');
    expect(container.textContent).toContain('Turn Around x2');
  });

  it('should render total and nocturnidad when present', () => {
    const { container } = render(
      <ExtrasSummary
        horasExtra={0}
        turnAround={0}
        nocturnidad={1}
        penaltyLunch={0}
      />
    );
    expect(container.textContent).toContain('1');
    expect(container.textContent).toContain('Nocturnidad x1');
  });

  it('should render total and penalty lunch when present', () => {
    const { container } = render(
      <ExtrasSummary
        horasExtra={0}
        turnAround={0}
        nocturnidad={0}
        penaltyLunch={1}
      />
    );
    expect(container.textContent).toContain('1');
    expect(container.textContent).toContain('Penalty lunch x1');
  });

  it('should render total and multiple extras on separate lines', () => {
    const { container } = render(
      <ExtrasSummary
        horasExtra={2}
        turnAround={1}
        nocturnidad={1}
        penaltyLunch={1}
      />
    );
    expect(container.textContent).toContain('5'); // Total
    expect(container.textContent).toContain('Horas extra x2');
    expect(container.textContent).toContain('Turn Around x1');
    expect(container.textContent).toContain('Nocturnidad x1');
    expect(container.textContent).toContain('Penalty lunch x1');
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
    expect(container.textContent).toContain('5'); // Total
    expect(container.textContent).toContain('Horas extra x3');
    expect(container.textContent).toContain('Nocturnidad x2');
  });
});
