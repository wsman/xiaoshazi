/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useUserBehaviorPredictor } from './useUserBehaviorPredictor';

// Mock axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ 
      data: { 
        success: true, 
        data: [
          { id: '1', model: 'GPT-4', avgPerf: 90 },
        ] 
      } 
    })),
  },
  get: vi.fn(() => Promise.resolve({ 
    data: { 
      success: true, 
      data: [
        { id: '1', model: 'GPT-4', avgPerf: 90 },
      ] 
    } 
  })),
}));

// Mock ChartWorkerManager
vi.mock('../utils/ChartWorkerManager', () => ({
  default: {
    processData: vi.fn((data) => Promise.resolve(data)),
    initialize: vi.fn(() => Promise.resolve()),
  },
}));

describe('useUserBehaviorPredictor', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    // Clear prefetch cache between tests
    vi.resetModules();
  });

  it('should return initial state', () => {
    const { result } = renderHook(() => 
      useUserBehaviorPredictor({ baseUrl: 'http://localhost:14514' })
    );

    expect(result.current.isPrefetching).toBe(false);
    expect(result.current.prefetchedScenarios).toEqual([]);
    expect(result.current.handleMouseEnter).toBeDefined();
    expect(result.current.handleMouseLeave).toBeDefined();
    expect(result.current.getCachedResult).toBeDefined();
  });

  it('should return configuration', () => {
    const { result } = renderHook(() => 
      useUserBehaviorPredictor({ 
        baseUrl: 'http://localhost:14514',
        hoverDelay: 100 
      })
    );

    expect(result.current.config).toBeDefined();
    expect(result.current.config.hoverDelay).toBe(100);
  });

  it('should not trigger prefetch for "all" scenario', async () => {
    const { result } = renderHook(() => 
      useUserBehaviorPredictor({ baseUrl: 'http://localhost:14514' })
    );

    act(() => {
      result.current.handleMouseEnter('all');
    });

    // Wait for potential prefetch
    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current.prefetchedScenarios).toEqual([]);
  });

  it('should not trigger prefetch for empty scenario', async () => {
    const { result } = renderHook(() => 
      useUserBehaviorPredictor({ baseUrl: 'http://localhost:14514' })
    );

    act(() => {
      result.current.handleMouseEnter('');
    });

    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current.prefetchedScenarios).toEqual([]);
  });

  it('should check if scenario is prefetched', () => {
    const { result } = renderHook(() => 
      useUserBehaviorPredictor({ baseUrl: 'http://localhost:14514' })
    );

    expect(result.current.isPrefetched('coding')).toBe(false);
    expect(result.current.isPrefetched('reasoning')).toBe(false);
  });

  it('should get cached result returns null for non-cached scenario', () => {
    const { result } = renderHook(() => 
      useUserBehaviorPredictor({ baseUrl: 'http://localhost:14514' })
    );

    expect(result.current.getCachedResult('coding')).toBeNull();
  });

  it('should return prefetchScenario function', () => {
    const { result } = renderHook(() => 
      useUserBehaviorPredictor({ baseUrl: 'http://localhost:14514' })
    );

    expect(result.current.prefetchScenario).toBeDefined();
    expect(typeof result.current.prefetchScenario).toBe('function');
  });

  it('should return prefetchMultiple function', () => {
    const { result } = renderHook(() => 
      useUserBehaviorPredictor({ baseUrl: 'http://localhost:14514' })
    );

    expect(result.current.prefetchMultiple).toBeDefined();
    expect(typeof result.current.prefetchMultiple).toBe('function');
  });

  it('should return clearCache function', () => {
    const { result } = renderHook(() => 
      useUserBehaviorPredictor({ baseUrl: 'http://localhost:14514' })
    );

    expect(result.current.clearCache).toBeDefined();
    expect(typeof result.current.clearCache).toBe('function');
  });

  it('should return clearScenarioCache function', () => {
    const { result } = renderHook(() => 
      useUserBehaviorPredictor({ baseUrl: 'http://localhost:14514' })
    );

    expect(result.current.clearScenarioCache).toBeDefined();
    expect(typeof result.current.clearScenarioCache).toBe('function');
  });

  it('should call onPrefetchStart callback when prefetch starts', async () => {
    const onPrefetchStart = vi.fn();
    
    const { result } = renderHook(() => 
      useUserBehaviorPredictor({ 
        baseUrl: 'http://localhost:14514',
        onPrefetchStart,
        hoverDelay: 10 // Use short delay for testing
      })
    );

    // Initial state - should not have called callback
    expect(onPrefetchStart).not.toHaveBeenCalled();

    act(() => {
      result.current.handleMouseEnter('coding');
    });

    // Advance timer past hover delay
    await act(async () => {
      vi.advanceTimersByTime(20);
    });

    // Now the callback should have been called
    expect(onPrefetchStart).toHaveBeenCalledWith('coding');
  });

  it('should cancel prefetch on mouse leave before delay', async () => {
    const onPrefetchStart = vi.fn();
    const onPrefetchComplete = vi.fn();
    
    const { result } = renderHook(() => 
      useUserBehaviorPredictor({ 
        baseUrl: 'http://localhost:14514',
        onPrefetchStart,
        onPrefetchComplete,
        hoverDelay: 100
      })
    );

    act(() => {
      result.current.handleMouseEnter('coding');
    });

    // Leave before delay
    await act(async () => {
      vi.advanceTimersByTime(50);
    });

    act(() => {
      result.current.handleMouseLeave('coding');
    });

    // Advance past delay
    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    // Should not have started prefetch
    expect(onPrefetchStart).not.toHaveBeenCalled();
  });
});

describe('useHoverIntent', () => {
  // Import and test the useHoverIntent separately if needed
  it('should export useHoverIntent function', async () => {
    const { useHoverIntent } = await import('./useUserBehaviorPredictor');
    expect(useHoverIntent).toBeDefined();
    expect(typeof useHoverIntent).toBe('function');
  });
});
