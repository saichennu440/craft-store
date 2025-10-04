import { describe, it, expect } from 'vitest'
import { formatCurrency, formatDate, generateSlug, debounce } from '../utils'

describe('Utils', () => {
  describe('formatCurrency', () => {
    it('formats Indian currency correctly', () => {
      expect(formatCurrency(1000)).toBe('₹1,000.00')
      expect(formatCurrency(1500.50)).toBe('₹1,500.50')
      expect(formatCurrency(0)).toBe('₹0.00')
    })
  })

  describe('formatDate', () => {
    it('formats date correctly for Indian locale', () => {
      const date = new Date('2025-01-15')
      const formatted = formatDate(date)
      expect(formatted).toMatch(/15 January 2025/)
    })
  })

  describe('generateSlug', () => {
    it('generates slug from title', () => {
      expect(generateSlug('Handmade Ceramic Bowl')).toBe('handmade-ceramic-bowl')
      expect(generateSlug('Special $#@! Characters')).toBe('special-characters')
      expect(generateSlug('  Spaces   Around  ')).toBe('spaces-around')
    })
  })

  describe('debounce', () => {
    it('debounces function calls', async () => {
      let callCount = 0
      const fn = debounce(() => callCount++, 100)
      
      fn()
      fn()
      fn()
      
      expect(callCount).toBe(0)
      
      await new Promise(resolve => setTimeout(resolve, 150))
      expect(callCount).toBe(1)
    })
  })
})