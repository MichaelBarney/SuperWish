<template>
  <Page>
    <ActionBar title="SuperTask">
      <ActionItem
        ios.position="right"
        android.position="actionBar"
        @tap="handleSignOut"
      >
        <Label text="Sign Out" style="color: white; font-size: 14;" />
      </ActionItem>
    </ActionBar>

    <GridLayout rows="auto, *, auto">
      <!-- Tab bar -->
      <SegmentedBar
        row="0"
        :items="tabItems"
        :selectedIndex="selectedTabIndex"
        @selectedIndexChanged="onTabChange"
      />

      <!-- Main content area -->
      <GridLayout row="1" rows="*, auto">
        <!-- Loading state -->
        <ActivityIndicator
          v-if="loading"
          row="0"
          busy="true"
          class="loading"
          verticalAlignment="center"
          horizontalAlignment="center"
        />

        <!-- Empty state -->
        <Label
          v-else-if="displayedActiveTasks.length === 0 && displayedCompletedTasks.length === 0"
          row="0"
          :text="emptyStateText"
          class="empty-state"
          textWrap="true"
        />

        <!-- Task list -->
        <ScrollView v-else row="0">
          <StackLayout>
            <!-- Active tasks -->
            <StackLayout v-for="task in displayedActiveTasks" :key="task.id">
              <TaskItemNative
                :task="task"
                :allTasks="tasks"
                @toggle="handleToggle"
                @tap="handleTaskTap"
              />
            </StackLayout>

            <!-- Completed section (collapsible) -->
            <GridLayout
              v-if="displayedCompletedTasks.length > 0"
              columns="auto, *"
              class="section-header"
              @tap="completedExpanded = !completedExpanded"
            >
              <Label col="0" :text="completedExpanded ? '▾' : '▸'" style="margin-right: 6;" />
              <Label col="1" :text="`Completed (${displayedCompletedTasks.length})`" />
            </GridLayout>

            <StackLayout v-if="completedExpanded">
              <StackLayout v-for="task in displayedCompletedTasks" :key="task.id">
                <TaskItemNative
                  :task="task"
                  :allTasks="tasks"
                  @toggle="handleToggle"
                  @tap="handleTaskTap"
                />
              </StackLayout>
            </StackLayout>
          </StackLayout>
        </ScrollView>
      </GridLayout>

      <!-- Quick add bar -->
      <TaskQuickAddNative
        row="2"
        :currentTimeHorizon="currentTabHorizon"
        @add="handleQuickAdd"
      />
    </GridLayout>
  </Page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'nativescript-vue'
import { Dialogs } from '@nativescript/core'
import { useTasks } from '../composables/useTasks'
import type { Task, TaskTimeHorizon, TaskEstimatedTime } from '@superwish/shared'
import TaskItemNative from '../components/TaskItemNative.vue'
import TaskQuickAddNative from '../components/TaskQuickAddNative.vue'
import { getFirebaseAuth } from '../firebase'

const {
  tasks,
  loading,
  inboxTasks,
  todayHorizonTasks,
  thisWeekTasks,
  thisMonthTasks,
  longTermTasks,
  createTask,
  toggleTaskComplete,
  updateTaskTimeHorizon,
  updateTaskEstimatedTime,
  deleteTask,
  subscribeToTasks,
  unsubscribeFromTasks,
} = useTasks()

const selectedTabIndex = ref(0)
const completedExpanded = ref(false)

const tabItems = [
  { title: 'Inbox' },
  { title: 'Today' },
  { title: 'Week' },
  { title: 'Month' },
  { title: 'Later' },
]

const tabHorizons: (TaskTimeHorizon | null)[] = [null, 'today', 'this_week', 'this_month', 'long_term']

const currentTabHorizon = computed((): TaskTimeHorizon | null => {
  return tabHorizons[selectedTabIndex.value] ?? null
})

const currentTabTasks = computed((): Task[] => {
  switch (selectedTabIndex.value) {
    case 0: return inboxTasks.value as Task[]
    case 1: return todayHorizonTasks.value as Task[]
    case 2: return thisWeekTasks.value as Task[]
    case 3: return thisMonthTasks.value as Task[]
    case 4: return longTermTasks.value as Task[]
    default: return []
  }
})

const displayedActiveTasks = computed(() =>
  currentTabTasks.value.filter(t => !t.completed)
)

const displayedCompletedTasks = computed(() =>
  currentTabTasks.value.filter(t => t.completed)
)

const emptyStateText = computed(() => {
  const labels = ['No tasks in inbox', 'No tasks for today', 'No tasks this week', 'No tasks this month', 'No long-term tasks']
  return labels[selectedTabIndex.value] || 'No tasks'
})

onMounted(() => {
  subscribeToTasks()
})

onUnmounted(() => {
  unsubscribeFromTasks()
})

function onTabChange(event: any) {
  selectedTabIndex.value = event.value ?? event.object?.selectedIndex ?? 0
  completedExpanded.value = false
}

async function handleToggle(task: Task) {
  const result = await toggleTaskComplete(task.id, !task.completed)
  if (!result.success && result.error) {
    Dialogs.alert({
      title: 'Cannot complete task',
      message: result.error,
      okButtonText: 'OK',
    })
  }
}

async function handleTaskTap(task: Task) {
  const actions = ['Set Time Horizon', 'Set Estimated Time', 'Delete Task', 'Cancel']
  const result = await Dialogs.action({
    title: task.title,
    cancelButtonText: 'Cancel',
    actions: ['Set Time Horizon', 'Set Estimated Time', 'Delete Task'],
  })

  if (result === 'Set Time Horizon') {
    await showTimeHorizonPicker(task)
  } else if (result === 'Set Estimated Time') {
    await showEstimatedTimePicker(task)
  } else if (result === 'Delete Task') {
    await handleDeleteTask(task)
  }
}

async function showTimeHorizonPicker(task: Task) {
  const options: { label: string; value: TaskTimeHorizon | null }[] = [
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'this_week' },
    { label: 'This Month', value: 'this_month' },
    { label: 'Long Term', value: 'long_term' },
    { label: 'Remove', value: null },
  ]

  const result = await Dialogs.action({
    title: 'Set Time Horizon',
    cancelButtonText: 'Cancel',
    actions: options.map(o => o.label),
  })

  const selected = options.find(o => o.label === result)
  if (selected !== undefined) {
    await updateTaskTimeHorizon(task.id, selected.value)
  }
}

async function showEstimatedTimePicker(task: Task) {
  const options: { label: string; value: TaskEstimatedTime | null }[] = [
    { label: '5 min', value: '5min' },
    { label: '12 min (pomodoro)', value: '12min' },
    { label: '25 min (pomodoro)', value: '25min' },
    { label: '1h+', value: '1h_plus' },
    { label: 'Remove', value: null },
  ]

  const result = await Dialogs.action({
    title: 'Set Estimated Time',
    cancelButtonText: 'Cancel',
    actions: options.map(o => o.label),
  })

  const selected = options.find(o => o.label === result)
  if (selected !== undefined) {
    await updateTaskEstimatedTime(task.id, selected.value)
  }
}

async function handleDeleteTask(task: Task) {
  const confirmed = await Dialogs.confirm({
    title: 'Delete Task',
    message: `Are you sure you want to delete "${task.title}"?`,
    okButtonText: 'Delete',
    cancelButtonText: 'Cancel',
  })

  if (confirmed) {
    await deleteTask(task.id)
  }
}

async function handleQuickAdd(title: string) {
  if (!title.trim()) return

  await createTask({
    title: title.trim(),
    description: '',
    dueDate: '',
    questId: '',
    subQuestId: '',
    tripId: '',
    destinationId: '',
    accommodationId: '',
    experienceId: '',
    wishId: '',
    timeHorizon: currentTabHorizon.value || '',
    estimatedTime: '',
    recurrence: '',
    blockedByTaskIds: [],
  })
}

async function handleSignOut() {
  const confirmed = await Dialogs.confirm({
    title: 'Sign Out',
    message: 'Are you sure you want to sign out?',
    okButtonText: 'Sign Out',
    cancelButtonText: 'Cancel',
  })

  if (confirmed) {
    unsubscribeFromTasks()
    await getFirebaseAuth().signOut()
    // Auth state listener in LoginView will handle navigation
    const Frame = require('@nativescript/core').Frame
    const LoginView = require('./LoginView.vue').default
    Frame.topmost()?.navigate({
      create: () => {
        const { createApp } = require('nativescript-vue')
        return createApp(LoginView)
      },
      clearHistory: true,
    })
  }
}
</script>
