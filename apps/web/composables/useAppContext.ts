export type AppType = 'superwish' | 'supertrip' | 'superquest' | 'supertask'

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
      if (savedApp && (savedApp === 'superwish' || savedApp === 'supertrip' || savedApp === 'superquest' || savedApp === 'supertask')) {
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

  // Computed: is SuperTrip active
  const isSuperTrip = computed(() => currentApp.value === 'supertrip')

  // Computed: is SuperWish active
  const isSuperWish = computed(() => currentApp.value === 'superwish')

  // Computed: is SuperQuest active
  const isSuperQuest = computed(() => currentApp.value === 'superquest')

  // Computed: is SuperTask active
  const isSuperTask = computed(() => currentApp.value === 'supertask')

  // Computed: accent color class prefix based on current app
  const accentColorClass = computed(() => {
    switch (currentApp.value) {
      case 'supertrip': return 'purple'
      case 'superquest': return 'green'
      case 'supertask': return 'orange'
      default: return 'accent'
    }
  })

  // Helper to get the correct color class
  const getAccentClass = (shade: number, prefix: string = 'bg') => {
    return `${prefix}-${accentColorClass.value}-${shade}`
  }

  // Initialize on composable use
  initializeContext()

  return {
    currentApp: readonly(currentApp),
    isSuperTrip,
    isSuperWish,
    isSuperQuest,
    isSuperTask,
    accentColorClass,
    setApp,
    getAccentClass,
    initializeContext,
  }
}
