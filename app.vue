<template>
  <div class="min-h-screen bg-slate-950 text-slate-50 p-4 md:p-8 font-sans">
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <header class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 class="text-4xl font-bold tracking-tight text-white">
            Stock<span class="text-indigo-500">Watcher</span>
          </h1>
          <p class="text-slate-400 mt-1">Real-time market monitoring</p>
        </div>

        <div class="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <StockSearch @add-stock="handleAddStock" :loading="loading" />
          <div class="flex items-center gap-3">
            <button @click="refreshAll" :disabled="loading"
              class="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
              Refresh
            </button>
          </div>
        </div>
      </header>

      <!-- Stock Grid -->
      <ClientOnly>
        <div v-if="stocks.length === 0 && !loading" class="text-center py-20">
          <div class="text-slate-600 text-6xl mb-4">📈</div>
          <p class="text-slate-400 text-xl">Your watchlist is empty. Start adding some symbols!</p>
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StockCard v-for="stock in stocks" :key="stock.symbol" :stock="stock" :alert-config="alerts[stock.symbol]"
            @remove="removeStock" @save-alert="saveAlert" @clear-alert="clearAlert" @clear-all-alerts="clearAllAlerts"
            @edit-alert="editAlert" />
        </div>
      </ClientOnly>
    </div>

    <!-- Toast Container -->
    <ToastContainer :toast="toast" @dismiss="dismissToast" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const { stocks, alerts, loading, addStock, removeStock, setStockPrice, saveAlerts, toggleAlert } = useWatchlist()
const { requestPermission, hasPermission, checkAndNotify } = useBrowserNotifications()

// Toast state
const toast = ref<{
  visible: boolean
  title: string
  description: string
  type: 'success' | 'error' | 'info' | 'warning'
}>({
  visible: false,
  title: '',
  description: '',
  type: 'info',
})

const showToast = (params: typeof toast.value) => {
  toast.value = { ...params, visible: true }
}

const dismissToast = () => {
  toast.value = { visible: false, title: '', description: '', type: 'info' }
}

const refreshAll = async () => {
  if (stocks.value.length === 0) return
  const symbolString = stocks.value.map(s => s.symbol).join(',')
  try {
    const data = await $fetch<typeof stocks.value>(`/api/stocks?symbols=${symbolString}`)
    if (data && data.length > 0) {
      data.forEach(item => {
        setStockPrice(item.symbol, item.price, item.change, item.changePercent)
      })
      showToast({ title: 'Refreshed', description: 'Watchlist updated', type: 'success' })
    }
  } catch (e) {
    console.error('Refresh failed:', e)
    showToast({ title: 'Error', description: 'Failed to refresh data', type: 'error' })
  }
}

onMounted(async () => {
  if (stocks.value.length === 0) {
    const defaults = ['INTC.US', 'AMD.US', 'NVDA.US', 'DUOL.US']
    await addStock(defaults[0])
    await addStock(defaults[1])
    await addStock(defaults[2])
    await addStock(defaults[3])
  }
  if (hasPermission.value === false) {
    await requestPermission()
  }
})

const handleAddStock = async (symbol: string) => {
  const success = await addStock(symbol)
  if (success) {
    showToast({ title: 'Added', description: `${symbol} added to watchlist`, type: 'success' })
  } else {
    showToast({ title: 'Error', description: `Could not find ${symbol}`, type: 'error' })
  }
}

const saveAlert = (symbol: string, above: number | null, below: number | null) => {
  alerts.value[symbol] = { above, below }
  saveAlerts()
  showToast({ title: 'Alert Saved', description: 'Price targets updated', type: 'success' })
}

const clearAlert = (symbol: string, type: 'above' | 'below') => {
  if (!alerts.value[symbol]) return
  const updated = { ...alerts.value[symbol], [type]: null }
  if (updated.above == null && updated.below == null) {
    const { [symbol]: _, ...rest } = alerts.value
    alerts.value = rest
  } else {
    alerts.value = { ...alerts.value, [symbol]: updated }
  }
  saveAlerts()
  showToast({ title: 'Alert Removed', description: '', type: 'info' })
}

const clearAllAlerts = (symbol: string) => {
  const { [symbol]: _, ...rest } = alerts.value
  alerts.value = rest
  saveAlerts()
  showToast({ title: 'Alerts Cleared', description: 'All targets removed', type: 'info' })
}

const editAlert = (symbol: string) => {
  // handled by StockCard component
}
</script>

<style scoped>
/* Component-specific styles if needed */
</style>