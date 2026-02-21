export default defineNuxtRouteMiddleware(async () => {
  // Skip on server side - auth will be checked on client
  if (import.meta.server) {
    return
  }

  const { user, loading, initAuth } = useAuth()

  // Initialize auth if not already done
  initAuth()

  // Wait for auth to be ready
  if (loading.value) {
    await new Promise<void>((resolve) => {
      const unwatch = watch(loading, (isLoading) => {
        if (!isLoading) {
          unwatch()
          resolve()
        }
      })
    })
  }

  // Redirect to login if not authenticated
  if (!user.value) {
    return navigateTo('/')
  }
})
