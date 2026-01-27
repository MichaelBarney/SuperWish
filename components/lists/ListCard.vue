<template>
  <NuxtLink
    :to="`/list/${list.id}`"
    class="group block bg-white rounded-2xl shadow-soft hover:shadow-soft-lg transition-all duration-300 overflow-hidden"
  >
    <!-- Card Header with gradient -->
    <div class="h-24 relative overflow-hidden">
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
      <div class="relative p-5 z-10">
        <h3 class="text-white font-semibold text-lg truncate">
          {{ list.name }}
        </h3>
      </div>
    </div>

    <!-- Card Body -->
    <div class="p-5">
      <p v-if="list.description" class="text-gray-500 text-sm line-clamp-2 mb-4">
        {{ list.description }}
      </p>
      <p v-else class="text-gray-400 text-sm italic mb-4">No description</p>

      <!-- Meta Info -->
      <div class="flex items-center gap-4 text-sm">
        <!-- Deadline -->
        <div v-if="list.deadline" class="flex items-center gap-1.5 text-gray-500">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span :class="isOverdue ? 'text-red-500' : ''">{{ formattedDeadline }}</span>
        </div>

        <!-- Location -->
        <div v-if="list.location" class="flex items-center gap-1.5 text-gray-500">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span class="truncate max-w-[100px]">{{ list.location }}</span>
        </div>
      </div>
    </div>

    <!-- Card Footer -->
    <div class="px-5 py-3 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between">
      <span class="text-xs text-gray-400">
        Updated {{ formatRelativeTime(list.updatedAt?.toDate()) }}
      </span>
      <svg class="w-5 h-5 text-gray-300 group-hover:text-accent-500 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { WishList } from '~/types'

interface Props {
  list: WishList
}

const props = defineProps<Props>()

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
  return deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
})

function formatRelativeTime(date?: Date): string {
  if (!date) return 'recently'

  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 7) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } else if (days > 0) {
    return `${days}d ago`
  } else if (hours > 0) {
    return `${hours}h ago`
  } else if (minutes > 0) {
    return `${minutes}m ago`
  } else {
    return 'just now'
  }
}
</script>
