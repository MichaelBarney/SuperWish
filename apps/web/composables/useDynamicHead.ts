export function useDynamicHead() {
  const { currentApp } = useAppContext()

  const faviconPath = computed(() => {
    switch (currentApp.value) {
      case 'supertrip': return '/favicon-travel.svg'
      case 'superquest': return '/favicon-quest.svg'
      case 'supertask': return '/favicon-task.svg'
      default: return '/favicon.svg'
    }
  })

  const pageTitle = computed(() => {
    switch (currentApp.value) {
      case 'supertrip': return 'SuperTrip - Trip Planner'
      case 'superquest': return 'SuperQuest - Goal Tracker'
      case 'supertask': return 'SuperTask - Task Manager'
      default: return 'SuperWish - Wishlist Manager'
    }
  })

  useFavicon(faviconPath)
  useTitle(pageTitle)
}
