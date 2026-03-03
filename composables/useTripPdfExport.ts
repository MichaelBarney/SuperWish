import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
  type Firestore,
} from 'firebase/firestore'
import type { Trip, Destination, Transportation, Accommodation, Experience } from '~/types'
import type { TripPdfData } from '~/utils/tripPdfBuilder'

export function useTripPdfExport() {
  const nuxtApp = useNuxtApp()
  const { user } = useAuth()
  const { locale, t } = useI18n()

  const exporting = ref(false)
  const error = ref<string | null>(null)

  const getDb = (): Firestore | null => {
    if (import.meta.server) return null
    return nuxtApp.$db as Firestore | null
  }

  async function fetchExperiencesForDestination(db: Firestore, userId: string, destinationId: string): Promise<Experience[]> {
    const experiencesRef = collection(db, 'experiences')
    const q = query(
      experiencesRef,
      where('userId', '==', userId),
      where('destinationId', '==', destinationId),
      orderBy('scheduledDate', 'asc'),
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(docSnap => {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        tripId: data.tripId,
        userId: data.userId,
        destinationId: data.destinationId,
        category: data.category,
        name: data.name,
        description: data.description || '',
        address: data.address || '',
        scheduledDate: data.scheduledDate ? (data.scheduledDate as Timestamp).toDate() : null,
        scheduledTime: data.scheduledTime || '',
        duration: data.duration || 0,
        status: data.status || 'wishlist',
        bookingReference: data.bookingReference || '',
        bookingUrl: data.bookingUrl || '',
        estimatedCost: data.estimatedCost || 0,
        actualCost: data.actualCost || 0,
        currency: data.currency || 'USD',
        convertedCost: data.convertedCost || 0,
        rating: data.rating || 0,
        notes: data.notes || '',
        imageUrl: data.imageUrl || '',
        externalUrl: data.externalUrl || '',
        country: data.country || '',
        city: data.city || '',
        countryCode: data.countryCode || '',
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      } as Experience
    })
  }

  async function exportTripPdf(
    trip: Trip,
    destinations: Destination[],
    transportations: Transportation[],
    accommodations: Accommodation[],
    getArrivalDate: (dest: Destination, index: number) => Date | string | null,
    getDepartureDate: (dest: Destination, index: number) => Date | string | null,
  ) {
    const db = getDb()
    if (!db || !user.value) {
      error.value = 'Not authenticated'
      return
    }

    exporting.value = true
    error.value = null

    try {
      // Fetch experiences for all destinations in parallel
      const sortedDestinations = [...destinations].sort((a, b) => a.order - b.order)
      const experiencesByDest = await Promise.all(
        sortedDestinations.map(dest =>
          fetchExperiencesForDestination(db, user.value!.uid, dest.id)
        )
      )

      // Build destination data array
      const destinationData: TripPdfData['destinations'] = sortedDestinations.map((dest, idx) => ({
        destination: dest,
        experiences: experiencesByDest[idx],
        accommodations: accommodations.filter(a => a.destinationId === dest.id),
        arrivalDate: getArrivalDate(dest, idx),
        departureDate: getDepartureDate(dest, idx),
      }))

      // Dynamic import jsPDF, then autotable (applyPlugin attaches .autoTable to prototype)
      const { jsPDF } = await import('jspdf')
      const { applyPlugin } = await import('jspdf-autotable')
      applyPlugin(jsPDF)

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

      // Build PDF
      const { buildTripPdfWithDoc } = await import('~/utils/tripPdfBuilder')
      buildTripPdfWithDoc(doc, {
        trip,
        destinations: destinationData,
        transportations,
        locale: locale.value,
      }, t)

      // Trigger download
      const safeName = trip.name.replace(/[^a-zA-Z0-9_\- ]/g, '').replace(/\s+/g, '_')
      doc.save(`${safeName}_Itinerary.pdf`)
    } catch (err) {
      console.error('Error exporting PDF:', err)
      error.value = t('travel.pdf.exportError')
    } finally {
      exporting.value = false
    }
  }

  return {
    exporting: readonly(exporting),
    error: readonly(error),
    exportTripPdf,
  }
}
