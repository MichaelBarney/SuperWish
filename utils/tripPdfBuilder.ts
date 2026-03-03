import type { jsPDF } from 'jspdf'
import type { Trip, Destination, Transportation, Accommodation, Experience } from '~/types'
import { getCurrencySymbol } from '~/types'
import { localeDateString } from '~/utils/date'

// ---------- Types ----------

type TFunc = (key: string, params?: Record<string, unknown>, pluralCount?: number) => string

interface DestinationData {
  destination: Destination
  experiences: Experience[]
  accommodations: Accommodation[]
  arrivalDate: Date | string | null
  departureDate: Date | string | null
}

export interface TripPdfData {
  trip: Trip
  destinations: DestinationData[]
  transportations: Transportation[]
  locale: string
}

type DayItemKind = 'experience' | 'accommodation-checkin' | 'accommodation-checkout' | 'transport-arriving' | 'transport-departing'

interface DayItem {
  kind: DayItemKind
  sortTime: string
  data: Experience | Accommodation | Transportation
}

interface DayGroup {
  dateKey: string
  label: string
  dayNum: number | null
  items: DayItem[]
}

// ---------- Helpers ----------

const PURPLE = [168, 85, 247] as const // #a855f7
const GRAY_DARK = [55, 65, 81] as const
const GRAY_MED = [107, 114, 128] as const
const GRAY_LIGHT = [229, 231, 235] as const
const WHITE = [255, 255, 255] as const
const PURPLE_LIGHT_BG = [250, 245, 255] as const // purple-50

const PAGE_LEFT = 14
const PAGE_RIGHT = 196
const CONTENT_WIDTH = PAGE_RIGHT - PAGE_LEFT

function toDateKey(d: Date | string): string {
  const date = d instanceof Date ? d : new Date(d)
  if (isNaN(date.getTime())) return ''
  return date.toISOString().split('T')[0]
}

function toDate(d: Date | string | null | undefined): Date | null {
  if (!d) return null
  const date = d instanceof Date ? d : new Date(d)
  return isNaN(date.getTime()) ? null : date
}

function extractTime(d: Date | string | null | undefined): string {
  if (!d) return ''
  const date = d instanceof Date ? d : new Date(d)
  if (isNaN(date.getTime())) return ''
  const h = String(date.getHours()).padStart(2, '0')
  const m = String(date.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

function formatDuration(minutes: number): string {
  if (!minutes) return ''
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0 && m > 0) return `${h}h ${m}min`
  if (h > 0) return `${h}h`
  return `${m}min`
}

function formatDateForPdf(d: Date | string | null | undefined, locale: string): string {
  const date = toDate(d)
  if (!date) return ''
  const dateLocale = locale === 'pt-BR' ? 'pt-BR' : 'en-US'
  return localeDateString(date, dateLocale, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
}

function formatDateWithWeekday(dateKey: string, locale: string): string {
  const d = new Date(dateKey + 'T00:00:00Z')
  const dateLocale = locale === 'pt-BR' ? 'pt-BR' : 'en-US'
  const datePart = localeDateString(d, dateLocale, { day: 'numeric', month: 'long', timeZone: 'UTC' })
  const weekday = localeDateString(d, dateLocale, { weekday: 'long', timeZone: 'UTC' })
  return `${datePart}, ${weekday}`
}

function formatCurrency(amount: number | undefined, currency: string): string {
  if (!amount) return ''
  const symbol = getCurrencySymbol(currency)
  return `${symbol} ${amount.toLocaleString()}`
}

function getTransportBetween(transportations: Transportation[], fromId: string | null, toId: string | null): Transportation | undefined {
  return transportations.find(t => {
    const tFrom = t.fromDestinationId || null
    const tTo = t.toDestinationId || null
    return tFrom === fromId && tTo === toId
  })
}

// ---------- Day grouping (mirrors DayTimeline.vue) ----------

function buildDayGroups(
  experiences: Experience[],
  accommodations: Accommodation[],
  transportations: Transportation[],
  destinationId: string,
  arrivalDate: Date | string | null,
  departureDate: Date | string | null,
  locale: string,
  t: TFunc,
): DayGroup[] {
  const dateItems: Record<string, DayItem[]> = {}
  const unscheduledItems: DayItem[] = []

  const addItem = (dateKey: string, item: DayItem) => {
    if (!dateKey) { unscheduledItems.push(item); return }
    if (!dateItems[dateKey]) dateItems[dateKey] = []
    dateItems[dateKey].push(item)
  }

  const arrival = toDate(arrivalDate)
  const departure = toDate(departureDate)
  const hasRange = arrival && departure

  const rangeKeys = new Set<string>()
  if (hasRange) {
    const current = new Date(arrival!)
    current.setUTCHours(0, 0, 0, 0)
    const end = new Date(departure!)
    end.setUTCHours(0, 0, 0, 0)
    while (current <= end) {
      const key = current.toISOString().split('T')[0]
      rangeKeys.add(key)
      dateItems[key] = dateItems[key] || []
      current.setUTCDate(current.getUTCDate() + 1)
    }
  }

  // Experiences
  for (const exp of experiences) {
    if (exp.scheduledDate) {
      const key = toDateKey(exp.scheduledDate)
      const inRange = hasRange && rangeKeys.has(key)
      addItem(inRange || !hasRange ? key : '', {
        kind: 'experience',
        sortTime: exp.scheduledTime || '12:00',
        data: exp,
      })
    } else {
      unscheduledItems.push({ kind: 'experience', sortTime: '12:00', data: exp })
    }
  }

  // Accommodations
  for (const acc of accommodations) {
    const checkInKey = toDateKey(acc.checkIn)
    const checkOutKey = toDateKey(acc.checkOut)
    if (checkInKey) {
      const inRange = hasRange && rangeKeys.has(checkInKey)
      addItem(inRange || !hasRange ? checkInKey : '', {
        kind: 'accommodation-checkin',
        sortTime: acc.checkInTime || '15:00',
        data: acc,
      })
    }
    if (checkOutKey && checkOutKey !== checkInKey) {
      const inRange = hasRange && rangeKeys.has(checkOutKey)
      addItem(inRange || !hasRange ? checkOutKey : '', {
        kind: 'accommodation-checkout',
        sortTime: acc.checkOutTime || '11:00',
        data: acc,
      })
    }
  }

  // Transportations
  for (const tr of transportations) {
    const isArriving = tr.toDestinationId === destinationId
    const isDeparting = tr.fromDestinationId === destinationId
    if (isArriving && tr.arrivalDateTime) {
      const key = toDateKey(tr.arrivalDateTime)
      const inRange = hasRange && rangeKeys.has(key)
      addItem(inRange || !hasRange ? key : '', {
        kind: 'transport-arriving',
        sortTime: extractTime(tr.arrivalDateTime) || '00:00',
        data: tr,
      })
    }
    if (isDeparting && tr.departureDateTime) {
      const key = toDateKey(tr.departureDateTime)
      const inRange = hasRange && rangeKeys.has(key)
      addItem(inRange || !hasRange ? key : '', {
        kind: 'transport-departing',
        sortTime: extractTime(tr.departureDateTime) || '23:59',
        data: tr,
      })
    }
  }

  const sortedKeys = Object.keys(dateItems).sort()

  const groups: DayGroup[] = sortedKeys.map(key => {
    const items = dateItems[key].sort((a, b) => a.sortTime.localeCompare(b.sortTime))
    const label = formatDateWithWeekday(key, locale)

    let dayNum: number | null = null
    if (hasRange) {
      const arrivalKey = arrival!.toISOString().split('T')[0]
      const d = new Date(key + 'T00:00:00Z')
      dayNum = Math.round((d.getTime() - new Date(arrivalKey + 'T00:00:00Z').getTime()) / (1000 * 60 * 60 * 24)) + 1
    }

    return { dateKey: key, label, dayNum, items }
  })

  if (unscheduledItems.length > 0) {
    groups.push({
      dateKey: '_unscheduled',
      label: t('travel.pdf.unscheduled'),
      dayNum: null,
      items: unscheduledItems,
    })
  }

  return groups
}

// ---------- PDF Rendering helpers ----------

function ensureSpace(doc: jsPDF, needed: number, y: number): number {
  const pageHeight = doc.internal.pageSize.getHeight()
  if (y + needed > pageHeight - 20) {
    doc.addPage()
    return 20
  }
  return y
}

function addFooters(doc: jsPDF, t: TFunc) {
  const pageCount = doc.getNumberOfPages()
  const pageHeight = doc.internal.pageSize.getHeight()
  const pageWidth = doc.internal.pageSize.getWidth()
  const now = new Date()
  const dateStr = now.toLocaleDateString()

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(...GRAY_MED)
    doc.text(`${i} / ${pageCount}`, pageWidth / 2, pageHeight - 8, { align: 'center' })
    doc.text(dateStr, pageWidth - PAGE_LEFT, pageHeight - 8, { align: 'right' })
  }
}

// ---------- Item detail renderers ----------

function renderExperienceDetails(exp: Experience, t: TFunc, locale: string): string {
  const parts: string[] = []
  const category = t(`travel.experiences.categories.${exp.category}`)
  parts.push(category)
  if (exp.scheduledTime) parts.push(exp.scheduledTime)
  if (exp.address) parts.push(exp.address)
  if (exp.duration) parts.push(formatDuration(exp.duration))
  if (exp.description) parts.push(exp.description)
  if (exp.estimatedCost) parts.push(`${t('travel.pdf.cost')}: ${formatCurrency(exp.estimatedCost, exp.currency)}`)
  if (exp.bookingReference) parts.push(`${t('travel.pdf.bookingRef')}: ${exp.bookingReference}`)
  const status = t(`travel.experiences.status.${exp.status}`)
  parts.push(`[${status}]`)
  if (exp.notes) parts.push(exp.notes)
  return parts.join(' | ')
}

function renderAccommodationDetails(acc: Accommodation, kind: 'checkin' | 'checkout', t: TFunc): string {
  const parts: string[] = []
  const accType = t(`travel.accommodations.types.${acc.type}`)
  parts.push(accType)
  if (kind === 'checkin' && acc.checkInTime) parts.push(acc.checkInTime)
  if (kind === 'checkout' && acc.checkOutTime) parts.push(acc.checkOutTime)
  if (acc.address) parts.push(acc.address)
  if (acc.roomType) parts.push(acc.roomType)
  if (acc.totalPrice) parts.push(`${t('travel.pdf.cost')}: ${formatCurrency(acc.totalPrice, acc.currency)}`)
  if (acc.bookingReference) parts.push(`${t('travel.pdf.bookingRef')}: ${acc.bookingReference}`)
  if (acc.amenities?.length) parts.push(acc.amenities.join(', '))
  if (acc.notes) parts.push(acc.notes)
  return parts.join(' | ')
}

function renderTransportDetails(tr: Transportation, t: TFunc): string {
  const parts: string[] = []
  const trType = t(`travel.transportation.types.${tr.type}`)
  parts.push(trType)
  if (tr.carrier) {
    let carrierStr = tr.carrier
    if (tr.flightNumber) carrierStr += ` ${tr.flightNumber}`
    parts.push(carrierStr)
  }
  const depTime = extractTime(tr.departureDateTime)
  const arrTime = extractTime(tr.arrivalDateTime)
  if (depTime || arrTime) parts.push(`${depTime} -> ${arrTime}`)
  parts.push(`${tr.fromLocation} -> ${tr.toLocation}`)
  if (tr.seatInfo) parts.push(`${t('travel.pdf.seat')}: ${tr.seatInfo}`)
  if (tr.bookingReference) parts.push(`${t('travel.pdf.bookingRef')}: ${tr.bookingReference}`)
  if (tr.price) parts.push(formatCurrency(tr.price, tr.currency))
  if (tr.notes) parts.push(tr.notes)
  return parts.join(' | ')
}

// ---------- Main builder ----------

export function buildTripPdfWithDoc(
  doc: jsPDF,
  data: TripPdfData,
  t: TFunc,
): jsPDF {
  const { trip, destinations, transportations, locale } = data
  let y = 20

  // ===== Trip Header =====
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...PURPLE)
  doc.text(trip.name, PAGE_LEFT, y)
  y += 8

  if (trip.description) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...GRAY_MED)
    const descLines = doc.splitTextToSize(trip.description, CONTENT_WIDTH) as string[]
    doc.text(descLines, PAGE_LEFT, y)
    y += descLines.length * 4.5
  }

  // Date range + budget + origin
  const metaParts: string[] = []
  if (trip.startDate && trip.endDate) {
    metaParts.push(`${formatDateForPdf(trip.startDate, locale)} — ${formatDateForPdf(trip.endDate, locale)}`)
  }
  if (trip.totalBudget) {
    metaParts.push(`${t('travel.pdf.budget')}: ${formatCurrency(trip.totalBudget, trip.baseCurrency)}`)
  }
  if (trip.origin?.name) {
    metaParts.push(`${t('travel.pdf.origin')}: ${trip.origin.name}${trip.origin.country ? ', ' + trip.origin.country : ''}`)
  }

  if (metaParts.length) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...GRAY_MED)
    doc.text(metaParts.join('  •  '), PAGE_LEFT, y)
    y += 6
  }

  // Divider line
  y += 2
  doc.setDrawColor(...GRAY_LIGHT)
  doc.setLineWidth(0.5)
  doc.line(PAGE_LEFT, y, PAGE_RIGHT, y)
  y += 8

  // ===== Per Destination =====
  const sortedDestinations = [...destinations].sort((a, b) => a.destination.order - b.destination.order)

  // Origin → first destination transport
  if (sortedDestinations.length > 0) {
    const firstDest = sortedDestinations[0].destination
    const originTransport = getTransportBetween(transportations, null, firstDest.id)
    if (originTransport) {
      y = ensureSpace(doc, 16, y)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'italic')
      doc.setTextColor(...GRAY_MED)
      const trType = t(`travel.transportation.types.${originTransport.type}`)
      const depTime = extractTime(originTransport.departureDateTime)
      const arrTime = extractTime(originTransport.arrivalDateTime)
      let segmentText = `${trType}: ${originTransport.fromLocation} -> ${originTransport.toLocation}`
      if (depTime || arrTime) segmentText += ` (${depTime} -> ${arrTime})`
      if (originTransport.carrier) segmentText += ` — ${originTransport.carrier}${originTransport.flightNumber ? ' ' + originTransport.flightNumber : ''}`
      doc.text(segmentText, PAGE_LEFT + 4, y)
      y += 8
    }
  }

  for (let dIdx = 0; dIdx < sortedDestinations.length; dIdx++) {
    const destData = sortedDestinations[dIdx]
    const { destination, experiences, accommodations, arrivalDate, departureDate } = destData

    // Between-destination transport segment
    if (dIdx > 0) {
      const prevDest = sortedDestinations[dIdx - 1].destination
      const transport = getTransportBetween(transportations, prevDest.id, destination.id)
      if (transport) {
        y = ensureSpace(doc, 16, y)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'italic')
        doc.setTextColor(...GRAY_MED)
        const trType = t(`travel.transportation.types.${transport.type}`)
        const depTime = extractTime(transport.departureDateTime)
        const arrTime = extractTime(transport.arrivalDateTime)
        let segmentText = `${trType}: ${transport.fromLocation} -> ${transport.toLocation}`
        if (depTime || arrTime) segmentText += ` (${depTime} -> ${arrTime})`
        if (transport.carrier) segmentText += ` — ${transport.carrier}${transport.flightNumber ? ' ' + transport.flightNumber : ''}`
        doc.text(segmentText, PAGE_LEFT + 4, y)
        y += 8
      }
    }

    // Destination header
    y = ensureSpace(doc, 20, y)
    doc.setFillColor(...PURPLE_LIGHT_BG)
    doc.roundedRect(PAGE_LEFT, y - 4, CONTENT_WIDTH, 14, 2, 2, 'F')

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...PURPLE)
    doc.text(`${destination.name}, ${destination.country}`, PAGE_LEFT + 4, y + 4)

    // Dates + nights on the right
    const arrivalStr = formatDateForPdf(arrivalDate, locale)
    const departureStr = formatDateForPdf(departureDate, locale)
    if (arrivalStr || departureStr) {
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...GRAY_MED)
      let dateInfo = ''
      if (arrivalStr && departureStr) {
        dateInfo = `${arrivalStr} — ${departureStr}`
        const arrD = toDate(arrivalDate)
        const depD = toDate(departureDate)
        if (arrD && depD) {
          const nights = Math.round((depD.getTime() - arrD.getTime()) / (1000 * 60 * 60 * 24))
          if (nights > 0) dateInfo += ` (${t('travel.pdf.nights', { count: nights }, nights)})`
        }
      } else if (arrivalStr) {
        dateInfo = arrivalStr
      }
      doc.text(dateInfo, PAGE_RIGHT - 4, y + 4, { align: 'right' })
    }

    y += 14

    // Build day groups for this destination
    // Filter transportations relevant to this destination
    const destTransports = transportations.filter(
      tr => tr.toDestinationId === destination.id || tr.fromDestinationId === destination.id
    )

    const dayGroups = buildDayGroups(
      experiences, accommodations, destTransports,
      destination.id, arrivalDate, departureDate,
      locale, t,
    )

    if (dayGroups.length === 0) {
      doc.setFontSize(9)
      doc.setFont('helvetica', 'italic')
      doc.setTextColor(...GRAY_MED)
      doc.text(t('travel.pdf.noItems'), PAGE_LEFT + 4, y + 2)
      y += 10
    }

    // Render day groups using autoTable
    for (const day of dayGroups) {
      y = ensureSpace(doc, 18, y)

      // Day header
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...GRAY_DARK)
      const dayLabel = day.dayNum ? `${t('travel.pdf.day')} ${day.dayNum} — ${day.label}` : day.label
      doc.text(dayLabel, PAGE_LEFT + 2, y)
      y += 5

      if (day.items.length === 0) {
        doc.setFontSize(8)
        doc.setFont('helvetica', 'italic')
        doc.setTextColor(...GRAY_MED)
        doc.text(t('travel.pdf.emptyDay'), PAGE_LEFT + 4, y + 2)
        y += 7
        continue
      }

      // Build table rows for this day
      const tableBody: (string | { content: string; styles?: Record<string, unknown> })[][] = []

      for (const item of day.items) {
        let time = item.sortTime
        let type = ''
        let name = ''
        let details = ''

        if (item.kind === 'experience') {
          const exp = item.data as Experience
          type = t(`travel.experiences.categories.${exp.category}`)
          name = exp.name
          details = renderExperienceDetails(exp, t, locale)
        } else if (item.kind === 'accommodation-checkin') {
          const acc = item.data as Accommodation
          time = acc.checkInTime || '15:00'
          type = t('travel.pdf.checkIn')
          name = acc.name
          details = renderAccommodationDetails(acc, 'checkin', t)
        } else if (item.kind === 'accommodation-checkout') {
          const acc = item.data as Accommodation
          time = acc.checkOutTime || '11:00'
          type = t('travel.pdf.checkOut')
          name = acc.name
          details = renderAccommodationDetails(acc, 'checkout', t)
        } else if (item.kind === 'transport-arriving') {
          const tr = item.data as Transportation
          time = extractTime(tr.arrivalDateTime) || ''
          type = `${t(`travel.transportation.types.${tr.type}`)} (${t('travel.pdf.arrival')})`
          name = `${tr.fromLocation} -> ${tr.toLocation}`
          details = renderTransportDetails(tr, t)
        } else if (item.kind === 'transport-departing') {
          const tr = item.data as Transportation
          time = extractTime(tr.departureDateTime) || ''
          type = `${t(`travel.transportation.types.${tr.type}`)} (${t('travel.pdf.departure')})`
          name = `${tr.fromLocation} -> ${tr.toLocation}`
          details = renderTransportDetails(tr, t)
        }

        tableBody.push([time, type, name, details])
      }

      // @ts-expect-error autoTable is added via plugin
      doc.autoTable({
        startY: y,
        margin: { left: PAGE_LEFT + 2, right: PAGE_LEFT },
        head: [[
          t('travel.pdf.time'),
          t('travel.pdf.type'),
          t('travel.pdf.name'),
          t('travel.pdf.details'),
        ]],
        body: tableBody,
        theme: 'grid',
        styles: {
          fontSize: 7.5,
          cellPadding: 2,
          textColor: GRAY_DARK,
          lineColor: GRAY_LIGHT,
          lineWidth: 0.3,
          overflow: 'linebreak' as const,
        },
        headStyles: {
          fillColor: PURPLE,
          textColor: WHITE,
          fontStyle: 'bold',
          fontSize: 7.5,
        },
        columnStyles: {
          0: { cellWidth: 14 },  // Time
          1: { cellWidth: 28 },  // Type
          2: { cellWidth: 36 },  // Name
          3: { cellWidth: 'auto' }, // Details
        },
        didDrawPage: () => {
          // Page break handling is automatic via autoTable
        },
      })

      // @ts-expect-error autoTable sets lastAutoTable
      y = doc.lastAutoTable.finalY + 6
    }

    y += 4
  }

  // ===== Return transport (last dest → origin) =====
  if (sortedDestinations.length > 0 && trip.origin) {
    const lastDest = sortedDestinations[sortedDestinations.length - 1].destination
    const returnTransport = getTransportBetween(transportations, lastDest.id, null)
    if (returnTransport) {
      y = ensureSpace(doc, 16, y)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'italic')
      doc.setTextColor(...GRAY_MED)
      const trType = t(`travel.transportation.types.${returnTransport.type}`)
      const depTime = extractTime(returnTransport.departureDateTime)
      const arrTime = extractTime(returnTransport.arrivalDateTime)
      let segmentText = `${trType}: ${returnTransport.fromLocation} -> ${returnTransport.toLocation}`
      if (depTime || arrTime) segmentText += ` (${depTime} -> ${arrTime})`
      if (returnTransport.carrier) segmentText += ` — ${returnTransport.carrier}${returnTransport.flightNumber ? ' ' + returnTransport.flightNumber : ''}`
      doc.text(segmentText, PAGE_LEFT + 4, y)
      y += 8
    }
  }

  // ===== Footers =====
  addFooters(doc, t)

  return doc
}
