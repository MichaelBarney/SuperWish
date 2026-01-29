export function useDynamicHead() {
  const { currentApp } = useAppContext()

  const faviconPath = computed(() =>
    currentApp.value === 'supertravel' ? '/favicon-travel.svg' : '/favicon.svg'
  )

  const pageTitle = computed(() =>
    currentApp.value === 'supertravel'
      ? 'SuperTravel - Trip Planner'
      : 'SuperWish - Wishlist Manager'
  )

  useFavicon(faviconPath)
  useTitle(pageTitle)
}
