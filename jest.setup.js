// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Used for __tests__/testing-library.js
// Learn more: https://github.com/testing-library/jest-dom
// import '@testing-library/jest-dom/extend-expect'

// Mock environment variables for tests
process.env.NODE_ENV = 'test'
process.env.ANTHROPIC_API_KEY = 'test-anthropic-key'
process.env.AWS_REGION = 'us-east-1'
process.env.AWS_ACCESS_KEY_ID = 'test-access-key'
process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key'

// Mock window object for browser compatibility tests
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    },
    writable: true,
  })
}

// Suppress console warnings during tests unless explicitly needed
const originalWarn = console.warn
console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('deprecated')) {
    return
  }
  originalWarn(...args)
}

// Mock fetch for HTTP requests in tests
global.fetch = jest.fn()

// Mock crypto for browser environment
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substring(2),
    getRandomValues: (arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256)
      }
      return arr
    },
  },
})

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks()
})