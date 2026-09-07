<template>
  <div
    class="border p-6 rounded-2xl transition-all group relative"
    :class="cardClasses"
  >
    <div class="flex justify-between items-start mb-4">
      <div class="overflow-hidden">
        <h3 class="text-2xl font-bold text-white truncate">{{ stock.symbol }}</h3>
        <p class="text-slate-400 text-sm truncate font-medium">{{ stock.name }}</p>
      </div>
      <button
        @click="$emit('remove', stock.symbol)"
        class="text-slate-600 hover:text-rose-500 p-1 transition-colors"
        title="Remove stock"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <div class="flex items-baseline gap-2">
      <span class="text-3xl font-mono font-semibold transition-colors" :class="priceClasses">
        {{ formatPrice(stock.price) }}
      </span>
      <span class="text-slate-500 text-sm">{{ stock.currency }}</span>
    </div>

    <div :class="['flex items-center gap-1 mt-2 font-medium', changeColorClass]">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-4 w-4"
        :class="stock.change >= 0 ? 'translate-y-[-1px]' : 'translate-y-[1px]'"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="3"
          :d="stock.change >= 0 ? 'M5 15l7-7 7 7' : 'M5 9l7 7 7-7'"
        />
      </svg>
      {{ stock.change >= 0 ? '+' : '' }}{{ formatChange(stock.change) }}
      ({{ stock.changePercent ? stock.changePercent.toFixed(2) : '0.00' }}%)
    </div>

    <!-- Alert triggered badges -->
    <div v-if="alertState.sell || alertState.buy" class="mt-4 flex flex-col gap-2">
      <span
        v-if="alertState.sell"
        class="inline-flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/40 text-amber-300 px-3 py-1.5 rounded-full text-xs font-bold tracking-wide animate-pulse"
      >
        <span class="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse"></span>
        ▲ Time to sell — ≥ {{ formatPrice(alertConfig.above ?? 0) }}
      </span>
      <span
        v-if="alertState.buy"
        class="inline-flex items-center gap-1.5 bg-sky-500/15 border border-sky-500/40 text-sky-300 px-3 py-1.5 rounded-full text-xs font-bold tracking-wide animate-pulse"
      >
        <span class="w-1.5 h-1.5 bg-sky-400 rounded-full animate-pulse"></span>
        ▼ Time to buy — ≤ {{ formatPrice(alertConfig.below ?? 0) }}
      </span>
    </div>

    <!-- Configured but not triggered -->
    <div v-else-if="hasAlertConfig" class="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-500 font-medium">
      <span v-if="alertConfig.above != null" class="inline-flex items-center gap-1 bg-slate-800 border border-slate-700 px-2 py-1 rounded-full">
        🔔 Sell ≥ {{ formatPrice(alertConfig.above) }}
      </span>
      <span v-if="alertConfig.below != null" class="inline-flex items-center gap-1 bg-slate-800 border border-slate-700 px-2 py-1 rounded-full">
        🔔 Buy ≤ {{ formatPrice(alertConfig.below) }}
      </span>
    </div>

    <!-- Alert configuration -->
    <div class="mt-4 pt-4 border-t" :class="borderColorClass">
      <button
        @click="toggleEdit"
        class="text-xs font-medium flex items-center gap-1.5 transition-colors"
        :class="editing ? 'text-slate-300' : 'text-slate-400 hover:text-indigo-400'"
      >
        <span>{{ editing ? '✕ Close' : '🔔 Set alert' }}</span>
        <span v-if="!editing && hasAlertConfig" class="w-2 h-2 bg-indigo-500 rounded-full"></span>
      </button>

      <div v-if="editing" class="mt-3 space-y-3">
        <div>
          <label class="text-[11px] font-semibold tracking-widest uppercase text-amber-400/80">Upper alert — sell</label>
          <p class="text-[11px] text-slate-500 mb-1">Triggers when ≥ target price (time to sell)</p>
          <div class="flex gap-2">
            <span class="flex items-center text-slate-500 text-sm px-2 bg-slate-900 border border-slate-800 rounded-lg">$</span>
            <input
              v-model="draftAbove"
              type="number"
              step="0.01"
              min="0"
              placeholder="E.g. 320"
              class="flex-1 bg-slate-900 border border-slate-800 text-white px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm placeholder:text-slate-600"
            />
            <button
v-if="alertConfig?.above != null"
              @click="$emit('clear-alert', stock.symbol, 'above')"
              class="text-xs text-slate-400 hover:text-rose-400 px-2"
              title="Remove upper alert"
            >✕</button>
          </div>
        </div>

        <div>
          <label class="text-[11px] font-semibold tracking-widest uppercase text-sky-400/80">Lower alert — buy</label>
          <p class="text-[11px] text-slate-500 mb-1">Triggers when ≤ target price (time to buy)</p>
          <div class="flex gap-2">
            <span class="flex items-center text-slate-500 text-sm px-2 bg-slate-900 border border-slate-800 rounded-lg">$</span>
            <input
              v-model="draftBelow"
              type="number"
              step="0.01"
              min="0"
              placeholder="E.g. 250"
              class="flex-1 bg-slate-900 border border-slate-800 text-white px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/50 text-sm placeholder:text-slate-600"
            />
            <button
v-if="alertConfig?.below != null"
              @click="$emit('clear-alert', stock.symbol, 'below')"
              class="text-xs text-slate-400 hover:text-rose-400 px-2"
              title="Remove lower alert"
            >✕</button>
          </div>
        </div>

        <div class="flex gap-2 pt-1">
          <button
            @click="save"
            class="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
          >
            Save
          </button>
          <button
            v-if="hasAlertConfig"
            @click="clearAll"
            class="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium px-3 py-2 rounded-lg border border-slate-700 transition-colors"
          >
            Remove
          </button>
        </div>
        <p v-if="error" class="text-xs text-rose-400">{{ error }}</p>
      </div>
    </div>

    <!-- Subtle background glow -->
    <div
      class="absolute -bottom-4 -right-4 w-24 h-24 blur-3xl opacity-10 transition-opacity group-hover:opacity-20 pointer-events-none"
      :class="glowClass"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface StockItem {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  currency: string
  previousClose: number
}

interface AlertConfig {
  above: number | null
  below: number | null
}

interface Props {
  stock: StockItem
  alertConfig: AlertConfig | undefined
}

interface Emits {
  remove: [symbol: string]
  'save-alert': [symbol: string, above: number | null, below: number | null]
  'clear-alert': [symbol: string, type: 'above' | 'below']
  'clear-all-alerts': [symbol: string]
  'edit-alert': [symbol: string]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const editing = ref(false)
const draftAbove = ref('')
const draftBelow = ref('')
const error = ref('')

const formatPrice = (price: number) => {
  if (price == null || isNaN(price)) return '$0.00'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price)
}

const formatChange = (change: number) => {
  if (change == null || isNaN(change)) return '0.00'
  return change.toFixed(2)
}

const hasAlertConfig = computed(() => {
  const cfg = props.alertConfig
  return !!(cfg && (cfg.above != null || cfg.below != null))
})

const alertState = computed(() => {
  const cfg = props.alertConfig
  if (!cfg) return { sell: false, buy: false }
  const price = Number(props.stock.price)
  const sell = cfg.above != null && !isNaN(cfg.above) && price >= cfg.above
  const buy = cfg.below != null && !isNaN(cfg.below) && price <= cfg.below
  return { sell, buy }
})

const cardClasses = computed(() => {
  const { sell, buy } = alertState.value
  if (sell) return 'bg-amber-950/30 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
  if (buy) return 'bg-sky-950/30 border-sky-500/50 shadow-[0_0_20px_rgba(14,165,233,0.15)]'
  return 'bg-slate-900 border-slate-800 hover:border-slate-700'
})

const priceClasses = computed(() => {
  const { sell, buy } = alertState.value
  if (sell) return 'text-amber-400'
  if (buy) return 'text-sky-400'
  return 'text-white'
})

const changeColorClass = computed(() => {
  return props.stock.change >= 0 ? 'text-emerald-400' : 'text-rose-400'
})

const borderColorClass = computed(() => {
  const { sell, buy } = alertState.value
  if (sell) return 'border-amber-500/20'
  if (buy) return 'border-sky-500/20'
  return 'border-slate-800'
})

const glowClass = computed(() => {
  const { sell, buy } = alertState.value
  if (sell) return 'bg-amber-500'
  if (buy) return 'bg-sky-500'
  return props.stock.change >= 0 ? 'bg-emerald-500' : 'bg-rose-500'
})

const toggleEdit = () => {
  if (editing.value) {
    editing.value = false
    draftAbove.value = ''
    draftBelow.value = ''
    error.value = ''
  } else {
    editing.value = true
    const cfg = props.alertConfig
    if (cfg) {
      draftAbove.value = cfg.above != null ? String(cfg.above) : ''
      draftBelow.value = cfg.below != null ? String(cfg.below) : ''
    }
  }
}

  const save = () => {
    const aboveStr = String(draftAbove.value || '').trim()
    const belowStr = String(draftBelow.value || '').trim()
    
    const above = aboveStr === '' ? null : Number(aboveStr)
    const below = belowStr === '' ? null : Number(belowStr)

    if (above != null && (isNaN(above) || above <= 0)) {
      error.value = 'Sell target must be a positive number'
      return
    }
    if (below != null && (isNaN(below) || below <= 0)) {
      error.value = 'Buy target must be a positive number'
      return
    }
    if (above == null && below == null) {
      error.value = 'Enter at least one target price'
      return
    }
    if (above != null && below != null && below >= above) {
      error.value = 'Buy target must be lower than sell target'
      return
    }

    emit('save-alert', props.stock.symbol, above, below)
    editing.value = false
    // Do not clear drafts here to avoid flickers or issues if user re-opens quickly, 
    // but the primary issue was likely state sync.
  }

const clearAll = () => {
  emit('clear-all-alerts', props.stock.symbol)
  editing.value = false
}
</script>

<style scoped>
/* Component-specific styles if needed */
</style>