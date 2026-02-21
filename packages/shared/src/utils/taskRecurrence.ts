import type { TaskRecurrence, TaskTimeHorizon } from '../types/task'
import { computeTimeHorizonFromDate } from './taskDueDate'

export function stripRecurrenceTextFromTitle(title: string, matchedText: string, index: number): string {
  const before = title.slice(0, index).trimEnd()
  const after = title.slice(index + matchedText.length).trimStart()
  const result = before + (before && after ? ' ' : '') + after
  return result.trim()
}

export function formatRecurrence(recurrence: TaskRecurrence, locale: string, t: (key: string, params?: Record<string, unknown>) => string): string {
  if (recurrence.dayOfWeek !== undefined && recurrence.frequency === 'weekly') {
    const dayNames = locale.startsWith('pt')
      ? ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
      : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const prefix = locale.startsWith('pt') ? 'Toda' : 'Every'
    return `${prefix} ${dayNames[recurrence.dayOfWeek]}`
  }

  if (recurrence.dayOfMonth !== undefined && recurrence.frequency === 'monthly') {
    return t('task.recurrence.dayOfMonth', { day: recurrence.dayOfMonth })
  }

  if (recurrence.interval > 1) {
    const unitKey = recurrence.frequency === 'daily' ? 'day'
      : recurrence.frequency === 'weekly' ? 'week'
      : recurrence.frequency === 'monthly' ? 'month'
      : 'year'
    const unitNames: Record<string, Record<string, string>> = {
      en: { day: 'days', week: 'weeks', month: 'months', year: 'years' },
      pt: { day: 'dias', week: 'semanas', month: 'meses', year: 'anos' },
    }
    const lang = locale.startsWith('pt') ? 'pt' : 'en'
    const prefix = locale.startsWith('pt') ? 'A cada' : 'Every'
    return `${prefix} ${recurrence.interval} ${unitNames[lang][unitKey]}`
  }

  return t(`task.recurrence.${recurrence.frequency}`)
}

function nextWeekday(dayOfWeek: number): Date {
  const now = new Date()
  const today = now.getDay()
  let diff = dayOfWeek - today
  if (diff <= 0) diff += 7
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff, 12, 0, 0)
  return next
}

function nextDayOfMonth(day: number): Date {
  const now = new Date()
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), day, 12, 0, 0)
  if (thisMonth > now) return thisMonth
  return new Date(now.getFullYear(), now.getMonth() + 1, day, 12, 0, 0)
}

export function computeInitialDueDateFromRecurrence(recurrence: TaskRecurrence): Date {
  const now = new Date()
  switch (recurrence.frequency) {
    case 'daily':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0)
    case 'weekly':
      if (recurrence.dayOfWeek !== undefined) {
        return nextWeekday(recurrence.dayOfWeek)
      }
      // No specific day -> 7 days from now
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 12, 0, 0)
    case 'monthly':
      if (recurrence.dayOfMonth !== undefined) {
        return nextDayOfMonth(recurrence.dayOfMonth)
      }
      // No specific day -> same day next month
      return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate(), 12, 0, 0)
    case 'yearly':
      return new Date(now.getFullYear() + 1, now.getMonth(), now.getDate(), 12, 0, 0)
    default:
      return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0)
  }
}

export function computeTimeHorizonFromRecurrence(recurrence: TaskRecurrence): TaskTimeHorizon {
  const dueDate = computeInitialDueDateFromRecurrence(recurrence)
  return computeTimeHorizonFromDate(dueDate)
}

export function computeNextDueDate(currentDueDate: Date | null | undefined, recurrence: TaskRecurrence): Date {
  const base = currentDueDate ? new Date(currentDueDate) : new Date()

  // Ensure we start from at least today
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0)
  if (base < today) {
    base.setTime(today.getTime())
  }

  switch (recurrence.frequency) {
    case 'daily':
      base.setDate(base.getDate() + recurrence.interval)
      break
    case 'weekly':
      if (recurrence.dayOfWeek !== undefined) {
        // Jump to the next occurrence of this weekday
        let diff = recurrence.dayOfWeek - base.getDay()
        if (diff <= 0) diff += 7 * recurrence.interval
        else if (recurrence.interval > 1) diff += 7 * (recurrence.interval - 1)
        base.setDate(base.getDate() + diff)
      } else {
        base.setDate(base.getDate() + 7 * recurrence.interval)
      }
      break
    case 'monthly':
      if (recurrence.dayOfMonth !== undefined) {
        base.setMonth(base.getMonth() + recurrence.interval)
        base.setDate(recurrence.dayOfMonth)
      } else {
        base.setMonth(base.getMonth() + recurrence.interval)
      }
      break
    case 'yearly':
      base.setFullYear(base.getFullYear() + recurrence.interval)
      break
  }

  // Normalize to noon to avoid timezone issues
  base.setHours(12, 0, 0, 0)
  return base
}
