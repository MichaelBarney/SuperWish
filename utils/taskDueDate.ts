import * as chrono from 'chrono-node'
import { Chrono } from 'chrono-node'
import type { TaskTimeHorizon } from '~/types'
import PTRelativeDateFormatParser from '~/utils/PTRelativeDateFormatParser'

const ptParser = new Chrono(chrono.pt.createCasualConfiguration())
ptParser.parsers.push(new PTRelativeDateFormatParser())

export interface NlpDateMatch {
  date: Date
  matchedText: string
  index: number
  end: number
}

export function computeTimeHorizonFromDate(date: Date): TaskTimeHorizon {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  const diffDays = Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays <= 0) return 'today'

  // Calculate days until end of this week (Sunday)
  const dayOfWeek = now.getDay() // 0 = Sunday
  const daysUntilEndOfWeek = 7 - dayOfWeek
  if (diffDays <= daysUntilEndOfWeek) return 'this_week'

  // Calculate days until end of this month
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const daysUntilEndOfMonth = Math.floor((endOfMonth.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays <= daysUntilEndOfMonth) return 'this_month'

  return 'long_term'
}

export function parseDateFromText(text: string, locale: string): NlpDateMatch | null {
  if (!text || text.length < 3) return null

  const parser = locale.startsWith('pt') ? ptParser : chrono.en.casual
  const results = parser.parse(text, new Date(), { forwardDate: true })

  if (results.length === 0) return null

  const result = results[0]
  const parsed = result.start.date()
  let matchEndIndex = result.index + result.text.length
  let timeDetected = result.start.isCertain('hour')

  // chrono-node doesn't always handle Portuguese "Xh" time notation (e.g. "às 10h", "10h30").
  // If no time was detected, look for a PT time pattern right after the chrono match.
  if (!timeDetected && locale.startsWith('pt')) {
    const remaining = text.slice(matchEndIndex)
    const ptTimeRe = /^\s+(?:(?:às?|de|das?)\s+)*(\d{1,2})(?:h(\d{2})?|:(\d{2}))/i
    const timeMatch = remaining.match(ptTimeRe)

    if (timeMatch) {
      const hours = parseInt(timeMatch[1])
      const mins = parseInt(timeMatch[2] || timeMatch[3] || '0') || 0
      parsed.setHours(hours, mins, 0, 0)
      matchEndIndex += timeMatch[0].length
      timeDetected = true
    }
  }

  // Also try merging with chrono's second result if it detected time separately
  if (!timeDetected && results.length >= 2 && results[1].start.isCertain('hour')) {
    const second = results[1]
    const gap = second.index - matchEndIndex
    if (gap >= 0 && gap <= 5) {
      parsed.setHours(
        second.start.get('hour') ?? 0,
        second.start.get('minute') ?? 0,
        0, 0,
      )
      matchEndIndex = second.index + second.text.length
      timeDetected = true
    }
  }

  if (!timeDetected) {
    // No time component — set to noon per CLAUDE.md date-only rule
    parsed.setHours(12, 0, 0, 0)
  }

  const matchedText = text.slice(result.index, matchEndIndex).trimEnd()

  return {
    date: parsed,
    matchedText,
    index: result.index,
    end: result.index + matchedText.length,
  }
}

export function stripDateTextFromTitle(title: string, matchedText: string, index: number): string {
  const before = title.slice(0, index).trimEnd()
  const after = title.slice(index + matchedText.length).trimStart()
  const result = before + (before && after ? ' ' : '') + after
  return result.trim()
}

export function formatDueDate(date: Date, locale: string, t: (key: string) => string): string {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  const hasTime = date.getHours() !== 12 || date.getMinutes() !== 0
  const timeStr = hasTime
    ? ' ' + date.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })
    : ''

  if (diffDays === 0) return t('task.dueDate.today') + timeStr
  if (diffDays === 1) return t('task.dueDate.tomorrow') + timeStr

  // Within this week: show weekday name
  if (diffDays > 1 && diffDays < 7) {
    const weekday = date.toLocaleDateString(locale, { weekday: 'short' })
    return weekday + timeStr
  }

  // Otherwise show short date
  const dateStr = date.toLocaleDateString(locale, { month: 'short', day: 'numeric' })
  return dateStr + timeStr
}

export function isDueDateOverdue(date: Date): boolean {
  const now = new Date()
  const hasTime = date.getHours() !== 12 || date.getMinutes() !== 0
  if (hasTime) {
    return date.getTime() < now.getTime()
  }
  // Date-only: overdue if the date has passed
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  return target.getTime() < today.getTime()
}
