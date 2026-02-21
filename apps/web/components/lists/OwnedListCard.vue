<template>
  <NuxtLink
    to="/wish/owned"
    class="group block bg-white rounded-xl shadow-soft hover:shadow-soft-lg transition-all duration-300 overflow-hidden flex-shrink-0 w-48"
  >
    <!-- Card Header with green gradient -->
    <div class="h-16 relative overflow-hidden">
      <!-- Green Gradient Background -->
      <div class="absolute inset-0 bg-gradient-to-br from-green-400 to-green-600" />
      <!-- Hover Overlay -->
      <div class="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
      <!-- Content -->
      <div class="relative p-3 z-10 h-full flex items-end justify-between">
        <h3 class="text-white font-semibold text-sm truncate">
          {{ $t('lists.owned.title') }}
        </h3>
        <Icon name="lucide:package-check" class="w-5 h-5 text-white/80" />
      </div>
    </div>

    <!-- Card Body -->
    <div class="p-3">
      <!-- Count -->
      <div class="flex items-center gap-1 text-xs text-gray-500">
        <Icon name="lucide:box" class="w-3 h-3" />
        <span>{{ $t('lists.owned.itemCount', count) }}</span>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
interface Props {
  count: number
}

defineProps<Props>()
</script>
