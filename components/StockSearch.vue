<template>
  <div class="relative flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
    <input
      v-model="searchQuery"
      @keydown.enter="addStock"
      @input="debouncedSearch"
      type="text"
      placeholder="Add symbol (e.g. AAPL, TSLA.LSE)"
      class="bg-slate-900 border border-slate-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all w-full sm:w-64"
      :disabled="loading"
    />

    <button
      @click="addStock"
      :disabled="loading || !searchQuery.trim()"
      class="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <span v-if="loading" class="flex items-center gap-2">
        <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        Adding...
      </span>
      <span v-else>Add</span>
    </button>

    <!-- Search Results Dropdown -->
    <div
      v-if="showResults && searchResults.length > 0"
      class="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-lg shadow-xl overflow-hidden z-50"
    >
      <div
        v-for="result in searchResults"
        :key="result.symbol"
        @click="selectResult(result)"
        class="px-4 py-3 hover:bg-slate-800 cursor-pointer transition-colors border-b border-slate-800 last:border-0"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium text-white">{{ result.symbol }}</p>
            <p class="text-xs text-slate-400 truncate max-w-[200px]">{{ result.name }}</p>
          </div>
          <span class="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded">{{ result.exchange }}</span>
        </div>
      </div>
    </div>

    <div
      v-if="showResults && searchResults.length === 0 && searchQuery.trim().length > 1"
      class="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-lg shadow-xl overflow-hidden z-50 p-4 text-center text-slate-500 text-sm"
    >
      No results found for "{{ searchQuery }}"
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface SearchResult {
  code: string
  exchange: string
  symbol: string
  name: string
  type: string
  currency: string
}

interface Props {
  loading: boolean
}

interface Emits {
  'add-stock': [symbol: string]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const searchQuery = ref('')
const searchResults = ref<SearchResult[]>([])
const showResults = ref(false)
let debounceTimer: number | null = null

const debouncedSearch = () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(async () => {
    const query = searchQuery.value.trim()
    if (query.length < 2) {
      searchResults.value = []
      showResults.value = false
      return
    }
    try {
      const data = await $fetch<SearchResult[]>(`/api/search?q=${encodeURIComponent(query)}`)
      searchResults.value = data
      showResults.value = true
    } catch (e) {
      console.error('Search failed:', e)
      searchResults.value = []
      showResults.value = false
    }
  }, 200)
}

const addStock = () => {
  const symbol = searchQuery.value.trim().toUpperCase()
  if (!symbol) return
  emit('add-stock', symbol)
  searchQuery.value = ''
  searchResults.value = []
  showResults.value = false
}

const selectResult = (result: SearchResult) => {
  emit('add-stock', result.symbol)
  searchQuery.value = ''
  searchResults.value = []
  showResults.value = false
}

watch(() => searchQuery.value, () => {
  if (searchQuery.value.trim().length < 2) {
    searchResults.value = []
    showResults.value = false
  }
})
</script>