import { ParsingComponents } from 'chrono-node'
import type { Parser, ParsingContext } from 'chrono-node'

const UNIT_MAP: Record<string, string> = {
  dia: 'day',
  semana: 'week',
  mes: 'month',
  mês: 'month',
  ano: 'year',
}

// Forma A: próximo/próxima/último/última/este/esta + unidade
// Forma B: unidade + que vem / passado/passada
const PATTERN = new RegExp(
  '(?:' +
    // Forma A: prefix + unit
    '(pr[oó]xim[oa]|[uú]ltim[oa]|est[ea])\\s+(dia|semana|m[eê]s|ano)' +
    '|' +
    // Forma B: unit + suffix
    '(dia|semana|m[eê]s|ano)\\s+(que\\s+vem|passad[oa])' +
  ')',
  'i',
)

function resolveOffset(modifier: string): number {
  const normalized = modifier
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  if (/^proxim/.test(normalized) || normalized === 'que vem') return 1
  if (/^ultim/.test(normalized) || /^passad/.test(normalized)) return -1
  if (/^est/.test(normalized)) return 0
  return 0
}

export default class PTRelativeDateFormatParser implements Parser {
  pattern(): RegExp {
    return PATTERN
  }

  extract(context: ParsingContext, match: RegExpMatchArray) {
    const prefixModifier = match[1]
    const prefixUnit = match[2]
    const suffixUnit = match[3]
    const suffixModifier = match[4]

    const modifier = prefixModifier || suffixModifier
    const rawUnit = prefixUnit || suffixUnit

    const unitKey = rawUnit
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
    const chronoUnit = UNIT_MAP[unitKey]
    if (!chronoUnit || !modifier) return null

    const offset = resolveOffset(modifier)

    return ParsingComponents.createRelativeFromReference(
      context.reference,
      { [chronoUnit]: offset },
    )
  }
}
