<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ $t('dashboard.myLists') }}</h1>
        <p class="text-gray-500 mt-1">{{ $t('dashboard.listCount', lists.length) }}</p>
      </div>

      <UiButton @click="showCreateModal = true">
        <Icon name="lucide:plus" class="w-4 h-4 mr-1.5" />
        {{ $t('dashboard.newList') }}
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
          <h2 class="text-xl font-bold text-gray-900">{{ $t('dashboard.quickWishes') }}</h2>
          <p class="text-gray-500 mt-1">
            {{ $t('dashboard.wishCount', unassignedWishes.length) }}
          </p>
        </div>

        <UiButton @click="showCreateWishModal = true">
          <Icon name="lucide:plus" class="w-4 h-4 mr-1.5" />
          {{ $t('dashboard.addWish') }}
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
          <Icon name="lucide:star" class="w-8 h-8 text-gray-400" />
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ $t('wishes.empty.quickTitle') }}</h3>
        <p class="text-gray-500 mb-4">{{ $t('wishes.empty.quickDescription') }}</p>
        <UiButton variant="secondary" @click="showCreateWishModal = true">
          <Icon name="lucide:plus" class="w-4 h-4 mr-1.5" />
          {{ $t('wishes.empty.addFirst') }}
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
      :title="$t('dashboard.createNewWishlist')"
    >
      <ListsListForm
        @submit="handleCreateList"
        @cancel="showCreateModal = false"
      />
    </UiModal>

    <!-- Create Wish Modal -->
    <UiModal
      v-model="showCreateWishModal"
      :title="$t('dashboard.addNewWish')"
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
      :current-list-id="null"
      @move="handleMoveWish"
    />
  </div>
</template>

<script setup lang="ts">
import type { Wish, WishForm, WishListForm } from '~/types'

definePageMeta({
  layout: 'app-with-sidebar',
  middleware: 'auth',
})

// Auth
const { user } = useAuth()

// Set app context to SuperWish
const { setApp } = useAppContext()
onMounted(() => {
  setApp('superwish')
})

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
