export function capitalizeFirst(str: string): string {
  if (!str) return str
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function localeDateString(date: Date, locale: string, options: Intl.DateTimeFormatOptions): string {
  const parts = new Intl.DateTimeFormat(locale, options).formatToParts(date)
  return parts.map(part => {
    if (part.type === 'month' || part.type === 'weekday') {
      return capitalizeFirst(part.value)
    }
    return part.value
  }).join('')
}
