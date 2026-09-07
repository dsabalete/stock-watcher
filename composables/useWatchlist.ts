import { ref } from 'vue'

export interface StockItem {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  currency: string
  previousClose: number
}

export interface AlertConfig {
  above: number | null
  below: number | null
}

const stocks = ref<StockItem[]>([])
const alerts = ref<Record<string, AlertConfig>>({})
const loading = ref<boolean>(false)

export const useWatchlist = () => {
  if (typeof window !== 'undefined') {
    const savedStocks = localStorage.getItem('stock-watchlist')
    const savedAlerts = localStorage.getItem('stock-alerts')

    if (savedStocks) {
      stocks.value = JSON.parse(savedStocks).map((s: any) => ({
        ...s,
        price: Number(s.price),
        change: Number(s.change),
        changePercent: Number(s.changePercent),
        previousClose: Number(s.previousClose),
      }))
    }

    if (savedAlerts) {
      const parsed = JSON.parse(savedAlerts)
      const loadedAlerts: Record<string, AlertConfig> = {}
      for (const k of Object.keys(parsed)) {
        const v = parsed[k]
        loadedAlerts[k] = {
          above: v.above != null && !isNaN(Number(v.above)) ? Number(v.above) : null,
          below: v.below != null && !isNaN(Number(v.below)) ? Number(v.below) : null,
        }
      }
      alerts.value = loadedAlerts
    }
  }

  const addStock = async (symbol: string) => {
    if (stocks.value.some((s) => s.symbol === symbol)) return false

    loading.value = true
    try {
      const data = await $fetch<StockItem[]>(`/api/stocks?symbols=${symbol}`)
      if (data && data.length > 0) {
        stocks.value = [...stocks.value, ...data]
        saveWatchlist()
        return true
      }
      return false
    } catch (e) {
      console.error('Add stock error:', e)
      return false
    } finally {
      loading.value = false
    }
  }

  const removeStock = (symbol: string) => {
    stocks.value = stocks.value.filter((s) => s.symbol !== symbol)
    if (alerts.value[symbol]) {
      delete alerts.value[symbol]
      saveAlerts()
    }
    saveWatchlist()
  }

  const toggleAlert = (symbol: string, target: 'above' | 'below', value: number | null) => {
    if (!alerts.value[symbol]) {
      alerts.value[symbol] = { above: null, below: null }
    }
    alerts.value[symbol][target] = value
    saveAlerts()
  }

  const clearAlert = (symbol: string, type: 'above' | 'below') => {
    if (!alerts.value[symbol]) return
    alerts.value[symbol][type] = null
    if (alerts.value[symbol].above == null && alerts.value[symbol].below == null) {
      delete alerts.value[symbol]
    }
    saveAlerts()
  }

  const clearAllAlerts = (symbol: string) => {
    if (!alerts.value[symbol]) return
    delete alerts.value[symbol]
    saveAlerts()
  }

  const saveWatchlist = () => {
    localStorage.setItem('stock-watchlist', JSON.stringify(stocks.value))
  }

  const saveAlerts = () => {
    console.log('Saving alerts:', alerts.value)
    if (typeof window !== 'undefined') {
      localStorage.setItem('stock-alerts', JSON.stringify(alerts.value))
      console.log('Alerts saved to localStorage')
    } else {
      console.warn('localStorage not available (not in window context)')
    }
  }

  const updateStock = (symbol: string, updates: Partial<StockItem>) => {
    const idx = stocks.value.findIndex((s) => s.symbol === symbol)
    if (idx >= 0) {
      stocks.value[idx] = { ...stocks.value[idx], ...updates }
      saveWatchlist()
    }
  }

  const setStockPrice = (symbol: string, price: number, change: number, changePercent: number) => {
    updateStock(symbol, { price, change, changePercent })
  }

  return {
    stocks,
    alerts,
    loading,
    addStock,
    removeStock,
    toggleAlert,
    clearAlert,
    clearAllAlerts,
    saveWatchlist,
    saveAlerts,
    setStockPrice,
  }
}