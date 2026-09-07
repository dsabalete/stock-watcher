<template>
  <div v-if="toast.visible" class="fixed bottom-4 right-4 z-50 animate-slide-in">
    <div
      class="flex items-start gap-3 px-4 py-3 rounded-xl shadow-xl min-w-[300px] max-w-md backdrop-blur-sm"
      :class="toastClasses"
    >
      <div class="flex-1">
        <p class="font-semibold text-white">{{ toast.title }}</p>
        <p v-if="toast.description" class="text-sm text-slate-300 mt-0.5">{{ toast.description }}</p>
      </div>
      <button
        @click="dismiss"
        class="text-slate-400 hover:text-white transition-colors p-1"
        aria-label="Dismiss"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface ToastState {
  visible: boolean
  title: string
  description: string
  type: 'success' | 'error' | 'info' | 'warning'
}

interface Props {
  toast: ToastState
}

interface Emits {
  dismiss: []
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const toastClasses = computed(() => {
  const base = 'border'
  switch (props.toast.type) {
    case 'success':
      return `${base} bg-emerald-900/90 border-emerald-500/30`
    case 'error':
      return `${base} bg-rose-900/90 border-rose-500/30`
    case 'warning':
      return `${base} bg-amber-900/90 border-amber-500/30`
    default:
      return `${base} bg-indigo-900/90 border-indigo-500/30`
  }
})

const dismiss = () => {
  emit('dismiss')
}
</script>

<style scoped>
@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-in {
  animation: slide-in 0.3s ease-out forwards;
}
</style>