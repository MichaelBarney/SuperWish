<template>
  <div>
    <!-- Loading State -->
    <div v-if="listsLoading" class="flex items-center justify-center py-20">
      <svg class="animate-spin h-8 w-8 text-accent-500" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    </div>

    <!-- List Not Found -->
    <div v-else-if="!list" class="text-center py-20">
      <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h2 class="text-xl font-semibold text-gray-900 mb-2">{{ $t('lists.notFound.title') }}</h2>
      <p class="text-gray-500 mb-6">{{ $t('lists.notFound.description') }}</p>
      <UiButton to="/dashboard">
        {{ $t('lists.notFound.backButton') }}
      </UiButton>
    </div>

    <!-- List Content -->
    <template v-else>
      <!-- Header -->
      <div class="mb-8">
        <!-- Breadcrumb -->
        <div class="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <NuxtLink to="/dashboard" class="hover:text-accent-600 transition-colors">
            {{ $t('lists.breadcrumb') }}
          </NuxtLink>
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
          <span class="text-gray-900">{{ list.name }}</span>
        </div>

        <!-- Title Row -->
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <h1 class="text-2xl font-bold text-gray-900">{{ list.name }}</h1>
            <p v-if="list.description" class="text-gray-500 mt-1">{{ list.description }}</p>

            <!-- Meta Info -->
            <div class="flex items-center gap-4 mt-3 text-sm">
              <div v-if="list.deadline" class="flex items-center gap-1.5 text-gray-500">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span :class="isOverdue ? 'text-red-500' : ''">{{ formattedDeadline }}</span>
              </div>
              <div v-if="list.location" class="flex items-center gap-1.5 text-gray-500">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <span>{{ list.location }}</span>
              </div>
              <span class="text-gray-400">{{ $t('dashboard.wishCount', wishes.length) }}</span>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <UiButton variant="ghost" @click="showEditListModal = true">
              <svg class="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {{ $t('common.edit') }}
            </UiButton>
            <UiButton variant="danger" @click="showDeleteListModal = true">
              <svg class="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {{ $t('common.delete') }}
            </UiButton>
            <UiButton @click="showCreateWishModal = true">
              <svg class="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              {{ $t('dashboard.addWish') }}
            </UiButton>
          </div>
        </div>
      </div>

      <!-- Wishes Grid -->
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
      <div v-else-if="wishes.length === 0" class="text-center py-16">
        <div class="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-6">
          <svg class="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ $t('wishes.empty.title') }}</h3>
        <p class="text-gray-500 mb-6">{{ $t('wishes.empty.description') }}</p>
        <UiButton @click="showCreateWishModal = true">
          <svg class="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          {{ $t('wishes.empty.addFirst') }}
        </UiButton>
      </div>

      <!-- Wishes Grid -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <WishesWishCard
          v-for="wish in wishes"
          :key="wish.id"
          :wish="wish"
          @edit="openEditWishModal"
          @delete="openDeleteWishModal"
          @move="openMoveWishModal"
        />
      </div>
    </template>

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
      :current-list-id="listId"
      @move="handleMoveWish"
    />

    <!-- Edit List Modal -->
    <UiModal
      v-model="showEditListModal"
      :title="$t('lists.editList')"
    >
      <ListsListForm
        :initial-data="list || undefined"
        @submit="handleUpdateList"
        @cancel="showEditListModal = false"
      />
    </UiModal>

    <!-- Delete List Confirmation -->
    <UiModal
      v-model="showDeleteListModal"
      :title="$t('lists.deleteList')"
      size="sm"
    >
      <p class="text-gray-600">
        {{ $t('lists.deleteListConfirm', { name: list?.name }) }}
      </p>
      <template #footer>
        <UiButton variant="secondary" @click="showDeleteListModal = false">
          {{ $t('common.cancel') }}
        </UiButton>
        <UiButton variant="danger" :loading="deletingList" @click="handleDeleteList">
          {{ $t('lists.deleteList') }}
        </UiButton>
      </template>
    </UiModal>
  </div>
</template>

<script setup lang="ts">
import type { Wish, WishForm, WishListForm } from '~/types'

definePageMeta({
  layout: 'app-with-sidebar',
  middleware: 'auth',
})

const route = useRoute()
const { locale } = useI18n()
const listId = computed(() => route.params.id as string)

// User
const { user } = useAuth()

// Set app context to SuperWish
const { setApp } = useAppContext()
onMounted(() => {
  setApp('superwish')
})

// Lists
const { lists, loading: listsLoading, getListById, updateList, deleteList } = useLists()
const list = computed(() => getListById(listId.value))

// Wishes
const { wishes, loading: wishesLoading, createWish, updateWish, deleteWish } = useWishes(listId)

// Modals
const showCreateWishModal = ref(false)
const showEditWishModal = ref(false)
const showDeleteWishModal = ref(false)
const showMoveWishModal = ref(false)
const showEditListModal = ref(false)
const showDeleteListModal = ref(false)

// Selected wish for operations
const selectedWish = ref<Wish | null>(null)

// Loading states
const deleting = ref(false)
const deletingList = ref(false)

// Computed
const isOverdue = computed(() => {
  if (!list.value?.deadline) return false
  const deadline = list.value.deadline instanceof Date
    ? list.value.deadline
    : new Date(list.value.deadline)
  return deadline < new Date()
})

const formattedDeadline = computed(() => {
  if (!list.value?.deadline) return ''
  const deadline = list.value.deadline instanceof Date
    ? list.value.deadline
    : new Date(list.value.deadline)
  const dateLocale = locale.value === 'pt-BR' ? 'pt-BR' : 'en-US'
  return deadline.toLocaleDateString(dateLocale, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
})

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

async function handleCreateWish(data: WishForm) {
  const result = await createWish(listId.value, data)
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

// List Handlers
async function handleUpdateList(data: WishListForm) {
  const result = await updateList(listId.value, data)
  if (result.success) {
    showEditListModal.value = false
  }
}

async function handleDeleteList() {
  deletingList.value = true
  const result = await deleteList(listId.value)

  if (result.success) {
    navigateTo('/dashboard')
  }

  deletingList.value = false
}
</script>
