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
      :owned-count="ownedWishes.length"
      @create="showCreateModal = true"
    />

    <!-- In Transit Section -->
    <div v-if="shippingWishes.length > 0" class="mt-12">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-xl font-bold text-gray-900">{{ $t('dashboard.inTransit') }}</h2>
          <p class="text-gray-500 mt-1">
            {{ $t('dashboard.inTransitCount', shippingWishes.length) }}
          </p>
        </div>
      </div>

      <!-- Shipping Wishes Carousel -->
      <div class="relative group/carousel">
        <div
          ref="shippingScrollContainer"
          class="flex gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth"
        >
          <WishesWishCard
            v-for="item in shippingWishesWithListName"
            :key="item.wish.id"
            :wish="item.wish"
            :list-name="item.listName"
            compact
            class="flex-shrink-0"
            @edit="openEditShippingWishModal"
            @delete="openDeleteShippingWishModal"
            @move="openMoveShippingWishModal"
          />
        </div>

        <!-- Left Arrow -->
        <button
          v-if="canScrollShippingLeft"
          class="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-gray-900 opacity-0 group-hover/carousel:opacity-100 transition-opacity z-10"
          @click="scrollShippingLeft"
        >
          <Icon name="lucide:chevron-left" class="w-5 h-5" />
        </button>

        <!-- Right Arrow -->
        <button
          v-if="canScrollShippingRight"
          class="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-gray-900 opacity-0 group-hover/carousel:opacity-100 transition-opacity z-10"
          @click="scrollShippingRight"
        >
          <Icon name="lucide:chevron-right" class="w-5 h-5" />
        </button>
      </div>
    </div>

    <!-- Quick Wishes Section -->
    <div class="mt-12">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-xl font-bold text-gray-900">{{ $t('dashboard.quickWishes') }}</h2>
          <p class="text-gray-500 mt-1">
            {{ $t('dashboard.wishCount', filteredQuickWishes.length) }}
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
      <div v-else-if="filteredQuickWishes.length === 0" class="text-center py-12 bg-gray-50 rounded-2xl">
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
          v-for="wish in filteredQuickWishes"
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
import { useOwnedWishes, useShippingWishes } from '~/composables/useWishes'

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

// Owned wishes (for the Owned list card count)
const { ownedWishes } = useOwnedWishes()

// Shipping wishes (for the In Transit section)
const { shippingWishes } = useShippingWishes()
const { t } = useI18n()

// Map shipping wishes to include list names and sort by estimated delivery (closest first)
const shippingWishesWithListName = computed(() => {
  return shippingWishes.value
    .map(wish => ({
      wish,
      listName: wish.listId
        ? lists.value.find(l => l.id === wish.listId)?.name || '?'
        : t('dashboard.quickWishLabel')
    }))
    .sort((a, b) => {
      const dateA = a.wish.estimatedDelivery?.getTime() ?? Infinity
      const dateB = b.wish.estimatedDelivery?.getTime() ?? Infinity
      return dateA - dateB
    })
})

// Filter quick wishes to exclude shipping status
const filteredQuickWishes = computed(() => {
  return unassignedWishes.value.filter(w => w.status !== 'shipping')
})

// Shipping carousel scroll
const shippingScrollContainer = ref<HTMLElement | null>(null)
const canScrollShippingLeft = ref(false)
const canScrollShippingRight = ref(false)

function updateShippingScrollButtons() {
  if (!shippingScrollContainer.value) return
  const { scrollLeft, scrollWidth, clientWidth } = shippingScrollContainer.value
  canScrollShippingLeft.value = scrollLeft > 0
  canScrollShippingRight.value = scrollLeft + clientWidth < scrollWidth - 10
}

function scrollShippingLeft() {
  if (!shippingScrollContainer.value) return
  shippingScrollContainer.value.scrollBy({ left: -200, behavior: 'smooth' })
}

function scrollShippingRight() {
  if (!shippingScrollContainer.value) return
  shippingScrollContainer.value.scrollBy({ left: 200, behavior: 'smooth' })
}

onMounted(() => {
  nextTick(() => {
    updateShippingScrollButtons()
    shippingScrollContainer.value?.addEventListener('scroll', updateShippingScrollButtons)
  })
})

onUnmounted(() => {
  shippingScrollContainer.value?.removeEventListener('scroll', updateShippingScrollButtons)
})

watch(shippingWishes, () => {
  nextTick(updateShippingScrollButtons)
})

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

// Wish handlers (for quick wishes)
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

// Shipping wish handlers (use same modals)
function openEditShippingWishModal(wish: Wish) {
  selectedWish.value = wish
  showEditWishModal.value = true
}

function openDeleteShippingWishModal(wish: Wish) {
  selectedWish.value = wish
  showDeleteWishModal.value = true
}

function openMoveShippingWishModal(wish: Wish) {
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

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
