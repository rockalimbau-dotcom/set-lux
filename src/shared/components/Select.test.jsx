import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import Select from './Select.tsx';

describe('Select', () => {
  const defaultOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ];

  const stringOptions = ['Option A', 'Option B', 'Option C'];

  describe('rendering', () => {
    it('renders without crashing', () => {
      render(<Select options={defaultOptions} />);
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('renders with default props', () => {
      render(<Select options={defaultOptions} />);
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
      expect(select).not.toBeDisabled();
      expect(select).not.toBeRequired();
    });

    it('renders with custom props', () => {
      render(
        <Select
          options={defaultOptions}
          value='option2'
          placeholder='Choose an option'
          disabled
          required
          className='custom-class'
          id='test-select'
          name='test-name'
          title='Test title'
        />
      );

      const select = screen.getByRole('combobox');
      expect(select).toHaveValue('option2');
      expect(select).toBeDisabled();
      expect(select).toBeRequired();
      expect(select).toHaveClass('custom-class');
      expect(select).toHaveAttribute('id', 'test-select');
      expect(select).toHaveAttribute('name', 'test-name');
      expect(select).toHaveAttribute('title', 'Test title');
    });
  });

  describe('options rendering', () => {
    it('renders object options correctly', () => {
      render(<Select options={defaultOptions} />);

      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
      expect(screen.getByText('Option 3')).toBeInTheDocument();
    });

    it('renders string options correctly', () => {
      render(<Select options={stringOptions} />);

      expect(screen.getByText('Option A')).toBeInTheDocument();
      expect(screen.getByText('Option B')).toBeInTheDocument();
      expect(screen.getByText('Option C')).toBeInTheDocument();
    });

    it('renders empty options array', () => {
      render(<Select options={[]} />);
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
      // Should only have placeholder option if provided
    });

    it('renders placeholder option when provided', () => {
      render(
        <Select options={defaultOptions} placeholder='Select an option' />
      );

      const placeholderOption = screen.getByText('Select an option');
      expect(placeholderOption).toBeInTheDocument();
      expect(placeholderOption).toHaveAttribute('disabled');
      expect(placeholderOption).toHaveValue('');
    });

    it('does not render placeholder when not provided', () => {
      render(<Select options={defaultOptions} />);
      expect(screen.queryByText('Select an option')).not.toBeInTheDocument();
    });
  });

  describe('sizes', () => {
    it('applies small size classes', () => {
      render(<Select options={defaultOptions} size='sm' />);
      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('px-2', 'py-1', 'text-xs');
    });

    it('applies medium size classes (default)', () => {
      render(<Select options={defaultOptions} />);
      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('px-4', 'py-3', 'text-sm');
    });

    it('applies large size classes', () => {
      render(<Select options={defaultOptions} size='lg' />);
      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('px-6', 'py-4', 'text-base');
    });
  });

  describe('styling', () => {
    it('applies base classes', () => {
      render(<Select options={defaultOptions} />);
      const select = screen.getByRole('combobox');
      expect(select).toHaveClass(
        'w-full',
        'rounded-xl',
        'border',
        'border-neutral-border',
        'bg-black/40',
        'text-white',
        'transition-colors',
        'duration-200'
      );
    });

    it('applies focus classes', () => {
      render(<Select options={defaultOptions} />);
      const select = screen.getByRole('combobox');
      expect(select).toHaveClass(
        'focus:outline-none',
        'focus:ring-2',
        'focus:ring-blue-500',
        'focus:border-blue-500'
      );
    });

    it('applies disabled classes', () => {
      render(<Select options={defaultOptions} disabled />);
      const select = screen.getByRole('combobox');
      expect(select).toHaveClass(
        'disabled:opacity-50',
        'disabled:cursor-not-allowed'
      );
    });

    it('applies custom className', () => {
      render(<Select options={defaultOptions} className='custom-class' />);
      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('custom-class');
    });
  });

  describe('interactions', () => {
    it('calls onChange when option is selected', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(<Select options={defaultOptions} onChange={handleChange} />);

      const select = screen.getByRole('combobox');
      await user.selectOptions(select, 'option2');

      expect(handleChange).toHaveBeenCalledTimes(1);
      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({
          target: expect.objectContaining({ value: 'option2' }),
        })
      );
    });

    it('does not call onChange when disabled', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <Select options={defaultOptions} onChange={handleChange} disabled />
      );

      const select = screen.getByRole('combobox');
      await user.selectOptions(select, 'option2');

      expect(handleChange).not.toHaveBeenCalled();
    });

    it('updates value when controlled', () => {
      const { rerender } = render(
        <Select options={defaultOptions} value='option1' />
      );

      let select = screen.getByRole('combobox');
      expect(select).toHaveValue('option1');

      rerender(<Select options={defaultOptions} value='option2' />);

      select = screen.getByRole('combobox');
      expect(select).toHaveValue('option2');
    });
  });

  describe('accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(
        <Select
          options={defaultOptions}
          id='test-select'
          name='test-name'
          required
          disabled
        />
      );

      const select = screen.getByRole('combobox');
      expect(select).toHaveAttribute('id', 'test-select');
      expect(select).toHaveAttribute('name', 'test-name');
      expect(select).toHaveAttribute('required');
      expect(select).toHaveAttribute('disabled');
    });

    it('has proper title attribute', () => {
      render(<Select options={defaultOptions} title='Test title' />);

      const select = screen.getByRole('combobox');
      expect(select).toHaveAttribute('title', 'Test title');
    });
  });

  describe('option attributes', () => {
    it('renders options with correct values and labels', () => {
      render(<Select options={defaultOptions} />);

      const option1 = screen.getByText('Option 1');
      const option2 = screen.getByText('Option 2');
      const option3 = screen.getByText('Option 3');

      expect(option1).toHaveValue('option1');
      expect(option2).toHaveValue('option2');
      expect(option3).toHaveValue('option3');
    });

    it('renders options with correct CSS classes', () => {
      render(<Select options={defaultOptions} />);

      const options = screen.getAllByRole('option');
      options.forEach(option => {
        if (option.value !== '') {
          // Skip placeholder
          expect(option).toHaveClass('bg-gray-800', 'text-white');
        }
      });
    });

    it('handles options with numeric values', () => {
      const numericOptions = [
        { value: 1, label: 'One' },
        { value: 2, label: 'Two' },
        { value: 3, label: 'Three' },
      ];

      render(<Select options={numericOptions} />);

      expect(screen.getByText('One')).toHaveValue('1');
      expect(screen.getByText('Two')).toHaveValue('2');
      expect(screen.getByText('Three')).toHaveValue('3');
    });
  });

  describe('edge cases', () => {
    it('handles empty string options', () => {
      const emptyStringOptions = ['', 'Option 1', 'Option 2'];
      render(<Select options={emptyStringOptions} />);

      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
    });

    it('handles options with duplicate values', () => {
      const duplicateOptions = [
        { value: 'same', label: 'First' },
        { value: 'same', label: 'Second' },
      ];
      render(<Select options={duplicateOptions} />);

      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
    });

    it('handles options with special characters', () => {
      const specialOptions = [
        { value: 'special&chars', label: 'Special & Characters' },
        { value: 'quotes"test', label: 'Quotes "Test"' },
      ];
      render(<Select options={specialOptions} />);

      expect(screen.getByText('Special & Characters')).toBeInTheDocument();
      expect(screen.getByText('Quotes "Test"')).toBeInTheDocument();
    });
  });

  describe('SelectSizes export', () => {
    it('exports SelectSizes correctly', async () => {
      const { SelectSizes } = await import('./Select.tsx');

      expect(SelectSizes).toBeDefined();
      expect(SelectSizes.SM).toBe('sm');
      expect(SelectSizes.MD).toBe('md');
      expect(SelectSizes.LG).toBe('lg');
    });
  });
});
