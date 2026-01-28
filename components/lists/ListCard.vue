<template>
  <NuxtLink
    :to="`/list/${list.id}`"
    class="group block bg-white rounded-xl shadow-soft hover:shadow-soft-lg transition-all duration-300 overflow-hidden flex-shrink-0 w-48"
  >
    <!-- Card Header with gradient -->
    <div class="h-16 relative overflow-hidden">
      <!-- Cover Image -->
      <img
        v-if="list.coverUrl"
        :src="list.coverUrl"
        :alt="list.name"
        class="absolute inset-0 w-full h-full object-cover"
      />
      <!-- Gradient Overlay -->
      <div
        :class="[
          'absolute inset-0 bg-gradient-to-br from-accent-400 to-accent-600',
          list.coverUrl ? 'opacity-80' : ''
        ]"
      />
      <!-- Hover Overlay -->
      <div class="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
      <!-- Content -->
      <div class="relative p-3 z-10 h-full flex items-end">
        <h3 class="text-white font-semibold text-sm truncate w-full">
          {{ list.name }}
        </h3>
      </div>
    </div>

    <!-- Card Body -->
    <div class="p-3">
      <!-- Meta Info -->
      <div class="flex items-center gap-2 text-xs">
        <!-- Deadline -->
        <div v-if="list.deadline" class="flex items-center gap-1 text-gray-500">
          <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span :class="isOverdue ? 'text-red-500' : ''">{{ formattedDeadline }}</span>
        </div>

        <!-- Location -->
        <div v-else-if="list.location" class="flex items-center gap-1 text-gray-500">
          <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span class="truncate max-w-[60px]">{{ list.location }}</span>
        </div>

        <!-- No meta - show updated -->
        <span v-else class="text-gray-400 truncate">
          {{ formatRelativeTime(list.updatedAt?.toDate()) }}
        </span>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { WishList } from '~/types'

interface Props {
  list: WishList
}

const props = defineProps<Props>()
const { t, locale } = useI18n()

const isOverdue = computed(() => {
  if (!props.list.deadline) return false
  const deadline = props.list.deadline instanceof Date
    ? props.list.deadline
    : new Date(props.list.deadline)
  return deadline < new Date()
})

const formattedDeadline = computed(() => {
  if (!props.list.deadline) return ''
  const deadline = props.list.deadline instanceof Date
    ? props.list.deadline
    : new Date(props.list.deadline)
  const dateLocale = locale.value === 'pt-BR' ? 'pt-BR' : 'en-US'
  return deadline.toLocaleDateString(dateLocale, { month: 'short', day: 'numeric' })
})

function formatRelativeTime(date?: Date): string {
  if (!date) return t('common.recently')

  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 7) {
    const dateLocale = locale.value === 'pt-BR' ? 'pt-BR' : 'en-US'
    return date.toLocaleDateString(dateLocale, { month: 'short', day: 'numeric' })
  } else if (days > 0) {
    return t('common.daysAgo', { days })
  } else if (hours > 0) {
    return t('common.hoursAgo', { hours })
  } else if (minutes > 0) {
    return t('common.minutesAgo', { minutes })
  } else {
    return t('common.justNow')
  }
}
</script>
