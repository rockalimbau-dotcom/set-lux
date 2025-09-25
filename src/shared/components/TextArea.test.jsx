import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TextArea from './TextArea.tsx';

describe('TextArea', () => {
  describe('rendering', () => {
    it('renders without crashing', () => {
      render(<TextArea />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders with default props', () => {
      render(<TextArea />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();
      expect(textarea).not.toBeDisabled();
      expect(textarea).not.toBeRequired();
      expect(textarea).toHaveAttribute('rows', '3');
    });

    it('renders with custom props', () => {
      render(
        <TextArea
          value="test value"
          placeholder="Enter text"
          disabled
          required
          className="custom-class"
          id="test-textarea"
          name="test-name"
          title="Test title"
          rows={5}
          cols={50}
        />
      );
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue('test value');
      expect(textarea).toHaveAttribute('placeholder', 'Enter text');
      expect(textarea).toBeDisabled();
      expect(textarea).toBeRequired();
      expect(textarea).toHaveClass('custom-class');
      expect(textarea).toHaveAttribute('id', 'test-textarea');
      expect(textarea).toHaveAttribute('name', 'test-name');
      expect(textarea).toHaveAttribute('title', 'Test title');
      expect(textarea).toHaveAttribute('rows', '5');
      expect(textarea).toHaveAttribute('cols', '50');
    });
  });

  describe('variants', () => {
    it('applies default variant classes', () => {
      render(<TextArea />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass(
        'bg-black/40',
        'border-neutral-border',
        'text-white',
        'placeholder-gray-400',
        'focus:ring-blue-500',
        'focus:border-blue-500'
      );
    });

    it('applies error variant classes', () => {
      render(<TextArea variant="error" />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass(
        'bg-red-50',
        'border-red-300',
        'text-red-900',
        'placeholder-red-400',
        'focus:ring-red-500',
        'focus:border-red-500'
      );
    });
  });

  describe('sizes', () => {
    it('applies small size classes', () => {
      render(<TextArea size="sm" />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('px-2', 'py-1', 'text-xs');
    });

    it('applies medium size classes (default)', () => {
      render(<TextArea />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('px-4', 'py-3', 'text-sm');
    });

    it('applies large size classes', () => {
      render(<TextArea size="lg" />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('px-6', 'py-4', 'text-base');
    });
  });

  describe('resize behavior', () => {
    it('applies resize class when resize is true (default)', () => {
      render(<TextArea />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('resize');
    });

    it('applies resize-none class when resize is false', () => {
      render(<TextArea resize={false} />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('resize-none');
    });
  });

  describe('styling', () => {
    it('applies base classes', () => {
      render(<TextArea />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass(
        'w-full',
        'rounded-xl',
        'border',
        'transition-colors',
        'duration-200',
        'focus:outline-none',
        'focus:ring-2',
        'focus:ring-offset-2'
      );
    });

    it('applies disabled classes', () => {
      render(<TextArea disabled />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed');
    });

    it('applies custom className', () => {
      render(<TextArea className="custom-class" />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('custom-class');
    });
  });

  describe('interactions', () => {
    it('calls onChange when text is entered', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      
      render(<TextArea onChange={handleChange} />);
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'test input');
      
      expect(handleChange).toHaveBeenCalled();
    });

    it('does not call onChange when disabled', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      
      render(<TextArea onChange={handleChange} disabled />);
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'test input');
      
      expect(handleChange).not.toHaveBeenCalled();
    });

    it('updates value when controlled', () => {
      const { rerender } = render(<TextArea value="initial" />);
      
      let textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue('initial');
      
      rerender(<TextArea value="updated" />);
      
      textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue('updated');
    });
  });

  describe('accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(
        <TextArea
          id="test-textarea"
          name="test-name"
          required
          disabled
          title="Test title"
        />
      );
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('id', 'test-textarea');
      expect(textarea).toHaveAttribute('name', 'test-name');
      expect(textarea).toHaveAttribute('required');
      expect(textarea).toHaveAttribute('disabled');
      expect(textarea).toHaveAttribute('title', 'Test title');
    });

    it('has proper placeholder', () => {
      render(<TextArea placeholder="Enter your message" />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('placeholder', 'Enter your message');
    });
  });

  describe('dimensions', () => {
    it('sets default rows to 3', () => {
      render(<TextArea />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('rows', '3');
    });

    it('sets custom rows', () => {
      render(<TextArea rows={10} />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('rows', '10');
    });

    it('sets custom cols', () => {
      render(<TextArea cols={80} />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('cols', '80');
    });
  });

  describe('edge cases', () => {
    it('handles empty value', () => {
      render(<TextArea value="" />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue('');
    });

    it('handles null value', () => {
      render(<TextArea value={null} />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue('');
    });

    it('handles undefined value', () => {
      render(<TextArea value={undefined} />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue('');
    });

    it('handles multiline text', () => {
      const multilineText = 'Line 1\nLine 2\nLine 3';
      render(<TextArea value={multilineText} />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue(multilineText);
    });

    it('handles special characters', () => {
      const specialText = 'Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?';
      render(<TextArea value={specialText} />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue(specialText);
    });
  });

  describe('variant and size combinations', () => {
    it('applies error variant with small size', () => {
      render(<TextArea variant="error" size="sm" />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('bg-red-50', 'px-2', 'py-1', 'text-xs');
    });

    it('applies default variant with large size', () => {
      render(<TextArea variant="default" size="lg" />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('bg-black/40', 'px-6', 'py-4', 'text-base');
    });
  });

  describe('exports', () => {
    it('exports TextAreaVariants correctly', async () => {
      const { TextAreaVariants } = await import('./TextArea.tsx');
      
      expect(TextAreaVariants).toBeDefined();
      expect(TextAreaVariants.DEFAULT).toBe('default');
      expect(TextAreaVariants.ERROR).toBe('error');
    });

    it('exports TextAreaSizes correctly', async () => {
      const { TextAreaSizes } = await import('./TextArea.tsx');
      
      expect(TextAreaSizes).toBeDefined();
      expect(TextAreaSizes.SM).toBe('sm');
      expect(TextAreaSizes.MD).toBe('md');
      expect(TextAreaSizes.LG).toBe('lg');
    });
  });
});
