# Adding a New App to SuperX

This guide explains how to add a new app module to the SuperX ecosystem.

## Overview

Each app in SuperX has:
- A unique identifier (e.g., `superwish`, `supertrip`, `superquest`)
- An accent color (teal, purple, green)
- An icon (from Lucide icons)
- Its own pages and routes

## Step-by-Step Guide

### Step 1: Define the App Type

**File:** `composables/useAppContext.ts`

1. Add to the `AppType` union:
```typescript
export type AppType = 'superwish' | 'supertrip' | 'superquest' | 'supernewapp'
```

2. Add a computed flag:
```typescript
const isSuperNewApp = computed(() => currentApp.value === 'supernewapp')
```

3. Update `accentColorClass` switch:
```typescript
const accentColorClass = computed(() => {
  switch (currentApp.value) {
    case 'supertrip': return 'purple'
    case 'superquest': return 'green'
    case 'supernewapp': return 'orange' // your color
    default: return 'accent'
  }
})
```

4. Update `initializeContext` validation to include the new app type.

5. Export the new flag in the return object.

---

### Step 2: Define Colors (if needed)

**File:** `tailwind.config.ts`

If using a new color, add the palette:
```typescript
colors: {
  orange: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316',
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
  }
}
```

**Existing colors:**
| Color | App |
|-------|-----|
| `accent` (teal) | SuperWish |
| `purple` | SuperTrip |
| `green` | SuperQuest |

---

### Step 3: Update App Switcher

**File:** `components/navigation/AppSwitcher.vue`

Add a new button after the existing ones:
```vue
<!-- SuperNewApp Button -->
<button
  @click="handleSwitch('supernewapp')"
  class="flex items-center justify-center gap-2 px-3 py-2 rounded-md transition-all duration-200"
  :class="[
    currentApp === 'supernewapp'
      ? 'bg-white shadow-soft text-orange-600'
      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50',
    collapsed ? 'w-full' : 'flex-1'
  ]"
>
  <Icon name="lucide:your-icon" class="w-5 h-5 shrink-0" />
  <span v-if="!collapsed" class="text-sm font-medium">{{ $t('nav.superNewApp') }}</span>
</button>
```

Update `handleSwitch` to navigate to your app route:
```typescript
const handleSwitch = (app: AppType) => {
  setApp(app)
  if (app === 'supertrip') {
    router.push('/trip')
  } else if (app === 'superquest') {
    router.push('/quest')
  } else if (app === 'supernewapp') {
    router.push('/newapp')
  } else {
    router.push('/wish')
  }
}
```

---

### Step 4: Update Sidebar

**File:** `components/navigation/AppSidebar.vue`

1. Import the new flag:
```typescript
const { isSuperWish, isSuperTrip, isSuperQuest, isSuperNewApp } = useAppContext()
```

2. Update logo gradient classes:
```vue
<div class="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br"
  :class="[
    isSuperTrip ? 'from-purple-400 to-purple-600' :
    isSuperQuest ? 'from-green-400 to-green-600' :
    isSuperNewApp ? 'from-orange-400 to-orange-600' :
    'from-accent-400 to-accent-600'
  ]"
>
```

3. Add logo icon condition:
```vue
<Icon v-if="!isSuperTrip && !isSuperQuest && !isSuperNewApp" name="lucide:star" />
<Icon v-else-if="isSuperTrip" name="lucide:plane" />
<Icon v-else-if="isSuperQuest" name="lucide:target" />
<Icon v-else name="lucide:your-icon" />
```

4. Add app-specific navigation section:
```vue
<template v-else-if="isSuperNewApp">
  <NavigationAppSidebarItem
    to="/newapp"
    :label="$t('nav.superNewApp')"
    :icon="YourIcon"
    :collapsed="!isMobile"
    variant="orange"
  />
</template>
```

---

### Step 5: Update Sidebar Item Variants

**File:** `components/navigation/AppSidebarItem.vue`

1. Add to variant prop type:
```typescript
interface Props {
  variant?: 'teal' | 'purple' | 'green' | 'orange'
}
```

2. Add to `activeClass` computed:
```typescript
const activeClass = computed(() => {
  if (props.variant === 'purple') {
    return 'bg-purple-50 text-purple-700 font-semibold'
  }
  if (props.variant === 'green') {
    return 'bg-green-50 text-green-700 font-semibold'
  }
  if (props.variant === 'orange') {
    return 'bg-orange-50 text-orange-700 font-semibold'
  }
  return 'bg-accent-50 text-accent-700 font-semibold'
})
```

---

### Step 6: Update Button Component

**File:** `components/ui/Button.vue`

Add color handling for primary buttons:
```typescript
const primaryClasses = computed(() => {
  if (isSuperTrip.value) {
    return 'bg-purple-500 text-white hover:bg-purple-600'
  }
  if (isSuperQuest.value) {
    return 'bg-green-500 text-white hover:bg-green-600'
  }
  if (isSuperNewApp.value) {
    return 'bg-orange-500 text-white hover:bg-orange-600'
  }
  return 'bg-accent-500 text-white hover:bg-accent-600'
})
```

---

### Step 7: Update Dynamic Head

**File:** `composables/useDynamicHead.ts`

Update favicon and page title logic:
```typescript
const faviconPath = computed(() => {
  switch (currentApp.value) {
    case 'supertrip': return '/favicon-travel.svg'
    case 'supernewapp': return '/favicon-newapp.svg'
    default: return '/favicon.svg'
  }
})

const pageTitle = computed(() => {
  switch (currentApp.value) {
    case 'supertrip': return 'SuperTrip - Trip Planner'
    case 'supernewapp': return 'SuperNewApp - Your Description'
    default: return 'SuperWish - Wishlist Manager'
  }
})
```

---

### Step 8: Create Favicon

**File:** `public/favicon-newapp.svg`

Create an SVG with your app's gradient and icon. Reference existing favicons:
- `public/favicon.svg` - Teal gradient with star icon (SuperWish)
- `public/favicon-travel.svg` - Purple gradient with plane icon (SuperTrip)

Example structure:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#fb923c"/>
      <stop offset="100%" style="stop-color:#ea580c"/>
    </linearGradient>
  </defs>
  <rect width="32" height="32" rx="8" fill="url(#grad)"/>
  <!-- Add your icon path here -->
</svg>
```

---

### Step 9: Update Landing Page

**File:** `pages/index.vue`

Add an app card in the grid:
```vue
<NuxtLink
  to="/newapp"
  class="group bg-white rounded-2xl shadow-soft p-8 text-center hover:shadow-md transition-shadow"
>
  <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center mx-auto mb-4 transition-transform group-hover:scale-110">
    <Icon name="lucide:your-icon" class="w-8 h-8 text-white" />
  </div>
  <h2 class="text-xl font-bold text-gray-900 mb-2">SuperNewApp</h2>
  <p class="text-gray-500 text-sm">{{ $t('landing.superNewAppDescription') }}</p>
</NuxtLink>
```

---

### Step 10: Add Translations

**File:** `i18n/locales/en.json`
```json
{
  "nav": {
    "superNewApp": "SuperNewApp"
  },
  "landing": {
    "superNewAppDescription": "Your app description here"
  }
}
```

**File:** `i18n/locales/pt-BR.json`
```json
{
  "nav": {
    "superNewApp": "SuperNewApp"
  },
  "landing": {
    "superNewAppDescription": "Descrição do seu app aqui"
  }
}
```

---

### Step 11: Create App Pages

**Directory:** `pages/newapp/`

Create the main page and any sub-routes:
```
pages/
└── newapp/
    ├── index.vue        # Main app page (/newapp)
    └── [id]/
        └── index.vue    # Detail page (/newapp/:id)
```

Use the `app-with-sidebar` layout:
```vue
<script setup lang="ts">
definePageMeta({
  layout: 'app-with-sidebar',
  middleware: 'auth'
})
</script>
```

---

## Checklist

- [ ] Add app type to `useAppContext.ts`
- [ ] Add color palette to `tailwind.config.ts` (if needed)
- [ ] Add button to `AppSwitcher.vue`
- [ ] Update logo and navigation in `AppSidebar.vue`
- [ ] Add variant to `AppSidebarItem.vue`
- [ ] Update `Button.vue` colors
- [ ] Update `useDynamicHead.ts`
- [ ] Create favicon in `public/`
- [ ] Add app card to `pages/index.vue`
- [ ] Add translations to `i18n/locales/`
- [ ] Create app pages in `pages/`
