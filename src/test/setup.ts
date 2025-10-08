import { beforeAll, afterEach, afterAll } from 'vitest'
import { cleanup } from '@testing-library/react'

// Setup for React Testing Library
afterEach(() => {
  cleanup()
})

// Mock environment variables
beforeAll(() => {
  Object.defineProperty(import.meta, 'env', {
    value: {
      VITE_SUPABASE_URL: 'https://test.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'test-anon-key',
      VITE_APP_NAME: 'Clay 2 Crafts',
      VITE_APP_BASE_URL: 'http://localhost:5173'
    },
    writable: true
  })
})