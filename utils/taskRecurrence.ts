import type { TaskRecurrence, TaskRecurrenceFrequency, TaskTimeHorizon } from '~/types'
import { computeTimeHorizonFromDate } from '~/utils/taskDueDate'

export interface NlpRecurrenceMatch {
  recurrence: TaskRecurrence
  matchedText: string
  index: number
  end: number
  impliedDate?: Date // e.g. "every monday" implies next monday as initial dueDate
}

const EN_DAYS: Record<string, number> = {
  sunday: 0, sun: 0,
  monday: 1, mon: 1,
  tuesday: 2, tue: 2, tues: 2,
  wednesday: 3, wed: 3,
  thursday: 4, thu: 4, thurs: 4,
  friday: 5, fri: 5,
  saturday: 6, sat: 6,
}

const PT_DAYS: Record<string, number> = {
  domingo: 0,
  segunda: 1, 'segunda-feira': 1,
  terça: 2, terca: 2, 'terça-feira': 2, 'terca-feira': 2,
  quarta: 3, 'quarta-feira': 3,
  quinta: 4, 'quinta-feira': 4,
  sexta: 5, 'sexta-feira': 5,
  sábado: 6, sabado: 6,
}

const PT_ORDINALS: Record<string, number> = {
  primeiro: 1, primeira: 1,
  segundo: 2, segunda: 2,
  terceiro: 3, terceira: 3,
  quarto: 4, quarta: 4,
  quinto: 5, quinta: 5,
  sexto: 6, sexta: 6,
  sétimo: 7, setimo: 7, sétima: 7, setima: 7,
  oitavo: 8, oitava: 8,
  nono: 9, nona: 9,
  décimo: 10, decimo: 10, décima: 10, decima: 10,
  último: 28, ultimo: 28, última: 28, ultima: 28,
}

const PT_CARDINALS: Record<string, number> = {
  um: 1, uma: 1, dois: 2, duas: 2, três: 3, tres: 3,
  quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9,
  dez: 10, onze: 11, doze: 12, treze: 13, quatorze: 14, catorze: 14,
  quinze: 15, dezesseis: 16, dezessete: 17, dezoito: 18, dezenove: 19,
  vinte: 20,
}

const PT_NUMBER_WORDS = Object.keys({ ...PT_ORDINALS, ...PT_CARDINALS })

function parsePTDayNumber(word: string): number | null {
  const lower = word.toLowerCase()
  if (PT_ORDINALS[lower] !== undefined) return PT_ORDINALS[lower]
  if (PT_CARDINALS[lower] !== undefined) return PT_CARDINALS[lower]
  const num = parseInt(lower)
  if (!isNaN(num)) return num
  return null
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

export function parseRecurrenceFromText(text: string, locale: string): NlpRecurrenceMatch | null {
  if (!text || text.length < 4) return null

  const lower = text.toLowerCase()

  if (locale.startsWith('pt')) {
    return parsePT(lower, text)
  }
  return parseEN(lower, text)
}

function parseEN(lower: string, original: string): NlpRecurrenceMatch | null {
  // "every N days/weeks/months/years"
  const everyN = /\bevery\s+(\d+)\s+(day|week|month|year)s?\b/i
  let m = lower.match(everyN)
  if (m) {
    const interval = parseInt(m[1])
    const unit = m[2] as string
    const freq = unitToFrequency(unit)
    if (freq) {
      const idx = lower.indexOf(m[0])
      return {
        recurrence: { frequency: freq, interval },
        matchedText: original.slice(idx, idx + m[0].length),
        index: idx,
        end: idx + m[0].length,
      }
    }
  }

  // "every <weekday>"
  const everyDay = /\bevery\s+(sunday|sun|monday|mon|tuesday|tue|tues|wednesday|wed|thursday|thu|thurs|friday|fri|saturday|sat)\b/i
  m = lower.match(everyDay)
  if (m) {
    const dayName = m[1].toLowerCase()
    const dayOfWeek = EN_DAYS[dayName]
    if (dayOfWeek !== undefined) {
      const idx = lower.indexOf(m[0])
      return {
        recurrence: { frequency: 'weekly', interval: 1, dayOfWeek },
        matchedText: original.slice(idx, idx + m[0].length),
        index: idx,
        end: idx + m[0].length,
        impliedDate: nextWeekday(dayOfWeek),
      }
    }
  }

  // "every 1st" / "every 2nd" / "every 15th" (monthly on day N)
  const everyOrdinal = /\bevery\s+(\d{1,2})(?:st|nd|rd|th)\b/i
  m = lower.match(everyOrdinal)
  if (m) {
    const dayOfMonth = parseInt(m[1])
    if (dayOfMonth >= 1 && dayOfMonth <= 31) {
      const idx = lower.indexOf(m[0])
      return {
        recurrence: { frequency: 'monthly', interval: 1, dayOfMonth },
        matchedText: original.slice(idx, idx + m[0].length),
        index: idx,
        end: idx + m[0].length,
        impliedDate: nextDayOfMonth(dayOfMonth),
      }
    }
  }

  // "every day" / "every week" / "every month" / "every year"
  const everyUnit = /\bevery\s+(day|week|month|year)\b/i
  m = lower.match(everyUnit)
  if (m) {
    const unit = m[1] as string
    const freq = unitToFrequency(unit)
    if (freq) {
      const idx = lower.indexOf(m[0])
      return {
        recurrence: { frequency: freq, interval: 1 },
        matchedText: original.slice(idx, idx + m[0].length),
        index: idx,
        end: idx + m[0].length,
      }
    }
  }

  // "daily" / "weekly" / "monthly" / "yearly"
  const shorthand = /\b(daily|weekly|monthly|yearly)\b/i
  m = lower.match(shorthand)
  if (m) {
    const freqMap: Record<string, TaskRecurrenceFrequency> = {
      daily: 'daily', weekly: 'weekly', monthly: 'monthly', yearly: 'yearly',
    }
    const freq = freqMap[m[1].toLowerCase()]
    if (freq) {
      const idx = lower.indexOf(m[0])
      return {
        recurrence: { frequency: freq, interval: 1 },
        matchedText: original.slice(idx, idx + m[0].length),
        index: idx,
        end: idx + m[0].length,
      }
    }
  }

  return null
}

function parsePT(lower: string, original: string): NlpRecurrenceMatch | null {
  // "a cada N semanas/meses/anos/dias"
  const aCadaN = /\ba cada\s+(\d+)\s+(dia|semana|m[eê]s|meses|ano)s?\b/i
  let m = lower.match(aCadaN)
  if (m) {
    const interval = parseInt(m[1])
    const unit = m[2]
    const freq = ptUnitToFrequency(unit)
    if (freq) {
      const idx = lower.indexOf(m[0])
      return {
        recurrence: { frequency: freq, interval },
        matchedText: original.slice(idx, idx + m[0].length),
        index: idx,
        end: idx + m[0].length,
      }
    }
  }

  // "todo dia N" (monthly on day N) — must come before "todo dia" (daily)
  // Matches numeric digits AND ordinal/cardinal words (primeiro, cinco, etc.)
  const ptNumberPattern = `\\d{1,2}|${PT_NUMBER_WORDS.join('|')}`
  const todoDiaN = new RegExp(`\\btodo\\s+dia\\s+(${ptNumberPattern})\\b`, 'i')
  m = lower.match(todoDiaN)
  if (m) {
    const dayOfMonth = parsePTDayNumber(m[1])
    if (dayOfMonth && dayOfMonth >= 1 && dayOfMonth <= 31) {
      const idx = lower.indexOf(m[0])
      return {
        recurrence: { frequency: 'monthly', interval: 1, dayOfMonth },
        matchedText: original.slice(idx, idx + m[0].length),
        index: idx,
        end: idx + m[0].length,
        impliedDate: nextDayOfMonth(dayOfMonth),
      }
    }
  }

  // "todo dia" (daily)
  const todoDia = /\btodo\s+dia\b/i
  m = lower.match(todoDia)
  if (m) {
    const idx = lower.indexOf(m[0])
    return {
      recurrence: { frequency: 'daily', interval: 1 },
      matchedText: original.slice(idx, idx + m[0].length),
      index: idx,
      end: idx + m[0].length,
    }
  }

  // "toda <weekday>"
  const todaDay = /\btoda\s+(segunda(?:-feira)?|ter[çc]a(?:-feira)?|quarta(?:-feira)?|quinta(?:-feira)?|sexta(?:-feira)?)\b/i
  m = lower.match(todaDay)
  if (m) {
    const dayName = m[1].toLowerCase()
    const dayOfWeek = PT_DAYS[dayName]
    if (dayOfWeek !== undefined) {
      const idx = lower.indexOf(m[0])
      return {
        recurrence: { frequency: 'weekly', interval: 1, dayOfWeek },
        matchedText: original.slice(idx, idx + m[0].length),
        index: idx,
        end: idx + m[0].length,
        impliedDate: nextWeekday(dayOfWeek),
      }
    }
  }

  // "todo sábado" / "todo domingo"
  const todoWeekend = /\btodo\s+(s[áa]bado|domingo)\b/i
  m = lower.match(todoWeekend)
  if (m) {
    const dayName = m[1].toLowerCase()
    const dayOfWeek = PT_DAYS[dayName]
    if (dayOfWeek !== undefined) {
      const idx = lower.indexOf(m[0])
      return {
        recurrence: { frequency: 'weekly', interval: 1, dayOfWeek },
        matchedText: original.slice(idx, idx + m[0].length),
        index: idx,
        end: idx + m[0].length,
        impliedDate: nextWeekday(dayOfWeek),
      }
    }
  }

  // "toda semana"
  const todaSemana = /\btoda\s+semana\b/i
  m = lower.match(todaSemana)
  if (m) {
    const idx = lower.indexOf(m[0])
    return {
      recurrence: { frequency: 'weekly', interval: 1 },
      matchedText: original.slice(idx, idx + m[0].length),
      index: idx,
      end: idx + m[0].length,
    }
  }

  // "todos os meses" / "todo mês"
  const todoMes = /\b(?:todos\s+os\s+meses|todo\s+m[eê]s)\b/i
  m = lower.match(todoMes)
  if (m) {
    const idx = lower.indexOf(m[0])
    return {
      recurrence: { frequency: 'monthly', interval: 1 },
      matchedText: original.slice(idx, idx + m[0].length),
      index: idx,
      end: idx + m[0].length,
    }
  }

  // "todos os anos" / "todo ano"
  const todoAno = /\b(?:todos\s+os\s+anos|todo\s+ano)\b/i
  m = lower.match(todoAno)
  if (m) {
    const idx = lower.indexOf(m[0])
    return {
      recurrence: { frequency: 'yearly', interval: 1 },
      matchedText: original.slice(idx, idx + m[0].length),
      index: idx,
      end: idx + m[0].length,
    }
  }

  return null
}

function unitToFrequency(unit: string): TaskRecurrenceFrequency | null {
  switch (unit.toLowerCase()) {
    case 'day': return 'daily'
    case 'week': return 'weekly'
    case 'month': return 'monthly'
    case 'year': return 'yearly'
    default: return null
  }
}

function ptUnitToFrequency(unit: string): TaskRecurrenceFrequency | null {
  const normalized = unit.toLowerCase()
  if (normalized === 'dia') return 'daily'
  if (normalized === 'semana') return 'weekly'
  if (normalized === 'mês' || normalized === 'mes' || normalized === 'meses') return 'monthly'
  if (normalized === 'ano') return 'yearly'
  return null
}

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

export function computeInitialDueDateFromRecurrence(recurrence: TaskRecurrence): Date {
  const now = new Date()
  switch (recurrence.frequency) {
    case 'daily':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0)
    case 'weekly':
      if (recurrence.dayOfWeek !== undefined) {
        return nextWeekday(recurrence.dayOfWeek)
      }
      // No specific day → 7 days from now
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 12, 0, 0)
    case 'monthly':
      if (recurrence.dayOfMonth !== undefined) {
        return nextDayOfMonth(recurrence.dayOfMonth)
      }
      // No specific day → same day next month
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
