<template>
  <UiModal
    :model-value="modelValue"
    :title="currentListId ? 'Move Wish' : 'Add Wish to List'"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="space-y-4">
      <p class="text-sm text-gray-500">
        {{ currentListId ? 'Choose where to move' : 'Select a list to add' }} "<span class="font-medium text-gray-700">{{ wish?.title }}</span>"{{ currentListId ? '' : ' to' }}:
      </p>

      <!-- Remove from list option (only when currently in a list) -->
      <button
        v-if="currentListId"
        @click="selectList(null)"
        :class="[
          'w-full text-left px-4 py-3 rounded-xl border transition-all duration-200',
          selectedListId === null && removeFromList
            ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-200'
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        ]"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <svg class="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <div>
              <h4 class="font-medium text-gray-900">Remove from list</h4>
              <p class="text-sm text-gray-500">Move to Quick Wishes</p>
            </div>
          </div>
          <svg
            v-if="selectedListId === null && removeFromList"
            class="w-5 h-5 text-amber-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
        </div>
      </button>

      <!-- Divider (only when removing option is shown and there are lists) -->
      <div v-if="currentListId && availableLists.length > 0" class="relative">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-200"></div>
        </div>
        <div class="relative flex justify-center text-xs">
          <span class="px-2 bg-white text-gray-500">or move to</span>
        </div>
      </div>

      <!-- List Options -->
      <div class="space-y-2 max-h-64 overflow-y-auto">
        <button
          v-for="list in availableLists"
          :key="list.id"
          @click="selectList(list.id)"
          :class="[
            'w-full text-left px-4 py-3 rounded-xl border transition-all duration-200',
            selectedListId === list.id
              ? 'border-accent-500 bg-accent-50 ring-2 ring-accent-200'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          ]"
        >
          <div class="flex items-center justify-between">
            <div>
              <h4 class="font-medium text-gray-900">{{ list.name }}</h4>
              <p v-if="list.description" class="text-sm text-gray-500 truncate">
                {{ list.description }}
              </p>
            </div>
            <svg
              v-if="selectedListId === list.id"
              class="w-5 h-5 text-accent-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
          </div>
        </button>
      </div>

      <!-- Empty State -->
      <div v-if="availableLists.length === 0 && !currentListId" class="text-center py-8">
        <svg class="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <p class="text-gray-500">No lists available</p>
      </div>
    </div>

    <template #footer>
      <UiButton variant="secondary" @click="$emit('update:modelValue', false)">
        Cancel
      </UiButton>
      <UiButton
        :disabled="!hasSelection"
        :loading="moving"
        :variant="removeFromList ? 'secondary' : 'primary'"
        @click="handleMove"
      >
        {{ buttonText }}
      </UiButton>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import type { Wish, WishList } from '~/types'

interface Props {
  modelValue: boolean
  wish: Wish | null
  currentListId?: string | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'move': [wishId: string, newListId: string | null]
}>()

const { lists } = useLists()
const { moveWishToList } = useWishes()

const selectedListId = ref<string | null>(null)
const removeFromList = ref(false)
const moving = ref(false)

// Filter out current list (or show all lists if no current list)
const availableLists = computed(() => {
  if (!props.currentListId) {
    return lists.value
  }
  return lists.value.filter(list => list.id !== props.currentListId)
})

// Check if user has made a selection
const hasSelection = computed(() => {
  return selectedListId.value !== null || removeFromList.value
})

// Dynamic button text
const buttonText = computed(() => {
  if (removeFromList.value) return 'Remove from List'
  if (!props.currentListId) return 'Add to List'
  return 'Move Wish'
})

// Reset selection when modal opens
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    selectedListId.value = null
    removeFromList.value = false
  }
})

function selectList(listId: string | null) {
  if (listId === null) {
    // Selecting "Remove from list"
    selectedListId.value = null
    removeFromList.value = true
  } else {
    selectedListId.value = listId
    removeFromList.value = false
  }
}

async function handleMove() {
  if (!props.wish) return
  if (!hasSelection.value) return

  moving.value = true

  const targetListId = removeFromList.value ? null : selectedListId.value
  const result = await moveWishToList(props.wish.id, targetListId)

  if (result.success) {
    emit('move', props.wish.id, targetListId)
    emit('update:modelValue', false)
  }

  moving.value = false
}
</script>
