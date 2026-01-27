<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">My Wishlists</h1>
        <p class="text-gray-500 mt-1">{{ lists.length }} {{ lists.length === 1 ? 'list' : 'lists' }}</p>
      </div>

      <UiButton @click="showCreateModal = true">
        <svg class="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        New List
      </UiButton>
    </div>

    <!-- Lists Grid -->
    <ListsListGrid
      :lists="lists"
      :loading="loading"
      @create="showCreateModal = true"
    />

    <!-- Quick Wishes Section -->
    <div class="mt-12">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-xl font-bold text-gray-900">Quick Wishes</h2>
          <p class="text-gray-500 mt-1">
            {{ unassignedWishes.length }} {{ unassignedWishes.length === 1 ? 'wish' : 'wishes' }} not in any list
          </p>
        </div>

        <UiButton @click="showCreateWishModal = true">
          <svg class="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Wish
        </UiButton>
      </div>

      <!-- Loading State -->
      <div v-if="wishesLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div
          v-for="i in 4"
          :key="i"
          class="bg-white rounded-2xl shadow-soft overflow-hidden animate-pulse"
        >
          <div class="aspect-[4/3] bg-gray-200" />
          <div class="p-4 space-y-3">
            <div class="h-4 bg-gray-200 rounded w-3/4" />
            <div class="h-3 bg-gray-100 rounded w-1/2" />
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="unassignedWishes.length === 0" class="text-center py-12 bg-gray-50 rounded-2xl">
        <div class="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">No quick wishes yet</h3>
        <p class="text-gray-500 mb-4">Add wishes here without assigning them to a list</p>
        <UiButton variant="secondary" @click="showCreateWishModal = true">
          <svg class="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Your First Wish
        </UiButton>
      </div>

      <!-- Wishes Grid -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <WishesWishCard
          v-for="wish in unassignedWishes"
          :key="wish.id"
          :wish="wish"
          @edit="openEditWishModal"
          @delete="openDeleteWishModal"
          @move="openMoveWishModal"
        />
      </div>
    </div>

    <!-- Create List Modal -->
    <UiModal
      v-model="showCreateModal"
      title="Create New Wishlist"
    >
      <ListsListForm
        @submit="handleCreateList"
        @cancel="showCreateModal = false"
      />
    </UiModal>

    <!-- Create Wish Modal -->
    <UiModal
      v-model="showCreateWishModal"
      title="Add New Wish"
      size="lg"
    >
      <WishesWishForm

        @submit="handleCreateWish"
        @cancel="showCreateWishModal = false"
      />
    </UiModal>

    <!-- Edit Wish Modal -->
    <UiModal
      v-model="showEditWishModal"
      title="Edit Wish"
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
      title="Delete Wish"
      size="sm"
    >
      <p class="text-gray-600">
        Are you sure you want to delete "<span class="font-medium">{{ selectedWish?.title }}</span>"? This action cannot be undone.
      </p>
      <template #footer>
        <UiButton variant="secondary" @click="showDeleteWishModal = false">
          Cancel
        </UiButton>
        <UiButton variant="danger" :loading="deleting" @click="handleDeleteWish">
          Delete
        </UiButton>
      </template>
    </UiModal>

    <!-- Move Wish Modal -->
    <WishesWishMoveModal
      v-model="showMoveWishModal"
      :wish="selectedWish"
      :current-list-id="null"
      @move="handleMoveWish"
    />
  </div>
</template>

<script setup lang="ts">
import type { Wish, WishForm, WishListForm } from '~/types'

definePageMeta({
  layout: 'app',
  middleware: 'auth',
})

// Auth
const { user } = useAuth()

// Lists
const { lists, loading, createList } = useLists()

// Unassigned wishes (listId = null)
const unassignedListId = ref<string | null>(null)
const {
  wishes: unassignedWishes,
  loading: wishesLoading,
  createWish,
  updateWish,
  deleteWish,
} = useWishes(unassignedListId)

// List modals
const showCreateModal = ref(false)

// Wish modals
const showCreateWishModal = ref(false)
const showEditWishModal = ref(false)
const showDeleteWishModal = ref(false)
const showMoveWishModal = ref(false)

// Selected wish for operations
const selectedWish = ref<Wish | null>(null)

// Loading states
const deleting = ref(false)

// List handlers
async function handleCreateList(data: WishListForm) {
  const result = await createList(data)

  if (result.success) {
    showCreateModal.value = false
  }
}

// Wish handlers
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

async function handleCreateWish(data: WishForm) {
  const result = await createWish(null, data)
  if (result.success) {
    showCreateWishModal.value = false
  }
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
