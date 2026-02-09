interface IconEntry {
  name: string
  label: string
}

interface IconCategory {
  label: string
  icons: IconEntry[]
}

const CACHE_KEY = 'lucide-icons-cache'
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000 // 7 days

const curatedCategories: IconCategory[] = [
  {
    label: 'General',
    icons: [
      { name: 'lucide:target', label: 'Target' },
      { name: 'lucide:star', label: 'Star' },
      { name: 'lucide:trophy', label: 'Trophy' },
      { name: 'lucide:flag', label: 'Flag' },
      { name: 'lucide:rocket', label: 'Rocket' },
      { name: 'lucide:zap', label: 'Zap' },
      { name: 'lucide:flame', label: 'Flame' },
      { name: 'lucide:gem', label: 'Gem' },
    ],
  },
  {
    label: 'Fitness',
    icons: [
      { name: 'lucide:dumbbell', label: 'Dumbbell' },
      { name: 'lucide:heart-pulse', label: 'Heart Pulse' },
      { name: 'lucide:bike', label: 'Bike' },
      { name: 'lucide:footprints', label: 'Footprints' },
      { name: 'lucide:timer', label: 'Timer' },
    ],
  },
  {
    label: 'Education',
    icons: [
      { name: 'lucide:book-open', label: 'Book' },
      { name: 'lucide:graduation-cap', label: 'Graduation' },
      { name: 'lucide:brain', label: 'Brain' },
      { name: 'lucide:pencil', label: 'Pencil' },
      { name: 'lucide:languages', label: 'Languages' },
    ],
  },
  {
    label: 'Creativity',
    icons: [
      { name: 'lucide:palette', label: 'Palette' },
      { name: 'lucide:music', label: 'Music' },
      { name: 'lucide:camera', label: 'Camera' },
      { name: 'lucide:pen-tool', label: 'Pen Tool' },
      { name: 'lucide:clapperboard', label: 'Film' },
    ],
  },
  {
    label: 'Health',
    icons: [
      { name: 'lucide:apple', label: 'Apple' },
      { name: 'lucide:salad', label: 'Salad' },
      { name: 'lucide:moon', label: 'Moon' },
      { name: 'lucide:sun', label: 'Sun' },
      { name: 'lucide:heart', label: 'Heart' },
    ],
  },
  {
    label: 'Work',
    icons: [
      { name: 'lucide:briefcase', label: 'Briefcase' },
      { name: 'lucide:laptop', label: 'Laptop' },
      { name: 'lucide:chart-bar', label: 'Chart' },
      { name: 'lucide:presentation', label: 'Presentation' },
      { name: 'lucide:code', label: 'Code' },
    ],
  },
  {
    label: 'Nature',
    icons: [
      { name: 'lucide:mountain', label: 'Mountain' },
      { name: 'lucide:trees', label: 'Trees' },
      { name: 'lucide:leaf', label: 'Leaf' },
      { name: 'lucide:flower-2', label: 'Flower' },
      { name: 'lucide:waves', label: 'Waves' },
    ],
  },
  {
    label: 'Lifestyle',
    icons: [
      { name: 'lucide:home', label: 'Home' },
      { name: 'lucide:wallet', label: 'Wallet' },
      { name: 'lucide:plane', label: 'Plane' },
      { name: 'lucide:users', label: 'Users' },
      { name: 'lucide:smile', label: 'Smile' },
    ],
  },
]

function formatLabel(slug: string): string {
  return slug
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function loadCache(): IconCategory[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { ts, data } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY)
      return null
    }
    return data as IconCategory[]
  } catch {
    return null
  }
}

function saveCache(data: IconCategory[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }))
  } catch {
    // localStorage full or unavailable — ignore
  }
}

function transformApiResponse(json: any): IconCategory[] {
  const cats: IconCategory[] = []
  const categoryMap: Record<string, string[]> = json.categories || {}

  for (const [catName, iconNames] of Object.entries(categoryMap)) {
    cats.push({
      label: formatLabel(catName),
      icons: (iconNames as string[]).map(n => ({
        name: `lucide:${n}`,
        label: formatLabel(n),
      })),
    })
  }

  // Sort categories alphabetically
  cats.sort((a, b) => a.label.localeCompare(b.label))

  // Handle uncategorized icons
  const uncategorized: string[] = json.uncategorized || []
  if (uncategorized.length > 0) {
    cats.push({
      label: 'Other',
      icons: uncategorized.map(n => ({
        name: `lucide:${n}`,
        label: formatLabel(n),
      })),
    })
  }

  return cats
}

// Shared state across component instances
const _categories = ref<IconCategory[]>(curatedCategories)
const _loading = ref(false)
const _fetched = ref(false)

export function useLucideIcons() {
  const allIcons = computed(() => _categories.value.flatMap(c => c.icons))

  if (!_fetched.value && !_loading.value) {
    _loading.value = true
    _fetched.value = true

    // Try cache first
    const cached = loadCache()
    if (cached) {
      _categories.value = cached
      _loading.value = false
    } else {
      // Fetch from API
      fetch('https://api.iconify.design/collection?prefix=lucide')
        .then(res => {
          if (!res.ok) throw new Error('API error')
          return res.json()
        })
        .then(json => {
          const result = transformApiResponse(json)
          if (result.length > 0) {
            _categories.value = result
            saveCache(result)
          }
        })
        .catch(() => {
          // Keep curated fallback — already set as default
        })
        .finally(() => {
          _loading.value = false
        })
    }
  }

  return {
    categories: _categories as Readonly<Ref<IconCategory[]>>,
    loading: _loading as Readonly<Ref<boolean>>,
    allIcons,
  }
}
