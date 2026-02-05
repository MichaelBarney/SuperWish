export function useDynamicHead() {
  const { currentApp } = useAppContext()

  const faviconPath = computed(() =>
    currentApp.value === 'supertrip' ? '/favicon-travel.svg' : '/favicon.svg'
  )

  const pageTitle = computed(() =>
    currentApp.value === 'supertrip'
      ? 'SuperTrip - Trip Planner'
      : 'SuperWish - Wishlist Manager'
  )

  useFavicon(faviconPath)
  useTitle(pageTitle)
}
