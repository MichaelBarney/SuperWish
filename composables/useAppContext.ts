export type AppType = 'superwish' | 'supertravel'

const STORAGE_KEY = 'app-context'

// Global state (persisted across components)
const currentApp = ref<AppType>('superwish')
const initialized = ref(false)

export function useAppContext() {
  // Initialize from localStorage on client-side
  const initializeContext = () => {
    if (initialized.value) return
    if (import.meta.client) {
      const savedApp = localStorage.getItem(STORAGE_KEY) as AppType | null
      if (savedApp && (savedApp === 'superwish' || savedApp === 'supertravel')) {
        currentApp.value = savedApp
      }
      initialized.value = true
    }
  }

  // Set current app and persist
  const setApp = (app: AppType) => {
    currentApp.value = app
    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, app)
    }
  }

  // Computed: is SuperTravel active
  const isSuperTravel = computed(() => currentApp.value === 'supertravel')

  // Computed: is SuperWish active
  const isSuperWish = computed(() => currentApp.value === 'superwish')

  // Computed: accent color class prefix based on current app
  const accentColorClass = computed(() => {
    return currentApp.value === 'supertravel' ? 'purple' : 'accent'
  })

  // Helper to get the correct color class
  const getAccentClass = (shade: number, prefix: string = 'bg') => {
    return `${prefix}-${accentColorClass.value}-${shade}`
  }

  // Initialize on composable use
  initializeContext()

  return {
    currentApp: readonly(currentApp),
    isSuperTravel,
    isSuperWish,
    accentColorClass,
    setApp,
    getAccentClass,
    initializeContext,
  }
}
