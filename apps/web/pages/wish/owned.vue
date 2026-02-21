<template>
  <div>
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <svg class="animate-spin h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    </div>

    <!-- Content -->
    <template v-else>
      <!-- Header -->
      <div class="mb-8">
        <!-- Breadcrumb -->
        <div class="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <NuxtLink to="/wish" class="hover:text-green-600 transition-colors">
            {{ $t('lists.breadcrumb') }}
          </NuxtLink>
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
          <span class="text-gray-900">{{ $t('lists.owned.title') }}</span>
        </div>

        <!-- Title Row -->
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                <Icon name="lucide:package-check" class="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 class="text-2xl font-bold text-gray-900">{{ $t('lists.owned.title') }}</h1>
                <p class="text-gray-500 mt-0.5">{{ $t('lists.owned.description') }}</p>
              </div>
            </div>

            <!-- Meta Info -->
            <div class="flex items-center gap-4 mt-4 text-sm">
              <span class="text-gray-400">{{ $t('dashboard.wishCount', ownedWishes.length) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="ownedWishes.length === 0" class="text-center py-16">
        <div class="w-20 h-20 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-6">
          <Icon name="lucide:package" class="w-10 h-10 text-green-400" />
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ $t('lists.owned.empty.title') }}</h3>
        <p class="text-gray-500 mb-6">{{ $t('lists.owned.empty.description') }}</p>
        <UiButton to="/wish" variant="secondary">
          <Icon name="lucide:arrow-left" class="w-4 h-4 mr-1.5" />
          {{ $t('lists.owned.empty.backButton') }}
        </UiButton>
      </div>

      <!-- Wishes Grid -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <WishesWishCard
          v-for="wish in ownedWishes"
          :key="wish.id"
          :wish="wish"
          @edit="openEditWishModal"
          @delete="openDeleteWishModal"
          @move="openMoveWishModal"
        />
      </div>
    </template>

    <!-- Edit Wish Modal -->
    <UiModal
      v-model="showEditWishModal"
      :title="$t('dashboard.editWish')"
      size="lg"
    >
      <WishesWishForm
        :initial-data="selectedWish || undefined"
        @submit="handleUpdateWish"
        @cancel="showEditWishModal = false"
      />
    </UiModal>

    <!-- Delete Wish Confirmation -->
    <UiModal
      v-model="showDeleteWishModal"
      :title="$t('dashboard.deleteWish')"
      size="sm"
    >
      <p class="text-gray-600">
        {{ $t('dashboard.deleteWishConfirm', { title: selectedWish?.title }) }}
      </p>
      <template #footer>
        <UiButton variant="secondary" @click="showDeleteWishModal = false">
          {{ $t('common.cancel') }}
        </UiButton>
        <UiButton variant="danger" :loading="deleting" @click="handleDeleteWish">
          {{ $t('common.delete') }}
        </UiButton>
      </template>
    </UiModal>

    <!-- Move Wish Modal -->
    <WishesWishMoveModal
      v-model="showMoveWishModal"
      :wish="selectedWish"
      :current-list-id="selectedWish?.listId ?? null"
      @move="handleMoveWish"
    />
  </div>
</template>

<script setup lang="ts">
import type { Wish, WishForm } from '~/types'
import { useOwnedWishes } from '~/composables/useWishes'

definePageMeta({
  layout: 'app-with-sidebar',
  middleware: 'auth',
})

// Set app context to SuperWish
const { setApp } = useAppContext()
onMounted(() => {
  setApp('superwish')
})

// Owned wishes
const { ownedWishes, loading } = useOwnedWishes()

// We need useWishes for update/delete operations
const { updateWish, deleteWish } = useWishes()

// Modals
const showEditWishModal = ref(false)
const showDeleteWishModal = ref(false)
const showMoveWishModal = ref(false)

// Selected wish for operations
const selectedWish = ref<Wish | null>(null)

// Loading states
const deleting = ref(false)

// Wish Handlers
function openEditWishModal(wish: Wish) {
  selectedWish.value = wish
  showEditWishModal.value = true
}

function openDeleteWishModal(wish: Wish) {
  selectedWish.value = wish
  showDeleteWishModal.value = true
}

function openMoveWishModal(wish: Wish) {
  selectedWish.value = wish
  showMoveWishModal.value = true
}

async function handleUpdateWish(data: WishForm) {
  if (!selectedWish.value) return

  const result = await updateWish(selectedWish.value.id, data)
  if (result.success) {
    showEditWishModal.value = false
    selectedWish.value = null
  }
}

async function handleDeleteWish() {
  if (!selectedWish.value) return

  deleting.value = true
  const result = await deleteWish(selectedWish.value.id)

  if (result.success) {
    showDeleteWishModal.value = false
    selectedWish.value = null
  }

  deleting.value = false
}

function handleMoveWish() {
  selectedWish.value = null
}
</script>
