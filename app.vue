<template>
  <div class="min-h-screen bg-slate-950 text-slate-50 p-4 md:p-8 font-sans">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <header class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
        <div>
          <h1 class="text-4xl font-bold tracking-tight text-white">
            Stock<span class="text-indigo-500">Watcher</span>
          </h1>
          <p class="text-slate-400 mt-1">Real-time market monitoring</p>
        </div>
        
        <div class="flex gap-2">
          <input 
            v-model="newSymbol" 
            @keyup.enter="addStock"
            type="text" 
            placeholder="Add symbol (e.g. AAPL)" 
            class="bg-slate-900 border border-slate-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all w-full md:w-64"
          />
          <button 
            @click="addStock" 
            class="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-colors active:scale-95"
          >
            Add
          </button>
        </div>
      </header>

      <!-- Stock Grid -->
      <div v-if="stocks.length === 0" class="text-center py-20">
        <div class="text-slate-600 text-6xl mb-4">📈</div>
        <p class="text-slate-400 text-xl">Your watchlist is empty. Start adding some symbols!</p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div 
          v-for="stock in stocks" 
          :key="stock.symbol" 
          class="border p-6 rounded-2xl transition-all group relative overflow-hidden"
          :class="getCardClasses(stock)"
        >
          <div class="flex justify-between items-start mb-4">
            <div class="overflow-hidden">
              <h3 class="text-2xl font-bold text-white truncate">{{ stock.symbol }}</h3>
              <p class="text-slate-400 text-sm truncate font-medium">{{ stock.name }}</p>
            </div>
            <button
              @click="removeStock(stock.symbol)"
              class="text-slate-600 hover:text-rose-500 p-1 transition-colors"
              title="Remove stock"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-mono font-semibold transition-colors" :class="getPriceClasses(stock)">
              {{ formatPrice(stock.price) }}
            </span>
            <span class="text-slate-500 text-sm">{{ stock.currency }}</span>
          </div>

          <div 
            :class="stock.change >= 0 ? 'text-emerald-400' : 'text-rose-400'" 
            class="flex items-center gap-1 mt-2 font-medium"
          >
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
            {{ stock.change >= 0 ? '+' : '' }}{{ stock.change ? stock.change.toFixed(2) : '0.00' }}
            ({{ stock.changePercent ? stock.changePercent.toFixed(2) : '0.00' }}%)
          </div>

          <!-- Alert triggered badges -->
          <div v-if="getAlertState(stock).sell || getAlertState(stock).buy" class="mt-4 flex flex-col gap-2">
            <span 
              v-if="getAlertState(stock).sell" 
              class="inline-flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/40 text-amber-300 px-3 py-1.5 rounded-full text-xs font-bold tracking-wide animate-pulse"
            >
              <span class="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse"></span>
              ▲ Time to sell — ≥ {{ formatPrice(alerts[stock.symbol]?.above) }}
            </span>
            <span 
              v-if="getAlertState(stock).buy" 
              class="inline-flex items-center gap-1.5 bg-sky-500/15 border border-sky-500/40 text-sky-300 px-3 py-1.5 rounded-full text-xs font-bold tracking-wide animate-pulse"
            >
              <span class="w-1.5 h-1.5 bg-sky-400 rounded-full animate-pulse"></span>
              ▼ Time to buy — ≤ {{ formatPrice(alerts[stock.symbol]?.below) }}
            </span>
          </div>
          <!-- Configured but not triggered -->
          <div v-else-if="hasAlertConfig(stock.symbol)" class="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-500 font-medium">
            <span v-if="alerts[stock.symbol]?.above != null" class="inline-flex items-center gap-1 bg-slate-800 border border-slate-700 px-2 py-1 rounded-full">
              🔔 Sell ≥ {{ formatPrice(alerts[stock.symbol].above) }}
            </span>
            <span v-if="alerts[stock.symbol]?.below != null" class="inline-flex items-center gap-1 bg-slate-800 border border-slate-700 px-2 py-1 rounded-full">
              🔔 Buy ≤ {{ formatPrice(alerts[stock.symbol].below) }}
            </span>
          </div>

          <!-- Alert configuration -->
          <div class="mt-4 pt-4 border-t" :class="getAlertState(stock).sell ? 'border-amber-500/20' : getAlertState(stock).buy ? 'border-sky-500/20' : 'border-slate-800'">
            <button
              @click="toggleAlertEdit(stock.symbol)"
              class="text-xs font-medium flex items-center gap-1.5 transition-colors"
              :class="isEditing(stock.symbol) ? 'text-slate-300' : 'text-slate-400 hover:text-indigo-400'"
            >
              <span>{{ isEditing(stock.symbol) ? '✕ Close' : '🔔 Set alert' }}</span>
              <span v-if="!isEditing(stock.symbol) && hasAlertConfig(stock.symbol)" class="w-2 h-2 bg-indigo-500 rounded-full"></span>
            </button>

            <div v-if="isEditing(stock.symbol)" class="mt-3 space-y-3">
              <div>
                <label class="text-[11px] font-semibold tracking-widest uppercase text-amber-400/80">Upper alert — sell</label>
                <p class="text-[11px] text-slate-500 mb-1">Triggers when ≥ target price (time to sell)</p>
                <div class="flex gap-2">
                  <span class="flex items-center text-slate-500 text-sm px-2 bg-slate-900 border border-slate-800 rounded-lg">$</span>
                  <input
                    v-model="alertDrafts[stock.symbol].above"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="E.g. 320"
                    class="flex-1 bg-slate-900 border border-slate-800 text-white px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm placeholder:text-slate-600"
                  />
                  <button
                    v-if="alerts[stock.symbol]?.above != null"
                    @click="clearSingleAlert(stock.symbol, 'above')"
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
                    v-model="alertDrafts[stock.symbol].below"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="E.g. 250"
                    class="flex-1 bg-slate-900 border border-slate-800 text-white px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/50 text-sm placeholder:text-slate-600"
                  />
                  <button
                    v-if="alerts[stock.symbol]?.below != null"
                    @click="clearSingleAlert(stock.symbol, 'below')"
                    class="text-xs text-slate-400 hover:text-rose-400 px-2"
                    title="Remove lower alert"
                  >✕</button>
                </div>
              </div>

              <div class="flex gap-2 pt-1">
                <button
                  @click="saveAlert(stock.symbol)"
                  class="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                >
                  Save
                </button>
                <button
                  v-if="hasAlertConfig(stock.symbol)"
                  @click="clearAlerts(stock.symbol)"
                  class="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium px-3 py-2 rounded-lg border border-slate-700 transition-colors"
                >
                  Remove
                </button>
              </div>
              <p v-if="alertErrors[stock.symbol]" class="text-xs text-rose-400">{{ alertErrors[stock.symbol] }}</p>
            </div>
          </div>

          <!-- Subtle background glow -->
          <div 
            class="absolute -bottom-4 -right-4 w-24 h-24 blur-3xl opacity-10 transition-opacity group-hover:opacity-20 pointer-events-none" 
            :class="getGlowClass(stock)"
          ></div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
const newSymbol = ref('');
const stocks = ref([]);
const isLoading = ref(false);

// Alerts: { [symbol]: { above: number|null, below: number|null } }
const alerts = ref({});
const alertDrafts = ref({});
const editingAlerts = ref(new Set());
const alertErrors = ref({});

const formatPrice = (price) => {
  if (price == null || isNaN(price)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
};

const fetchAllStocks = async (symbols) => {
  if (symbols.length === 0) return [];
  try {
    const symbolString = symbols.join(',');
    const data = await $fetch(`/api/stocks?symbols=${symbolString}`);
    return data;
  } catch (e) {
    console.error('Error fetching batch stocks:', e);
    return [];
  }
};

const saveWatchlist = () => {
  localStorage.setItem('stock-watchlist', JSON.stringify(stocks.value.map(s => s.symbol)));
};

const saveAlerts = () => {
  localStorage.setItem('stock-alerts', JSON.stringify(alerts.value));
};

const loadAlerts = () => {
  try {
    const raw = localStorage.getItem('stock-alerts');
    if (raw) {
      const parsed = JSON.parse(raw);
      // Normalize to ensure numbers or null
      for (const k of Object.keys(parsed)) {
        const v = parsed[k];
        parsed[k] = {
          above: v.above != null && !isNaN(Number(v.above)) ? Number(v.above) : null,
          below: v.below != null && !isNaN(Number(v.below)) ? Number(v.below) : null,
        };
      }
      alerts.value = parsed;
    }
  } catch (e) {
    console.error('Failed to load alerts', e);
    alerts.value = {};
  }
  // Init drafts
  for (const sym of Object.keys(alerts.value)) {
    alertDrafts.value[sym] = {
      above: alerts.value[sym].above != null ? String(alerts.value[sym].above) : '',
      below: alerts.value[sym].below != null ? String(alerts.value[sym].below) : '',
    };
  }
};

const loadWatchlist = async () => {
  const saved = localStorage.getItem('stock-watchlist');
  let symbols = [];
  
  if (saved) {
    symbols = JSON.parse(saved);
  } else {
    // EODHD requires the .Exchange suffix (e.g. .US)
    symbols = ['AAPL.US', 'MSFT.US', 'GOOGL.US', 'TSLA.US'];
  }

  isLoading.value = true;
  const data = await fetchAllStocks(symbols);
  stocks.value = data;
  isLoading.value = false;
};

const addStock = async () => {
  let symbol = newSymbol.value.trim().toUpperCase();
  if (!symbol) return;

  // Auto-append .US if not present for convenience
  if (!symbol.includes('.')) {
    symbol += '.US';
  }

  if (stocks.value.some(s => s.symbol === symbol)) {
    alert('Stock already in watchlist');
    return;
  }

  isLoading.value = true;
  const currentSymbols = [...stocks.value.map(s => s.symbol), symbol];
  const data = await fetchAllStocks(currentSymbols);
  
  if (data && data.length > 0) {
    stocks.value = data;
    newSymbol.value = '';
    saveWatchlist();
  } else {
    alert(`Could not find stock symbol: ${symbol}`);
  }
  isLoading.value = false;
};

const removeStock = (symbol) => {
  stocks.value = stocks.value.filter(s => s.symbol !== symbol);
  saveWatchlist();
  // Clean alert state
  if (alerts.value[symbol]) {
    delete alerts.value[symbol];
    saveAlerts();
  }
  if (alertDrafts.value[symbol]) delete alertDrafts.value[symbol];
  editingAlerts.value.delete(symbol);
  if (alertErrors.value[symbol]) delete alertErrors.value[symbol];
};

// Alert helpers
const getAlertState = (stock) => {
  const cfg = alerts.value[stock.symbol];
  if (!cfg) return { sell: false, buy: false };
  const price = Number(stock.price);
  const sell = cfg.above != null && !isNaN(cfg.above) && price >= cfg.above;
  const buy = cfg.below != null && !isNaN(cfg.below) && price <= cfg.below;
  return { sell, buy };
};

const hasAlertConfig = (symbol) => {
  const cfg = alerts.value[symbol];
  return !!(cfg && (cfg.above != null || cfg.below != null));
};

const isEditing = (symbol) => editingAlerts.value.has(symbol);

const toggleAlertEdit = (symbol) => {
  if (editingAlerts.value.has(symbol)) {
    editingAlerts.value.delete(symbol);
  } else {
    editingAlerts.value.add(symbol);
    if (!alertDrafts.value[symbol]) {
      alertDrafts.value[symbol] = { above: '', below: '' };
    }
    // Sync draft with current alert values when opening
    const cfg = alerts.value[symbol];
    if (cfg) {
      alertDrafts.value[symbol] = {
        above: cfg.above != null ? String(cfg.above) : '',
        below: cfg.below != null ? String(cfg.below) : '',
      };
    }
    if (alertErrors.value[symbol]) delete alertErrors.value[symbol];
  }
};

const saveAlert = (symbol) => {
  const draft = alertDrafts.value[symbol] || { above: '', below: '' };
  let above = draft.above.trim() === '' ? null : Number(draft.above);
  let below = draft.below.trim() === '' ? null : Number(draft.below);

  // Validation
  if (above != null && (isNaN(above) || above <= 0)) {
    alertErrors.value[symbol] = 'Sell target must be a positive number';
    return;
  }
  if (below != null && (isNaN(below) || below <= 0)) {
    alertErrors.value[symbol] = 'Buy target must be a positive number';
    return;
  }
  if (above == null && below == null) {
    alertErrors.value[symbol] = 'Enter at least one target price';
    return;
  }
  if (above != null && below != null && below >= above) {
    alertErrors.value[symbol] = 'Buy target must be lower than sell target';
    return;
  }

  alerts.value[symbol] = { above, below };
  // Remove entry if both null (should not happen due to validation above)
  if (above == null && below == null) {
    delete alerts.value[symbol];
  }
  saveAlerts();
  editingAlerts.value.delete(symbol);
  if (alertErrors.value[symbol]) delete alertErrors.value[symbol];
};

const clearAlerts = (symbol) => {
  delete alerts.value[symbol];
  if (alertDrafts.value[symbol]) {
    alertDrafts.value[symbol] = { above: '', below: '' };
  }
  saveAlerts();
  editingAlerts.value.delete(symbol);
  if (alertErrors.value[symbol]) delete alertErrors.value[symbol];
};

const clearSingleAlert = (symbol, type) => {
  if (!alerts.value[symbol]) return;
  alerts.value[symbol][type] = null;
  if (alerts.value[symbol].above == null && alerts.value[symbol].below == null) {
    delete alerts.value[symbol];
  }
  if (alertDrafts.value[symbol]) {
    alertDrafts.value[symbol][type] = '';
  }
  saveAlerts();
  if (alertErrors.value[symbol]) delete alertErrors.value[symbol];
};

const getCardClasses = (stock) => {
  const { sell, buy } = getAlertState(stock);
  if (sell) return 'bg-amber-950/30 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.15)]';
  if (buy) return 'bg-sky-950/30 border-sky-500/50 shadow-[0_0_20px_rgba(14,165,233,0.15)]';
  return 'bg-slate-900 border-slate-800 hover:border-slate-700';
};

const getPriceClasses = (stock) => {
  const { sell, buy } = getAlertState(stock);
  if (sell) return 'text-amber-400';
  if (buy) return 'text-sky-400';
  return 'text-white';
};

const getGlowClass = (stock) => {
  const { sell, buy } = getAlertState(stock);
  if (sell) return 'bg-amber-500';
  if (buy) return 'bg-sky-500';
  return stock.change >= 0 ? 'bg-emerald-500' : 'bg-rose-500';
};

onMounted(async () => {
  loadAlerts();
  await loadWatchlist();
});
</script>
