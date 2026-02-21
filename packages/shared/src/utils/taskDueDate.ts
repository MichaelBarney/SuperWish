import type { TaskTimeHorizon } from '../types/task'

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
