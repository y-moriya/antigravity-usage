/**
 * Quota output formatting
 */

import type { QuotaSnapshot, ModelQuotaInfo } from './types.js'

/**
 * Options for quota formatting
 */
export interface FormatOptions {
  allModels?: boolean
}

interface GroupLimit {
  remainingPercentage?: number
  timeUntilResetMs?: number
  isExhausted: boolean
}

/**
 * Format milliseconds to human readable time
 */
function formatTimeUntilReset(ms?: number): string {
  if (ms === undefined || ms <= 0) return 'N/A'

  const hours = Math.floor(ms / (1000 * 60 * 60))
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

/**
 * Draw progress bar with 50 characters width
 */
function drawProgressBar(percentage?: number): string {
  const width = 50
  const filledChar = '█'
  const emptyChar = '░'

  if (percentage === undefined) {
    return `[${emptyChar.repeat(width)}]`
  }

  const filledCount = Math.min(width, Math.max(0, Math.round((percentage / 100) * width)))
  const emptyCount = width - filledCount

  return `[${filledChar.repeat(filledCount)}${emptyChar.repeat(emptyCount)}]`
}

/**
 * Extract weekly and five-hour limits for a group of models
 */
function extractGroupLimits(models: ModelQuotaInfo[]) {
  let weekly: GroupLimit | undefined = undefined
  let fiveHour: GroupLimit | undefined = undefined

  // Weekly Limit:
  // 1. timeUntilResetMs > 5.5 hours OR modelId contains 'weekly'
  const weeklyModel = models.find(m => 
    m.modelId.toLowerCase().includes('weekly') || 
    m.modelId.toLowerCase().includes('week') ||
    (m.timeUntilResetMs !== undefined && m.timeUntilResetMs > 5.5 * 60 * 60 * 1000)
  )

  if (weeklyModel) {
    weekly = {
      remainingPercentage: weeklyModel.remainingPercentage,
      timeUntilResetMs: weeklyModel.timeUntilResetMs,
      isExhausted: weeklyModel.isExhausted
    }
  }

  // Five Hour Limit:
  // 1. timeUntilResetMs <= 5.5 hours OR modelId contains 'five' / '5h' / 'hour' / 'daily'
  const fiveHourModel = models.find(m => 
    m.modelId.toLowerCase().includes('five') || 
    m.modelId.toLowerCase().includes('5h') || 
    m.modelId.toLowerCase().includes('hour') || 
    m.modelId.toLowerCase().includes('daily') ||
    (m.timeUntilResetMs !== undefined && m.timeUntilResetMs <= 5.5 * 60 * 60 * 1000) ||
    (!m.modelId.toLowerCase().includes('weekly') && !m.modelId.toLowerCase().includes('week'))
  )

  if (fiveHourModel) {
    fiveHour = {
      remainingPercentage: fiveHourModel.remainingPercentage,
      timeUntilResetMs: fiveHourModel.timeUntilResetMs,
      isExhausted: fiveHourModel.isExhausted
    }
  }

  // Fallback: if weekly is defined but fiveHour is not, or vice versa
  if (models.length > 0) {
    if (!weekly && !fiveHour) {
      fiveHour = {
        remainingPercentage: models[0].remainingPercentage,
        timeUntilResetMs: models[0].timeUntilResetMs,
        isExhausted: models[0].isExhausted
      }
    }
  }

  return { weekly, fiveHour }
}

/**
 * Get display info for a limit or default to 100.00% / Quota available
 */
function getLimitOrDefault(limit?: GroupLimit): { percentage: number; text: string; rawPercentage: number } {
  if (!limit) {
    return {
      percentage: 100.00,
      rawPercentage: 100.00,
      text: 'Quota available'
    }
  }

  const rawPercentage = limit.remainingPercentage !== undefined ? limit.remainingPercentage * 100 : 100.00
  const percentage = Math.round(rawPercentage * 100) / 100

  if (limit.isExhausted || percentage === 0) {
    const timeText = limit.timeUntilResetMs ? ` · Refreshes in ${formatTimeUntilReset(limit.timeUntilResetMs)}` : ''
    return {
      percentage: 0.00,
      rawPercentage: 0.00,
      text: `❌ EXHAUSTED${timeText}`
    }
  }

  if (percentage >= 99.99) {
    return {
      percentage: 100.00,
      rawPercentage: 100.00,
      text: 'Quota available'
    }
  }

  const roundedPct = Math.round(percentage)
  const timeText = limit.timeUntilResetMs
    ? ` · Refreshes in ${formatTimeUntilReset(limit.timeUntilResetMs)}`
    : ''
  return {
    percentage,
    rawPercentage,
    text: `${roundedPct}% remaining${timeText}`
  }
}

/**
 * Print quota matching /usage output layout
 */
export function printQuotaTable(snapshot: QuotaSnapshot, options: FormatOptions = {}): void {
  const email = snapshot.email || 'Unknown'

  // Group models
  const geminiModels = snapshot.models.filter(m => 
    m.label.toLowerCase().includes('gemini') || 
    m.modelId.toLowerCase().includes('gemini')
  )

  const claudeGptModels = snapshot.models.filter(m => 
    m.label.toLowerCase().includes('claude') || 
    m.label.toLowerCase().includes('gpt') || 
    m.modelId.toLowerCase().includes('claude') || 
    m.modelId.toLowerCase().includes('gpt')
  )

  const geminiLimits = extractGroupLimits(geminiModels)
  const claudeGptLimits = extractGroupLimits(claudeGptModels)

  const gWeekly = getLimitOrDefault(geminiLimits.weekly)
  const gFiveHour = getLimitOrDefault(geminiLimits.fiveHour)

  const cWeekly = getLimitOrDefault(claudeGptLimits.weekly)
  const cFiveHour = getLimitOrDefault(claudeGptLimits.fiveHour)

  console.log()
  console.log(' Models & Quota')
  console.log()
  console.log(`  Account: ${email}`)
  console.log()
  console.log('GEMINI MODELS')
  console.log('  Models within this group: Gemini Flash, Gemini Pro')
  console.log()
  console.log('  Weekly Limit')
  console.log(`    ${drawProgressBar(gWeekly.rawPercentage)} ${gWeekly.percentage.toFixed(2)}%`)
  console.log(`    ${gWeekly.text}`)
  console.log()
  console.log('  Five Hour Limit')
  console.log(`    ${drawProgressBar(gFiveHour.rawPercentage)} ${gFiveHour.percentage.toFixed(2)}%`)
  console.log(`    ${gFiveHour.text}`)
  console.log()
  console.log()
  console.log('CLAUDE AND GPT MODELS')
  console.log('  Models within this group: Claude Opus, Claude Sonnet, GPT-OSS')
  console.log()
  console.log('  Weekly Limit')
  console.log(`    ${drawProgressBar(cWeekly.rawPercentage)} ${cWeekly.percentage.toFixed(2)}%`)
  console.log(`    ${cWeekly.text}`)
  console.log()
  console.log('  Five Hour Limit')
  console.log(`    ${drawProgressBar(cFiveHour.rawPercentage)} ${cFiveHour.percentage.toFixed(2)}%`)
  console.log(`    ${cFiveHour.text}`)
  console.log()
  console.log()
  console.log('  │Within each group, models share a weekly limit and a 5-hour limit. Quota is')
  console.log('  │consumed proportionally to the cost of the tokens. Thus, limits will last')
  console.log('  │longer with shorter tasks or using more cost-effective models. The 5-hour')
  console.log('  │limit smooths out aggregate demand to fairly distribute global capacity across')
  console.log('  │all users, while your weekly limit is tied directly to your individual tier.')
  console.log()
}

/**
 * Print quota as JSON
 */
export function printQuotaJson(snapshot: QuotaSnapshot): void {
  console.log(JSON.stringify(snapshot, null, 2))
}
