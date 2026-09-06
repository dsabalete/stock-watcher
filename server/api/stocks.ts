// Cache company info to avoid repeated Search API calls for the same symbol
const companyInfoCache = new Map<string, { name: string; currency: string }>();

async function fetchCompanyInfo(symbol: string, apiToken: string): Promise<{ name: string; currency: string }> {
  const key = symbol.toUpperCase();
  const cached = companyInfoCache.get(key);
  if (cached) return cached;

  const fallback = { name: 'Unknown Company', currency: 'USD' };
  try {
    const results = await $fetch<any[]>(
      `https://eodhd.com/api/search/${key}?api_token=${apiToken}&fmt=json`
    );
    if (Array.isArray(results) && results.length > 0) {
      // Prefer the exact Code.Exchange match (e.g. AAPL.US), fall back to first result
      const exact =
        results.find((r) => `${r.Code}.${r.Exchange}`.toUpperCase() === key) ?? results[0];
      const info = {
        name: exact.Name || fallback.name,
        currency: exact.Currency || fallback.currency,
      };
      companyInfoCache.set(key, info);
      return info;
    }
  } catch (e) {
    console.error(`Failed to fetch company info for ${symbol}:`, e);
  }
  return fallback;
}

export default defineEventHandler(async (event) => {
  const { symbols } = getQuery(event);
  const config = useRuntimeConfig();

  if (!symbols) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Symbols query parameter is required (comma-separated)',
    });
  }

  try {
    const symbolParam = Array.isArray(symbols) ? symbols.join(',') : (symbols as string);
    const symbolList = symbolParam.split(',').map((s: string) => s.trim()).filter(Boolean);
  
    // EODHD Real-time API expects the first symbol as part of the path and others as the 's' parameter
    // We assume the symbols are provided in the format Ticker.Exchange (e.g. AAPL.US)
    const firstSymbol = symbolList[0];
    const otherSymbols = symbolList.slice(1).join(',');
    
    // Omit the 's' param when only one symbol is requested
    const params = new URLSearchParams({ api_token: config.eodhdKey as string, fmt: 'json' });
    if (otherSymbols) params.set('s', otherSymbols);
    const url = `https://eodhd.com/api/real-time/${firstSymbol}?${params.toString()}`;
    
    const data = await $fetch(url);
    
    if (!data || (Array.isArray(data) && data.length === 0)) {
      return [];
    }

    // EODHD returns a list of objects. We map them to our app's expected format.
    // If the response is a single object (for one symbol), we wrap it in an array.
    const results = Array.isArray(data) ? data : [data];

    // The real-time endpoint returns no company name or currency,
    // so enrich each quote via the Search API (which has Name + Currency).
    const enriched = await Promise.all(
      results.map(async (item) => {
        const fullSymbol = (item.code || '').toUpperCase();
        const info = fullSymbol
          ? await fetchCompanyInfo(fullSymbol, config.eodhdKey as string)
          : { name: 'Unknown Company', currency: 'USD' };

        // EODHD real-time API uses 'close' as the current price
        const price = parseFloat(item.close || item.price || 0);
        const change = parseFloat(item.change || 0);
        const changePercent = parseFloat(item.change_p || item.change_pct || 0);

        return {
          symbol: item.code,
          name: info.name,
          price: price,
          change: change,
          changePercent: changePercent,
          currency: info.currency,
          previousClose: price - change
        };
      })
    );

    return enriched;
  } catch (error) {
    console.error('EODHD API Error:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch stock data from EODHD',
    });
  }
})