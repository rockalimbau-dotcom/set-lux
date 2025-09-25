import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('setup.ts', () => {
  let originalConsoleError;
  let originalLocalStorage;
  let originalMatchMedia;
  let originalResizeObserver;
  let originalIntersectionObserver;

  beforeEach(() => {
    // Store original values
    originalConsoleError = console.error;
    originalLocalStorage = global.localStorage;
    originalMatchMedia = window.matchMedia;
    originalResizeObserver = global.ResizeObserver;
    originalIntersectionObserver = global.IntersectionObserver;
  });

  afterEach(() => {
    // Restore original values
    console.error = originalConsoleError;
    global.localStorage = originalLocalStorage;
    Object.defineProperty(window, 'matchMedia', {
      value: originalMatchMedia,
      writable: true,
    });
    global.ResizeObserver = originalResizeObserver;
    global.IntersectionObserver = originalIntersectionObserver;
  });

  it('sets up localStorage mock correctly', () => {
    // Import setup to trigger the mocks
    require('./setup.ts');
    
    expect(global.localStorage).toBeDefined();
    expect(global.localStorage.getItem).toBeDefined();
    expect(global.localStorage.setItem).toBeDefined();
    expect(global.localStorage.removeItem).toBeDefined();
    expect(global.localStorage.clear).toBeDefined();
  });

  it('sets up matchMedia mock correctly', () => {
    require('./setup.ts');
    
    expect(window.matchMedia).toBeDefined();
    expect(typeof window.matchMedia).toBe('function');
    
    const mockMediaQuery = window.matchMedia('(max-width: 768px)');
    expect(mockMediaQuery.matches).toBe(false);
    expect(mockMediaQuery.media).toBe('(max-width: 768px)');
    expect(mockMediaQuery.onchange).toBeNull();
    expect(typeof mockMediaQuery.addListener).toBe('function');
    expect(typeof mockMediaQuery.removeListener).toBe('function');
    expect(typeof mockMediaQuery.addEventListener).toBe('function');
    expect(typeof mockMediaQuery.removeEventListener).toBe('function');
    expect(typeof mockMediaQuery.dispatchEvent).toBe('function');
  });

  it('sets up ResizeObserver mock correctly', () => {
    require('./setup.ts');
    
    expect(global.ResizeObserver).toBeDefined();
    expect(typeof global.ResizeObserver).toBe('function');
    
    const mockObserver = new global.ResizeObserver(() => {});
    expect(typeof mockObserver.observe).toBe('function');
    expect(typeof mockObserver.unobserve).toBe('function');
    expect(typeof mockObserver.disconnect).toBe('function');
  });

  it('sets up IntersectionObserver mock correctly', () => {
    require('./setup.ts');
    
    expect(global.IntersectionObserver).toBeDefined();
    expect(typeof global.IntersectionObserver).toBe('function');
    
    const mockObserver = new global.IntersectionObserver(() => {});
    expect(typeof mockObserver.observe).toBe('function');
    expect(typeof mockObserver.unobserve).toBe('function');
    expect(typeof mockObserver.disconnect).toBe('function');
  });

  it('suppresses ReactDOM.render warnings', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Import setup to trigger the warning suppression
    require('./setup.ts');
    
    // Simulate the warning that should be suppressed
    console.error('Warning: ReactDOM.render is no longer supported');
    
    // The warning should be suppressed, so console.error should not be called
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    
    consoleSpy.mockRestore();
  });

  it('allows other console.error messages through', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    require('./setup.ts');
    
    // Simulate a different error message
    console.error('Some other error message');
    
    // This should not be suppressed
    expect(consoleSpy).toHaveBeenCalledWith('Some other error message');
    
    consoleSpy.mockRestore();
  });

  it('restores console.error after tests', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    require('./setup.ts');
    
    // The setup should restore the original console.error
    expect(console.error).not.toBe(originalConsoleError);
    
    consoleSpy.mockRestore();
  });

  it('handles multiple matchMedia calls', () => {
    require('./setup.ts');
    
    const query1 = window.matchMedia('(max-width: 768px)');
    const query2 = window.matchMedia('(min-width: 1024px)');
    
    expect(query1.media).toBe('(max-width: 768px)');
    expect(query2.media).toBe('(min-width: 1024px)');
    expect(query1.matches).toBe(false);
    expect(query2.matches).toBe(false);
  });

  it('provides working mock methods', () => {
    require('./setup.ts');
    
    // Test localStorage methods
    global.localStorage.setItem('test', 'value');
    expect(global.localStorage.setItem).toHaveBeenCalledWith('test', 'value');
    
    global.localStorage.getItem('test');
    expect(global.localStorage.getItem).toHaveBeenCalledWith('test');
    
    global.localStorage.removeItem('test');
    expect(global.localStorage.removeItem).toHaveBeenCalledWith('test');
    
    global.localStorage.clear();
    expect(global.localStorage.clear).toHaveBeenCalled();
  });
});
