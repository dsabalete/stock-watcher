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
          class="bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-slate-700 transition-all group relative overflow-hidden"
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
            <span class="text-3xl font-mono font-semibold text-white">
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

          <!-- Subtle background glow -->
          <div 
            class="absolute -bottom-4 -right-4 w-24 h-24 blur-3xl opacity-10 transition-opacity group-hover:opacity-20" 
            :class="stock.change >= 0 ? 'bg-emerald-500' : 'bg-rose-500'"
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

const formatPrice = (price) => {
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
};

onMounted(async () => {
  await loadWatchlist();
});
</script>
