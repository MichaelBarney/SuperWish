// Re-export shared pure functions
export {
  computeTimeHorizonFromDate,
  stripDateTextFromTitle,
  formatDueDate,
  isDueDateOverdue,
} from '@superwish/shared'

// Web-only: NLP date parsing (requires chrono-node)
import * as chrono from 'chrono-node'
import { Chrono } from 'chrono-node'
import PTRelativeDateFormatParser from '~/utils/PTRelativeDateFormatParser'

const ptParser = new Chrono(chrono.pt.createCasualConfiguration())
ptParser.parsers.push(new PTRelativeDateFormatParser())

export interface NlpDateMatch {
  date: Date
  matchedText: string
  index: number
  end: number
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
