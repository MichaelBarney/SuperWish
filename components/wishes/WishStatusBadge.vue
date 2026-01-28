<template>
  <span
    :class="[
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
      badgeClasses
    ]"
  >
    <span :class="['w-1.5 h-1.5 rounded-full', dotClass]" />
    {{ displayLabel }}
  </span>
</template>

<script setup lang="ts">
import type { WishStatus } from '~/types'
import { getStatusConfig } from '~/types'
import type { Timestamp } from 'firebase/firestore'

interface Props {
  status: WishStatus
  sinceText?: string
  estimatedDelivery?: Date | Timestamp | null
}

const props = defineProps<Props>()
const { t } = useI18n()

const daysUntilDelivery = computed(() => {
  if (!props.estimatedDelivery) return null

  let delivery: Date

  if (props.estimatedDelivery instanceof Date) {
    delivery = props.estimatedDelivery
  } else if (typeof (props.estimatedDelivery as Timestamp).toDate === 'function') {
    delivery = (props.estimatedDelivery as Timestamp).toDate()
  } else if ((props.estimatedDelivery as any).seconds !== undefined) {
    // Handle serialized Firestore Timestamp
    delivery = new Date((props.estimatedDelivery as any).seconds * 1000)
  } else {
    delivery = new Date(props.estimatedDelivery as unknown as string)
  }

  if (isNaN(delivery.getTime())) return null

  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const deliveryDay = new Date(delivery)
  deliveryDay.setHours(0, 0, 0, 0)

  const diffMs = deliveryDay.getTime() - now.getTime()
  return Math.round(diffMs / (1000 * 60 * 60 * 24))
})

const displayLabel = computed(() => {
  const label = t(`statuses.${props.status}`)

  if (props.status === 'wanted' && props.sinceText) {
    return `${label} ${props.sinceText}`
  }

  if (props.status === 'shipping' && daysUntilDelivery.value !== null) {
    const days = daysUntilDelivery.value
    if (days < 0) {
      return t('statuses.late')
    }
    if (days === 0) {
      return t('statuses.arrivingToday')
    }
    if (days === 1) {
      return t('statuses.arrivingTomorrow')
    }
    return t('statuses.arrivingInDays', { days })
  }

  return label
})

const statusConfig = computed(() => getStatusConfig(props.status))

const badgeClasses = computed(() => {
  switch (statusConfig.value.color) {
    case 'blue':
      return 'bg-blue-50 text-blue-700'
    case 'amber':
      return 'bg-amber-50 text-amber-700'
    case 'green':
      return 'bg-green-50 text-green-700'
    case 'purple':
      return 'bg-purple-50 text-purple-700'
    default:
      return 'bg-gray-100 text-gray-600'
  }
})

const dotClass = computed(() => {
  switch (statusConfig.value.color) {
    case 'blue':
      return 'bg-blue-500'
    case 'amber':
      return 'bg-amber-500'
    case 'green':
      return 'bg-green-500'
    case 'purple':
      return 'bg-purple-500'
    default:
      return 'bg-gray-400'
  }
})
</script>
