/**
 * Tests for quota formatting
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { printQuotaTable, printQuotaJson } from '../../src/quota/format.js'
import type { QuotaSnapshot } from '../../src/quota/types.js'

describe('printQuotaJson', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { })
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  it('should output valid JSON', () => {
    const snapshot: QuotaSnapshot = {
      timestamp: '2026-01-14T12:00:00.000Z',
      method: 'google',
      models: []
    }

    printQuotaJson(snapshot)

    expect(consoleSpy).toHaveBeenCalledOnce()
    const output = consoleSpy.mock.calls[0][0]
    const parsed = JSON.parse(output as string)
    expect(parsed.method).toBe('google')
  })
})

describe('printQuotaTable', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { })
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  it('should output model & quota format', () => {
    const snapshot: QuotaSnapshot = {
      timestamp: '2026-01-14T12:00:00.000Z',
      method: 'google',
      email: 'test@example.com',
      models: [
        {
          label: 'Gemini Flash',
          modelId: 'gemini-flash-weekly',
          remainingPercentage: 0.9362,
          isExhausted: false,
          timeUntilResetMs: 162 * 60 * 60 * 1000 + 4 * 60 * 1000 // 162h 4m
        },
        {
          label: 'Gemini Pro',
          modelId: 'gemini-pro-5h',
          remainingPercentage: 0.6171,
          isExhausted: false,
          timeUntilResetMs: 2 * 60 * 60 * 1000 + 57 * 60 * 1000 // 2h 57m
        },
        {
          label: 'Claude Opus',
          modelId: 'claude-opus',
          remainingPercentage: 1.0,
          isExhausted: false
        }
      ]
    }

    printQuotaTable(snapshot)

    // Verify console was called multiple times
    expect(consoleSpy.mock.calls.length).toBeGreaterThan(5)

    // Check that some expected content is in the output
    const allOutput = consoleSpy.mock.calls.map(c => c[0]).join('\n')
    expect(allOutput).toContain('Models & Quota')
    expect(allOutput).toContain('Account: test@example.com')
    expect(allOutput).toContain('GEMINI MODELS')
    expect(allOutput).toContain('CLAUDE AND GPT MODELS')
    expect(allOutput).toContain('93.62%')
    expect(allOutput).toContain('94% remaining')
    expect(allOutput).toContain('162h 4m')
    expect(allOutput).toContain('61.71%')
    expect(allOutput).toContain('62% remaining')
    expect(allOutput).toContain('2h 57m')
  })

  it('should handle exhausted models', () => {
    const snapshot: QuotaSnapshot = {
      timestamp: '2026-01-14T12:00:00.000Z',
      method: 'google',
      models: [
        {
          label: 'Gemini Flash',
          modelId: 'gemini-flash',
          isExhausted: true,
          remainingPercentage: 0,
          timeUntilResetMs: 3600000
        }
      ]
    }

    printQuotaTable(snapshot)

    const allOutput = consoleSpy.mock.calls.map(c => c[0]).join('\n')
    expect(allOutput).toContain('EXHAUSTED')
  })

  it('should run without error even with no models', () => {
    const snapshot: QuotaSnapshot = {
      timestamp: '2026-01-14T12:00:00.000Z',
      method: 'google',
      models: []
    }

    printQuotaTable(snapshot)

    const allOutput = consoleSpy.mock.calls.map(c => c[0]).join('\n')
    expect(allOutput).toContain('Models & Quota')
  })

  it('should run with allModels option', () => {
    const snapshot: QuotaSnapshot = {
      timestamp: '2026-01-14T12:00:00.000Z',
      method: 'google',
      models: [
        {
          label: 'Gemini Flash',
          modelId: 'gemini-flash',
          isExhausted: false,
          remainingPercentage: 1.0
        }
      ]
    }

    printQuotaTable(snapshot, { allModels: true })

    const allOutput = consoleSpy.mock.calls.map(c => c[0]).join('\n')
    expect(allOutput).toContain('Models & Quota')
  })
})
