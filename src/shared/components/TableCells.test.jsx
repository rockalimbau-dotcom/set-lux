import { describe, it, expect } from 'vitest';

import { render, screen } from '../../test/utils';

import { Th, Td, Row } from './TableCells.tsx';

describe('TableCells', () => {
  describe('Th', () => {
    it('renders without crashing', () => {
      render(
        <table>
          <thead>
            <tr>
              <Th>Header Cell</Th>
            </tr>
          </thead>
        </table>
      );

      expect(screen.getByText('Header Cell')).toBeInTheDocument();
    });

    it('applies default styling', () => {
      render(
        <table>
          <thead>
            <tr>
              <Th>Styled Header</Th>
            </tr>
          </thead>
        </table>
      );

      const th = screen.getByText('Styled Header');
      expect(th).toHaveClass('border', 'border-neutral-border', 'bg-white/5');
    });

    it('supports wide variant', () => {
      render(
        <table>
          <thead>
            <tr>
              <Th variant='wide'>Wide Header</Th>
            </tr>
          </thead>
        </table>
      );

      const th = screen.getByText('Wide Header');
      expect(th).toHaveClass('min-w-[190px]');
    });
  });

  describe('Td', () => {
    it('renders without crashing', () => {
      render(
        <table>
          <tbody>
            <tr>
              <Td>Data Cell</Td>
            </tr>
          </tbody>
        </table>
      );

      expect(screen.getByText('Data Cell')).toBeInTheDocument();
    });

    it('applies default styling', () => {
      render(
        <table>
          <tbody>
            <tr>
              <Td>Styled Data</Td>
            </tr>
          </tbody>
        </table>
      );

      const td = screen.getByText('Styled Data');
      expect(td).toHaveClass('align-top', 'border', 'border-neutral-border');
    });
  });

  describe('Row', () => {
    it('renders without crashing', () => {
      render(
        <table>
          <tbody>
            <Row label='Test Label'>
              <Td>Row Content</Td>
            </Row>
          </tbody>
        </table>
      );

      expect(screen.getByText('Test Label')).toBeInTheDocument();
      expect(screen.getByText('Row Content')).toBeInTheDocument();
    });

    it('applies label styling', () => {
      render(
        <table>
          <tbody>
            <Row label='Styled Label'>
              <Td>Content</Td>
            </Row>
          </tbody>
        </table>
      );

      const labelCell = screen.getByText('Styled Label');
      expect(labelCell).toHaveClass('font-semibold', 'bg-white/5');
    });
  });
});
