// Mock framer-motion
vi.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: {
      div: ({ children, ...props }) => React.createElement('div', props, children),
      span: ({ children, ...props }) => React.createElement('span', props, children),
    },
    AnimatePresence: ({ children }) => children,
    useAnimation: () => ({
      start: vi.fn(),
    }),
    useMotionValue: vi.fn(() => ({
      set: vi.fn(),
      get: vi.fn(),
    })),
    useTransform: vi.fn(() => vi.fn()),
  };
});

// Mock react-window
vi.mock('react-window', () => {
  const React = require('react');
  return {
    List: ({ children, ...props }) => React.createElement('div', { 'data-testid': 'virtualized-list', ...props }),
    FixedSizeList: ({ children, ...props }) => React.createElement('div', { 'data-testid': 'fixed-size-list', ...props }),
    VariableSizeList: ({ children, ...props }) => React.createElement('div', { 'data-testid': 'variable-size-list', ...props }),
  };
});

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: {
      changeLanguage: vi.fn(),
    },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: vi.fn(),
  },
}));

// Mock axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    create: vi.fn(() => ({
      get: vi.fn(),
      post: vi.fn(),
    })),
  },
  get: vi.fn(),
  post: vi.fn(),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => {
  const React = require('react');
  return {
    User: ({ size, strokeWidth, className }) => 
      React.createElement('svg', { 'data-testid': 'user-icon', width: size, height: size, className }),
    List: ({ size, strokeWidth, className }) => 
      React.createElement('svg', { 'data-testid': 'list-icon', width: size, height: size, className }),
  };
});

// Mock Web Worker
class MockWorker {
  constructor() {
    this.onmessage = null;
    this.onerror = null;
  }
  postMessage(message) {
    if (this.onmessage) {
      setTimeout(() => {
        this.onmessage({ data: { success: true, data: [] } });
      }, 0);
    }
  }
  terminate() {}
  addEventListener() {}
  removeEventListener() {}
}

global.Worker = MockWorker;

// Mock ChartWorkerManager
vi.mock('../utils/ChartWorkerManager', () => ({
  default: {
    processData: vi.fn(() => Promise.resolve([])),
    initialize: vi.fn(() => Promise.resolve()),
  },
}));

// Setup @testing-library/jest-dom matchers if available
try {
  require('@testing-library/jest-dom');
} catch (e) {
  // Ignore if not available
}
